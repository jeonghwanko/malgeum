import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadPredictions,
  savePrediction,
  hasPredictedToday,
  recordWeatherSnapshot,
  loadWeeklyMaxMap,
  getYesterdayMax,
  settlePendingPredictions,
  getGameStats,
  getWeekStartMonday,
  computePredictionResult,
  computeStats,
  computeDailyStreak,
  loadGameView,
} from "../services/predictionGameService";
import { todayKey, prevDayKey, nextDayKey, dateKey } from "../utils/date";
import { STORAGE_KEYS } from "../utils/storage";
import type { PredictionEntry } from "../types/predictionGame";

beforeEach(async () => {
  await (AsyncStorage.clear as jest.Mock)();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
});

describe("date utilities", () => {
  it("dateKey from Date", () => {
    expect(dateKey(new Date(2026, 3, 9))).toBe("2026-04-09");
  });
  it("nextDayKey month rollover", () => {
    expect(nextDayKey("2026-04-30")).toBe("2026-05-01");
  });
  it("nextDayKey year rollover", () => {
    expect(nextDayKey("2026-12-31")).toBe("2027-01-01");
  });
  it("prevDayKey month rollover", () => {
    expect(prevDayKey("2026-05-01")).toBe("2026-04-30");
  });
});

describe("getWeekStartMonday", () => {
  it("Wednesday → previous Monday", () => {
    expect(getWeekStartMonday(new Date(2026, 3, 8))).toBe("2026-04-06");
  });
  it("Monday → same day", () => {
    expect(getWeekStartMonday(new Date(2026, 3, 6))).toBe("2026-04-06");
  });
  it("Sunday → previous Monday", () => {
    expect(getWeekStartMonday(new Date(2026, 3, 12))).toBe("2026-04-06");
  });
});

describe("computePredictionResult", () => {
  it("higher win when actual > base", () => {
    expect(computePredictionResult(20, 22, "higher")).toBe("win");
  });
  it("higher lose when actual < base", () => {
    expect(computePredictionResult(20, 18, "higher")).toBe("lose");
  });
  it("lower win when actual < base", () => {
    expect(computePredictionResult(20, 18, "lower")).toBe("win");
  });
  it("lower lose when actual > base", () => {
    expect(computePredictionResult(20, 22, "lower")).toBe("lose");
  });
  it("tie when equal", () => {
    expect(computePredictionResult(20, 20, "higher")).toBe("tie");
    expect(computePredictionResult(20, 20, "lower")).toBe("tie");
  });
});

describe("recordWeatherSnapshot", () => {
  it("records today actual on first call", async () => {
    await recordWeatherSnapshot(18.4, {});
    const map = await loadWeeklyMaxMap();
    expect(map[todayKey()]).toBe(18);
  });

  it("only updates today when new sample is greater", async () => {
    await recordWeatherSnapshot(20, {});
    await recordWeatherSnapshot(18, {});
    let map = await loadWeeklyMaxMap();
    expect(map[todayKey()]).toBe(20);
    await recordWeatherSnapshot(23, {});
    map = await loadWeeklyMaxMap();
    expect(map[todayKey()]).toBe(23);
  });

  it("ignores non-finite today values", async () => {
    await recordWeatherSnapshot(NaN, {});
    const map = await loadWeeklyMaxMap();
    expect(map[todayKey()]).toBeUndefined();
  });

  it("overwrites future days", async () => {
    await recordWeatherSnapshot(undefined, { "2026-04-10": 22, "2026-04-11": 24 });
    let map = await loadWeeklyMaxMap();
    expect(map["2026-04-10"]).toBe(22);
    expect(map["2026-04-11"]).toBe(24);

    await recordWeatherSnapshot(undefined, { "2026-04-10": 25 });
    map = await loadWeeklyMaxMap();
    expect(map["2026-04-10"]).toBe(25);
  });

  it("today actual + future forecast in single atomic call (no clobber)", async () => {
    // 단일 call로 둘 다 처리되어야 race condition이 안 생김
    const tomorrow = nextDayKey(todayKey());
    const dayAfter = nextDayKey(tomorrow);
    await recordWeatherSnapshot(22, { [tomorrow]: 24, [dayAfter]: 26 });
    const map = await loadWeeklyMaxMap();
    expect(map[todayKey()]).toBe(22);
    expect(map[tomorrow]).toBe(24);
    expect(map[dayAfter]).toBe(26);
  });

  it("ignores non-finite future values", async () => {
    await recordWeatherSnapshot(undefined, {
      "2026-04-10": NaN as unknown as number,
    });
    const map = await loadWeeklyMaxMap();
    expect(map["2026-04-10"]).toBeUndefined();
  });
});

