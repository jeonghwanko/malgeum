import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey, prevDayKey, countConsecutiveDays } from "@/utils/date";
import type {
  GameStats,
  PredictionChoice,
  PredictionEntry,
  PredictionResult,
} from "@/types/predictionGame";

const MAX_ENTRIES = 90;
const MAX_WEEKLY_MAX_DAYS = 30;

type WeeklyMaxMap = Record<string, number>;

// 이번주 월요일 키 (월~일 단위)
export function getWeekStartMonday(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0=일, 1=월
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ─────────────── WEEKLY_MAX (게임 정산 + 주간 탭 어제 행 공유) ───────────────

export async function loadWeeklyMaxMap(): Promise<WeeklyMaxMap> {
  return loadJson<WeeklyMaxMap>(STORAGE_KEYS.WEEKLY_MAX, {});
}

function trimWeeklyMaxMap(map: WeeklyMaxMap): WeeklyMaxMap {
  const keys = Object.keys(map);
  if (keys.length <= MAX_WEEKLY_MAX_DAYS) return map;
  const keep = keys.sort().slice(-MAX_WEEKLY_MAX_DAYS);
  const trimmed: WeeklyMaxMap = {};
  for (const k of keep) trimmed[k] = map[k];
  return trimmed;
}

export async function loadWeeklyForecastMap(): Promise<WeeklyMaxMap> {
  return loadJson<WeeklyMaxMap>(STORAGE_KEYS.WEEKLY_FORECAST, {});
}

/**
 * 한 번의 weather refresh에서 발생하는 모든 WEEKLY_MAX + WEEKLY_FORECAST 갱신을 atomic하게 처리.
 *
 * @param actualToday  오늘의 실측 기온 (currentWeather.temp). undefined면 스킵.
 * @param futureMaxByDate  D+1..D+6 forecast max (date key → tempMax)
 * @param todayForecastMax  오늘의 예보 최고기온 (첫 기록만 저장)
 * @returns 변경 사항이 있어 저장이 발생했는지 여부
 */
export async function recordWeatherSnapshot(
  actualToday: number | undefined,
  futureMaxByDate: Record<string, number>,
  todayForecastMax?: number,
): Promise<boolean> {
  const [map, forecastMap] = await Promise.all([loadWeeklyMaxMap(), loadWeeklyForecastMap()]);
  let changed = false;

  if (typeof actualToday === "number" && Number.isFinite(actualToday)) {
    const today = todayKey();
    const next = Math.round(actualToday);
    const prev = map[today];
    if (prev === undefined || next > prev) {
      map[today] = next;
      changed = true;
    }
  }

  for (const [date, max] of Object.entries(futureMaxByDate)) {
    if (!Number.isFinite(max)) continue;
    const rounded = Math.round(max);
    if (map[date] !== rounded) {
      map[date] = rounded;
      changed = true;
    }
  }

  if (changed) {
    await saveJson(STORAGE_KEYS.WEEKLY_MAX, trimWeeklyMaxMap(map));
  }

  // forecast 원본 저장 (첫 기록만 — 실측으로 덮어쓰지 않음)
  let fcChanged = false;
  const today = todayKey();
  if (typeof todayForecastMax === "number" && Number.isFinite(todayForecastMax) && forecastMap[today] === undefined) {
    forecastMap[today] = Math.round(todayForecastMax);
    fcChanged = true;
  }
  for (const [date, max] of Object.entries(futureMaxByDate)) {
    if (!Number.isFinite(max)) continue;
    const rounded = Math.round(max);
    if (forecastMap[date] === undefined) {
      forecastMap[date] = rounded;
      fcChanged = true;
    }
  }
  if (fcChanged) {
    await saveJson(STORAGE_KEYS.WEEKLY_FORECAST, trimWeeklyMaxMap(forecastMap));
  }

  return changed;
}

/** 어제 날짜의 실측 max (없으면 null) */
export async function getYesterdayMax(): Promise<number | null> {
  const map = await loadWeeklyMaxMap();
  return map[prevDayKey(todayKey())] ?? null;
}

/**
 * Open-Meteo past_days=1 데이터로 어제 실측값 초기 시드.
 * 이미 기록된 값이 있으면 덮어쓰지 않음 (첫 설치/데이터 초기화 후 즉시 비교 가능하도록).
 */
export async function seedYesterdayMaxFromApi(apiMax: number): Promise<void> {
  const map = await loadWeeklyMaxMap();
  const yesterday = prevDayKey(todayKey());
  if (map[yesterday] !== undefined) return;
  map[yesterday] = Math.round(apiMax);
  await saveJson(STORAGE_KEYS.WEEKLY_MAX, trimWeeklyMaxMap(map));
}

// ─────────────── 예측 저장 ───────────────

export async function loadPredictions(): Promise<PredictionEntry[]> {
  return loadJson<PredictionEntry[]>(STORAGE_KEYS.GAME_PREDICTIONS, []);
}

async function savePredictions(entries: PredictionEntry[]): Promise<void> {
  const trimmed = entries.slice(-MAX_ENTRIES);
  await saveJson(STORAGE_KEYS.GAME_PREDICTIONS, trimmed);
}

export async function hasPredictedToday(): Promise<boolean> {
  const last = await loadJson<string>(STORAGE_KEYS.PREDICTION_LAST_DATE, "");
  return last === todayKey();
}

/**
 * 오늘의 예측 저장. 같은 날 두 번째 호출은 첫 예측을 그대로 반환 (1일 1회 락).
 */
export async function savePrediction(
  choice: PredictionChoice,
  baseMax: number,
): Promise<PredictionEntry> {
  const history = await loadPredictions();
  const today = todayKey();
  const existing = history.find((e) => e.date === today);
  if (existing) return existing;
  const entry: PredictionEntry = {
    date: today,
    targetDate: today,
    baseMax: Math.round(baseMax),
    choice,
  };
  history.push(entry);
  await savePredictions(history);
  await saveJson(STORAGE_KEYS.PREDICTION_LAST_DATE, today);
  return entry;
}

// ─────────────── 정산 ───────────────

export function computePredictionResult(
  baseMax: number,
  actualMax: number,
  choice: PredictionChoice,
): PredictionResult {
  if (actualMax === baseMax) return "tie";
  if (actualMax > baseMax) return choice === "higher" ? "win" : "lose";
  return choice === "lower" ? "win" : "lose";
}

/**
 * settledAt 없는 엔트리 중 targetDate < today 인 것을 WEEKLY_MAX[targetDate]로 정산.
 * 새로운 history 배열을 반환 (in-place 변경 없음).
 */
function settlePending(history: PredictionEntry[], map: WeeklyMaxMap): {
  next: PredictionEntry[];
  changed: boolean;
} {
  const today = todayKey();
  let changed = false;
  const next = history.map((entry) => {
    if (entry.settledAt) return entry;
    if (entry.targetDate >= today) return entry;
    const actual = map[entry.targetDate];
    if (actual === undefined) return entry;
    changed = true;
    return {
      ...entry,
      actualMax: actual,
      result: computePredictionResult(entry.baseMax, actual, entry.choice),
      settledAt: new Date().toISOString(),
    };
  });
  return { next, changed };
}

export async function settlePendingPredictions(): Promise<PredictionEntry[]> {
  const [history, map] = await Promise.all([loadPredictions(), loadWeeklyMaxMap()]);
  const { next, changed } = settlePending(history, map);
  if (changed) await savePredictions(next);
  return next;
}

// ─────────────── 통계 ───────────────

export function computeDailyStreak(history: PredictionEntry[], now?: Date): number {
  return countConsecutiveDays(history.map((e) => e.date), now);
}

export function computeStats(history: PredictionEntry[]): GameStats {
  const weekStart = getWeekStartMonday();

  let weekWins = 0;
  let weekLosses = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalTies = 0;

  for (const e of history) {
    if (!e.result) continue;
    if (e.result === "win") totalWins += 1;
    else if (e.result === "lose") totalLosses += 1;
    else totalTies += 1;
    if (e.date >= weekStart) {
      if (e.result === "win") weekWins += 1;
      else if (e.result === "lose") weekLosses += 1;
    }
  }

  const decided = totalWins + totalLosses;
  const winRate = decided === 0 ? 0 : Math.round((totalWins / decided) * 100);

  // 연승 (tie는 중립 — 끊지 않음)
  const settledAsc = history
    .filter((e) => e.result)
    .sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  for (let i = settledAsc.length - 1; i >= 0; i -= 1) {
    const r = settledAsc[i].result;
    if (r === "win") currentStreak += 1;
    else if (r === "tie") continue;
    else break;
  }

  let bestStreak = 0;
  let running = 0;
  for (const e of settledAsc) {
    if (e.result === "win") {
      running += 1;
      if (running > bestStreak) bestStreak = running;
    } else if (e.result === "tie") {
      continue;
    } else {
      running = 0;
    }
  }

  return {
    weekWins,
    weekLosses,
    totalWins,
    totalLosses,
    totalTies,
    winRate,
    bestStreak,
    currentStreak,
    dailyStreak: computeDailyStreak(history),
  };
}

/**
 * 이벤트 화면용 통합 로드: settle → history → stats를 단 1회 read로 처리.
 * 기존 refresh가 loadPredictions + getGameStats(내부에서 또 loadPredictions)로 2번 읽던 것을 1회로 줄임.
 */
export async function loadGameView(): Promise<{
  history: PredictionEntry[];
  stats: GameStats;
}> {
  const [raw, map] = await Promise.all([loadPredictions(), loadWeeklyMaxMap()]);
  const { next, changed } = settlePending(raw, map);
  if (changed) await savePredictions(next);
  return { history: next, stats: computeStats(next) };
}

export async function getGameStats(): Promise<GameStats> {
  const { stats } = await loadGameView();
  return stats;
}
