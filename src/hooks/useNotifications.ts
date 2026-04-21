import { useEffect, useRef } from "react";
import { Platform, InteractionManager } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import type { AlertSettings } from "@/types/settings";
import type { CurrentWeather, HourlyWeather, AirQuality } from "@/types/weather";
import { getPm25Status, getUvStatus, getPollenStatus } from "@/utils/weather";
import { getYesterdayMax } from "@/services/predictionGameService";
import { loadGameView } from "@/services/predictionGameService";
import {
  buildCommuteCopy,
  buildEveningCopy,
  buildRainCopy,
  buildDustCopy,
  buildUvCopy,
  buildPollenCopy,
  withName,
  type WeatherContext,
} from "@/services/microcopy";
import { logNotificationOpen, logNotificationAction } from "@/services/analytics";
import {
  registerNotificationCategories,
  cancelWeatherNotifications,
  CATEGORY_IDS,
  CHANNEL_IDS,
  ALERT_CHANNEL_MAP,
  ACTION_IDS,
} from "@/services/notificationCategories";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface WeatherSnapshot {
  current: CurrentWeather | null;
  hourly: HourlyWeather[];
  airQuality: AirQuality | null;
}

export function useNotifications() {
  const router = useRouter();
  const { state } = useWeatherContext();
  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);
  const prevKeyRef = useRef("");

  useEffect(() => {
    void Promise.all([registerNotificationCategories(), setupAndroidChannels()]);

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {}
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      const actionId = response.actionIdentifier;
      const screen = data?.screen ?? "home";
      const alertType = data?.alertType ?? "unknown";

      // 앱을 열지 않는 백그라운드 액션
      if (actionId === ACTION_IDS.umbrellaChecked) {
        logNotificationAction(actionId, alertType);
        return;
      }

      // 로그 (액션 버튼이면 actionId 포함)
      const isCustomAction = actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER;
      logNotificationOpen(screen, alertType, isCustomAction ? actionId : undefined);

      // 액션별 라우팅 오버라이드
      const actionRoute: Record<string, string> = {
        [ACTION_IDS.viewHourly]: "/card-detail?type=action&id=umbrella",
        [ACTION_IDS.viewResult]: "/(tabs)/event",
      };
      const route = actionRoute[actionId];
      if (route) {
        router.push(route as never);
        return;
      }

      // 기본 라우팅 (data.screen 기반)
      if (screen === "event") {
        router.push("/(tabs)/event" as never);
      } else if (screen === "/(tabs)/notify") {
        router.push("/(tabs)/notify" as never);
      } else if (screen === "diary") {
        router.push("/diary" as never);
      } else if (screen.startsWith("card-detail") || screen.startsWith("/card-detail")) {
        router.push(screen as never);
      } else {
        router.push("/(tabs)");
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = JSON.stringify({
      alerts: state.alerts,
      commute: state.commuteTime,
      cond: state.currentWeather?.condition,
      temp: state.currentWeather?.feelsLike,
      precip: state.currentWeather?.precipitation,
      aqi: state.airQuality?.aqi,
    });
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    const snapshot: WeatherSnapshot = {
      current: state.currentWeather,
      hourly: state.hourlyForecast,
      airQuality: state.airQuality,
    };

    const location = state.locations.find((l) => l.id === state.currentLocationId);
    const locationName = location?.name ?? "";
    const nickname = state.nickname;

    const task = InteractionManager.runAfterInteractions(() => {
      syncAllNotifications(
        state.alerts,
        state.commuteTime.departure,
        state.commuteTime.return,
        snapshot,
        nickname,
        locationName,
      );
    });
    return () => task.cancel();
  }, [state.alerts, state.commuteTime, state.currentWeather, state.hourlyForecast, state.airQuality, state.locations, state.currentLocationId, state.nickname]);
}

// ──────────────────────────── Android 채널 ────────────────────────────

async function setupAndroidChannels() {
  if (Platform.OS !== "android") return;

  // 기존 "default" 채널 정리
  await Notifications.deleteNotificationChannelAsync("default").catch(() => {});

  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.weather, {
      name: "날씨 알림",
      description: "출퇴근, 비, 자외선 등 날씨 알림",
      importance: Notifications.AndroidImportance.MAX,
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.health, {
      name: "건강 알림",
      description: "미세먼지, 꽃가루 등 건강 관련 알림",
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.lifestyle, {
      name: "생활 알림",
      description: "기온 예측 게임 등",
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.nag, {
      name: "잔소리 알림",
      description: "소중한 사람이 보낸 잔소리 메시지",
      importance: Notifications.AndroidImportance.HIGH,
    }),
  ]);
}

// ──────────────────────────── 알림 동기화 ────────────────────────────

