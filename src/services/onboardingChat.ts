/**
 * D1 온보딩 챗 컨트롤러
 *
 * 온보딩 완료 직후 ChatSheet가 자동 오픈 → 맑음이가 먼저 말 걸고
 * 5개 질문으로 개인 설정을 맞춘 뒤 첫 DailyBrief를 인라인으로 전달.
 *
 * 데이터 흐름:
 *   buildStepMessage(step, state) → ChatMessage (봇 발화 + RichContent)
 *   applyStepAnswer(step, answer, dispatch, state) → 설정 적용
 *   nextStep(step) → 다음 step
 */

import * as Crypto from "expo-crypto";
import type { Dispatch } from "react";
import type { Action, AppState } from "@/context/weatherReducer";
import type { ChatMessage, OnboardingOption, OnboardingStep } from "@/types/chat";
import type { DiscoverInterest } from "@/types/settings";
import type { BriefLine } from "@/services/microcopy";

// ── Step 진행 순서 ──────────────────────────────────────────

export const STEP_FLOW: OnboardingStep[] = [
  "greeting",
  "subway",
  "rain-alert",
  "dust-alert",
  "interests-festival",
  "interests-camping",
  "clothing",
  "try-typing",
  "brief",
  "done",
];

export function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_FLOW.indexOf(current);
  if (idx < 0 || idx >= STEP_FLOW.length - 1) return "done";
  return STEP_FLOW[idx + 1];
}

// ── Step 옵션 정의 ──────────────────────────────────────────

const GREETING_OPTIONS: OnboardingOption[] = [
  { id: "start", label: "좋아요" },
];
const GREETING_ESCAPE: OnboardingOption[] = [
  { id: "skip", label: "다음에" },
];

/** 서울 주요 역 5개 — MVP 하드코딩 (향후 위치 기반 추천으로 확장) */
const SUBWAY_RECOMMEND: OnboardingOption[] = [
  { id: "강남", label: "강남", emoji: "🚇" },
  { id: "잠실", label: "잠실", emoji: "🚇" },
  { id: "서울역", label: "서울역", emoji: "🚇" },
  { id: "홍대입구", label: "홍대입구", emoji: "🚇" },
  { id: "종로3가", label: "종로3가", emoji: "🚇" },
];
/** text input을 트리거하는 escape option id — RichCard가 별도 버튼으로 렌더해야 해서 필터링 기준 */
export const CUSTOM_TEXT_INPUT_ID = "custom";

/** brief step의 escape option ids — ChatSheet 핸들러에서 분기 키로 사용 */
export const BRIEF_ACTION = {
  PERSONALITY: "personality",
  CLOSE: "close",
} as const;

const SUBWAY_ESCAPE: OnboardingOption[] = [
  { id: CUSTOM_TEXT_INPUT_ID, label: "직접 입력" },
  { id: "none", label: "지하철 안 타요" },
];

const YES_NO_OPTIONS_RAIN: OnboardingOption[] = [
  { id: "yes", label: "네, 좋아요" },
  { id: "no", label: "괜찮아요" },
];
const YES_NO_OPTIONS_DUST: OnboardingOption[] = [
  { id: "yes", label: "네" },
  { id: "no", label: "괜찮아요" },
];

const YES_NO_INTEREST: OnboardingOption[] = [
  { id: "yes", label: "네" },
  { id: "no", label: "아니요" },
];

const CLOTHING_OPTIONS: OnboardingOption[] = [
  { id: "비즈니스 캐주얼", label: "비즈니스 캐주얼", emoji: "👔" },
  { id: "캐주얼", label: "캐주얼", emoji: "👕" },
  { id: "스포티", label: "스포티", emoji: "🏅" },
  { id: "포멀", label: "포멀", emoji: "🤵" },
  { id: "미니멀", label: "미니멀", emoji: "🖤" },
];
const CLOTHING_ESCAPE: OnboardingOption[] = [
  { id: "later", label: "나중에" },
];

// ── Step 봇 메시지 빌더 ─────────────────────────────────────

export function buildGreetingMessages(): ChatMessage[] {
  const ts = Date.now();
  return [
    {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: "안녕하세요 ☀️\n오늘부터 당신 옆에 있을 맑음이예요.",
      timestamp: ts,
    },
    {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: "좀 더 잘 챙겨드리려면\n몇 가지만 알면 돼요. 30초면 돼요.",
      timestamp: ts + 1,
      richContent: {
        type: "onboarding-quick",
        step: "greeting",
        options: GREETING_OPTIONS,
        escapeOptions: GREETING_ESCAPE,
      },
    },
  ];
}

