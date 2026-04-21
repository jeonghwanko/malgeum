/**
 * 개인 날씨 성격 프로필 집계 서비스.
 * 기존 서비스를 병렬 호출하여 "나의 날씨 성격" 인사이트를 생성.
 * 새 데이터 수집 없음 — 읽기 전용.
 */

import { loadCardTapCounts, sumTapCounts, type CardTapCounts } from "@/services/cardPreferenceService";
import { loadFeedbackHistory, type FeedbackEntry } from "@/services/feedbackService";
import { getGameStats } from "@/services/predictionGameService";
import { loadDiary } from "@/services/diaryService";
import { getConditionLabel } from "@/utils/weather";
import type { CardCategory } from "@/types/actions";
import type { WeatherCondition } from "@/types/weather";
import type {
  WeatherPersonalityType,
  PersonalityInsight,
  PersonalityProfile,
} from "@/types/personality";
import { countConsecutiveDays } from "@/utils/date";

interface TypeMeta {
  emoji: string;
  desc: string;
  paradox: string;
  rarity: number; // 추정 희귀도 %
}

const TYPE_META: Record<WeatherPersonalityType, TypeMeta> = {
  "우산 낭만가": {
    emoji: "☂️",
    desc: "비 올 확률 1%도 놓치지 않는 사람",
    paradox: "계획파지만, 실제 비 오면 가장 먼저 집에 돌아가는 타입",
    rarity: 14.2,
  },
  "아침 전략가": {
    emoji: "👔",
    desc: "출퇴근 날씨가 곧 오늘의 기분",
    paradox: "옷차림 완벽한데 우산은 자주 놓고 다님",
    rarity: 18.6,
  },
  "미세먼지 감시자": {
    emoji: "😷",
    desc: "숨 하나도 놓치지 않는 사람",
    paradox: "경보 뜨면 오히려 외출해서 직접 확인하는 본능",
    rarity: 7.3,
  },
  "주말 계획가": {
    emoji: "🏕️",
    desc: "날씨 좋은 날 무조건 나가는 사람",
    paradox: "예측은 가장 정확한데, 우산은 접어 놓고 다님",
    rarity: 11.8,
  },
  "비의 낭만가": {
    emoji: "🌧️",
    desc: "빗소리에 멈추는 사람",
    paradox: "낭만을 사랑하지만 실제 비 오면 택시부터 부름",
    rarity: 9.4,
  },
  "폭풍 관전자": {
    emoji: "⛈️",
    desc: "극적인 하늘을 기다리는 사람",
    paradox: "맑은 날엔 앱 거의 안 엶 (월 3회 미만)",
    rarity: 3.8,
  },
};

const CATEGORY_EMOJI: Record<CardCategory, string> = {
  umbrella: "☂️", clothing: "👔", outdoor: "🏔️",
  health: "💪", commute: "🚌", lifestyle: "✨",
};

const CATEGORY_LABEL: Record<CardCategory, string> = {
  umbrella: "우산", clothing: "옷차림", outdoor: "야외활동",
  health: "건강", commute: "출퇴근", lifestyle: "라이프스타일",
};

function derivePersonalityType(
  tapCounts: CardTapCounts,
  diaryCount: number,
  gameDecided: number,
): WeatherPersonalityType | null {
  const scores: Record<WeatherPersonalityType, number> = {
    "우산 낭만가": tapCounts.umbrella ?? 0,
    "아침 전략가": (tapCounts.commute ?? 0) + (tapCounts.clothing ?? 0),
    "미세먼지 감시자": tapCounts.health ?? 0,
    "주말 계획가": (tapCounts.outdoor ?? 0) + (tapCounts.lifestyle ?? 0),
    "비의 낭만가": diaryCount * 3,
    "폭풍 관전자": gameDecided * 2,
  };

  let best: WeatherPersonalityType | null = null;
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores) as [WeatherPersonalityType, number][]) {
    if (score > bestScore) { bestScore = score; best = type; }
  }
  return bestScore >= 5 ? best : null;
}

/** 진행도 0~1: 데이터 4종 누적 가중 평균. ready 임계값과 무관하게 계속 증가 */
function computeProgress(tapTotal: number, fbTotal: number, gameDecided: number, diaryCount: number): number {
  const raw = (
    Math.min(tapTotal / 10, 1) +
    Math.min(fbTotal / 5, 1) +
    Math.min(gameDecided / 5, 1) +
    Math.min(diaryCount / 3, 1)
  ) / 4;
  return Math.max(0, Math.min(1, raw));
}

// ── 피드백 히스토리 집계 (한 번 로드 → 3개 지표 파생) ──

function computeStatsFromHistory(history: FeedbackEntry[]) {
  const total = history.length;
  if (total === 0) return { total: 0, accurate: 0, rate: 0 };
  const accurate = history.filter((e) => e.accurate).length;
  return { total, accurate, rate: Math.round((accurate / total) * 100) };
}

function computeStreakFromHistory(history: FeedbackEntry[]): number {
  return countConsecutiveDays(history.map((e) => e.date));
}

function computeOffsetFromHistory(history: FeedbackEntry[]): number {
  const inaccurate = history.filter((e) => !e.accurate && e.feelsLike !== undefined);
  if (inaccurate.length < 5) return 0;
  const coldMiss = inaccurate.filter((e) => e.feelsLike! < 16).length;
  const hotMiss = inaccurate.filter((e) => e.feelsLike! >= 16).length;
  const ratio = (hotMiss - coldMiss) / inaccurate.length;
  return Math.round(ratio * 2 * 10) / 10;
}

