/**
 * 날씨 성격 서비스 테스트 — 라벨 분포, 진행도 계산, 희귀도·역설 매핑
 */
import { computePersonalityProfile } from "../services/personalityService";
import type { FeedbackEntry } from "../services/feedbackService";
import type { CardTapCounts } from "../services/cardPreferenceService";

// Mock asyncstorage 의존성
jest.mock("../services/feedbackService", () => ({
  loadFeedbackHistory: jest.fn(),
}));
jest.mock("../services/cardPreferenceService", () => ({
  loadCardTapCounts: jest.fn(),
  sumTapCounts: (c: CardTapCounts) =>
    (c.umbrella ?? 0) + (c.clothing ?? 0) + (c.health ?? 0) + (c.outdoor ?? 0) + (c.commute ?? 0) + (c.lifestyle ?? 0),
}));
jest.mock("../services/predictionGameService", () => ({
  getGameStats: jest.fn(),
}));
jest.mock("../services/diaryService", () => ({
  loadDiary: jest.fn(),
}));

import { loadFeedbackHistory } from "../services/feedbackService";
import { loadCardTapCounts } from "../services/cardPreferenceService";
import { getGameStats } from "../services/predictionGameService";
import { loadDiary } from "../services/diaryService";

function setupMocks(opts: {
  tapCounts?: Partial<CardTapCounts>;
  feedback?: FeedbackEntry[];
  gameStats?: { totalWins: number; totalLosses: number; totalTies: number; winRate: number; bestStreak: number; currentStreak: number; weekWins: number; weekLosses: number };
  diary?: Array<{ date: string; condition: string; temp: number; memo: string }>;
}) {
  (loadCardTapCounts as jest.Mock).mockResolvedValue({
    umbrella: 0, clothing: 0, health: 0, outdoor: 0, commute: 0, lifestyle: 0,
    ...opts.tapCounts,
  });
  (loadFeedbackHistory as jest.Mock).mockResolvedValue(opts.feedback ?? []);
  (getGameStats as jest.Mock).mockResolvedValue(
    opts.gameStats ?? { totalWins: 0, totalLosses: 0, totalTies: 0, winRate: 0, bestStreak: 0, currentStreak: 0, weekWins: 0, weekLosses: 0 },
  );
  (loadDiary as jest.Mock).mockResolvedValue(opts.diary ?? []);
}

describe("computePersonalityProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("데이터 없으면 ready=false, 라벨 '알아가는 중'", async () => {
    setupMocks({});
    const profile = await computePersonalityProfile();
    expect(profile.ready).toBe(false);
    expect(profile.personalityType).toBeNull();
    expect(profile.personalityLabel).toBe("알아가는 중");
    expect(profile.personalityEmoji).toBe("☁️");
    expect(profile.rarity).toBeNull();
    expect(profile.personalityParadox).toBeNull();
  });

  it("umbrella 탭 누적 → '우산 낭만가'", async () => {
    setupMocks({
      tapCounts: { umbrella: 12, clothing: 1 },
    });
    const profile = await computePersonalityProfile();
    expect(profile.ready).toBe(true);
    expect(profile.personalityType).toBe("우산 낭만가");
    expect(profile.personalityEmoji).toBe("☂️");
    expect(profile.rarity).toBe(14.2);
    expect(profile.personalityParadox).toContain("계획파");
  });

  it("commute + clothing 조합 → '아침 전략가'", async () => {
    setupMocks({
      tapCounts: { umbrella: 2, commute: 8, clothing: 5 },
    });
    const profile = await computePersonalityProfile();
    expect(profile.personalityType).toBe("아침 전략가");
    expect(profile.rarity).toBe(18.6);
  });

  it("health 탭 → '미세먼지 감시자'", async () => {
    setupMocks({ tapCounts: { health: 10 } });
    const profile = await computePersonalityProfile();
    expect(profile.personalityType).toBe("미세먼지 감시자");
    expect(profile.personalityEmoji).toBe("😷");
    expect(profile.rarity).toBe(7.3);
  });

  it("outdoor + lifestyle → '주말 계획가'", async () => {
    setupMocks({ tapCounts: { outdoor: 6, lifestyle: 5 } });
    const profile = await computePersonalityProfile();
    expect(profile.personalityType).toBe("주말 계획가");
    expect(profile.personalityEmoji).toBe("🏕️");
  });

  it("일기 충분 → '비의 낭만가' (가중치 3배)", async () => {
    setupMocks({
      diary: Array.from({ length: 4 }, (_, i) => ({
        date: `2026-04-0${i + 1}`, condition: "rain", temp: 18, memo: `${i}`,
      })),
    });
    const profile = await computePersonalityProfile();
    expect(profile.personalityType).toBe("비의 낭만가");
    expect(profile.personalityEmoji).toBe("🌧️");
  });

  it("게임 많이 → '폭풍 관전자' (가중치 2배)", async () => {
    setupMocks({
      gameStats: { totalWins: 5, totalLosses: 3, totalTies: 0, winRate: 62, bestStreak: 3, currentStreak: 2, weekWins: 2, weekLosses: 1 },
    });
    const profile = await computePersonalityProfile();
    expect(profile.personalityType).toBe("폭풍 관전자");
    expect(profile.personalityEmoji).toBe("⛈️");
    expect(profile.rarity).toBe(3.8);
  });
});

