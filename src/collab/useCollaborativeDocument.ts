import { useEffect, useRef, useState, useCallback } from "react";
import { createYjsWsProvider } from "./createYjsWsProvider";
import type { CollaborationConfig, ProviderStatus } from "./types";
import { authStorage } from "@/lib/authStorage";

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
  const [accessToken, setAccessToken] = useState(() => authStorage.getAccessToken());

  // config를 ref로 유지 → provider 재생성 없이 awareness만 갱신 가능
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    return authStorage.subscribe(() => {
      setAccessToken(authStorage.getAccessToken());
    });
  }, []);

  const wsUrl = config && accessToken
    ? buildWsUrl(config, accessToken)
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

  // provider 생성 — wsUrl만 의존 (user 표시 정보 변경 시 재생성하지 않음)
  useEffect(() => {
    if (!wsUrl) {
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

    const provider = createYjsWsProvider(wsUrl);
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

    provider.connect();

    return () => {
      provider.awareness.off("change", onAwarenessChange);
      unsub();
      unsubSync();
      provider.destroy();
      providerRef.current = null;
      setIsSynced(false);
      setCollaborators([]);
    };
  }, [wsUrl, syncCollaborators]);

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