describe("savePrediction", () => {
  it("creates entry with date == targetDate (today)", async () => {
    const entry = await savePrediction("higher", 18.7);
    expect(entry.date).toBe(todayKey());
    expect(entry.targetDate).toBe(todayKey());
    expect(entry.baseMax).toBe(19);
    expect(entry.choice).toBe("higher");
    expect(entry.settledAt).toBeUndefined();
  });

  it("ignores second call same day (returns existing entry)", async () => {
    const first = await savePrediction("higher", 20);
    const second = await savePrediction("lower", 25);
    expect(second).toEqual(first);
    const all = await loadPredictions();
    expect(all).toHaveLength(1);
    expect(all[0].choice).toBe("higher");
  });

  it("hasPredictedToday becomes true after save", async () => {
    expect(await hasPredictedToday()).toBe(false);
    await savePrediction("higher", 20);
    expect(await hasPredictedToday()).toBe(true);
  });

  it("hasPredictedToday uses lightweight key, not full array", async () => {
    await savePrediction("higher", 20);
    // 배열을 지워도 경량 키가 남아있으면 true
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_PREDICTIONS, JSON.stringify([]));
    expect(await hasPredictedToday()).toBe(true);
  });

  it("hasPredictedToday returns false for past date in key", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.PREDICTION_LAST_DATE, JSON.stringify("2020-01-01"));
    expect(await hasPredictedToday()).toBe(false);
  });

  it("trims to 90 entries max", async () => {
    const old: PredictionEntry[] = Array.from({ length: 95 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      targetDate: `2025-01-${String(i + 1).padStart(2, "0")}`,
      baseMax: 20,
      choice: "higher" as const,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_PREDICTIONS, JSON.stringify(old));
    await savePrediction("higher", 20);
    const all = await loadPredictions();
    expect(all.length).toBeLessThanOrEqual(90);
    expect(all[all.length - 1].date).toBe(todayKey());
  });
});

describe("settlePendingPredictions", () => {
  it("does NOT settle today's prediction (targetDate == today)", async () => {
    await savePrediction("higher", 20);
    await recordWeatherSnapshot(22, {});
    const all = await settlePendingPredictions();
    expect(all[0].result).toBeUndefined();
    expect(all[0].settledAt).toBeUndefined();
  });

  it("settles win on day after prediction", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([mkPending(yKey, "higher", 20)]),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 22 }));

    const all = await settlePendingPredictions();
    expect(all[0].result).toBe("win");
    expect(all[0].actualMax).toBe(22);
    expect(all[0].settledAt).toBeDefined();
  });

  it("settles lose when actual < base and choice higher", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([mkPending(yKey, "higher", 20)]),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 18 }));

    const all = await settlePendingPredictions();
    expect(all[0].result).toBe("lose");
  });

  it("settles tie when actual == base", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([mkPending(yKey, "higher", 20)]),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 20 }));

    const all = await settlePendingPredictions();
    expect(all[0].result).toBe("tie");
  });

  it("does not settle when WEEKLY_MAX missing", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([mkPending(yKey, "higher", 20)]),
    );
    const all = await settlePendingPredictions();
    expect(all[0].result).toBeUndefined();
  });

  it("does not re-settle already-settled entries", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([
        {
          date: yKey,
          targetDate: yKey,
          baseMax: 20,
          choice: "higher",
          actualMax: 22,
          result: "win",
          settledAt: "2026-04-09T00:00:00.000Z",
        },
      ]),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 25 }));
    const all = await settlePendingPredictions();
    expect(all[0].actualMax).toBe(22); // 변경 안 됨
  });
});

describe("getYesterdayMax", () => {
  it("returns null when missing", async () => {
    expect(await getYesterdayMax()).toBeNull();
  });

  it("returns the value when present", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 21 }));
    expect(await getYesterdayMax()).toBe(21);
  });
});

