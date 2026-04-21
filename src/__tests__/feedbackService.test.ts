import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveFeedback,
  loadFeedbackHistory,
  getFeedbackStats,
  hasFeedbackToday,
  getTempOffset,
} from "../services/feedbackService";
import { todayKey } from "../utils/date";
import { STORAGE_KEYS } from "../utils/storage";

beforeEach(async () => {
  await (AsyncStorage.clear as jest.Mock)();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
});

// ─── loadFeedbackHistory ───

describe("loadFeedbackHistory", () => {
  it("returns empty array when no data", async () => {
    const history = await loadFeedbackHistory();
    expect(history).toEqual([]);
  });

  it("returns saved entries", async () => {
    const entries = [{ date: "2026-04-01", accurate: true }];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const history = await loadFeedbackHistory();
    expect(history).toEqual(entries);
  });
});

// ─── saveFeedback ───

describe("saveFeedback", () => {
  it("saves a new feedback entry", async () => {
    await saveFeedback(true);
    const history = await loadFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].date).toBe(todayKey());
    expect(history[0].accurate).toBe(true);
  });

  it("saves feelsLike with feedback", async () => {
    await saveFeedback(false, 12);
    const history = await loadFeedbackHistory();
    expect(history[0].feelsLike).toBe(12);
  });

  it("updates feelsLike on overwrite", async () => {
    await saveFeedback(true, 20);
    await saveFeedback(false, 8);
    const history = await loadFeedbackHistory();
    expect(history[0].feelsLike).toBe(8);
    expect(history[0].accurate).toBe(false);
  });

  it("overwrites today's feedback if already exists", async () => {
    await saveFeedback(true);
    await saveFeedback(false); // 변경
    const history = await loadFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].accurate).toBe(false);
  });

  it("accumulates entries across different days", async () => {
    // 어제 피드백을 직접 저장
    const yesterday = [{ date: "2026-04-04", accurate: true }];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(yesterday));

    await saveFeedback(false); // 오늘 피드백
    const history = await loadFeedbackHistory();
    expect(history).toHaveLength(2);
    expect(history[0].date).toBe("2026-04-04");
    expect(history[1].date).toBe(todayKey());
  });

  it("trims to 90 entries max", async () => {
    // 100개 기존 엔트리 저장
    const old = Array.from({ length: 100 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      accurate: true,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(old));

    await saveFeedback(true); // 101번째 → 90개로 trim
    const history = await loadFeedbackHistory();
    expect(history.length).toBeLessThanOrEqual(90);
    // 가장 오래된 엔트리가 잘렸는지 확인
    expect(history[0].date).not.toBe("2026-01-01");
  });
});

// ─── getFeedbackStats ───