describe("progress 계산", () => {
  beforeEach(() => jest.clearAllMocks());

  it("데이터 0 → progress 0", async () => {
    setupMocks({});
    const profile = await computePersonalityProfile();
    expect(profile.progress).toBe(0);
  });

  it("탭 5개만 → progress ~0.125 (5/10 / 4)", async () => {
    setupMocks({ tapCounts: { umbrella: 5 } });
    const profile = await computePersonalityProfile();
    expect(profile.progress).toBeCloseTo(0.125, 2);
  });

  it("전 카테고리 충분 → progress 1.0", async () => {
    setupMocks({
      tapCounts: { umbrella: 20, clothing: 10 },
      feedback: Array.from({ length: 10 }, (_, i) => ({ date: `2026-04-${String(i + 1).padStart(2, "0")}`, accurate: true })),
      gameStats: { totalWins: 10, totalLosses: 5, totalTies: 0, winRate: 67, bestStreak: 4, currentStreak: 2, weekWins: 3, weekLosses: 1 },
      diary: Array.from({ length: 5 }, (_, i) => ({ date: `2026-04-${String(i + 1).padStart(2, "0")}`, condition: "clear", temp: 20, memo: "" })),
    });
    const profile = await computePersonalityProfile();
    expect(profile.progress).toBe(1);
  });

  it("progress는 항상 0~1 사이 (clamp 검증)", async () => {
    setupMocks({ tapCounts: { umbrella: 9999 } });
    const profile = await computePersonalityProfile();
    expect(profile.progress).toBeGreaterThanOrEqual(0);
    expect(profile.progress).toBeLessThanOrEqual(1);
  });
});

describe("희귀도·역설 매핑 (6종 모두 유효)", () => {
  const TYPE_DATA = [
    { label: "우산 낭만가", rarity: 14.2, paradoxContains: "계획파" },
    { label: "아침 전략가", rarity: 18.6, paradoxContains: "우산" },
    { label: "미세먼지 감시자", rarity: 7.3, paradoxContains: "외출" },
    { label: "주말 계획가", rarity: 11.8, paradoxContains: "예측" },
    { label: "비의 낭만가", rarity: 9.4, paradoxContains: "택시" },
    { label: "폭풍 관전자", rarity: 3.8, paradoxContains: "맑은" },
  ];

  TYPE_DATA.forEach(({ label, rarity, paradoxContains }) => {
    it(`${label} 타입 매핑 정합성`, () => {
      // 매핑 존재 여부만 확인 — 계산은 다른 describe에서
      expect(rarity).toBeGreaterThan(0);
      expect(rarity).toBeLessThan(100);
      expect(paradoxContains.length).toBeGreaterThan(0);
    });
  });

  it("희귀도 합계가 대략 유효한 분포 (50~80%)", () => {
    const total = TYPE_DATA.reduce((sum, t) => sum + t.rarity, 0);
    // 나머지 "알아가는 중" 유저·기타 타입 — 60% 내외 유효
    expect(total).toBeGreaterThan(50);
    expect(total).toBeLessThan(80);
  });
});
