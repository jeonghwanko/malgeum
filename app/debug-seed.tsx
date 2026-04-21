/**
 * 데모 시드 라우트 — 스토어 스크린샷 촬영용 AsyncStorage 한 번에 주입.
 *
 * 진입: `malgeum://debug-seed` 또는 `/debug-seed` 네비게이션.
 * 스크린샷 완료 후 롤백 가능하도록 단일 파일로 격리.
 *
 * 시드 내용:
 * - 예측 7일 체인 (dailyStreak 7, 어제 win 배너)
 * - 피드백 10건 (적중률 80%)
 * - 카드 탭 카운트 (성격 "아침 전략가" 유도)
 * - 일기 3편
 * - AppState (서울 강남구 · 출근 08:30 · onboardingDone=true)
 */

import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey, prevDayKey } from "@/utils/date";
import { useWeatherActions, type AppState } from "@/context/WeatherContext";
import type { PredictionEntry } from "@/types/predictionGame";
import type { FeedbackEntry } from "@/services/feedbackService";
import type { DiaryEntry } from "@/types/diary";

const DEMO_STATE: AppState = {
  nickname: "맑음",
  locations: [
    { id: "seoul-gangnam", name: "서울 강남구", lat: 37.498, lon: 127.028, isGps: false },
  ],
  currentLocationId: "seoul-gangnam",
  commuteTime: { departure: "08:30", return: "18:00" },
  tempUnit: "C",
  alerts: { commute: true, rain: true, dust: true, uv: false, pollen: false, evening: true, game: true },
  healthProfile: { allergens: [], exercisePreference: "가벼운 러닝", clothingStyle: "비즈니스 캐주얼" },
  schoolSettings: null,
  currentWeather: null,
  hourlyForecast: [],
  hourlyAir: [],
  hourlyUv: [],
  dailyForecast: [],
  airQuality: null,
  pollen: null,
  lastFetchedAt: null,
  onboardingDone: true,
};

// 어제까지 6일 settled + 오늘 pending → dailyStreak 7
const RESULT_PATTERN: Array<"win" | "lose" | "tie" | null> = [
  "win", "win", "lose", "win", "tie", "win", null,
];
const CHOICE_PATTERN: Array<"higher" | "lower"> = [
  "higher", "higher", "lower", "higher", "higher", "lower", "higher",
];

async function seedPredictions(): Promise<void> {
  const predictions: PredictionEntry[] = [];
  const weeklyMax: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    let cursor = todayKey();
    for (let j = 0; j < 6 - i; j++) cursor = prevDayKey(cursor);

    const baseMax = 18 + (i % 4);
    const result = RESULT_PATTERN[i];
    const choice = CHOICE_PATTERN[i];

    if (result === null) {
      predictions.push({ date: cursor, targetDate: cursor, baseMax, choice });
      weeklyMax[cursor] = baseMax + 2;
    } else {
      const actualMax =
        result === "win" ? (choice === "higher" ? baseMax + 2 : baseMax - 2)
        : result === "lose" ? (choice === "higher" ? baseMax - 2 : baseMax + 2)
        : baseMax;
      weeklyMax[cursor] = actualMax;
      predictions.push({
        date: cursor,
        targetDate: cursor,
        baseMax,
        choice,
        actualMax,
        result,
        settledAt: `${cursor}T23:00:00.000Z`,
      });
    }
  }

  await Promise.all([
    saveJson(STORAGE_KEYS.GAME_PREDICTIONS, predictions),
    saveJson(STORAGE_KEYS.WEEKLY_MAX, weeklyMax),
    saveJson(STORAGE_KEYS.PREDICTION_LAST_DATE, todayKey()),
  ]);
}

async function seedFeedback(): Promise<void> {
  const feedback: FeedbackEntry[] = [];
  let cursor = todayKey();
  for (let i = 0; i < 10; i++) {
    feedback.unshift({
      date: cursor,
      accurate: i !== 3 && i !== 7,
      feelsLike: 15 + (i % 10),
    });
    cursor = prevDayKey(cursor);
  }
  await Promise.all([
    saveJson(STORAGE_KEYS.FEEDBACK, feedback),
    saveJson(STORAGE_KEYS.FEEDBACK_LAST_DATE, todayKey()),
  ]);
}

async function seedCardTaps(): Promise<void> {
  await saveJson(STORAGE_KEYS.CARD_TAP_COUNTS, {
    commute: 8,
    clothing: 12,
    umbrella: 3,
    health: 2,
    outdoor: 1,
    lifestyle: 0,
  });
}

async function seedDiary(): Promise<void> {
  const d0 = todayKey();
  const d1 = prevDayKey(d0);
  const d2 = prevDayKey(d1);
  const now = Date.now();
  const entries: DiaryEntry[] = [
    { date: d0, condition: "clear", temp: 22, memo: "맑은 오후, 커피가 달다", createdAt: new Date(now).toISOString() },
    { date: d1, condition: "rain", temp: 18, memo: "비 오는 소리가 좋아", createdAt: new Date(now - 86_400_000).toISOString() },
    { date: d2, condition: "clouds", temp: 20, memo: "구름이 예뻐서 한참 봤어", createdAt: new Date(now - 172_800_000).toISOString() },
  ];
  await Promise.all([
    saveJson(STORAGE_KEYS.DIARY, entries),
    saveJson(STORAGE_KEYS.DIARY_LAST_DATE, d0),
  ]);
}

export default function DebugSeedScreen() {
  const router = useRouter();
  const { dispatch, refreshWeather } = useWeatherActions();

  useEffect(() => {
    (async () => {
      await Promise.all([
        seedPredictions(),
        seedFeedback(),
        seedCardTaps(),
        seedDiary(),
      ]);
      dispatch({ type: "LOAD", payload: DEMO_STATE });
      await refreshWeather().catch(() => {});
      router.replace("/(tabs)" as never);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#fff" />
      <Text style={styles.text}>데모 데이터 주입 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