export function buildStepMessage(step: OnboardingStep, state: AppState): ChatMessage | null {
  const ts = Date.now();
  const id = Crypto.randomUUID();

  switch (step) {
    case "subway": {
      const departure = state.commuteTime.departure;  // e.g., "08:30"
      const human = humanizeTime(departure);          // "8시 30분"
      return {
        id,
        role: "assistant",
        text: `${human}에 어느 역 근처에서 출발하세요?`,
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "subway",
          options: SUBWAY_RECOMMEND,
          escapeOptions: SUBWAY_ESCAPE,
          allowTextInput: true,
        },
      };
    }
    case "rain-alert":
      return {
        id,
        role: "assistant",
        text: "비 예보 있는 날 아침에 미리 알려드릴까요?",
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "rain-alert",
          options: YES_NO_OPTIONS_RAIN,
        },
      };
    case "dust-alert":
      return {
        id,
        role: "assistant",
        text: "미세먼지 심한 날도 알려드릴까요?",
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "dust-alert",
          options: YES_NO_OPTIONS_DUST,
        },
      };
    case "interests-festival":
      return {
        id,
        role: "assistant",
        text: "공연이나 축제 다니시는 편이세요?",
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "interests-festival",
          options: YES_NO_INTEREST,
        },
      };
    case "interests-camping":
      return {
        id,
        role: "assistant",
        text: "캠핑은요? 🏕️",
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "interests-camping",
          options: YES_NO_INTEREST,
        },
      };
    case "clothing":
      return {
        id,
        role: "assistant",
        text: "어떤 스타일로 입으세요?",
        timestamp: ts,
        richContent: {
          type: "onboarding-quick",
          step: "clothing",
          options: CLOTHING_OPTIONS,
          escapeOptions: CLOTHING_ESCAPE,
        },
      };
    case "try-typing":
      return {
        id,
        role: "assistant",
        text: "잘 하셨어요 ✨\n마지막으로 하나만 — 저한테 뭐든 편하게 물어봐요.\n아래 예시를 탭하거나 직접 입력해보세요.",
        timestamp: ts,
        followUps: [
          { emoji: "👔", text: "오늘 뭐 입지?" },
          { emoji: "☔", text: "우산 필요해?" },
          { emoji: "🌤️", text: "내일은 어때?" },
        ],
        richContent: {
          type: "onboarding-quick",
          step: "try-typing",
          options: [],
          escapeOptions: [{ id: "skip", label: "건너뛰기" }],
        },
      };
    default:
      return null;
  }
}

/** 유저가 답한 설정을 요약한 카드 아이템 배열 — 브리핑 직전 한눈 요약용 */
export function buildSummaryItems(state: AppState): Array<{ emoji: string; label: string }> {
  const items: Array<{ emoji: string; label: string }> = [];
  const depTime = shortTime(state.commuteTime.departure);
  const subway = state.commuteTime.subwayStation;
  const loc = state.locations.find((l) => l.id === state.currentLocationId);

  // 📍 위치 · 출근 시간 (한 줄)
  if (subway) {
    items.push({ emoji: "📍", label: `${subway}역 · ${depTime} 출근` });
  } else if (loc) {
    items.push({ emoji: "📍", label: `${loc.name} · ${depTime} 출근` });
  } else {
    items.push({ emoji: "⏰", label: `${depTime} 출근` });
  }

  // 🔔 알림 상태
  const activeAlerts: string[] = [];
  if (state.alerts.rain) activeAlerts.push("비");
  if (state.alerts.dust) activeAlerts.push("미세먼지");
  if (activeAlerts.length > 0) {
    items.push({ emoji: "🔔", label: `${activeAlerts.join("·")} 알림` });
  }

  // 🎭 관심사
  const interests = state.healthProfile.discoverInterests ?? [];
  const interestLabels: string[] = [];
  if (interests.includes("performance-festival")) interestLabels.push("공연·축제");
  if (interests.includes("camping")) interestLabels.push("캠핑");
  if (interestLabels.length > 0) {
    items.push({ emoji: "🎭", label: interestLabels.join(", ") });
  }

  // 👕 옷차림 스타일
  const clothing = state.healthProfile.clothingStyle;
  if (clothing) {
    items.push({ emoji: "👕", label: `${clothing} 스타일` });
  }

  return items;
}

/** "08:30" → "8:30" (앞자리 0 제거, summary 카드용) */
function shortTime(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  if (!h) return hhmm;
  return `${parseInt(h, 10)}:${m ?? "00"}`;
}

/** 완료 단계 봇 메시지 — 요약 카드 + 인라인 브리핑 + 후속 안내·홈 이동 버튼 */
export function buildBriefMessages(briefLines: BriefLine[], state: AppState): ChatMessage[] {
  const ts = Date.now();
  const summaryItems = buildSummaryItems(state);
  return [
    {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: "다 됐어요 ✨\n이렇게 맞춰놓을게요.",
      timestamp: ts,
      richContent: { type: "onboarding-summary", items: summaryItems },
    },
    {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: "자, 오늘 날씨 전해드릴게요.",
      timestamp: ts + 1,
      richContent: { type: "onboarding-brief", lines: briefLines },
    },
    {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: "궁금한 건 뭐든 그냥 말씀하세요.\n나중에 \"비 알림 꺼줘\"처럼 설정도 말로 바꿀 수 있어요.\n\n내일부턴 홈 화면에서 같은 브리핑을 보실 수 있어요.\n참, 당신의 \"날씨 성격\"도 기록하고 있어요 ✨",
      timestamp: ts + 2,
      richContent: {
        type: "onboarding-quick",
        step: "brief",
        options: [],
        escapeOptions: [
          { id: BRIEF_ACTION.PERSONALITY, label: "✨ 내 날씨 성격 미리 보기" },
          { id: BRIEF_ACTION.CLOSE, label: "홈 화면으로 →" },
        ],
      },
    },
  ];
}

