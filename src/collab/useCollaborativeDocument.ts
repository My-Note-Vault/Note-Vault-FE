import { useEffect, useMemo, useRef, useState } from "react";
import { createYjsWsProvider } from "./createYjsWsProvider";
import type { CollaborationConfig, ProviderStatus } from "./types";
import { authStorage } from "@/lib/authStorage";

function buildWsUrl(config: CollaborationConfig, token: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const path = `/ws/workspaces/${config.workspaceId}/${config.documentType}/${config.documentId}`;
  return `${protocol}//${host}${path}?token=${encodeURIComponent(token)}`;
}

export function useCollaborativeDocument(config: CollaborationConfig | null) {
  const [status, setStatus] = useState<ProviderStatus>("idle");
  const [accessToken, setAccessToken] = useState(() => authStorage.getAccessToken());

  useEffect(() => {
    return authStorage.subscribe(() => {
      setAccessToken(authStorage.getAccessToken());
    });
  }, []);

  const wsUrl = useMemo(() => {
    if (!config || !accessToken) return null;
    return buildWsUrl(config, accessToken);
  }, [
    accessToken,
    config?.workspaceId,
    config?.documentType,
    config?.documentId,
  ]);

  const providerRef = useRef<ReturnType<typeof createYjsWsProvider> | null>(null);

  useEffect(() => {
    if (!config || !wsUrl) {
      setStatus("idle");
      return;
    }

    const provider = createYjsWsProvider(wsUrl);
    providerRef.current = provider;

    // awareness user 정보 설정
    provider.awareness.setLocalStateField("user", {
      name: config.userName,
      color: config.userColor,
      colorLight: config.userColorLight,
    });

    const unsub = provider.onStatusChange(setStatus);
    provider.connect();

    return () => {
      unsub();
      provider.destroy();
      providerRef.current = null;
    };
  }, [config, wsUrl]);

  // user 정보만 바뀌면 awareness만 갱신
  useEffect(() => {
    if (!config || !providerRef.current) return;
    providerRef.current.awareness.setLocalStateField("user", {
      name: config.userName,
      color: config.userColor,
      colorLight: config.userColorLight,
    });
  }, [config?.userName, config?.userColor, config?.userColorLight]);

  return {
    provider: providerRef.current,
    doc: providerRef.current?.doc ?? null,
    awareness: providerRef.current?.awareness ?? null,
    status,
  };
}
