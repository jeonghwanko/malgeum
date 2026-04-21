/**
 * KOPIS 공연예술통합전산망 — 근처 공연 조회
 * locale === "ko" 전용.
 *
 * 환경변수: EXPO_PUBLIC_KOPIS_API_KEY (kopis.or.kr 발급)
 * 응답 형식: XML → 간이 파싱
 */
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";
import { logError } from "@/utils/logger";
import { dateCompact } from "@/utils/geo";
import { toHttps } from "@/utils/url";

const API_KEY = process.env.EXPO_PUBLIC_KOPIS_API_KEY ?? "";
const BASE_URL = "https://kopis.or.kr/openApi/restful/pblprfr";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12시간

/** 장르 코드 → 라벨 */
const GENRE_MAP: Record<string, string> = {
  AAAA: "연극",
  GGGA: "뮤지컬",
  CCCA: "클래식",
  BBBA: "무용",
  EEEA: "복합",
  CCCC: "국악",
};

/** 날씨 조건별 추천 장르 (실내 우선) */
const WEATHER_GENRE: Record<string, string[]> = {
  rain:         ["GGGA", "AAAA", "CCCA"], // 뮤지컬, 연극, 클래식
  drizzle:      ["GGGA", "AAAA", "CCCA"],
  thunderstorm: ["GGGA", "AAAA"],
  snow:         ["GGGA", "CCCA", "AAAA"],
  dust:         ["GGGA", "AAAA", "CCCA"],
  fog:          ["AAAA", "CCCA"],
  clouds:       ["AAAA", "CCCA", "GGGA"], // 감성적 — 연극, 클래식
  clear:        ["GGGA", "AAAA", "CCCA", "BBBA"], // 전체
};

export interface PerformanceItem {
  id: string;
  title: string;
  venue: string;      // 공연장 이름
  startDate: string;  // "YYYY.MM.DD"
  endDate: string;
  genre: string;      // "뮤지컬", "연극" 등
  poster?: string;    // 포스터 URL
  url?: string;       // KOPIS 상세 페이지
}

interface CachedPerformances {
  date: string;
  signguCode: string;
  items: PerformanceItem[];
  fetchedAt: number;
}

/** GPS → KOPIS 지역코드 (시/도 단위, 간이 매핑) */
function getSignguCode(lat: number, lon: number): string {
  // 서울: 11, 경기: 41, 인천: 28, 부산: 26, 대구: 27, 광주: 29, 대전: 30, 울산: 31, 세종: 36
  // 강원: 42, 충북: 43, 충남: 44, 전북: 45, 전남: 46, 경북: 47, 경남: 48, 제주: 50
  if (lat >= 37.4 && lat <= 37.7 && lon >= 126.8 && lon <= 127.2) return "11"; // 서울
  if (lat >= 37.0 && lat <= 37.9 && lon >= 126.5 && lon <= 127.8) return "41"; // 경기
  if (lat >= 37.3 && lat <= 37.6 && lon >= 126.3 && lon <= 126.8) return "28"; // 인천
  if (lat >= 34.9 && lat <= 35.3 && lon >= 128.8 && lon <= 129.3) return "26"; // 부산
  if (lat >= 35.7 && lat <= 36.0 && lon >= 128.4 && lon <= 128.8) return "27"; // 대구
  if (lat >= 35.0 && lat <= 35.3 && lon >= 126.7 && lon <= 127.0) return "29"; // 광주
  if (lat >= 36.2 && lat <= 36.5 && lon >= 127.2 && lon <= 127.5) return "30"; // 대전
  return "11"; // 기본값 서울
}

/** XML HTML entities 디코딩 */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** XML에서 태그 값 추출 (간이 파서) */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : "";
}

/** XML 아이템 목록 추출 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<db>([\s\S]*?)<\/db>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

/** 날씨 조건에 맞는 장르 코드 반환 */
export function getRecommendedGenres(condition: string): string[] {
  return WEATHER_GENRE[condition] ?? WEATHER_GENRE.clear;
}

/** 장르 코드 → 한글 라벨 */
export function getGenreLabel(code: string): string {
  return GENRE_MAP[code] ?? "공연";
}

/** 공연 목록 조회 (12h 캐시) */
export async function fetchPerformances(
  lat: number,
  lon: number,
  condition: string,
): Promise<PerformanceItem[]> {
  if (!API_KEY) return [];

  const signguCode = getSignguCode(lat, lon);

  // 캐시 확인
  const cached = await loadJson<CachedPerformances | null>(STORAGE_KEYS.PERFORMANCE_CACHE, null);
  if (
    cached &&
    cached.items.length > 0 &&
    cached.date === todayKey() &&
    cached.signguCode === signguCode &&
    Date.now() - cached.fetchedAt < CACHE_TTL
  ) {
    return cached.items;
  }

  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const genres = getRecommendedGenres(condition);

    // 추천 장르 중 첫 번째로 조회 (API 호출 최소화)
    const params = new URLSearchParams({
      service: API_KEY,
      stdate: dateCompact(now),
      eddate: dateCompact(weekLater),
      cpage: "1",
      rows: "10",
      signgucode: signguCode,
      kidstate: "02", // 공연중
      shcate: genres[0], // 추천 1순위 장르
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) return cached?.items ?? [];

    const xml = await res.text();
    const rawItems = extractItems(xml);

    const items: PerformanceItem[] = rawItems.slice(0, 5).map((item) => {
      const perfId = extractTag(item, "mt20id");
      const posterUrl = extractTag(item, "poster");
      return {
        id: perfId,
        title: extractTag(item, "prfnm"),
        venue: extractTag(item, "fcltynm"),
        startDate: extractTag(item, "prfpdfrom"),
        endDate: extractTag(item, "prfpdto"),
        genre: GENRE_MAP[genres[0]] ?? "공연",
        poster: toHttps(posterUrl) || undefined,
        url: perfId ? `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${perfId}` : undefined,
      };
    });

    await saveJson(STORAGE_KEYS.PERFORMANCE_CACHE, {
      date: todayKey(),
      signguCode,
      items,
      fetchedAt: Date.now(),
    });

    return items;
  } catch (e) {
    logError("general", e);
    return cached?.items ?? [];
  }
}

/** 캐시된 공연 데이터 로드 (네트워크 없이) */
export async function loadCachedPerformances(): Promise<PerformanceItem[]> {
  const cached = await loadJson<CachedPerformances | null>(STORAGE_KEYS.PERFORMANCE_CACHE, null);
  if (!cached || cached.date !== todayKey()) return [];
  return cached.items;
}

/** 공연 기간 포맷 "4/12~5/30" */
export function formatPerfPeriod(startDate: string, endDate: string): string {
  if (!startDate) return "";
  // "2026.04.12" → "4/12"
  const parts = startDate.split(".");
  const s = parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : startDate;
  if (!endDate || startDate === endDate) return s;
  const eParts = endDate.split(".");
  const e = eParts.length >= 3 ? `${Number(eParts[1])}/${Number(eParts[2])}` : endDate;
  return `${s}~${e}`;
}
