import * as Notifications from "expo-notifications";
import { todayKey } from "@/utils/date";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { logError } from "@/utils/logger";
import type { DiaryEntry } from "@/types/diary";

const MAX_ANNIVERSARY_NOTIFICATIONS = 30;
const DIARY_MAX_DAYS = 365;

export async function loadDiary(): Promise<DiaryEntry[]> {
  return loadJson<DiaryEntry[]>(STORAGE_KEYS.DIARY, []);
}

export async function hasDiaryToday(): Promise<boolean> {
  const last = await loadJson<string>(STORAGE_KEYS.DIARY_LAST_DATE, "");
  return last === todayKey();
}

export async function saveDiaryEntry(
  memo: string,
  condition: DiaryEntry["condition"],
  temp: number,
): Promise<DiaryEntry> {
  const today = todayKey();
  const diary = await loadDiary();

  // 오늘 기존 항목이 있으면 업데이트
  const existing = diary.find((e) => e.date === today);
  if (existing) {
    if (existing.anniversaryId) {
      await Notifications.cancelScheduledNotificationAsync(existing.anniversaryId).catch(() => {});
    }
  }

  const entry: DiaryEntry = {
    date: today,
    condition,
    temp,
    memo: memo.slice(0, 60),
    createdAt: new Date().toISOString(),
  };

  const anniversaryId = await scheduleAnniversaryNotification(entry);
  if (anniversaryId) entry.anniversaryId = anniversaryId;

  const updated = [
    entry,
    ...diary.filter((e) => e.date !== today),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, DIARY_MAX_DAYS);

  await saveJson(STORAGE_KEYS.DIARY, updated);
  await saveJson(STORAGE_KEYS.DIARY_LAST_DATE, today);
  await pruneAnniversaryNotifications(updated);

  return entry;
}

async function scheduleAnniversaryNotification(entry: DiaryEntry): Promise<string | undefined> {
  try {
    const identifier = `diary-anniversary-${entry.date}`;
    const triggerDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // DATE trigger 시도, 미지원 시 TimeInterval 폴백
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "1년 전 오늘...",
          body: entry.memo,
          data: { screen: "diary" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        } as any,
      });
    } catch {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "1년 전 오늘...",
          body: entry.memo,
          data: { screen: "diary" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 365 * 24 * 60 * 60,
          repeats: false,
        } as any,
      });
    }
    return identifier;
  } catch (e) {
    logError("notification", e);
    return undefined;
  }
}

/** iOS는 scheduled notification 최대 64개 제한 → anniversary 30개 초과 시 오래된 것부터 취소 */
async function pruneAnniversaryNotifications(diary: DiaryEntry[]): Promise<void> {
  const withAnniversary = diary.filter((e) => e.anniversaryId);
  if (withAnniversary.length <= MAX_ANNIVERSARY_NOTIFICATIONS) return;

  const toCancel = withAnniversary.slice(MAX_ANNIVERSARY_NOTIFICATIONS);
  await Promise.all(
    toCancel.map((e) =>
      Notifications.cancelScheduledNotificationAsync(e.anniversaryId!).catch(() => {}),
    ),
  );
}
