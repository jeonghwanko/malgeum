import { useEffect, useRef, useState } from "react";
import { getTimeOfDay } from "@/utils/date";
import { todayKey, prevDayKey } from "@/utils/date";
import { loadVisitStreak, daysSinceLastVisit } from "@/services/visitStreakService";
import { loadFeedbackHistory } from "@/services/feedbackService";
import { loadGameView } from "@/services/predictionGameService";
import { loadCachedFestivals } from "@/services/festivalService";
import { loadCachedPerformances } from "@/services/performanceService";
import { loadCachedCamping, isCampingWeather } from "@/services/campingService";
import { getLocale } from "@/i18n";
import { pickMalgeumGreeting } from "@/services/malgeumGreeting";
import type { GreetingContext, MalgeumGreeting } from "@/services/malgeumGreeting";
import type { WeatherBundle } from "@/types/weather";

/**
 * 맑음이 개인화 한마디 hook.
 * 비동기 데이터를 1회 로드 → GreetingContext 조립 → pickMalgeumGreeting 호출.
 * 세션 내 동일 문구 유지 (ref로 캐시).
 */
export function useMalgeumGreeting(
  bundle: WeatherBundle | null,
  nickname: string,
): MalgeumGreeting | null {
  const [greeting, setGreeting] = useState<MalgeumGreeting | null>(null);
  const computed = useRef(false);

  useEffect(() => {
    if (computed.current || !bundle?.current) return;
    computed.current = true;

    (async () => {
      const isKo = getLocale() === "ko";
      const [streak, feedbackHistory, gameView, festivals, performances, campingSites] = await Promise.all([
        loadVisitStreak(),
        loadFeedbackHistory(),
        loadGameView(),
        isKo ? loadCachedFestivals() : Promise.resolve([]),
        isKo ? loadCachedPerformances() : Promise.resolve([]),
        isKo ? loadCachedCamping() : Promise.resolve([]),
      ]);

      // stats를 feedbackHistory에서 직접 계산 (중복 AsyncStorage 읽기 제거)
      const fbTotal = feedbackHistory.length;
      const fbAccurate = feedbackHistory.filter((e) => e.accurate).length;

      const yesterday = prevDayKey(todayKey());
      const today = todayKey();

      // 어제 피드백
      const yesterdayFb = feedbackHistory.find((e) => e.date === yesterday);
      const yesterdayFeedback: GreetingContext["yesterdayFeedback"] = yesterdayFb
        ? (yesterdayFb.accurate ? "accurate" : "inaccurate")
        : null;

      // 어제 게임 결과
      const yesterdayGame = gameView.history
        .filter((e) => e.result && e.date !== today)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const yesterdayPrediction: GreetingContext["yesterdayPrediction"] =
        (yesterdayGame?.result as GreetingContext["yesterdayPrediction"]) ?? null;

      // 비 여부
      const maxPrecip = Math.max(
        bundle.current.precipitation,
        ...bundle.hourly.slice(0, 8).map((h) => h.precipitation),
      );

      // 근처 축제 (첫 번째)
      const nearbyFestival = festivals.length > 0 ? festivals[0].title : null;

      // 근처 공연 (첫 번째)
      const perf = performances.length > 0 ? performances[0] : null;
      const nearbyPerformance = perf
        ? { title: perf.title, genre: perf.genre, venue: perf.venue }
        : null;

      // 캠핑 (날씨 조건 충족 시만)
      const hasRain = maxPrecip >= 30;
      const campingOk = isCampingWeather(bundle.current.condition, bundle.current.feelsLike, hasRain);
      const nearbyCamping = campingOk && campingSites.length > 0 ? campingSites[0].name : null;

      const ctx: GreetingContext = {
        condition: bundle.current.condition,
        feelsLike: bundle.current.feelsLike,
        hasRain: maxPrecip >= 30,
        timeOfDay: getTimeOfDay() as GreetingContext["timeOfDay"],
        nickname,
        consecutiveDays: streak.consecutiveDays,
        daysSinceLastVisit: daysSinceLastVisit(streak),
        yesterdayFeedback,
        feedbackTotal: fbTotal,
        yesterdayPrediction,
        predictionStreak: gameView.stats.currentStreak,
        isFirstVisit: !streak.lastVisitDate,
        nearbyFestival,
        nearbyPerformance,
        nearbyCamping,
      };

      setGreeting(pickMalgeumGreeting(ctx));
    })();
  }, [!!bundle?.current, nickname]);

  return greeting;
}
