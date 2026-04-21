/**
 * 백그라운드 날씨 체크 태스크.
 * expo-background-fetch로 OS가 주기적으로 실행.
 * 날씨를 fetch한 뒤 조건부 알림을 재스케줄한다.
 */
import { AppState as RNAppState, Platform } from "react-native";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { fetchWithCache } from "./weatherApi";
import { getClothingCopy, getPm25Status, getUvStatus, getPollenStatus } from "@/utils/weather";
import { pickCommuteTitle, pickEveningTitle } from "@/constants/notificationMessages";
import { logError } from "@/utils/logger";
import { CATEGORY_IDS, ALERT_CHANNEL_MAP, cancelWeatherNotifications } from "./notificationCategories";
import type { AppState } from "@/context/WeatherContext";

export const BACKGROUND_WEATHER_TASK = "malgeum-background-weather";

// 최소 실행 간격 (초). Android WorkManager 최소 15분.
const MIN_INTERVAL_SEC = 60 * 60; // 60분

/** 태스크 정의 — 앱 로드 시 즉시 호출해야 함 (index.js 등) */
export function defineBackgroundWeatherTask() {
  TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
    try {
      // 포그라운드에서는 useNotifications가 처리 — 중복 방지
      if (RNAppState.currentState === "active") {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const state = await loadJson<AppState | null>(STORAGE_KEYS.USER, null);
      if (!state || !state.onboardingDone) return BackgroundFetch.BackgroundFetchResult.NoData;

      const location = state.locations.find((l) => l.id === state.currentLocationId);
      if (!location) return BackgroundFetch.BackgroundFetchResult.NoData;

      // 날씨 fetch (캐시 활용)
      const bundle = await fetchWithCache(location.lat, location.lon);
      const cur = bundle.current;
      const hourly = bundle.hourly;
      const aq = bundle.airQuality;
      const alerts = state.alerts;
      const dep = state.commuteTime.departure;
      const ret = state.commuteTime.return;
      const nickname = state.nickname;
      const locationName = location.name;

      // 유의미한 변화가 없으면 알림 재스케줄 스킵
      const maxPrecip = Math.max(cur?.precipitation ?? 0, ...hourly.slice(0, 8).map((h) => h.precipitation));
      const weatherHash = cur
        ? `${Math.round(cur.temp)}_${cur.condition}_${Math.round(maxPrecip / 5)}_${aq?.aqi ?? 0}`
        : "";
      const prevHash = await loadJson<string>(STORAGE_KEYS.BG_WEATHER_HASH, "");
      if (prevHash === weatherHash) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      await saveJson(STORAGE_KEYS.BG_WEATHER_HASH, weatherHash);

      // 날씨 알림만 취소 (다이어리 기념일 등 다른 알림 보존)
      await cancelWeatherNotifications();
      const tasks: Promise<void>[] = [];

      const commuteOn = alerts.commute && cur != null;

      if (commuteOn) {
        const clothing = getClothingCopy(cur.feelsLike);
        const maxPrecip = Math.max(cur.precipitation, ...hourly.slice(0, 4).map((h) => h.precipitation));
        const hasRain = maxPrecip >= 30;
        const title = withName(nickname, pickCommuteTitle(cur.feelsLike, hasRain));
        const parts: string[] = [];
        if (locationName) parts.push(locationName);
        parts.push(`체감 ${cur.feelsLike}°`);
        if (hasRain) parts.push(`☂️ ${maxPrecip}%`);
        if (aq && aq.aqi >= 2) parts.push(`😷 ${getPm25Status(aq.pm25).label}`);
        if (cur.uvIndex >= 6) parts.push(`🧴 UV ${cur.uvIndex}`);
        tasks.push(scheduleWeekdays("commute", title, parts.join("\n"), dep, 30, "home",
          CATEGORY_IDS.commute, ALERT_CHANNEL_MAP.commute));
      }

      if (alerts.evening && cur) {
        const laterHours = hourly.slice(4, 8);
        const willRain = laterHours.some((h) => h.precipitation >= 40);
        const tempDrop = laterHours.length > 0
          ? Math.round(cur.temp - Math.min(...laterHours.map((h) => h.temp)))
          : 0;
        const title = withName(nickname, pickEveningTitle(willRain, tempDrop));
        const parts: string[] = [];
        if (locationName) parts.push(locationName);
        if (willRain) parts.push("우산 있는지 확인하세요!");
        else if (tempDrop >= 5) parts.push(`아침보다 ${tempDrop}° 떨어져요`);
        else parts.push(`${cur.temp}° · 편하게 퇴근하세요`);
        tasks.push(scheduleWeekdays("evening", title, parts.join("\n"), ret, 30, "home",
          CATEGORY_IDS.evening, ALERT_CHANNEL_MAP.evening));
      }

      if (!commuteOn) {
        if (alerts.rain && cur) {
          const maxPrecip = Math.max(cur.precipitation, ...hourly.slice(0, 8).map((h) => h.precipitation));
          if (maxPrecip >= 30) {
            const rt = subtractMinutes(dep, 60);
            tasks.push(scheduleDailyFixed("rain", withName(nickname, "☂️ 오늘 비 소식!"), `강수확률 ${maxPrecip}%`, rt.hour, rt.minute, "/card-detail?type=action&id=umbrella",
              CATEGORY_IDS.rain, ALERT_CHANNEL_MAP.rain));
          }
        }
        if (alerts.dust && aq && aq.aqi >= 2) {
          const dt = subtractMinutes(dep, 45);
          tasks.push(scheduleDailyFixed("dust", withName(nickname, `😷 미세먼지 ${getPm25Status(aq.pm25).label}`), "마스크 챙기세요", dt.hour, dt.minute, "/card-detail?type=health&id=pm25",
            CATEGORY_IDS.dust, ALERT_CHANNEL_MAP.dust));
        }
        if (alerts.uv && cur && cur.uvIndex >= 3) {
          const label = getUvStatus(cur.uvIndex).label;
          tasks.push(scheduleDailyFixed("uv", withName(nickname, `🧴 자외선 ${label}`), `UV ${cur.uvIndex}`, 11, 0, "/card-detail?type=health&id=uv",
            CATEGORY_IDS.uv, ALERT_CHANNEL_MAP.uv));
        }
        if (alerts.pollen && cur) {
          const month = new Date().getMonth() + 1;
          if ((month >= 3 && month <= 5) || (month >= 9 && month <= 10)) {
            const pollen = getPollenStatus(cur.temp, cur.humidity, cur.windSpeed, cur.condition);
            if (pollen.status !== "safe") {
              tasks.push(scheduleDailyFixed("pollen", withName(nickname, `🌿 꽃가루 ${pollen.label}`), "마스크 챙기세요", 8, 0, "/card-detail?type=health&id=pollen",
                CATEGORY_IDS.pollen, ALERT_CHANNEL_MAP.pollen));
            }
          }
        }
      }

      if (alerts.game) {
        tasks.push(scheduleDailyFixed("game", "🎯 기온 예측 결과 확인", "오늘 맞혔는지 확인해보세요!", 21, 0, "event",
          CATEGORY_IDS.game, ALERT_CHANNEL_MAP.game));
      }

      await Promise.all(tasks);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (e) {
      logError("background-weather", e);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/** 백그라운드 fetch 등록 */
export async function registerBackgroundWeatherTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
    minimumInterval: MIN_INTERVAL_SEC,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

// ── Helpers ──

function withName(nickname: string, message: string): string {
  return nickname ? `${nickname}님, ${message}` : message;
}

function subtractMinutes(time: string, mins: number): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m - mins;
  if (total < 0) total += 24 * 60;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}

async function scheduleWeekdays(
  id: string, title: string, body: string,
  baseTime: string, minsBefore: number, screen: string,
  categoryIdentifier: string, channelId: string,
) {
  const { hour, minute } = subtractMinutes(baseTime, minsBefore);
  const weekdays = [2, 3, 4, 5, 6];
  await Promise.all(weekdays.map((weekday) =>
    Notifications.scheduleNotificationAsync({
      identifier: `malgeum-${id}-${weekday}`,
      content: {
        title,
        body,
        data: { screen, alertType: id },
        categoryIdentifier,
        ...(Platform.OS === "android" && { channelId }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: Math.max(0, Math.min(23, hour)),
        minute: Math.max(0, Math.min(59, minute)),
      } as any,
    }),
  ));
}

async function scheduleDailyFixed(
  id: string, title: string, body: string,
  hour: number, minute: number, screen: string,
  categoryIdentifier: string, channelId: string,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: `malgeum-${id}`,
    content: {
      title,
      body,
      data: { screen, alertType: id },
      categoryIdentifier,
      ...(Platform.OS === "android" && { channelId }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.max(0, Math.min(23, hour)),
      minute: Math.max(0, Math.min(59, minute)),
    } as any,
  });
}