async function syncAllNotifications(
  alerts: AlertSettings,
  departure: string,
  returnTime: string,
  weather: WeatherSnapshot,
  nickname: string,
  locationName: string,
) {
  await cancelWeatherNotifications();

  const cur = weather.current;
  const hourly = weather.hourly;
  const aq = weather.airQuality;
  if (!cur) return;

  // 어제 대비 기온차
  let yesterdayDiff: number | null = null;
  try {
    const yMax = await getYesterdayMax();
    if (yMax !== null) yesterdayDiff = Math.round(cur.temp - yMax);
  } catch { /* 어제 데이터 없으면 null */ }

  // 공통 WeatherContext — microcopy 시스템에 전달
  const ctx: WeatherContext = {
    current: cur,
    hourly,
    airQuality: aq,
    yesterdayDiff,
    locationName,
    nickname,
  };

  const tasks: Promise<void>[] = [];
  const commuteOn = alerts.commute;

  if (commuteOn) {
    tasks.push(scheduleCommuteNotification(departure, ctx));
  }
  if (alerts.evening) {
    tasks.push(scheduleEveningNotification(returnTime, ctx));
  }

  // 비·미세먼지·UV·꽃가루 — 출근 알림이 꺼져 있을 때만 단독 발송
  if (!commuteOn) {
    if (alerts.rain) {
      const maxPrecip = Math.max(cur.precipitation, ...hourly.slice(0, 8).map((h) => h.precipitation));
      if (maxPrecip >= 30) tasks.push(scheduleRainNotification(departure, ctx));
    }
    if (alerts.dust && aq && aq.aqi >= 2) {
      tasks.push(scheduleDustNotification(departure, ctx));
    }
    if (alerts.uv && cur.uvIndex >= 3) {
      tasks.push(scheduleUvNotification(ctx));
    }
    if (alerts.pollen) {
      const month = new Date().getMonth() + 1;
      const isPollenSeason = (month >= 3 && month <= 5) || (month >= 9 && month <= 10);
      if (isPollenSeason) {
        const pollen = getPollenStatus(cur.temp, cur.humidity, cur.windSpeed, cur.condition);
        if (pollen.status !== "safe") tasks.push(schedulePollenNotification(ctx));
      }
    }
  }

  if (alerts.game) {
    tasks.push(scheduleGameNotification());
  }

  await Promise.all(tasks);
}


// ──────────────────────────── 개별 알림 ────────────────────────────

async function scheduleCommuteNotification(departure: string, ctx: WeatherContext) {
  const { hour, minute } = subtractMinutes(departure, 30);
  const { title, body } = buildCommuteCopy(ctx);
  await scheduleWeekdayNotifications("commute", title, body, hour, minute,
    { screen: "home", alertType: "commute" },
    CATEGORY_IDS.commute, ALERT_CHANNEL_MAP.commute);
}

async function scheduleEveningNotification(returnTime: string, ctx: WeatherContext) {
  const { hour, minute } = subtractMinutes(returnTime, 30);
  const { title, body } = buildEveningCopy(ctx);
  await scheduleWeekdayNotifications("evening", title, body, hour, minute,
    { screen: "home", alertType: "evening" },
    CATEGORY_IDS.evening, ALERT_CHANNEL_MAP.evening);
}

async function scheduleRainNotification(departure: string, ctx: WeatherContext) {
  const { hour, minute } = subtractMinutes(departure, 60);
  const { title, body } = buildRainCopy(ctx);
  await scheduleDailyNotification("rain", title, body, hour, minute,
    { screen: "/card-detail?type=action&id=umbrella", alertType: "rain" },
    CATEGORY_IDS.rain, ALERT_CHANNEL_MAP.rain);
}

async function scheduleDustNotification(departure: string, ctx: WeatherContext) {
  const { hour, minute } = subtractMinutes(departure, 45);
  const { title, body } = buildDustCopy(ctx);
  await scheduleDailyNotification("dust", title, body, hour, minute,
    { screen: "/card-detail?type=health&id=pm25", alertType: "dust" },
    CATEGORY_IDS.dust, ALERT_CHANNEL_MAP.dust);
}

async function scheduleUvNotification(ctx: WeatherContext) {
  const { title, body } = buildUvCopy(ctx);
  await scheduleDailyNotification("uv", title, body, 11, 0,
    { screen: "/card-detail?type=health&id=uv", alertType: "uv" },
    CATEGORY_IDS.uv, ALERT_CHANNEL_MAP.uv);
}

async function schedulePollenNotification(ctx: WeatherContext) {
  const { title, body } = buildPollenCopy(ctx);
  await scheduleDailyNotification("pollen", title, body, 8, 0,
    { screen: "/card-detail?type=health&id=pollen", alertType: "pollen" },
    CATEGORY_IDS.pollen, ALERT_CHANNEL_MAP.pollen);
}

async function scheduleGameNotification() {
  let title = "🎯 기온 예측 결과 확인";
  let body = "오늘 맞혔는지 확인해보세요!";
  try {
    const { stats } = await loadGameView();
    if (stats.currentStreak >= 2) {
      title = `🎯 ${stats.currentStreak}연승 중!`;
      body = "오늘도 맞혔는지 확인해보세요";
    } else if (stats.totalWins > 0) {
      const rate = stats.winRate;
      body = `승률 ${rate}% · 오늘 결과를 확인하세요`;
    }
  } catch { /* 게임 데이터 없으면 기본 메시지 */ }
  await scheduleDailyNotification("game", title, body, 21, 0,
    { screen: "event", alertType: "game" },
    CATEGORY_IDS.game, ALERT_CHANNEL_MAP.game);
}

// ──────────────────────────── Helpers ────────────────────────────

async function scheduleWeekdayNotifications(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  data: Record<string, string>,
  categoryIdentifier: string,
  channelId: string,
) {
  const weekdays = [2, 3, 4, 5, 6]; // 월~금
  await Promise.all(weekdays.map((weekday) =>
    Notifications.scheduleNotificationAsync({
      identifier: `malgeum-${id}-${weekday}`,
      content: {
        title,
        body,
        data,
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

async function scheduleDailyNotification(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  data: Record<string, string>,
  categoryIdentifier: string,
  channelId: string,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: `malgeum-${id}`,
    content: {
      title,
      body,
      data,
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

function subtractMinutes(time: string, mins: number): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  let totalMinutes = h * 60 + m - mins;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  return { hour: Math.floor(totalMinutes / 60) % 24, minute: totalMinutes % 60 };
}
