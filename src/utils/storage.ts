import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "./date";
import { logError } from "./logger";

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    // JSON.parse 성공 시 타입 일치는 호출자 책임이나, null/undefined는 fallback으로 방어
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch (e: unknown) {
    logError("storage", e);
    return fallback;
  }
}

// 직렬화 큐: 키별로 순서 보장, 마지막 Promise가 완료되면 정리
const saveQueue = new Map<string, Promise<void>>();

export async function saveJson<T>(key: string, value: T): Promise<void> {
  const prev = saveQueue.get(key) ?? Promise.resolve();
  const next = prev.then(async () => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logError("storage", e);
    }
    // 자신이 큐의 마지막이면 정리 (체인 중간에 삭제 방지)
    if (saveQueue.get(key) === next) {
      saveQueue.delete(key);
    }
  });
  saveQueue.set(key, next);
  return next;
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e: unknown) {
    logError("storage", e);
  }
}

export const STORAGE_KEYS = {
  USER: "@malgeum/user",
  WEATHER_CACHE: "@malgeum/weather_cache",
  REMOTE_CONFIG: "@malgeum/remote_config",
  THEME: "@malgeum/theme",
  FEEDBACK: "@malgeum/feedback",
  AI_USAGE: "@malgeum/ai_usage",
  DEVICE_ID: "@malgeum/device_id",
  AI_ENGAGEMENT: "@malgeum/ai_engagement",
  CHAT_HISTORY: "@malgeum/chat_history",
  AI_FEEDBACK: "@malgeum/ai_feedback",
  WIDGET_GLASS: "@malgeum/widget_glass",
  WEEKLY_MAX: "@malgeum/weekly_max",
  WEEKLY_FORECAST: "@malgeum/weekly_forecast",
  GAME_PREDICTIONS: "@malgeum/game_predictions",
  DAILY_BRIEF_DATE: "@malgeum/daily_brief_date",
  ONBOARDING_SHARE_SHOWN: "@malgeum/onboarding_share_shown",
  DIARY: "@malgeum/diary",
  FEEDBACK_LAST_DATE: "@malgeum/feedback_last_date",
  PREDICTION_LAST_DATE: "@malgeum/prediction_last_date",
  DIARY_LAST_DATE: "@malgeum/diary_last_date",
  CARD_TAP_COUNTS: "@malgeum/card_tap_counts",
  SCHOOL_LUNCH: "@malgeum/school_lunch",
  NOTIFY_RECIPIENTS: "@malgeum/notify_recipients",
  BG_WEATHER_HASH: "@malgeum/bg_weather_hash",
  WIN_CELEBRATE_DATE: "@malgeum/win_celebrate_date",
  VISIT_STREAK: "@malgeum/visit_streak",
  FESTIVAL_CACHE: "@malgeum/festival_cache",
  PERFORMANCE_CACHE: "@malgeum/performance_cache",
  CAMPING_CACHE: "@malgeum/camping_cache",
  ONBOARDING_CHAT_DONE: "@malgeum/onboarding_chat_done",
  PENDING_INVITE: "@malgeum/pending_invite",
} as const;

export async function hasSeenOnboardingShare(): Promise<boolean> {
  return loadJson<boolean>(STORAGE_KEYS.ONBOARDING_SHARE_SHOWN, false);
}

export async function markOnboardingShareSeen(): Promise<void> {
  await saveJson(STORAGE_KEYS.ONBOARDING_SHARE_SHOWN, true);
}

export async function hasBriefedToday(): Promise<boolean> {
  const saved = await loadJson<string | null>(STORAGE_KEYS.DAILY_BRIEF_DATE, null);
  return saved === todayKey();
}

export async function markBriefedToday(): Promise<void> {
  await saveJson(STORAGE_KEYS.DAILY_BRIEF_DATE, todayKey());
}

export async function hasCompletedOnboardingChat(): Promise<boolean> {
  return loadJson<boolean>(STORAGE_KEYS.ONBOARDING_CHAT_DONE, false);
}

export async function markOnboardingChatDone(): Promise<void> {
  await saveJson(STORAGE_KEYS.ONBOARDING_CHAT_DONE, true);
}

export async function hasCelebratedWinToday(): Promise<boolean> {
  const saved = await loadJson<string | null>(STORAGE_KEYS.WIN_CELEBRATE_DATE, null);
  return saved === todayKey();
}

export async function markWinCelebrated(): Promise<void> {
  await saveJson(STORAGE_KEYS.WIN_CELEBRATE_DATE, todayKey());
}
