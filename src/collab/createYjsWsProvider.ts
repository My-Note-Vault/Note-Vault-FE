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
} from "./messageTypes";
import type { ProviderStatus, YjsWsProvider } from "./types";

const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 30_000;
const BACKOFF_FACTOR = 2;
const CRDT_RECONCILE_INTERVAL_MS = 5_000;

export function createYjsWsProvider(url: string, persistDocumentUpdates: boolean): YjsWsProvider {
  const doc = new Y.Doc();
  const searchDoc = new Y.Doc();
  const awareness = new Awareness(doc);

  let ws: WebSocket | null = null;
  let status: ProviderStatus = "idle";
  let isSynced = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = INITIAL_RECONNECT_MS;
  let destroyed = false;
  let pendingRealtimeUpdates: Uint8Array[] = [];
  const unacknowledgedUpdates = new Map<string, Uint8Array>();
  const bufferedCommittedUpdates = new Map<number, Uint8Array>();
  let lastAppliedRevision = 0;
  let serverLatestRevision = 0;
  let lastProjectedRevision = 0;
  let syncInFlight = false;
  let searchProjectionTimer: ReturnType<typeof setTimeout> | null = null;
  let reconcileTimer: ReturnType<typeof setInterval> | null = null;

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

  function sendDocumentUpdate(clientUpdateId: string, update: Uint8Array) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_DOCUMENT_UPDATE);
    encoding.writeVarString(encoder, clientUpdateId);
    encoding.writeVarUint8Array(encoder, update);
    send(encoding.toUint8Array(encoder));
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
    }, 500);
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
          setSynced(true);
          scheduleSearchProjection();
        }
        break;
      case MSG_DOCUMENT_UPDATE: {
        const revision = decoding.readVarUint(decoder);
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(doc, update, provider);
        receiveCommittedUpdate(revision, update);
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
        break;
      }
    }
  }

  // ── doc update listener (로컬 변경 → 원격 전송) ───────────────────

  function onDocUpdate(update: Uint8Array, origin: unknown) {
    if (origin === provider) return;
    if (persistDocumentUpdates) {
      const clientUpdateId = crypto.randomUUID();
      unacknowledgedUpdates.set(clientUpdateId, update);
      if (ws?.readyState === WebSocket.OPEN) {
        sendDocumentUpdate(clientUpdateId, update);
      }
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

    setStatus("connecting");
    setSynced(false);

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
        unacknowledgedUpdates.forEach((update, clientUpdateId) => {
          sendDocumentUpdate(clientUpdateId, update);
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
        url,
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
      console.error("[crdt] WebSocket error", { event, url });
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
    connect,
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
