import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

import {
  MSG_SYNC,
  MSG_AWARENESS,
  MSG_BOOTSTRAP_COMPLETE,
  MSG_DOCUMENT_UPDATE,
  MSG_UPDATE_ACK,
  MSG_SEARCH_PROJECTION,
  MSG_CRDT_SYNC_REQUEST,
  MSG_CRDT_SNAPSHOT,
  MSG_DOCUMENT_UPDATE_WITH_ACTIVITY,
} from "./messageTypes";
import type { ProviderStatus, YjsWsProvider } from "./types";
import type { CollaborationBootstrap } from "@/api/collaboration";

const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 30_000;
const BACKOFF_FACTOR = 2;
const CRDT_RECONCILE_INTERVAL_MS = 5_000;
const DOCUMENT_UPDATE_BATCH_DELAY_MS = 50;
const DOCUMENT_INDEXING_IDLE_DELAY_MS = 30_000;
const DOCUMENT_INDEXING_RETRY_DELAY_MS = 10_000;

export function createYjsWsProvider(
  getUrl: () => Promise<string>,
  persistDocumentUpdates: boolean,
  deferLocalUpdatesUntilRestore = false,
  requestDocumentIndexing?: (revision: number) => Promise<void>,
): YjsWsProvider {
  const doc = new Y.Doc();
  const searchDoc = new Y.Doc();
  const awareness = new Awareness(doc);

  let ws: WebSocket | null = null;
  let status: ProviderStatus = "idle";
  let isSynced = false;
  let hasInitialDocumentState = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = INITIAL_RECONNECT_MS;
  let connectInFlight = false;
  let destroyed = false;
  let pendingRealtimeUpdates: Uint8Array[] = [];
  let pendingDocumentUpdates: Uint8Array[] = [];
  let pendingDocumentUpdateBytes = 0;
  let pendingInsertedCharacters = 0;
  let documentUpdateBatchTimer: ReturnType<typeof setTimeout> | null = null;
  const unacknowledgedUpdates = new Map<string, { update: Uint8Array; insertedCharacters: number }>();
  const bufferedCommittedUpdates = new Map<number, Uint8Array>();
  let lastAppliedRevision = 0;
  let serverLatestRevision = 0;
  let lastProjectedRevision = 0;
  let syncInFlight = false;
  let searchProjectionTimer: ReturnType<typeof setTimeout> | null = null;
  let documentIndexingTimer: ReturnType<typeof setTimeout> | null = null;
  let reconcileTimer: ReturnType<typeof setInterval> | null = null;
  let roomUrl = "";
  let restoringLocalState = deferLocalUpdatesUntilRestore;
  let restoredLocalStatePending = deferLocalUpdatesUntilRestore;

  const statusListeners = new Set<(s: ProviderStatus) => void>();
  const syncListeners = new Set<(synced: boolean) => void>();

  // ── helpers ────────────────────────────────────────────────────────

  function setStatus(next: ProviderStatus) {
    if (status === next) return;
    status = next;
    statusListeners.forEach((cb) => cb(status));
  }

  function setSynced(next: boolean) {
    if (isSynced === next) return;
    isSynced = next;
    syncListeners.forEach((cb) => cb(isSynced));
  }

  function send(data: Uint8Array) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }

  function sendDocumentUpdate(clientUpdateId: string, update: Uint8Array, insertedCharacters: number) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_DOCUMENT_UPDATE_WITH_ACTIVITY);
    encoding.writeVarString(encoder, clientUpdateId);
    encoding.writeVarUint(encoder, insertedCharacters);
    encoding.writeVarUint8Array(encoder, update);
    send(encoding.toUint8Array(encoder));
  }

  function flushPendingDocumentUpdates(sendImmediately = true) {
    if (documentUpdateBatchTimer !== null) {
      clearTimeout(documentUpdateBatchTimer);
      documentUpdateBatchTimer = null;
    }
    if (pendingDocumentUpdates.length === 0) return;

    const updates = pendingDocumentUpdates;
    pendingDocumentUpdates = [];
    pendingDocumentUpdateBytes = 0;
    const insertedCharacters = pendingInsertedCharacters;
    pendingInsertedCharacters = 0;

    const update = updates.length === 1
      ? updates[0]
      : Y.mergeUpdates(updates);
    const clientUpdateId = crypto.randomUUID();
    unacknowledgedUpdates.set(clientUpdateId, { update, insertedCharacters });

    if (sendImmediately && ws?.readyState === WebSocket.OPEN) {
      sendDocumentUpdate(clientUpdateId, update, insertedCharacters);
    }
  }

  function queueDocumentUpdate(update: Uint8Array) {
    pendingDocumentUpdates.push(update);
    pendingDocumentUpdateBytes += update.byteLength;

    if (documentUpdateBatchTimer === null) {
      documentUpdateBatchTimer = setTimeout(
        flushPendingDocumentUpdates,
        DOCUMENT_UPDATE_BATCH_DELAY_MS,
      );
    }
  }

  function recordInsertedCharacters(count: number) {
    if (!Number.isSafeInteger(count) || count <= 0) return;
    pendingInsertedCharacters += count;
  }

  function enqueueRestoredLocalState() {
    if (
      !persistDocumentUpdates ||
      restoringLocalState ||
      !restoredLocalStatePending ||
      !hasInitialDocumentState
    ) {
      return;
    }

    restoredLocalStatePending = false;
    const serverStateVector = Y.encodeStateVector(searchDoc);
    const missingUpdate = Y.encodeStateAsUpdate(doc, serverStateVector);
    if (missingUpdate.byteLength > 2) {
      queueDocumentUpdate(missingUpdate);
    }
  }

  function requestCrdtSync() {
    if (
      !persistDocumentUpdates ||
      syncInFlight ||
      !ws ||
      ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    syncInFlight = true;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_CRDT_SYNC_REQUEST);
    encoding.writeVarUint(encoder, lastAppliedRevision);
    send(encoding.toUint8Array(encoder));
  }

  function applyContiguousCommittedUpdates() {
    while (bufferedCommittedUpdates.has(lastAppliedRevision + 1)) {
      const revision = lastAppliedRevision + 1;
      const update = bufferedCommittedUpdates.get(revision)!;
      Y.applyUpdate(searchDoc, update, provider);
      bufferedCommittedUpdates.delete(revision);
      lastAppliedRevision = revision;
    }
  }

  function receiveCommittedUpdate(revision: number, update: Uint8Array) {
    clearDocumentIndexingTimer();
    serverLatestRevision = Math.max(serverLatestRevision, revision);
    if (revision <= lastAppliedRevision) return;

    bufferedCommittedUpdates.set(revision, update);
    applyContiguousCommittedUpdates();

    if (
      bufferedCommittedUpdates.size > 0 &&
      !bufferedCommittedUpdates.has(lastAppliedRevision + 1)
    ) {
      requestCrdtSync();
      return;
    }
    scheduleSearchProjection();
  }

  function scheduleSearchProjection() {
    if (
      !persistDocumentUpdates ||
      lastAppliedRevision !== serverLatestRevision ||
      lastAppliedRevision <= lastProjectedRevision
    ) {
      return;
    }
    if (searchProjectionTimer !== null) clearTimeout(searchProjectionTimer);
    searchProjectionTimer = setTimeout(() => {
      searchProjectionTimer = null;
      if (
        !ws ||
        ws.readyState !== WebSocket.OPEN ||
        lastAppliedRevision !== serverLatestRevision ||
        lastAppliedRevision <= lastProjectedRevision
      ) {
        return;
      }
      const revision = lastAppliedRevision;
      const content = searchDoc.getText("content").toString();
      const crdtState = Y.encodeStateAsUpdate(searchDoc);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SEARCH_PROJECTION);
      encoding.writeVarUint(encoder, revision);
      encoding.writeVarString(encoder, content);
      encoding.writeVarUint8Array(encoder, crdtState);
      send(encoding.toUint8Array(encoder));
      lastProjectedRevision = revision;
      scheduleDocumentIndexing(revision);
    }, 500);
  }

  function clearDocumentIndexingTimer() {
    if (documentIndexingTimer !== null) {
      clearTimeout(documentIndexingTimer);
      documentIndexingTimer = null;
    }
  }

  function isCurrentProjectedRevision(revision: number) {
    return !destroyed && revision === lastProjectedRevision
      && revision === lastAppliedRevision
      && revision === serverLatestRevision;
  }

  function scheduleDocumentIndexing(revision: number, delay = DOCUMENT_INDEXING_IDLE_DELAY_MS) {
    clearDocumentIndexingTimer();
    if (!requestDocumentIndexing) return;
    documentIndexingTimer = setTimeout(() => {
      documentIndexingTimer = null;
      if (!isCurrentProjectedRevision(revision)) return;
      void requestDocumentIndexing(revision).catch((error) => {
        console.warn("[crdt] Document indexing request failed", {
          room: roomUrl,
          revision,
          error,
        });
        if (isCurrentProjectedRevision(revision)) {
          scheduleDocumentIndexing(revision, DOCUMENT_INDEXING_RETRY_DELAY_MS);
        }
      });
    }, delay);
  }

  // ── outbound: sync step 1 ─────────────────────────────────────────

  function sendSyncStep1() {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(encoding.toUint8Array(encoder));
  }

  // ── outbound: awareness ───────────────────────────────────────────

  function broadcastAwareness() {
    const clients = [doc.clientID];
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(awareness, clients),
    );
    send(encoding.toUint8Array(encoder));
  }

  // ── inbound message handler ───────────────────────────────────────

  function handleMessage(data: ArrayBuffer) {
    const message = new Uint8Array(data);
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MSG_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, provider);
        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
          setSynced(true);
        }
        // readSyncMessage 가 reply 를 encoder에 쓸 수 있다 (sync step 2 응답 등)
        if (encoding.length(encoder) > 1) {
          send(encoding.toUint8Array(encoder));
        }
        break;
      }
      case MSG_AWARENESS: {
        const update = decoding.readVarUint8Array(decoder);
        applyAwarenessUpdate(awareness, update, provider);
        break;
      }
      case MSG_BOOTSTRAP_COMPLETE:
        serverLatestRevision = Math.max(
          serverLatestRevision,
          decoding.readVarUint(decoder),
        );
        syncInFlight = false;
        applyContiguousCommittedUpdates();
        if (lastAppliedRevision < serverLatestRevision) {
          requestCrdtSync();
        } else {
          hasInitialDocumentState = true;
          enqueueRestoredLocalState();
          setSynced(true);
          scheduleSearchProjection();
        }
        console.info("[crdt] bootstrap complete", {
          room: roomUrl,
          serverLatestRevision,
          lastAppliedRevision,
          contentLength: doc.getText("content").length,
        });
        break;
      case MSG_DOCUMENT_UPDATE: {
        const revision = decoding.readVarUint(decoder);
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(doc, update, provider);
        receiveCommittedUpdate(revision, update);
        console.info("[crdt] document update applied", {
          room: roomUrl,
          revision,
          updateBytes: update.byteLength,
          contentLength: doc.getText("content").length,
        });
        break;
      }
      case MSG_UPDATE_ACK: {
        const clientUpdateId = decoding.readVarString(decoder);
        const revision = decoding.readVarUint(decoder);
        const update = decoding.readVarUint8Array(decoder);
        unacknowledgedUpdates.delete(clientUpdateId);
        receiveCommittedUpdate(revision, update);
        break;
      }
      case MSG_CRDT_SNAPSHOT: {
        const revision = decoding.readVarUint(decoder);
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(doc, update, provider);
        Y.applyUpdate(searchDoc, update, provider);
        lastAppliedRevision = Math.max(lastAppliedRevision, revision);
        serverLatestRevision = Math.max(serverLatestRevision, revision);
        bufferedCommittedUpdates.forEach((_, bufferedRevision) => {
          if (bufferedRevision <= lastAppliedRevision) {
            bufferedCommittedUpdates.delete(bufferedRevision);
          }
        });
        applyContiguousCommittedUpdates();
        console.info("[crdt] snapshot applied", {
          room: roomUrl,
          revision,
          updateBytes: update.byteLength,
          contentLength: doc.getText("content").length,
        });
        break;
      }
    }
  }

  // ── doc update listener (로컬 변경 → 원격 전송) ───────────────────

  function onDocUpdate(update: Uint8Array, origin: unknown) {
    if (origin === provider) return;
    if (restoringLocalState) return;
    clearDocumentIndexingTimer();
    if (persistDocumentUpdates) {
      queueDocumentUpdate(update);
      return;
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingRealtimeUpdates.push(update);
      return;
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    send(encoding.toUint8Array(encoder));
  }

  // ── awareness update listener ─────────────────────────────────────

  function onAwarenessUpdate(
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) {
    if (origin === provider) return;
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(awareness, changedClients),
    );
    send(encoding.toUint8Array(encoder));
  }

  // ── connect / disconnect ──────────────────────────────────────────

  function connect() {
    if (destroyed) return;
    if (ws) return;
    if (connectInFlight) return;

    setStatus("connecting");
    if (!hasInitialDocumentState) {
      setSynced(false);
    }
    connectInFlight = true;

    void openSocket();
  }

  function applyRestBootstrap(bootstrap: CollaborationBootstrap) {
    if (bootstrap.state && bootstrap.state.byteLength > 0) {
      Y.applyUpdate(doc, bootstrap.state, provider);
      Y.applyUpdate(searchDoc, bootstrap.state, provider);
    }
    bootstrap.updates.forEach(({ update }) => {
      Y.applyUpdate(doc, update, provider);
      Y.applyUpdate(searchDoc, update, provider);
    });
    lastAppliedRevision = bootstrap.cursor;
    serverLatestRevision = bootstrap.cursor;
    lastProjectedRevision = bootstrap.cursor;
    hasInitialDocumentState = true;
    enqueueRestoredLocalState();
    setSynced(true);
  }

  function finishLocalRestore() {
    restoringLocalState = false;
    enqueueRestoredLocalState();
  }

  async function openSocket() {
    let url: string;
    try {
      url = await getUrl();
    } catch (error) {
      connectInFlight = false;
      if (destroyed) return;
      console.error("[crdt] Failed to prepare WebSocket authentication", error);
      setStatus("error");
      scheduleReconnect();
      return;
    }

    connectInFlight = false;
    if (destroyed || ws) return;

    roomUrl = new URL(url).pathname;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    ws = socket;

    socket.addEventListener("open", () => {
      reconnectDelay = INITIAL_RECONNECT_MS;
      setStatus("connected");
      if (!persistDocumentUpdates) {
        sendSyncStep1();
      } else {
        requestCrdtSync();
      }
      if (persistDocumentUpdates) {
        // 아직 전송 단위로 확정되지 않은 update를 먼저 하나의 불변 batch로 만든다.
        // 아래 반복문에서 기존 미확인 batch와 함께 동일한 ID로 전송한다.
        flushPendingDocumentUpdates(false);
        unacknowledgedUpdates.forEach(({ update, insertedCharacters }, clientUpdateId) => {
          sendDocumentUpdate(clientUpdateId, update, insertedCharacters);
        });
      } else if (pendingRealtimeUpdates.length > 0) {
        const pendingUpdate = Y.mergeUpdates(pendingRealtimeUpdates);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeUpdate(encoder, pendingUpdate);
        send(encoding.toUint8Array(encoder));
        pendingRealtimeUpdates = [];
      }
      broadcastAwareness();

      if (persistDocumentUpdates && reconcileTimer === null) {
        reconcileTimer = setInterval(
          requestCrdtSync,
          CRDT_RECONCILE_INTERVAL_MS,
        );
      }
    });

    socket.addEventListener("message", (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleMessage(event.data);
      }
    });

    socket.addEventListener("close", (event) => {
      console.warn("[crdt] WebSocket closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        room: roomUrl,
      });
      ws = null;
      syncInFlight = false;
      if (reconcileTimer !== null) {
        clearInterval(reconcileTimer);
        reconcileTimer = null;
      }
      if (!destroyed) {
        setStatus("disconnected");
        scheduleReconnect();
      }
    });

    socket.addEventListener("error", (event) => {
      console.error("[crdt] WebSocket error", { event, room: roomUrl });
      setStatus("error");
      socket.close();
    });
  }

  function disconnect() {
    clearReconnect();
    if (searchProjectionTimer !== null) {
      clearTimeout(searchProjectionTimer);
      searchProjectionTimer = null;
    }
    if (reconcileTimer !== null) {
      clearInterval(reconcileTimer);
      reconcileTimer = null;
    }
    if (ws) {
      // 오프라인 상태 전파
      removeAwarenessStates(
        awareness,
        [doc.clientID],
        provider,
      );
      ws.close();
      ws = null;
    }
    setSynced(false);
    setStatus("disconnected");
  }

  function scheduleReconnect() {
    if (destroyed) return;
    clearReconnect();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * BACKOFF_FACTOR, MAX_RECONNECT_MS);
  }

  function clearReconnect() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearDocumentIndexingTimer();
    if (documentUpdateBatchTimer !== null) {
      clearTimeout(documentUpdateBatchTimer);
      documentUpdateBatchTimer = null;
    }
    disconnect();
    doc.off("update", onDocUpdate);
    awareness.off("update", onAwarenessUpdate);
    awareness.setLocalState(null);
    awareness.destroy();
    doc.destroy();
    searchDoc.destroy();
    statusListeners.clear();
    syncListeners.clear();
  }

  // ── listeners 등록 ────────────────────────────────────────────────

  doc.on("update", onDocUpdate);
  awareness.on("update", onAwarenessUpdate);

  // ── public api ────────────────────────────────────────────────────

  const provider: YjsWsProvider = {
    get doc() {
      return doc;
    },
    get awareness() {
      return awareness;
    },
    get status() {
      return status;
    },
    get isSynced() {
      return isSynced;
    },
    recordInsertedCharacters,
    finishLocalRestore,
    connect,
    applyRestBootstrap,
    disconnect,
    destroy,
    onStatusChange(cb) {
      statusListeners.add(cb);
      return () => {
        statusListeners.delete(cb);
      };
    },
    onSync(cb) {
      syncListeners.add(cb);
      return () => {
        syncListeners.delete(cb);
      };
    },
  };

  return provider;
}