// ── 인사이트 빌드 ──

interface InsightInput {
  tapCounts: CardTapCounts;
  tapTotal: number;
  fbTotal: number;
  fbRate: number;
  streak: number;
  tempOffset: number;
  gameWinRate: number;
  gameBestStreak: number;
  gameDecided: number;
  diaryCount: number;
  diaryTopCondition: string | null;
}

function buildInsights(input: InsightInput): PersonalityInsight[] {
  const insights: PersonalityInsight[] = [];
  const { tapCounts, tapTotal, fbTotal, fbRate, streak, tempOffset, gameWinRate, gameBestStreak, gameDecided, diaryCount, diaryTopCondition } = input;

  if (tapTotal >= 10) {
    const topEntry = Object.entries(tapCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
    if (topEntry) {
      const cat = topEntry[0] as CardCategory;
      const pct = Math.round(((topEntry[1] ?? 0) / tapTotal) * 100);
      insights.push({ id: "top_category", emoji: CATEGORY_EMOJI[cat], title: `가장 신경 쓰는 건 ${CATEGORY_LABEL[cat]}`, detail: `전체 탭의 ${pct}%를 차지해요` });
    }
  }

  if (fbTotal >= 5) {
    const comment = fbRate >= 80 ? "잘 맞고 있어요!" : fbRate >= 60 ? "꽤 괜찮은 편이에요" : "조금 더 맞춰볼게요";
    insights.push({ id: "accuracy", emoji: "🎯", title: `추천 적중률 ${fbRate}%`, detail: `${fbTotal}일 평가 기준 — ${comment}` });
  }

  if (streak >= 3) {
    insights.push({ id: "streak", emoji: "🔥", title: `${streak}일 연속 평가 중`, detail: "꾸준한 피드백이 추천을 더 정확하게 만들어요" });
  }

  if (tempOffset !== 0) {
    const isCold = tempOffset < 0;
    insights.push({ id: "temp_sensitivity", emoji: isCold ? "🧊" : "🔥", title: isCold ? "추위를 잘 타는 편이에요" : "더위를 잘 타는 편이에요", detail: "피드백 분석으로 옷차림 추천을 보정하고 있어요" });
  }

  if (gameDecided >= 5) {
    insights.push({ id: "game", emoji: "🏆", title: `예측 승률 ${gameWinRate}%`, detail: gameBestStreak >= 3 ? `최고 ${gameBestStreak}연승 달성!` : `${gameDecided}판 도전 중` });
  }

  if (diaryCount >= 3) {
    const condNote = diaryTopCondition ? ` · ${diaryTopCondition} 날이 가장 많아요` : "";
    insights.push({ id: "diary", emoji: "📝", title: `날씨 일기 ${diaryCount}편`, detail: `감정을 날씨에 담고 있어요${condNote}` });
  }

  return insights;
}

// ── 메인 함수 ──

export async function computePersonalityProfile(): Promise<PersonalityProfile> {
  const [tapCounts, fbHistory, gameStats, diary] = await Promise.all([
    loadCardTapCounts(),
    loadFeedbackHistory(),
    getGameStats(),
    loadDiary(),
  ]);

  // 피드백 히스토리 1회 로드 → 3개 지표 병합 파생
  const fbStats = computeStatsFromHistory(fbHistory);
  const streak = computeStreakFromHistory(fbHistory);
  const tempOffset = computeOffsetFromHistory(fbHistory);

  const tapTotal = sumTapCounts(tapCounts);
  const gameDecided = gameStats.totalWins + gameStats.totalLosses;
  const diaryCount = diary.length;

  const ready = tapTotal >= 10 || fbStats.total >= 5 || gameDecided >= 5 || diaryCount >= 3;
  const personalityType = ready ? derivePersonalityType(tapCounts, diaryCount, gameDecided) : null;
  const meta = personalityType ? TYPE_META[personalityType] : null;
  const progress = computeProgress(tapTotal, fbStats.total, gameDecided, diaryCount);

  // 일기에서 가장 많은 날씨 조건 (한글 라벨)
  let diaryTopCondition: string | null = null;
  if (diaryCount >= 3) {
    const condCounts: Record<string, number> = {};
    for (const d of diary) { condCounts[d.condition] = (condCounts[d.condition] ?? 0) + 1; }
    const top = Object.entries(condCounts).sort((a, b) => b[1] - a[1])[0];
    if (top) diaryTopCondition = getConditionLabel(top[0] as WeatherCondition);
  }

  const insights = ready
    ? buildInsights({ tapCounts, tapTotal, fbTotal: fbStats.total, fbRate: fbStats.rate, streak, tempOffset, gameWinRate: gameStats.winRate, gameBestStreak: gameStats.bestStreak, gameDecided, diaryCount, diaryTopCondition })
    : [];

  const oldestDate = diary.length > 0 ? diary[diary.length - 1]?.date : null;
  const totalDays = oldestDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(oldestDate).getTime()) / 86_400_000))
    : fbStats.total || 1;

  return {
    ready,
    personalityType,
    personalityEmoji: meta?.emoji ?? "☁️",
    personalityLabel: personalityType ?? "알아가는 중",
    personalityDesc: meta?.desc ?? "조금 더 사용하면 나만의 날씨 성격이 나타나요",
    personalityParadox: meta?.paradox ?? null,
    rarity: meta?.rarity ?? null,
    progress,
    insights,
    totalDays,
    fbRate: fbStats.rate,
    fbTotal: fbStats.total,
  };
}
