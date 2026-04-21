/**
 * 알림 카테고리 — Apple Watch / Wear OS 액션 버튼 지원
 * 앱 시작 시 1회 등록. OS가 영구 저장하므로 백그라운드 태스크에서는 재등록 불필요.
 */
import * as Notifications from "expo-notifications";

export const CATEGORY_IDS = {
  commute: "malgeum.commute",
  evening: "malgeum.evening",
  rain: "malgeum.rain",
  dust: "malgeum.dust",
  uv: "malgeum.uv",
  pollen: "malgeum.pollen",
  game: "malgeum.game",
} as const;

export type CategoryId = (typeof CATEGORY_IDS)[keyof typeof CATEGORY_IDS];

export const ACTION_IDS = {
  umbrellaChecked: "umbrella_checked",
  viewDetail: "view_detail",
  viewHourly: "view_hourly",
  viewResult: "view_result",
} as const;

export const CHANNEL_IDS = {
  weather: "weather",
  health: "health",
  lifestyle: "lifestyle",
  nag: "nag",
} as const;

type ChannelId = (typeof CHANNEL_IDS)[keyof typeof CHANNEL_IDS];

export const ALERT_CHANNEL_MAP: Record<keyof typeof CATEGORY_IDS, ChannelId> = {
  commute: CHANNEL_IDS.weather,
  evening: CHANNEL_IDS.weather,
  rain: CHANNEL_IDS.weather,
  uv: CHANNEL_IDS.weather,
  dust: CHANNEL_IDS.health,
  pollen: CHANNEL_IDS.health,
  game: CHANNEL_IDS.lifestyle,
};

const VIEW_DETAIL_ACTION: Notifications.NotificationAction = {
  identifier: ACTION_IDS.viewDetail,
  buttonTitle: "자세히 보기",
  options: { opensAppToForeground: true },
};

let registered = false;

export async function registerNotificationCategories(): Promise<void> {
  if (registered) return;
  registered = true;

  const simpleCategories: (keyof typeof CATEGORY_IDS)[] = ["evening", "dust", "uv", "pollen"];

  await Promise.all([
    Notifications.setNotificationCategoryAsync(CATEGORY_IDS.commute, [
      {
        identifier: ACTION_IDS.umbrellaChecked,
        buttonTitle: "우산 챙김 ✓",
        options: { opensAppToForeground: false },
      },
      VIEW_DETAIL_ACTION,
    ]),
    ...simpleCategories.map((key) =>
      Notifications.setNotificationCategoryAsync(CATEGORY_IDS[key], [VIEW_DETAIL_ACTION]),
    ),
    Notifications.setNotificationCategoryAsync(CATEGORY_IDS.rain, [
      {
        identifier: ACTION_IDS.viewHourly,
        buttonTitle: "시간대별 보기",
        options: { opensAppToForeground: true },
      },
    ]),
    Notifications.setNotificationCategoryAsync(CATEGORY_IDS.game, [
      {
        identifier: ACTION_IDS.viewResult,
        buttonTitle: "결과 보기",
        options: { opensAppToForeground: true },
      },
    ]),
  ]);
}

const WEATHER_NOTIFICATION_PREFIX = "malgeum-";

/** 날씨 알림(malgeum-*)만 취소 — 다이어리 기념일 등 다른 알림은 보존 */
export async function cancelWeatherNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(WEATHER_NOTIFICATION_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
