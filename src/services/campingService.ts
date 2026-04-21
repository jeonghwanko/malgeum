/**
 * 고캠핑 API — 근처 캠핑장 조회
 * locale === "ko" 전용.
 * 날씨 조건: 맑음/흐림 + 체감 10°C 이상 + 비 없음 → 캠핑 추천
 *
 * 환경변수: EXPO_PUBLIC_TOUR_API_KEY (공공데이터포털 — 관광공사 키 공유)
 */
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";
import { logError } from "@/utils/logger";
import { haversineKm, shortAddr } from "@/utils/geo";
import { toHttps } from "@/utils/url";

const API_KEY = process.env.EXPO_PUBLIC_TOUR_API_KEY ?? "";
const BASE_URL = "https://apis.data.go.kr/B551011/GoCamping";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 (캠핑장은 변동 적음)
const RADIUS = 30000; // 30km
const MAX_RESULTS = 5;

export interface CampingItem {
  name: string;       // 캠핑장 이름
  addr: string;       // 주소
  type: string;       // "일반야영장", "자동차야영장", "글램핑" 등
  environment: string; // "산", "해변", "호수" 등
  tel?: string;
  image?: string;
  mapX?: number;
  mapY?: number;
  homepage?: string;   // 캠핑장 홈페이지
  reserveUrl?: string; // 예약 URL
}

interface CachedCamping {
  date: string;
  lat: number;
  lon: number;
  items: CampingItem[];
  fetchedAt: number;
}


/** 캠핑 추천 조건: 맑음/흐림 + 체감 10°C+ + 비 없음 */
export function isCampingWeather(condition: string, feelsLike: number, hasRain: boolean): boolean {
  if (hasRain) return false;
  if (feelsLike < 10) return false;
  return condition === "clear" || condition === "clouds";
}

/** 근처 캠핑장 조회 (24h 캐시) */
export async function fetchNearbyCamping(
  lat: number,
  lon: number,
): Promise<CampingItem[]> {
  if (!API_KEY) return [];

  // 캐시 확인
  const cached = await loadJson<CachedCamping | null>(STORAGE_KEYS.CAMPING_CACHE, null);
  if (
    cached &&
    cached.items.length > 0 &&
    cached.date === todayKey() &&
    Date.now() - cached.fetchedAt < CACHE_TTL &&
    haversineKm(lat, lon, cached.lat, cached.lon) < 10
  ) {
    return cached.items;
  }

  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      numOfRows: String(MAX_RESULTS),
      pageNo: "1",
      MobileOS: "ETC",
      MobileApp: "malgeum",
      _type: "json",
      mapX: String(lon),
      mapY: String(lat),
      radius: String(RADIUS),
    });

    const url = `${BASE_URL}/locationBasedList?${params.toString()}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) return cached?.items ?? [];

    const json = await res.json();
    const body = json?.response?.body;
    const rawItems = body?.items?.item;
    if (!rawItems) return [];

    const items: CampingItem[] = (Array.isArray(rawItems) ? rawItems : [rawItems]).map(
      (item: Record<string, string>) => ({
        name: item.facltNm ?? "",
        addr: item.addr1 ?? "",
        type: item.induty ?? "",
        environment: item.lctCl ?? "",
        tel: item.tel || undefined,
        image: toHttps(item.firstImageUrl) || undefined,
        mapX: item.mapX ? Number(item.mapX) : undefined,
        mapY: item.mapY ? Number(item.mapY) : undefined,
        homepage: item.homepage || undefined,
        reserveUrl: item.resveUrl || undefined,
      }),
    );

    await saveJson(STORAGE_KEYS.CAMPING_CACHE, {
      date: todayKey(),
      lat,
      lon,
      items,
      fetchedAt: Date.now(),
    });

    return items;
  } catch (e) {
    logError("general", e);
    return cached?.items ?? [];
  }
}

/** 캐시된 캠핑장 로드 (네트워크 없이) */
export async function loadCachedCamping(): Promise<CampingItem[]> {
  const cached = await loadJson<CachedCamping | null>(STORAGE_KEYS.CAMPING_CACHE, null);
  if (!cached || cached.date !== todayKey()) return [];
  return cached.items;
}

/** 캠핑장 짧은 주소 */
export { shortAddr as shortCampAddr };