/**
 * 유저 답변 확인 멘트 — 탭 즉시 "듣고 반영했음" 마이크로 피드백.
 * 이미 받은 정보(출근 시간·위치 등)를 엮어 "기억하는 맑음이" 연출.
 * null 반환 시 확인 멘트 생략 (greeting/try-typing/brief 등 dispatch 없는 step).
 */
export function buildConfirmText(
  step: OnboardingStep,
  answer: string | string[] | null,
  state: AppState,
): string | null {
  if (answer === null) return null;
  const depTime = humanizeTime(state.commuteTime.departure);
  const locName = state.locations.find((l) => l.id === state.currentLocationId)?.name;

  switch (step) {
    case "subway":
      if (typeof answer !== "string") return null;
      if (answer === "none") return "알겠습니다.";
      if (answer === "custom") return null;
      {
        const station = answer.replace(/역$/, "");
        return `네, ${depTime}에 ${station}역 출발 기준으로 맞춰 놓을게요 🚇`;
      }
    case "rain-alert":
      return answer === "yes"
        ? `네, ${depTime} 출근 전에 비 예보 있으면 알려드릴게요 🔔`
        : "알겠습니다.";
    case "dust-alert":
      return answer === "yes"
        ? "네, 아침에 미세먼지 심하면 마스크 챙기시라고 알려드릴게요 😷"
        : "알겠습니다.";
    case "interests-festival":
      if (answer !== "yes") return "알겠습니다.";
      return locName
        ? `${locName} 근처 공연·축제 많이 소개해드릴게요 🎭`
        : "공연·축제 많이 소개해드릴게요 🎭";
    case "interests-camping":
      return answer === "yes" ? "맑은 날 근처 캠핑장 보여드릴게요 🏕️" : "알겠습니다.";
    case "clothing":
      if (answer === "later") return "알겠습니다.";
      if (typeof answer === "string") {
        return `${answer} 기준으로, ${depTime} 출근 시간대 옷차림 추천드릴게요 👕`;
      }
      return null;
    default:
      return null;
  }
}

// ── 답변 적용 ──────────────────────────────────────────────

/**
 * 유저가 step에 답한 내용을 AppState에 반영.
 * answer:
 *   - string: 단일 선택 id 또는 직접 입력 텍스트
 *   - string[]: 다중 선택 id들
 *   - null: skip (설정 변경 없음)
 * escaped: escapeOptions의 id가 선택된 경우 (skip 처리)
 */
export function applyStepAnswer(
  step: OnboardingStep,
  answer: string | string[] | null,
  dispatch: Dispatch<Action>,
  state: AppState,
): void {
  if (answer === null) return;

  switch (step) {
    case "subway": {
      // "none" 또는 다른 escape → subwayStation 비우기 (undefined)
      // "강남" 등 recommend id 또는 직접 입력 텍스트 → 그 값 저장
      const station = typeof answer === "string" && answer !== "none" && answer !== "custom"
        ? answer
        : undefined;
      dispatch({
        type: "SET_COMMUTE_TIME",
        payload: { ...state.commuteTime, subwayStation: station },
      });
      break;
    }
    case "rain-alert":
      dispatch({ type: "SET_ALERT", payload: { key: "rain", enabled: answer === "yes" } });
      break;
    case "dust-alert":
      dispatch({ type: "SET_ALERT", payload: { key: "dust", enabled: answer === "yes" } });
      break;
    case "interests-festival":
      dispatch({
        type: "SET_PROFILE",
        payload: {
          discoverInterests: toggleInterest(state.healthProfile.discoverInterests, "performance-festival", answer === "yes"),
        },
      });
      break;
    case "interests-camping":
      dispatch({
        type: "SET_PROFILE",
        payload: {
          discoverInterests: toggleInterest(state.healthProfile.discoverInterests, "camping", answer === "yes"),
        },
      });
      break;
    case "clothing":
      if (typeof answer === "string" && answer !== "later") {
        dispatch({ type: "SET_PROFILE", payload: { clothingStyle: answer } });
      }
      break;
  }
}

// ── 유틸 ──────────────────────────────────────────────────

function humanizeTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  if (isNaN(h)) return hhmm;
  if (!m || m === 0) return `${h}시`;
  return `${h}시 ${m}분`;
}

/** 관심사 Y/N 토글 — 기존 값 유지 + 해당 카테고리만 추가/제거 */
function toggleInterest(
  current: DiscoverInterest[] | undefined,
  key: DiscoverInterest,
  enabled: boolean,
): DiscoverInterest[] {
  const base = current ?? [];
  if (enabled) return base.includes(key) ? base : [...base, key];
  return base.filter((i) => i !== key);
}
