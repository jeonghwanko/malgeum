import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey, prevDayKey } from "@/utils/date";

export interface VisitStreakData {
  lastVisitDate: string;
  consecutiveDays: number;
}

const DEFAULT: VisitStreakData = { lastVisitDate: "", consecutiveDays: 0 };

export async function loadVisitStreak(): Promise<VisitStreakData> {
  return loadJson<VisitStreakData>(STORAGE_KEYS.VISIT_STREAK, DEFAULT);
}

/**
 * 오늘 방문을 기록하고 갱신된 streak 데이터를 반환한다.
 * 같은 날 여러 번 호출해도 안전 (멱등).
 */
export async function recordVisit(): Promise<VisitStreakData> {
  const data = await loadVisitStreak();
  const today = todayKey();

  if (data.lastVisitDate === today) return data;

  const yesterday = prevDayKey(today);
  const next: VisitStreakData = {
    lastVisitDate: today,
    consecutiveDays: data.lastVisitDate === yesterday
      ? data.consecutiveDays + 1
      : 1,
  };

  await saveJson(STORAGE_KEYS.VISIT_STREAK, next);
  return next;
}

/** 마지막 방문 이후 경과일. 오늘이면 0, 기록 없으면 Infinity. */
export function daysSinceLastVisit(data: VisitStreakData): number {
  if (!data.lastVisitDate) return Infinity;
  const today = new Date(todayKey());
  const last = new Date(data.lastVisitDate);
  return Math.floor((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
}
