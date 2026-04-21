/**
 * 발견 콘텐츠 좋아요/댓글 API — findthem 서버 연동
 * contentKey: "festival:{id}" | "performance:{id}" | "camping:{id}"
 */
import { logError } from "@/utils/logger";
import { getOrCreateDeviceId } from "@/utils/deviceId";

const API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL ?? "";
const APP_KEY = process.env.EXPO_PUBLIC_RECOMMENDATION_APP_KEY ?? "";

const HEADERS = { "x-app-key": APP_KEY, "Content-Type": "application/json" };

function abortAfter(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, clear: () => clearTimeout(t) };
}

// ── 콘텐츠 소셜 정보 ──

export interface ContentSocial {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export async function fetchContentSocial(contentKey: string): Promise<ContentSocial> {
  if (!API_URL) return { likeCount: 0, commentCount: 0, isLiked: false };
  const deviceId = await getOrCreateDeviceId();
  const params = new URLSearchParams({ contentKey, deviceId });
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/content-social?${params}`, {
      headers: { "x-app-key": APP_KEY },
      signal,
    });
    clear();
    if (!res.ok) return { likeCount: 0, commentCount: 0, isLiked: false };
    return await res.json();
  } catch (e) {
    logError("general", e);
    return { likeCount: 0, commentCount: 0, isLiked: false };
  }
}

// ── 좋아요 토글 ──

export async function toggleLike(contentKey: string): Promise<{ isLiked: boolean; likeCount: number }> {
  const deviceId = await getOrCreateDeviceId();
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/like`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ contentKey, deviceId }),
      signal,
    });
    clear();
    if (!res.ok) throw new Error(`like failed: ${res.status}`);
    return await res.json();
  } catch (e) {
    logError("general", e);
    throw e;
  }
}

// ── 댓글 ──

export interface DiscoverComment {
  id: string;
  deviceId: string;
  nickname: string;
  text: string;
  createdAt: string;
}

export async function fetchComments(contentKey: string): Promise<DiscoverComment[]> {
  if (!API_URL) return [];
  const params = new URLSearchParams({ contentKey });
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/comments?${params}`, {
      headers: { "x-app-key": APP_KEY },
      signal,
    });
    clear();
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    logError("general", e);
    return [];
  }
}

export async function addComment(contentKey: string, text: string, nickname?: string): Promise<DiscoverComment | null> {
  const deviceId = await getOrCreateDeviceId();
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/comments`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ contentKey, deviceId, nickname: nickname || "익명", text }),
      signal,
    });
    clear();
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    logError("general", e);
    return null;
  }
}

export async function editComment(commentId: string, text: string): Promise<boolean> {
  const deviceId = await getOrCreateDeviceId();
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/comments/${commentId}`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ deviceId, text }),
      signal,
    });
    clear();
    return res.ok;
  } catch (e) {
    logError("general", e);
    return false;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const deviceId = await getOrCreateDeviceId();
  const params = new URLSearchParams({ deviceId });
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/comments/${commentId}?${params}`, {
      method: "DELETE",
      headers: { "x-app-key": APP_KEY },
      signal,
    });
    clear();
    return res.ok;
  } catch (e) {
    logError("general", e);
    return false;
  }
}

// ── 배치 소셜 조회 (리스트 뷰용) ──

export type SocialMap = Record<string, { likeCount: number; commentCount: number }>;

export async function fetchContentSocialBatch(contentKeys: string[]): Promise<SocialMap> {
  if (!API_URL || contentKeys.length === 0) return {};
  const keys = contentKeys.slice(0, 50).join(",");
  const { signal, clear } = abortAfter(5000);
  try {
    const res = await fetch(`${API_URL}/malgeum/content-social-batch?keys=${encodeURIComponent(keys)}`, {
      headers: { "x-app-key": APP_KEY },
      signal,
    });
    clear();
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    logError("general", e);
    return {};
  }
}

// ── 상세 보기용 데이터 캐시 ──

export interface DiscoverDetailData {
  contentKey: string;
  type: "festival" | "performance" | "camping";
  title: string;
  addr: string;
  image?: string;
  period?: string;
  url?: string;
  extra?: Record<string, string>; // genre, venue, environment 등
}

let _detailCache: DiscoverDetailData | null = null;

export function setDetailCache(data: DiscoverDetailData) { _detailCache = data; }
export function getDetailCache(): DiscoverDetailData | null { return _detailCache; }
