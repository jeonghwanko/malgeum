import { t } from "@/i18n";

/** Date → "YYYY-MM-DD" (로컬 시간 기준) */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** "YYYY-MM-DD"의 다음날 키 */
export function nextDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return dateKey(date);
}

/** "YYYY-MM-DD"의 전날 키 */
export function prevDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

/**
 * 오늘(없으면 어제)부터 과거로 연속된 dateKey 개수를 센다.
 * 비어있거나 어제도 없으면 0. 1일 grace period 포함.
 */
export function countConsecutiveDays(dates: Iterable<string>, now: Date = new Date()): number {
  const set = dates instanceof Set ? dates : new Set(dates);
  if (set.size === 0) return 0;
  let cursor = dateKey(now);
  if (!set.has(cursor)) cursor = prevDayKey(cursor);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = prevDayKey(cursor);
  }
  return count;
}

export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { text: t("date.greeting.dawn"), emoji: "🌙" };
  if (hour < 7) return { text: t("date.greeting.earlyMorning"), emoji: "🌅" };
  if (hour < 9) return { text: t("date.greeting.morning"), emoji: "☀️" };
  if (hour < 12) return { text: t("date.greeting.lateMorning"), emoji: "💪" };
  if (hour < 14) return { text: t("date.greeting.lunch"), emoji: "🍽️" };
  if (hour < 18) return { text: t("date.greeting.afternoon"), emoji: "💪" };
  if (hour < 21) return { text: t("date.greeting.evening"), emoji: "🌆" };
  return { text: t("date.greeting.night"), emoji: "🌙" };
}

export function getTimeOfDay(): "dawn" | "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour < 6) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export function formatHour(dt: number): string {
  const date = new Date(dt * 1000);
  const hour = date.getHours();
  if (hour === 0) return t("date.midnight");
  if (hour === 12) return t("date.noon");
  return t("date.hourFormat", { hour });
}

export const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const DAY_KEYS = [
  "date.day.sun", "date.day.mon", "date.day.tue", "date.day.wed",
  "date.day.thu", "date.day.fri", "date.day.sat",
] as const;

export function getLocalizedDay(dayIndex: number): string {
  return t(DAY_KEYS[dayIndex]);
}

export function formatDay(dt: number): { day: string; date: string; isToday: boolean } {
  const date = new Date(dt * 1000);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const day = isToday ? t("date.today") : isTomorrow ? t("date.tomorrow") : getLocalizedDay(date.getDay());
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  return { day, date: dateStr, isToday };
}

export function isNighttime(sunrise: number, sunset: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now < sunrise || now > sunset;
}

/** ISO 문자열이 thresholdMs(기본 30분) 이상 경과했으면 true.
 *  데이터가 없으면(null) 아직 한 번도 받지 못한 것이므로 stale로 간주 */
export function isStaleData(isoString: string | null, thresholdMs = 30 * 60_000): boolean {
  if (!isoString) return true;
  return Date.now() - new Date(isoString).getTime() > thresholdMs;
}

/** "HH:MM" 문자열에서 분을 빼서 "HH:MM" 반환 (자정 경계 처리) */
export function subtractTimeMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m - mins + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** ISO 문자열 → "방금 전", "N분 전", "N시간 전" */
export function timeAgo(isoString: string | null): string | null {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 0) return null;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t("date.timeAgo.justNow");
  if (min < 60) return t("date.timeAgo.minutes", { min });
  const hr = Math.floor(min / 60);
  return t("date.timeAgo.hours", { hr });
}
