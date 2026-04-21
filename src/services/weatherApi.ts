import type {
  CurrentWeather,
  HourlyWeather,
  HourlyAirQuality,
  DailyWeather,
  AirQuality,
  AirGrade,
  PollenData,
  HourlyUv,
  WeatherBundle,
  WeatherCondition,
} from "@/types/weather";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { getPollenStatus } from "@/utils/weather";
import { logError } from "@/utils/logger";
import { dateKey } from "@/utils/date";
import { fetchAirKorea, type AirKoreaReport } from "@/services/kskillProxy";

const API_BASE = "https://api.openweathermap.org/data/2.5";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? "";
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10분
const FETCH_TIMEOUT_MS = 8_000;
// Open-Meteo는 OWM과 병렬 fetch되므로 더 짧은 timeout — 느려도 OWM 폴백으로 빠르게 전환
const OPEN_METEO_TIMEOUT_MS = 4_000;
const FORECAST_DAYS = 7;
// API에 여유분 1일 추가 요청 — 늦은 시간 호출 시 오늘이 잘려 6개만 오는 문제 방지
const OPEN_METEO_FETCH_DAYS = 8;

// ──────────────────────────── OpenWeatherMap Raw Types ────────────────────────────

interface OWMWeatherItem { id: number; description: string; icon: string }
interface OWMCurrentRaw {
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: OWMWeatherItem[];
  sys: { sunrise: number; sunset: number };
  clouds?: { all: number };
  rain?: { "1h"?: number };
}
interface OWMForecastItem {
  dt: number;
  main: { temp: number; feels_like: number };
  weather: OWMWeatherItem[];
  pop?: number;
}
interface OWMForecastRaw { list: OWMForecastItem[] }
interface OWMAirItem { dt: number; main: { aqi: number }; components: { pm2_5: number; pm10: number } }
interface OWMAirRaw { list: OWMAirItem[] }

// Open-Meteo daily — 7일 예보 (OWM 무료 API의 5일 제약 해결용)
interface OpenMeteoDailyRaw {
  daily: {
    time: string[];                          // ["YYYY-MM-DD", ...]
    weather_code: number[];                  // WMO code
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[]; // 0~100
  };
}

async function fetchWithTimeout<T>(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────── Public API ────────────────────────────

export async function fetchWeatherData(
  lat: number,
  lon: number,
  locationName?: string,
): Promise<WeatherBundle> {
  const [current, forecast, airKorea, airQualityOwm, airForecastOwm, uvIndex, openMeteoDaily, hourlyUvRaw] = await Promise.all([
    fetchCurrentWeather(lat, lon),
    fetchForecast(lat, lon),
    locationName ? fetchAirKorea(locationName).catch(() => null) : Promise.resolve(null),
    fetchAirQuality(lat, lon).catch(() => null),
    fetchAirQualityForecast(lat, lon).catch(() => null),
    fetchUvIndex(lat, lon).catch(() => 0),
    fetchOpenMeteoDaily(lat, lon).catch((e: unknown) => {
      logError("weather-api", e);
      return null;
    }),
    fetchOpenMeteoHourlyUv(lat, lon).catch(() => null),
  ]);
  return normalizeWeatherData(current, forecast, airKorea, airQualityOwm, airForecastOwm, uvIndex, openMeteoDaily, hourlyUvRaw);
}

// in-flight 요청 중복 방지: 동일 좌표 동시 호출 시 하나의 Promise 공유
let inflightKey = "";
let inflightRequest: Promise<WeatherBundle> | null = null;

export async function fetchWithCache(
  lat: number,
  lon: number,
  force = false,
  locationName?: string,
): Promise<WeatherBundle> {
  if (!force) {
    const cached = await loadJson<WeatherBundle & { _lat?: number; _lon?: number } | null>(
      STORAGE_KEYS.WEATHER_CACHE,
      null
    );
    if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
      // 좌표가 다르면 캐시 무효 (위치 이동 시)
      const sameLoc = cached._lat == null || (
        Math.abs((cached._lat ?? 0) - lat) < 0.005 &&
        Math.abs((cached._lon ?? 0) - lon) < 0.005
      );
      if (sameLoc) return cached;
    }
  }

  // 동일 좌표로 진행 중인 요청이 있으면 재사용
  const key = `${lat},${lon}`;
  if (inflightRequest && inflightKey === key) return inflightRequest;

  inflightKey = key;
  inflightRequest = fetchWeatherData(lat, lon, locationName)
    .then(async (data) => {
      await saveJson(STORAGE_KEYS.WEATHER_CACHE, { ...data, _lat: lat, _lon: lon });
      return data;
    })
    .finally(() => {
      inflightRequest = null;
      inflightKey = "";
    });

  return inflightRequest;
}

