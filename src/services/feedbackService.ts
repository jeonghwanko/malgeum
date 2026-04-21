import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey, countConsecutiveDays } from "@/utils/date";

export interface FeedbackEntry {
  date: string;       // "2026-04-05"
  accurate: boolean;  // 유저가 "맞았어요" 선택했는지
  feelsLike?: number; // 피드백 시점 체감온도 (캘리브레이션용)
}

export interface FeedbackStats {
  total: number;
  accurate: number;
  rate: number;        // 0~100
}

const MAX_ENTRIES = 90; // 최근 90일 보관

export async function loadFeedbackHistory(): Promise<FeedbackEntry[]> {
  return loadJson<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK, []);
}

export async function saveFeedback(accurate: boolean, feelsLike?: number): Promise<void> {
  const history = await loadFeedbackHistory();
  const today = todayKey();

  // 오늘 이미 피드백했으면 덮어쓰기
  const existing = history.findIndex((e) => e.date === today);
  if (existing >= 0) {
    history[existing].accurate = accurate;
    if (feelsLike !== undefined) history[existing].feelsLike = feelsLike;
  } else {
    history.push({ date: today, accurate, feelsLike });
  }

  // 최근 N일만 보관
  const trimmed = history.slice(-MAX_ENTRIES);
  await saveJson(STORAGE_KEYS.FEEDBACK, trimmed);
  await saveJson(STORAGE_KEYS.FEEDBACK_LAST_DATE, today);
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const history = await loadFeedbackHistory();
  const total = history.length;
  if (total === 0) return { total: 0, accurate: 0, rate: 0 };
  const accurate = history.filter((e) => e.accurate).length;
  return { total, accurate, rate: Math.round((accurate / total) * 100) };
}

export async function hasFeedbackToday(): Promise<boolean> {
  const last = await loadJson<string>(STORAGE_KEYS.FEEDBACK_LAST_DATE, "");
  return last === todayKey();
}

export async function getFeedbackStreak(): Promise<number> {
  const history = await loadFeedbackHistory();
  return countConsecutiveDays(history.map((e) => e.date));
}

/**
 * 옷차림 캘리브레이션: "아쉬웠어요" 피드백의 체감온도 분포로 보정값 계산.
 * 부정확 피드백이 5건 이상이면 활성화.
 * 반환값: -2 ~ +2 (체감온도에 더해서 사용).
 * 논리: 추운 쪽(feelsLike < 16)에서 부정확이 많으면 → 더 따뜻하게 추천 (offset < 0)
 *       더운 쪽(feelsLike >= 16)에서 부정확이 많으면 → 더 시원하게 추천 (offset > 0)
 */
export async function getTempOffset(): Promise<number> {
  const history = await loadFeedbackHistory();
  const inaccurate = history.filter((e) => !e.accurate && e.feelsLike !== undefined);
  if (inaccurate.length < 5) return 0;

  const coldMiss = inaccurate.filter((e) => e.feelsLike! < 16).length;
  const hotMiss = inaccurate.filter((e) => e.feelsLike! >= 16).length;
  const total = inaccurate.length;

  // 추운 쪽 미스가 많으면 체감온도를 낮춰서 더 따뜻한 옷 추천
  // 더운 쪽 미스가 많으면 체감온도를 높여서 더 시원한 옷 추천
  const ratio = (hotMiss - coldMiss) / total; // -1 ~ +1
  return Math.round(ratio * 2 * 10) / 10; // -2 ~ +2, 소수점 1자리
}
