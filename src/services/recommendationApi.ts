/**
 * findthem 서버의 맑음 추천 API 호출
 * 로컬 API(축제/캠핑 직접 호출)의 상위 레이어 — 서버에서 스코어링된 추천 1개 반환
 *
 * 환경변수: EXPO_PUBLIC_RECOMMENDATION_API_URL (findthem 서버 URL)
 */
import { logError } from "@/utils/logger";

const API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL ?? "";
const APP_KEY = process.env.EXPO_PUBLIC_RECOMMENDATION_APP_KEY ?? "";

export interface RecommendationItem {
  id: string;
  type: "festival" | "camping" | "performance";
  title: string;
  addr: string;
  region: string;
  startDate: string | null;
  endDate: string | null;
  image: string | null;
  meta: Record<string, string> | null;
  score: number;
  distKm: number;
  clicks: number;
}

export interface SocialProof {
  date: string;
  region: string;
  totalImpressions: number;
  festivalClicks: number;
  campingClicks: number;
  topContent: { title: string; type: string } | null;
}

/** 서버 추천 API 호출 — 스코어링된 최적 1개 + 대안 2개 */
export async function fetchRecommendation(
  lat: number,
  lon: number,
  condition: string,
  feelsLike: number,
  deviceId?: string,
): Promise<{ recommendation: RecommendationItem | null; alternatives: RecommendationItem[] }> {
  if (!API_URL) return { recommendation: null, alternatives: [] };

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      condition,
      feelsLike: String(feelsLike),
    });
    if (deviceId) params.set("deviceId", deviceId);

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_URL}/malgeum/recommendations?${params.toString()}`, {
      headers: { "x-app-key": APP_KEY },
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return { recommendation: null, alternatives: [] };
    return await res.json();
  } catch (e) {
    logError("general", e);
    return { recommendation: null, alternatives: [] };
  }
}

/** 소셜 프루프 조회 — "오늘 N명이 봤어요" */
export async function fetchSocialProof(region: string): Promise<SocialProof | null> {
  if (!API_URL) return null;

  try {
    const params = new URLSearchParams({ region });
    const sc = new AbortController();
    const st = setTimeout(() => sc.abort(), 5000);
    const res = await fetch(`${API_URL}/malgeum/social?${params.toString()}`, {
      headers: { "x-app-key": APP_KEY },
      signal: sc.signal,
    });
    clearTimeout(st);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** 클릭 기록 */
export async function recordClick(contentId: string, deviceId: string, source: "greeting" | "banner" = "banner"): Promise<void> {
  if (!API_URL) return;

  try {
    const cc = new AbortController();
    const ct = setTimeout(() => cc.abort(), 5000);
    await fetch(`${API_URL}/malgeum/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-key": APP_KEY },
      body: JSON.stringify({ contentId, deviceId, source }),
      signal: cc.signal,
    });
    clearTimeout(ct);
  } catch { /* fire-and-forget */ }
}
