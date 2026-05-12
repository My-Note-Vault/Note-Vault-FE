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

import { MSG_SYNC, MSG_AWARENESS } from "./messageTypes";
import type { ProviderStatus, YjsWsProvider } from "./types";

const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 30_000;
const BACKOFF_FACTOR = 2;
const SYNC_FALLBACK_MS = 1_000;

export function createYjsWsProvider(url: string): YjsWsProvider {
  const doc = new Y.Doc();
  const awareness = new Awareness(doc);

  let ws: WebSocket | null = null;
  let status: ProviderStatus = "idle";
  let isSynced = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let syncFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = INITIAL_RECONNECT_MS;
  let destroyed = false;

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

  function clearSyncFallback() {
    if (syncFallbackTimer !== null) {
      clearTimeout(syncFallbackTimer);
      syncFallbackTimer = null;
    }
  }

  function scheduleSyncFallback() {
    clearSyncFallback();
    syncFallbackTimer = setTimeout(() => {
      syncFallbackTimer = null;
      setSynced(true);
    }, SYNC_FALLBACK_MS);
  }

  function send(data: Uint8Array) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
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
          clearSyncFallback();
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
    }
  }

  // ── doc update listener (로컬 변경 → 원격 전송) ───────────────────

  function onDocUpdate(update: Uint8Array, origin: unknown) {
    if (origin === provider) return;
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
      sendSyncStep1();
      broadcastAwareness();
      // 서버가 Y.Doc 상태를 갖지 않는 경우 step2가 없을 수 있다.
      // 잠깐 기다려 기존 피어의 step2를 먼저 적용한 뒤 단독 접속으로 간주한다.
      scheduleSyncFallback();
    });

    socket.addEventListener("message", (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleMessage(event.data);
      }
    });

    socket.addEventListener("close", () => {
      ws = null;
      if (!destroyed) {
        setStatus("disconnected");
        scheduleReconnect();
      }
    });

    socket.addEventListener("error", () => {
      setStatus("error");
      socket.close();
    });
  }

  function disconnect() {
    clearReconnect();
    clearSyncFallback();
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