// ──────────────────────────── Raw API Calls ────────────────────────────

async function fetchCurrentWeather(lat: number, lon: number): Promise<OWMCurrentRaw> {
  return fetchWithTimeout<OWMCurrentRaw>(`${API_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${API_KEY}`);
}

async function fetchForecast(lat: number, lon: number): Promise<OWMForecastRaw> {
  return fetchWithTimeout<OWMForecastRaw>(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${API_KEY}`);
}

async function fetchAirQuality(lat: number, lon: number): Promise<OWMAirRaw> {
  return fetchWithTimeout<OWMAirRaw>(`${API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
}

async function fetchAirQualityForecast(lat: number, lon: number): Promise<OWMAirRaw> {
  return fetchWithTimeout<OWMAirRaw>(`${API_BASE}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
}

async function fetchOpenMeteoDaily(lat: number, lon: number): Promise<OpenMeteoDailyRaw> {
  const params = `latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&past_days=1&forecast_days=${OPEN_METEO_FETCH_DAYS}`;
  return fetchWithTimeout<OpenMeteoDailyRaw>(`${OPEN_METEO_BASE}?${params}`, OPEN_METEO_TIMEOUT_MS);
}

interface OpenMeteoHourlyUvRaw {
  hourly: { time: string[]; uv_index: number[] };
}

async function fetchOpenMeteoHourlyUv(lat: number, lon: number): Promise<OpenMeteoHourlyUvRaw | null> {
  try {
    const params = `latitude=${lat}&longitude=${lon}&hourly=uv_index&timezone=auto&forecast_days=2`;
    return await fetchWithTimeout<OpenMeteoHourlyUvRaw>(`${OPEN_METEO_BASE}?${params}`, OPEN_METEO_TIMEOUT_MS);
  } catch {
    return null;
  }
}

async function fetchUvIndex(lat: number, lon: number): Promise<number> {
  // OneCall 3.0 (유료) 없이 UV 추정: 계절 + 위도 + 시간대 + 날씨 기반
  // OpenWeatherMap /uvi 엔드포인트는 deprecated 됨
  return estimateUvIndex(lat);
}

function estimateUvIndex(lat: number): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();
  const absLat = Math.abs(lat);

  // 야간은 UV 0
  if (hour < 6 || hour > 19) return 0;

  // 위도별 기본값
  let base: number;
  if (absLat < 23) base = 8;
  else if (absLat < 45) base = 5;
  else base = 3;

  // 계절 보정 (북반구 기준, 남반구는 반전)
  const summerMonths = lat >= 0 ? [5, 6, 7] : [11, 0, 1];
  const winterMonths = lat >= 0 ? [11, 0, 1] : [5, 6, 7];
  if (summerMonths.includes(month)) base += 2;
  else if (winterMonths.includes(month)) base -= 2;

  // 시간대 보정: 정오에 피크, 아침/저녁 낮음
  const hourFactor = 1 - Math.abs(hour - 13) / 7; // 13시 피크
  base = Math.round(base * Math.max(0.2, hourFactor));

  return Math.max(0, Math.min(11, base));
}

// ──────────────────────────── Normalization ────────────────────────────

function mapCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) {
    if (id === 761 || id === 762) return "dust";
    return "fog";
  }
  if (id === 800) return "clear";
  return "clouds";
}

// Open-Meteo WMO 코드 → WeatherCondition
// https://open-meteo.com/en/docs (weather_code)
function mapWmoCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2 || code === 3) return "clouds";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "clouds";
}


function mapAirGrade(aqi: number): AirGrade {
  if (aqi <= 1) return "good";
  if (aqi <= 2) return "moderate";
  if (aqi <= 3) return "unhealthy";
  if (aqi <= 4) return "veryUnhealthy";
  return "hazardous";
}

function buildDailyFromOpenMeteo(raw: OpenMeteoDailyRaw): { daily: DailyWeather[]; yesterdayMax: number | null } {
  const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = raw.daily;

  // past_days=1 사용 시 time[0]은 어제 날짜 — today와 비교해 감지
  const todayStr = dateKey();
  const startIdx = time[0] !== todayStr ? 1 : 0;
  const yesterdayMax = startIdx === 1 ? Math.round(temperature_2m_max[0]) : null;

  const out: DailyWeather[] = [];
  for (let i = startIdx; i < time.length && out.length < FORECAST_DAYS; i += 1) {
    const [y, m, d] = time[i].split("-").map(Number);
    // 정오 기준 timestamp — timezone shift로 인한 day boundary 회피
    const dt = Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
    out.push({
      dt,
      tempMin: Math.round(temperature_2m_min[i]),
      tempMax: Math.round(temperature_2m_max[i]),
      condition: mapWmoCondition(weather_code[i]),
      precipitation: Math.round(precipitation_probability_max[i] ?? 0),
    });
  }
  return { daily: out, yesterdayMax };
}

function buildDailyFromOwm(forecastRaw: OWMForecastRaw): DailyWeather[] {
  type DayEntry = { temps: number[]; conditions: number[]; pops: number[]; dt: number };
  const dailyMap = new Map<string, DayEntry>();
  for (const h of forecastRaw.list) {
    const dateKey = new Date(h.dt * 1000).toLocaleDateString("ko-KR");
    const existing = dailyMap.get(dateKey);
    const entry: DayEntry = existing ?? { temps: [], conditions: [], pops: [], dt: h.dt };
    entry.temps.push(h.main.temp);
    entry.conditions.push(h.weather[0].id);
    entry.pops.push(h.pop ?? 0);
    dailyMap.set(dateKey, entry);
  }
  return Array.from(dailyMap.values())
    .slice(0, FORECAST_DAYS)
    .map((d) => ({
      dt: d.dt,
      tempMin: Math.round(Math.min(...d.temps)),
      tempMax: Math.round(Math.max(...d.temps)),
      condition: mapCondition(d.conditions[Math.floor(d.conditions.length / 2)]),
      precipitation: Math.round(Math.max(...d.pops) * 100),
    }));
}

// 에어코리아 등급(1~4) → 앱 AirGrade / AQI
const AIR_KOREA_GRADE: Record<number, AirGrade> = { 1: "good", 2: "moderate", 3: "unhealthy", 4: "veryUnhealthy" };
const mapAirKoreaGrade = (g: number | null): AirGrade => (g != null ? AIR_KOREA_GRADE[g] : undefined) ?? "hazardous";
const airKoreaGradeToAqi = (g: number | null): number => (g && g >= 1 && g <= 4) ? g : 5;

function buildHourlyAir(raw: OWMAirRaw | null): HourlyAirQuality[] {
  if (!raw?.list?.length) return [];
  const now = Math.floor(Date.now() / 1000);
  // 현재 ~ +24h 범위의 데이터를 3시간 간격으로 필터 (weather forecast 시간 슬롯과 유사)
  const endTime = now + 24 * 3600;
  const filtered = raw.list.filter((item) => item.dt >= now - 1800 && item.dt <= endTime);
  // OWM air forecast는 1시간 간격 → 3시간 간격으로 샘플링 (8개)
  const result: HourlyAirQuality[] = [];
  let lastDt = 0;
  for (const item of filtered) {
    if (result.length >= 12) break;
    if (item.dt - lastDt < 2 * 3600) continue; // ~3h 간격
    result.push({ dt: item.dt, pm25: item.components.pm2_5, pm10: item.components.pm10 });
    lastDt = item.dt;
  }
  return result;
}

function normalizeWeatherData(
  currentRaw: OWMCurrentRaw,
  forecastRaw: OWMForecastRaw,
  airKorea: AirKoreaReport | null,
  airRaw: OWMAirRaw | null,
  airForecastRaw: OWMAirRaw | null,
  uvIndex: number,
  openMeteoDaily: OpenMeteoDailyRaw | null,
  hourlyUvRaw: OpenMeteoHourlyUvRaw | null,
): WeatherBundle {
  const current: CurrentWeather = {
    temp: Math.round(currentRaw.main.temp),
    feelsLike: Math.round(currentRaw.main.feels_like),
    humidity: currentRaw.main.humidity,
    windSpeed: currentRaw.wind.speed,
    condition: mapCondition(currentRaw.weather[0].id),
    description: currentRaw.weather[0].description,
    icon: currentRaw.weather[0].icon,
    uvIndex,
    precipitation: currentRaw.rain?.["1h"] ? 100 : ((currentRaw.clouds?.all ?? 0) > 80 ? 60 : 0),
    sunrise: currentRaw.sys.sunrise,
    sunset: currentRaw.sys.sunset,
  };

  const hourly: HourlyWeather[] = forecastRaw.list.slice(0, 8).map((h) => ({
    dt: h.dt,
    temp: Math.round(h.main.temp),
    feelsLike: Math.round(h.main.feels_like),
    condition: mapCondition(h.weather[0].id),
    precipitation: Math.round((h.pop ?? 0) * 100),
    icon: h.weather[0].icon,
  }));

  // 일별 7일 예보: Open-Meteo (무료 7일 daily). 실패 시 OWM 5일 forecast로 폴백.
  const { daily, yesterdayMax } = openMeteoDaily
    ? buildDailyFromOpenMeteo(openMeteoDaily)
    : { daily: buildDailyFromOwm(forecastRaw), yesterdayMax: null };

  // 에어코리아 우선 → OWM 폴백 (에어코리아가 한국 실측 데이터로 더 정확)
  let airQuality: AirQuality | null = null;
  if (airKorea && (airKorea.pm25Value != null || airKorea.pm10Value != null)) {
    const grade = airKorea.pm25Grade ?? airKorea.khaiGrade;
    airQuality = {
      pm25: airKorea.pm25Value ?? 0,
      pm10: airKorea.pm10Value ?? 0,
      aqi: airKoreaGradeToAqi(grade),
      grade: mapAirKoreaGrade(grade),
    };
  } else if (airRaw?.list?.[0]) {
    const aq = airRaw.list[0];
    airQuality = {
      pm25: aq.components.pm2_5,
      pm10: aq.components.pm10,
      aqi: aq.main.aqi,
      grade: mapAirGrade(aq.main.aqi),
    };
  }

  // 꽃가루 지수: 기상 조건 기반 추정
  const pollenRaw = getPollenStatus(
    current.temp,
    current.humidity,
    current.windSpeed,
    current.condition,
  );
  const pollen: PollenData = {
    score: Math.round(pollenRaw.progress * 10),
    label: pollenRaw.label,
    description: pollenRaw.description,
    grade: pollenRaw.progress <= 0.2 ? "low" : pollenRaw.progress <= 0.5 ? "moderate" : pollenRaw.progress <= 0.7 ? "high" : "veryHigh",
  };

  const hourlyAir = buildHourlyAir(airForecastRaw);

  // 시간별 UV (Open-Meteo) — 현재 이후 ~36시간, 3시간 간격으로 샘플링 (기온/미세먼지와 동일 범위)
  const hourlyUv: HourlyUv[] = [];
  if (hourlyUvRaw?.hourly) {
    const nowMs = Date.now();
    const { time, uv_index } = hourlyUvRaw.hourly;
    let lastDt = 0;
    for (let i = 0; i < time.length && hourlyUv.length < 12; i++) {
      const dt = new Date(time[i]).getTime() / 1000;
      if (dt * 1000 < nowMs - 3600_000) continue;
      if (lastDt && dt - lastDt < 2 * 3600) continue;
      hourlyUv.push({ dt, uvIndex: Math.round(uv_index[i] * 10) / 10 });
      lastDt = dt;
    }
  }

  return { current, hourly, daily, airQuality, hourlyAir, hourlyUv, pollen, fetchedAt: Date.now(), yesterdayActualMax: yesterdayMax ?? undefined };
}
