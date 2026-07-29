import { useEffect, useRef, useState, useCallback } from "react";
import { createYjsWsProvider } from "./createYjsWsProvider";
import type { CollaborationConfig, ProviderStatus } from "./types";
import { ensureFreshAccessToken } from "@/api/client";
import { fetchCollaborationBootstrap } from "@/api/collaboration";

export interface CollaboratorInfo {
  clientId: number;
  name: string;
  color: string;
  colorLight: string;
  profileImageUrl: string | null;
}

function buildWsUrl(config: CollaborationConfig, token: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const path = `/ws/workspaces/${config.workspaceId}/${config.documentType}/${config.documentId}`;
  return `${protocol}//${host}${path}?token=${encodeURIComponent(token)}`;
}

export function useCollaborativeDocument(config: CollaborationConfig | null) {
  const [status, setStatus] = useState<ProviderStatus>("idle");
  const [isSynced, setIsSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);

  // config를 ref로 유지 → provider 재생성 없이 awareness만 갱신 가능
  const configRef = useRef(config);
  configRef.current = config;

  const collaborationKey = config
    ? `${config.workspaceId}/${config.documentType}/${config.documentId}`
    : null;

  const providerRef = useRef<ReturnType<typeof createYjsWsProvider> | null>(null);

  const syncCollaborators = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) {
      setCollaborators([]);
      return;
    }
    const awareness = provider.awareness;
    const localId = provider.doc.clientID;

    // 이름 기준으로 중복 제거 (재연결 시 이전 clientId awareness가 남아있을 수 있음)
    const byName = new Map<string, CollaboratorInfo>();

    awareness.getStates().forEach((state, clientId) => {
      if (clientId === localId) return;
      const user = state.user as
        | { name?: string; color?: string; colorLight?: string; profileImageUrl?: string | null }
        | undefined;
      if (!user) return;

      const name = user.name ?? "Anonymous";
      const existing = byName.get(name);
      // 같은 이름이면 더 큰 clientId(최신)만 유지
      if (!existing || clientId > existing.clientId) {
        byName.set(name, {
          clientId,
          name,
          color: user.color ?? "#888",
          colorLight: user.colorLight ?? "#88888833",
          profileImageUrl: user.profileImageUrl ?? null,
        });
      }
    });

    setCollaborators(Array.from(byName.values()));
  }, []);

  // provider 생성 — 문서 식별자만 의존 (재연결 시마다 최신 token으로 URL 생성)
  useEffect(() => {
    if (!collaborationKey) {
      setStatus("idle");
      setIsSynced(false);
      setCollaborators([]);
      return;
    }

    const currentConfig = configRef.current;
    if (!currentConfig) {
      setStatus("idle");
      setIsSynced(false);
      setCollaborators([]);
      return;
    }

    const provider = createYjsWsProvider(async () => {
      const latestConfig = configRef.current;
      if (!latestConfig) {
        throw new Error("Collaboration config is unavailable");
      }
      const token = await ensureFreshAccessToken();
      return buildWsUrl(latestConfig, token);
    }, true);
    providerRef.current = provider;

    // 초기 awareness user 정보 설정
    provider.awareness.setLocalStateField("user", {
      name: currentConfig.userName,
      color: currentConfig.userColor,
      colorLight: currentConfig.userColorLight,
      profileImageUrl: currentConfig.userProfileImageUrl,
    });

    const unsub = provider.onStatusChange(setStatus);
    const unsubSync = provider.onSync(setIsSynced);

    // awareness 변경 시 collaborators 목록 갱신
    const onAwarenessChange = () => syncCollaborators();
    provider.awareness.on("change", onAwarenessChange);

    const abortController = new AbortController();
    void fetchCollaborationBootstrap(
      currentConfig.workspaceId,
      currentConfig.documentType,
      currentConfig.documentId,
      abortController.signal,
    )
      .then((bootstrap) => {
        if (abortController.signal.aborted) return;
        provider.applyRestBootstrap(bootstrap);
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        console.warn("[crdt] REST bootstrap failed; falling back to WebSocket", error);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          provider.connect();
        }
      });
    const reconnectWhenOnline = () => provider.connect();
    const reconnectWhenVisible = () => {
      if (document.visibilityState === "visible") {
        provider.connect();
      }
    };
    window.addEventListener("online", reconnectWhenOnline);
    document.addEventListener("visibilitychange", reconnectWhenVisible);

    return () => {
      abortController.abort();
      window.removeEventListener("online", reconnectWhenOnline);
      document.removeEventListener("visibilitychange", reconnectWhenVisible);
      provider.awareness.off("change", onAwarenessChange);
      unsub();
      unsubSync();
      provider.destroy();
      providerRef.current = null;
      setIsSynced(false);
      setCollaborators([]);
    };
  }, [collaborationKey, syncCollaborators]);

  // user 정보만 바뀌면 awareness만 갱신 (provider 재생성 없음)
  useEffect(() => {
    if (!config || !providerRef.current) return;
    const { userName, userColor, userColorLight, userProfileImageUrl } = config;
    providerRef.current.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      colorLight: userColorLight,
      profileImageUrl: userProfileImageUrl,
    });
  }, [config]);

  return {
    provider: providerRef.current,
    doc: providerRef.current?.doc ?? null,
    awareness: providerRef.current?.awareness ?? null,
    status,
    isSynced,
    collaborators,
  };
}
