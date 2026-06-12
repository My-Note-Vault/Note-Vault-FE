import {
  fetchContentImageUrl,
  issueContentImageCookies,
  type ContentImageAccessResponse,
} from "@/api/contentImages";

const CONTENT_IMAGE_KEY_PATTERN =
  /^content\/(?:daily-note|workspace|task|subtask|note|trivia)\/[^\s"'<>)]*?\.(?:png|jpe?g)$/i;
const CACHE_SAFETY_WINDOW_MS = 30_000;

let accessCache: (ContentImageAccessResponse & { expiresAt: number }) | null = null;
let accessPromise: Promise<ContentImageAccessResponse & { expiresAt: number }> | null = null;
const presignedUrlCache = new Map<string, string>();

export function isContentImageKey(value: string): boolean {
  return CONTENT_IMAGE_KEY_PATTERN.test(value);
}

export async function ensureContentImageAccess(): Promise<ContentImageAccessResponse> {
  const now = Date.now();
  if (accessCache && accessCache.expiresAt > now) {
    return accessCache;
  }

  if (!accessPromise) {
    accessPromise = issueContentImageCookies()
      .then((access) => {
        const expiresInMs = Math.max(access.expiresInSeconds * 1000, 0);
        accessCache = {
          ...access,
          expiresAt: Date.now() + expiresInMs - CACHE_SAFETY_WINDOW_MS,
        };
        return accessCache;
      })
      .finally(() => {
        accessPromise = null;
      });
  }

  return accessPromise;
}

export async function resolveContentImageSrc(value: string): Promise<string> {
  const key = normalizeMarkdownImageUrl(value);
  if (!isContentImageKey(key)) {
    return key;
  }

  const access = await ensureContentImageAccess();
  if (access.cloudFrontEnabled && access.cdnBaseUrl) {
    return joinUrl(access.cdnBaseUrl, key);
  }

  const cachedUrl = presignedUrlCache.get(key);
  if (cachedUrl) {
    return cachedUrl;
  }

  const { presignedUrl } = await fetchContentImageUrl(key);
  presignedUrlCache.set(key, presignedUrl);
  return presignedUrl;
}

export function normalizeMarkdownImageUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function joinUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}
