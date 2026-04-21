/**
 * 한국관광공사 TourAPI — 주변 축제/행사 조회
 * locale === "ko" 전용. 영어 빌드에서는 호출하지 않음.
 *
 * 환경변수: EXPO_PUBLIC_TOUR_API_KEY (공공데이터포털 발급)
 */
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";
import { logError } from "@/utils/logger";
import { haversineKm, shortAddr as shortAddrUtil, dateCompact } from "@/utils/geo";
import { toHttps } from "@/utils/url";

const API_KEY = process.env.EXPO_PUBLIC_TOUR_API_KEY ?? "";
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12시간
const RADIUS_KM = 50; // 50km (클라이언트 필터)
const FETCH_ROWS = 50; // 전국 조회 후 거리 필터
const MAX_RESULTS = 10;

export interface FestivalItem {
  title: string;
  addr: string;        // 주소 (시/군/구)
  startDate: string;   // "YYYYMMDD"
  endDate: string;     // "YYYYMMDD"
  image?: string;      // 대표 이미지 URL
  tel?: string;
  dist?: number;       // 거리 (m)
  mapX?: number;
  mapY?: number;
  url?: string;        // Visit Korea 상세 페이지
}

interface CachedFestivals {
  date: string;
  lat: number;
  lon: number;
  items: FestivalItem[];
  fetchedAt: number;
}


/** 주변 축제/행사 조회 (12h 캐시) */
export async function fetchNearbyFestivals(
  lat: number,
  lon: number,
): Promise<FestivalItem[]> {
  if (!API_KEY) return [];

  // 캐시 확인
  const cached = await loadJson<CachedFestivals | null>(STORAGE_KEYS.FESTIVAL_CACHE, null);
  if (
    cached &&
    cached.items.length > 0 && // 빈 결과 캐시 무시 — 이전 API 실패로 빈 배열 저장됐을 수 있음
    cached.date === todayKey() &&
    Date.now() - cached.fetchedAt < CACHE_TTL &&
    haversineKm(lat, lon, cached.lat, cached.lon) < 10
  ) {
    return cached.items;
  }

  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // searchFestival2는 날짜 기반 전국 검색 — GPS 파라미터(mapX/mapY/radius/listYN) 미지원
    // 전국에서 가져온 후 클라이언트에서 haversineKm()으로 거리 필터 + 정렬
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      numOfRows: String(FETCH_ROWS),
      pageNo: "1",
      MobileOS: "ETC",
      MobileApp: "malgeum",
      _type: "json",
      arrange: "A",
      eventStartDate: dateCompact(now),
      eventEndDate: dateCompact(weekLater),
    });

    const url = `${BASE_URL}/searchFestival2?${params.toString()}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) return cached?.items ?? [];

    const json = await res.json();
    const body = json?.response?.body;
    const rawItems = body?.items?.item;
    if (!rawItems) return [];

    const allItems: FestivalItem[] = (Array.isArray(rawItems) ? rawItems : [rawItems])
      .map((item: Record<string, string>) => {
        const fmapX = item.mapx ? Number(item.mapx) : undefined;
        const fmapY = item.mapy ? Number(item.mapy) : undefined;
        const distKm = (fmapX && fmapY) ? haversineKm(lat, lon, fmapY, fmapX) : undefined;
        const contentId = item.contentid;
        return {
          title: item.title ?? "",
          addr: item.addr1 ?? "",
          startDate: item.eventstartdate ?? "",
          endDate: item.eventenddate ?? "",
          image: toHttps(item.firstimage || item.firstimage2) || undefined,
          tel: item.tel || undefined,
          dist: distKm ? Math.round(distKm * 1000) : undefined, // km → m
          mapX: fmapX,
          mapY: fmapY,
          url: contentId ? `https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=${contentId}` : undefined,
        };
      })
      .filter((f) => f.dist !== undefined && f.dist <= RADIUS_KM * 1000)
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));

    const items = allItems.slice(0, MAX_RESULTS);

    await saveJson(STORAGE_KEYS.FESTIVAL_CACHE, {
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

/** 캐시된 축제 데이터 로드 (네트워크 없이) */
export async function loadCachedFestivals(): Promise<FestivalItem[]> {
  const cached = await loadJson<CachedFestivals | null>(STORAGE_KEYS.FESTIVAL_CACHE, null);
  if (!cached || cached.date !== todayKey()) return [];
  return cached.items;
}

/** 축제 날짜를 "4/12~4/17" 형태로 포맷 */
export function formatFestivalPeriod(startDate: string, endDate: string): string {
  if (!startDate) return "";
  const s = `${Number(startDate.slice(4, 6))}/${Number(startDate.slice(6, 8))}`;
  if (!endDate || startDate === endDate) return s;
  const e = `${Number(endDate.slice(4, 6))}/${Number(endDate.slice(6, 8))}`;
  return `${s}~${e}`;
}

/** 축제의 짧은 주소 (시/구 까지만) */
export { shortAddrUtil as shortAddr };