describe("computeStats / getGameStats", () => {
  it("zero when empty", () => {
    expect(computeStats([])).toEqual({
      weekWins: 0,
      weekLosses: 0,
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      winRate: 0,
      bestStreak: 0,
      currentStreak: 0,
      dailyStreak: 0,
    });
  });

  it("counts weekly separately from total", async () => {
    const weekStart = getWeekStartMonday();
    const all: PredictionEntry[] = [
      mkSettled("2020-01-01", "win"),
      mkSettled("2020-01-02", "lose"),
      mkSettled(weekStart, "win"),
      mkSettled(weekStart, "lose"),
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_PREDICTIONS, JSON.stringify(all));
    const stats = await getGameStats();
    expect(stats.totalWins).toBe(2);
    expect(stats.totalLosses).toBe(2);
    expect(stats.weekWins).toBe(1);
    expect(stats.weekLosses).toBe(1);
    expect(stats.winRate).toBe(50);
  });

  it("current streak (tie is neutral)", () => {
    const all: PredictionEntry[] = [
      mkSettled("2026-03-01", "win"),
      mkSettled("2026-03-02", "win"),
      mkSettled("2026-03-03", "lose"),
      mkSettled("2026-03-04", "win"),
      mkSettled("2026-03-05", "tie"),
      mkSettled("2026-03-06", "win"),
    ];
    const stats = computeStats(all);
    expect(stats.currentStreak).toBe(2);
  });

  it("best streak", () => {
    const all: PredictionEntry[] = [
      mkSettled("2026-03-01", "win"),
      mkSettled("2026-03-02", "win"),
      mkSettled("2026-03-03", "win"),
      mkSettled("2026-03-04", "lose"),
      mkSettled("2026-03-05", "win"),
      mkSettled("2026-03-06", "win"),
    ];
    expect(computeStats(all).bestStreak).toBe(3);
  });

  it("excludes ties from win rate denominator", () => {
    const all: PredictionEntry[] = [
      mkSettled("2026-03-01", "win"),
      mkSettled("2026-03-02", "win"),
      mkSettled("2026-03-03", "lose"),
      mkSettled("2026-03-04", "tie"),
      mkSettled("2026-03-05", "tie"),
    ];
    const stats = computeStats(all);
    expect(stats.winRate).toBe(67); // 2/3
    expect(stats.totalTies).toBe(2);
  });
});

describe("computeDailyStreak", () => {
  it("zero when empty", () => {
    expect(computeDailyStreak([])).toBe(0);
  });

  it("1 when only today predicted", () => {
    const today = todayKey();
    expect(computeDailyStreak([mkPending(today, "higher", 20)])).toBe(1);
  });

  it("chain from today through consecutive days", () => {
    const d0 = todayKey();
    const d1 = prevDayKey(d0);
    const d2 = prevDayKey(d1);
    const entries = [mkPending(d2, "higher", 20), mkPending(d1, "higher", 20), mkPending(d0, "higher", 20)];
    expect(computeDailyStreak(entries)).toBe(3);
  });

  it("breaks on gap", () => {
    const d0 = todayKey();
    const d2 = prevDayKey(prevDayKey(d0));
    const entries = [mkPending(d2, "higher", 20), mkPending(d0, "higher", 20)];
    expect(computeDailyStreak(entries)).toBe(1);
  });

  it("allows yesterday-only as start (grace period)", () => {
    const d1 = prevDayKey(todayKey());
    const d2 = prevDayKey(d1);
    const entries = [mkPending(d2, "higher", 20), mkPending(d1, "higher", 20)];
    expect(computeDailyStreak(entries)).toBe(2);
  });

  it("zero when gap extends beyond yesterday", () => {
    const d2 = prevDayKey(prevDayKey(todayKey()));
    expect(computeDailyStreak([mkPending(d2, "higher", 20)])).toBe(0);
  });
});

describe("loadGameView", () => {
  it("returns history + stats and auto-settles in single call", async () => {
    const yKey = prevDayKey(todayKey());
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([mkPending(yKey, "higher", 20)]),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MAX, JSON.stringify({ [yKey]: 22 }));

    const view = await loadGameView();
    expect(view.history[0].result).toBe("win");
    expect(view.stats.totalWins).toBe(1);
  });

  it("settles correctly with parallel predictions + weeklyMax load", async () => {
    // 여러 날의 미정산 predictions + weeklyMax 동시 로드 검증
    const d1 = prevDayKey(todayKey());
    const d2 = prevDayKey(d1);
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PREDICTIONS,
      JSON.stringify([
        mkPending(d2, "lower", 25),
        mkPending(d1, "higher", 20),
      ]),
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.WEEKLY_MAX,
      JSON.stringify({ [d1]: 22, [d2]: 23 }),
    );

    const view = await loadGameView();
    expect(view.history).toHaveLength(2);
    // d2: base=25, actual=23, choice=lower → 25>23 → win
    expect(view.history[0].result).toBe("win");
    // d1: base=20, actual=22, choice=higher → 22>20 → win
    expect(view.history[1].result).toBe("win");
    expect(view.stats.totalWins).toBe(2);
  });
});

function mkPending(date: string, choice: "higher" | "lower", baseMax: number): PredictionEntry {
  return { date, targetDate: date, baseMax, choice };
}

function mkSettled(
  date: string,
  result: "win" | "lose" | "tie",
): PredictionEntry {
  return {
    date,
    targetDate: date,
    baseMax: 20,
    choice: "higher",
    actualMax: result === "win" ? 22 : result === "lose" ? 18 : 20,
    result,
    settledAt: `${date}T12:00:00.000Z`,
  };
}