describe("getFeedbackStats", () => {
  it("returns zero stats when empty", async () => {
    const stats = await getFeedbackStats();
    expect(stats).toEqual({ total: 0, accurate: 0, rate: 0 });
  });

  it("calculates rate correctly", async () => {
    const entries = [
      { date: "2026-04-01", accurate: true },
      { date: "2026-04-02", accurate: true },
      { date: "2026-04-03", accurate: false },
      { date: "2026-04-04", accurate: true },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const stats = await getFeedbackStats();
    expect(stats.total).toBe(4);
    expect(stats.accurate).toBe(3);
    expect(stats.rate).toBe(75);
  });

  it("returns 100% when all accurate", async () => {
    const entries = [
      { date: "2026-04-01", accurate: true },
      { date: "2026-04-02", accurate: true },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const stats = await getFeedbackStats();
    expect(stats.rate).toBe(100);
  });

  it("returns 0% when none accurate", async () => {
    const entries = [
      { date: "2026-04-01", accurate: false },
      { date: "2026-04-02", accurate: false },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const stats = await getFeedbackStats();
    expect(stats.rate).toBe(0);
  });

  it("rounds rate to integer", async () => {
    const entries = [
      { date: "2026-04-01", accurate: true },
      { date: "2026-04-02", accurate: false },
      { date: "2026-04-03", accurate: false },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const stats = await getFeedbackStats();
    expect(stats.rate).toBe(33); // 1/3 = 33.33... → 33
  });
});

// ─── hasFeedbackToday ───

describe("hasFeedbackToday", () => {
  it("returns false when no feedback", async () => {
    expect(await hasFeedbackToday()).toBe(false);
  });

  it("returns false when only past feedback in array (no last_date key)", async () => {
    const entries = [{ date: "2020-01-01", accurate: true }];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    // 경량 키가 없으면 false
    expect(await hasFeedbackToday()).toBe(false);
  });

  it("returns true after saving today", async () => {
    await saveFeedback(true);
    expect(await hasFeedbackToday()).toBe(true);
  });

  it("uses lightweight FEEDBACK_LAST_DATE key, not full array scan", async () => {
    await saveFeedback(true);
    // 배열을 지워도 경량 키가 남아있으면 true
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
    expect(await hasFeedbackToday()).toBe(true);
  });

  it("returns false when last_date is a past date", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_LAST_DATE, JSON.stringify("2020-01-01"));
    expect(await hasFeedbackToday()).toBe(false);
  });
});

// ─── getTempOffset (옷차림 캘리브레이션) ───

describe("getTempOffset", () => {
  it("returns 0 when fewer than 5 inaccurate entries", async () => {
    const entries = [
      { date: "2026-04-01", accurate: false, feelsLike: 10 },
      { date: "2026-04-02", accurate: false, feelsLike: 8 },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    expect(await getTempOffset()).toBe(0);
  });

  it("returns 0 when no feelsLike data", async () => {
    const entries = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-04-0${i + 1}`,
      accurate: false,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    expect(await getTempOffset()).toBe(0);
  });

  it("returns negative offset when cold-side misses dominate", async () => {
    // 추운 쪽(< 16)에서만 부정확 → 더 따뜻하게 추천 (offset < 0)
    const entries = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-04-0${i + 1}`,
      accurate: false,
      feelsLike: 10,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const offset = await getTempOffset();
    expect(offset).toBeLessThan(0);
    expect(offset).toBeGreaterThanOrEqual(-2);
  });

  it("returns positive offset when hot-side misses dominate", async () => {
    // 더운 쪽(>= 16)에서만 부정확 → 더 시원하게 추천 (offset > 0)
    const entries = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-04-0${i + 1}`,
      accurate: false,
      feelsLike: 25,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const offset = await getTempOffset();
    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThanOrEqual(2);
  });

  it("returns ~0 when cold and hot misses are balanced", async () => {
    const entries = [
      { date: "2026-04-01", accurate: false, feelsLike: 5 },
      { date: "2026-04-02", accurate: false, feelsLike: 8 },
      { date: "2026-04-03", accurate: false, feelsLike: 10 },
      { date: "2026-04-04", accurate: false, feelsLike: 20 },
      { date: "2026-04-05", accurate: false, feelsLike: 25 },
      { date: "2026-04-06", accurate: false, feelsLike: 28 },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const offset = await getTempOffset();
    expect(Math.abs(offset)).toBeLessThanOrEqual(0.5);
  });

  it("ignores accurate entries", async () => {
    const entries = [
      // 정확한 피드백 10건 (무시됨)
      ...Array.from({ length: 10 }, (_, i) => ({
        date: `2026-03-${String(i + 1).padStart(2, "0")}`,
        accurate: true,
        feelsLike: 25,
      })),
      // 부정확 6건 (추운 쪽)
      ...Array.from({ length: 6 }, (_, i) => ({
        date: `2026-04-0${i + 1}`,
        accurate: false,
        feelsLike: 5,
      })),
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(entries));
    const offset = await getTempOffset();
    expect(offset).toBeLessThan(0); // 추운 쪽 미스만 반영
  });
});
