/**
 * k-skill-proxy 클라이언트
 * 에어코리아 미세먼지, 서울 지하철 도착정보, 급식 식단 조회
 * https://github.com/NomaDamas/k-skill
 */
import { logError } from "@/utils/logger";

const PROXY_BASE =
  process.env.EXPO_PUBLIC_KSKILL_PROXY_URL ?? "https://k-skill-proxy.nomadamas.org";

const TIMEOUT_MS = 5_000;

// ──────────────────────────── Common ────────────────────────────

async function proxyGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const url = `${PROXY_BASE}${path}?${qs}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`k-skill ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────── 미세먼지 (에어코리아) ────────────────────────────

export interface AirKoreaReport {
  stationName: string;
  dataTime: string;
  pm10Value: number | null;
  pm25Value: number | null;
  pm10Grade: number | null;  // 1좋음 2보통 3나쁨 4매우나쁨
  pm25Grade: number | null;
  khaiGrade: number | null;  // 통합대기등급
}

interface AirKoreaRawResponse {
  stationName?: string;
  dataTime?: string;
  pm10Value?: string | number | null;
  pm25Value?: string | number | null;
  pm10Grade?: string | number | null;
  pm25Grade?: string | number | null;
  khaiGrade?: string | number | null;
  // ambiguous일 때
  ambiguous_location?: boolean;
  candidate_stations?: string[];
}

function parseNum(v: string | number | null | undefined): number | null {
  if (v == null || v === "-" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function fetchAirKorea(regionHint: string): Promise<AirKoreaReport | null> {
  try {
    const raw = await proxyGet<AirKoreaRawResponse>("/v1/fine-dust/report", { regionHint });
    if (raw.ambiguous_location) {
      // 모호한 지역명 — 첫 번째 후보로 재시도
      const first = raw.candidate_stations?.[0];
      if (!first) return null;
      const retry = await proxyGet<AirKoreaRawResponse>("/v1/fine-dust/report", { stationName: first });
      return normalizeAirKorea(retry);
    }
    return normalizeAirKorea(raw);
  } catch (e: unknown) {
    logError("weather-api", e);
    return null;
  }
}

function normalizeAirKorea(raw: AirKoreaRawResponse): AirKoreaReport | null {
  if (!raw.stationName) return null;
  return {
    stationName: raw.stationName,
    dataTime: raw.dataTime ?? "",
    pm10Value: parseNum(raw.pm10Value),
    pm25Value: parseNum(raw.pm25Value),
    pm10Grade: parseNum(raw.pm10Grade),
    pm25Grade: parseNum(raw.pm25Grade),
    khaiGrade: parseNum(raw.khaiGrade),
  };
}

// ──────────────────────────── 지하철 도착정보 ────────────────────────────

export interface SubwayArrival {
  line: string;           // "2호선"
  direction: string;      // "외선" / "내선" / "상행" / "하행"
  message: string;        // "잠실 도착" / "전역 출발"
  arrivalSec: number;     // 도착 예정 초
  trainDestination: string; // 종착역
}

interface SubwayRawItem {
  subwayId?: string;
  updnLine?: string;
  arvlMsg2?: string;
  arvlMsg3?: string;
  barvlDt?: string;
  bstatnNm?: string;
  trainLineNm?: string;
}

interface SubwayRawResponse {
  realtimeArrivalList?: SubwayRawItem[];
  errorMessage?: { status?: number; message?: string };
}

export async function fetchSubwayArrival(stationName: string): Promise<SubwayArrival[]> {
  try {
    const raw = await proxyGet<SubwayRawResponse>("/v1/seoul-subway/arrival", { stationName });
    if (!raw.realtimeArrivalList?.length) return [];
    return raw.realtimeArrivalList.map((item) => ({
      line: item.trainLineNm?.split(" ")[0] ?? "",
      direction: item.updnLine ?? "",
      message: item.arvlMsg2 ?? "",
      arrivalSec: Number(item.barvlDt) || 0,
      trainDestination: item.bstatnNm ?? "",
    }));
  } catch (e: unknown) {
    logError("general", e);
    return [];
  }
}

// ──────────────────────────── 급식 식단 ────────────────────────────

export interface SchoolLunchMenu {
  date: string;           // "20260414"
  mealType: string;       // "중식"
  dishes: string[];       // ["밥", "된장찌개", ...]
  calorie: string;        // "654.2 Kcal"
}

interface SchoolSearchRow {
  ATPT_OFCDC_SC_CODE: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  ORG_RDNMA?: string;
}

interface SchoolSearchResponse {
  schoolInfo?: Array<{ row?: SchoolSearchRow[] }>;
  resolved_education_office?: { atpt_ofcdc_sc_code: string };
  ambiguous_education_office?: boolean;
  candidate_codes?: Array<{ name: string; code: string }>;
}

interface MealRow {
  MLSV_YMD: string;
  MMEAL_SC_NM: string;
  DDISH_NM: string;
  CAL_INFO?: string;
}

interface MealResponse {
  mealServiceDietInfo?: Array<{ row?: MealRow[] }>;
}

export interface SchoolInfo {
  educationOfficeCode: string;
  schoolCode: string;
  schoolName: string;
}

export async function searchSchool(educationOffice: string, schoolName: string): Promise<SchoolInfo[]> {
  try {
    const raw = await proxyGet<SchoolSearchResponse>("/v1/neis/school-search", {
      educationOffice,
      schoolName,
    });
    const rows = raw.schoolInfo?.flatMap((s) => s.row ?? []) ?? [];
    return rows.map((r) => ({
      educationOfficeCode: r.ATPT_OFCDC_SC_CODE,
      schoolCode: r.SD_SCHUL_CODE,
      schoolName: r.SCHUL_NM,
    }));
  } catch (e: unknown) {
    logError("general", e);
    return [];
  }
}

export async function fetchSchoolLunch(
  educationOfficeCode: string,
  schoolCode: string,
  mealDate: string,
): Promise<SchoolLunchMenu[]> {
  try {
    const raw = await proxyGet<MealResponse>("/v1/neis/school-meal", {
      educationOfficeCode,
      schoolCode,
      mealDate,
    });
    const rows = raw.mealServiceDietInfo?.flatMap((m) => m.row ?? []) ?? [];
    return rows.map((r) => ({
      date: r.MLSV_YMD,
      mealType: r.MMEAL_SC_NM,
      dishes: r.DDISH_NM.replace(/<br\/>/g, "\n").split("\n").map((d) => d.replace(/\([\d.]+\)/g, "").trim()).filter(Boolean),
      calorie: r.CAL_INFO ?? "",
    }));
  } catch (e: unknown) {
    logError("general", e);
    return [];
  }
}
