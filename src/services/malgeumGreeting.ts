import { t, tRandom } from "@/i18n";
import { getConditionEmoji } from "@/constants/weather-assets";
import type { WeatherCondition } from "@/types/weather";

export interface GreetingContext {
  condition: string;
  feelsLike: number;
  hasRain: boolean;
  timeOfDay: "dawn" | "morning" | "afternoon" | "evening" | "night";
  nickname: string;
  consecutiveDays: number;
  daysSinceLastVisit: number;
  yesterdayFeedback: "accurate" | "inaccurate" | null;
  feedbackTotal: number;
  yesterdayPrediction: "win" | "lose" | "tie" | null;
  predictionStreak: number;
  isFirstVisit: boolean;
  nearbyFestival: string | null; // 근처 축제/행사 이름 (있으면)
  nearbyPerformance: { title: string; genre: string; venue: string } | null;
  nearbyCamping: string | null; // 캠핑장 이름 (캠핑 날씨일 때만)
}

export interface MalgeumGreeting {
  message: string;
  emoji: string;
  category: string;
}

const FEEDBACK_MILESTONES = [100, 50, 20, 10];
const STREAK_SPECIALS = [100, 30, 14, 7, 3];

function withNickname(msg: string, nickname: string): string {
  if (!nickname) return msg;
  return msg.replace("{{nickname}}", nickname);
}

/**
 * 맑음이의 개인화 한마디를 생성한다.
 * 순수 함수 — 비동기 없음. 우선순위 순서로 조건을 평가.
 */
export function pickMalgeumGreeting(ctx: GreetingContext): MalgeumGreeting {
  // 1. 첫 방문
  if (ctx.isFirstVisit) {
    return { message: withNickname(tRandom("mg.first"), ctx.nickname), emoji: "👋", category: "first" };
  }

  // 2. 오랜만 복귀 (3일+ 미접속)
  if (ctx.daysSinceLastVisit >= 3) {
    return { message: withNickname(tRandom("mg.return"), ctx.nickname), emoji: "🥹", category: "return" };
  }

  // 3. 어제 피드백 반응
  if (ctx.yesterdayFeedback !== null) {
    const milestone = FEEDBACK_MILESTONES.find((m) => ctx.feedbackTotal === m);
    if (milestone) {
      return {
        message: t("mg.fb.milestone", { total: milestone }),
        emoji: "🎉",
        category: "feedback",
      };
    }
    if (ctx.yesterdayFeedback === "accurate") {
      return { message: tRandom("mg.fb.accurate"), emoji: "😎", category: "feedback" };
    }
    return { message: tRandom("mg.fb.inaccurate"), emoji: "😅", category: "feedback" };
  }

  // 4. 어제 게임 결과
  if (ctx.yesterdayPrediction !== null) {
    if (ctx.yesterdayPrediction === "win" && ctx.predictionStreak >= 3) {
      return {
        message: tRandom("mg.game.winStreak").replace("{{streak}}", String(ctx.predictionStreak)),
        emoji: "🔥",
        category: "game",
      };
    }
    if (ctx.yesterdayPrediction === "win") {
      return { message: tRandom("mg.game.win"), emoji: "🎯", category: "game" };
    }
    if (ctx.yesterdayPrediction === "lose") {
      return { message: tRandom("mg.game.lose"), emoji: "💪", category: "game" };
    }
    // tie — 폴스루
  }

  // 5. 연속 접속 칭찬 (3일+)
  if (ctx.consecutiveDays >= 3) {
    const special = STREAK_SPECIALS.find((d) => ctx.consecutiveDays === d);
    if (special) {
      return {
        message: tRandom(`mg.streak.${special}`),
        emoji: ctx.consecutiveDays >= 30 ? "💖" : "✨",
        category: "streak",
      };
    }
    return { message: tRandom("mg.streak.generic"), emoji: "✨", category: "streak" };
  }

  // 6. 근처 축제/행사
  if (ctx.nearbyFestival) {
    const festivalMsg = ctx.hasRain
      ? tRandom("mg.festival.rain").replace("{{name}}", ctx.nearbyFestival)
      : tRandom("mg.festival.good").replace("{{name}}", ctx.nearbyFestival);
    return { message: festivalMsg, emoji: "🎪", category: "festival" };
  }

  // 7. 근처 공연 (날씨 감성 연결)
  if (ctx.nearbyPerformance) {
    const p = ctx.nearbyPerformance;
    const key = ctx.hasRain || ctx.condition === "dust" || ctx.condition === "snow"
      ? "mg.perf.indoor"
      : "mg.perf.good";
    const msg = tRandom(key)
      .replace("{{title}}", p.title)
      .replace("{{genre}}", p.genre)
      .replace("{{venue}}", p.venue);
    return { message: msg, emoji: "🎭", category: "performance" };
  }

  // 8. 캠핑 추천 (맑음+따뜻+비없음)
  if (ctx.nearbyCamping) {
    const msg = tRandom("mg.camping").replace("{{name}}", ctx.nearbyCamping);
    return { message: msg, emoji: "⛺", category: "camping" };
  }

  // 9. 날씨+시간대 폴백
  const msg = tRandom(`mg.weather.${ctx.condition}.${ctx.timeOfDay}`);
  return { message: msg, emoji: getConditionEmoji(ctx.condition as WeatherCondition) ?? "☀️", category: "weather" };
}
