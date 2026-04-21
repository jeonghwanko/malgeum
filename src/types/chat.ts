import type { AlertSettings, HealthProfile } from "./settings";
import type { BriefLine } from "../services/microcopy";
import type { DailyWeather, WeatherCondition } from "./weather";

/** D1 온보딩 챗의 각 단계 */
export type OnboardingStep =
  | "greeting"
  | "subway"
  | "rain-alert"
  | "dust-alert"
  | "interests-festival"
  | "interests-camping"
  | "clothing"
  | "try-typing"
  | "brief"
  | "done";

export interface OnboardingOption {
  id: string;
  label: string;
  emoji?: string;
}

export type WeatherIntent =
  | "clothing"
  | "umbrella"
  | "outdoor"
  | "commute"
  | "health"
  | "forecast"
  | "settings"
  | "chat"
  | "general";

/** 채팅에서 실행 가능한 설정 변경 액션 */
export type SettingsAction =
  | { type: "SET_TEMP_UNIT"; unit: "C" | "F" }
  | { type: "SET_COMMUTE_TIME"; departure?: string; return?: string }
  | { type: "SET_ALERT"; key: keyof AlertSettings; enabled: boolean }
  | { type: "SET_PROFILE"; field: keyof HealthProfile; value: string }
  | { type: "SET_LOCALE"; locale: "ko" | "en" };

export interface SettingsActionResult {
  action: SettingsAction;
  confirmText: string;  // "온도 단위를 °F로 변경할까요?"
  summary: string;      // "온도 단위 → °F" (카드 한 줄 요약)
  route: string;        // "/edit-temp-unit" 등 직접 설정 화면 경로
}

/** 출퇴근 시간대 날씨 슬롯 (리치 카드용) */
export interface CommuteSlotInfo {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
}

/** AI 버블에 첨부되는 인라인 리치 콘텐츠 */
export type RichContent =
  | { type: "forecast"; days: DailyWeather[] }
  | {
      type: "commute";
      departure: CommuteSlotInfo;
      returnTrip: CommuteSlotInfo;
      tempDiff: number;
      needUmbrella: boolean;
    }
  /** 설정 변경 확인 대기 — [변경하기][취소] 버튼 */
  | {
      type: "settings-pending";
      action: SettingsAction;
      summary: string;
      route: string;
      resolved?: "applied" | "cancelled";
    }
  /** 설정 변경 완료 — "설정 열기 →" 링크 */
  | {
      type: "settings-applied";
      action: SettingsAction;
      route: string;
      summary: string;
    }
  /** 수동 설정 안내 — 👎 피드백 후 노출 */
  | {
      type: "settings-link";
      route: string;
      label: string;
      reason: string;
    }
  /** D1 온보딩 퀵탭 질문 카드 */
  | {
      type: "onboarding-quick";
      step: OnboardingStep;
      allowMultiple?: boolean;
      allowTextInput?: boolean;
      options: OnboardingOption[];
      escapeOptions?: OnboardingOption[];
      selectedIds?: string[];
      resolved?: boolean;
    }
  /** D1 온보딩 인라인 브리핑 */
  | {
      type: "onboarding-brief";
      lines: BriefLine[];
    }
  /** D1 온보딩 — 설정 요약 카드 (브리핑 직전, 유저가 설정한 것들 한눈에) */
  | {
      type: "onboarding-summary";
      items: Array<{ emoji: string; label: string }>;
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  /** AI 답변 후 표시할 맥락 기반 후속 질문 */
  followUps?: SuggestedQuestion[];
  /** 분류된 의도 (assistant 메시지에만) */
  intent?: WeatherIntent;
  /** 인라인 리치 카드 데이터 (assistant 메시지에만) */
  richContent?: RichContent;
  /** 유저 피드백 */
  rated?: "up" | "down";
  /** 사용량 한도 초과로 인한 메시지 */
  isLimitReached?: boolean;
}

export interface AIPrompt {
  system: string;
  userMessage: string;
  intent: WeatherIntent;
  /** 멀티턴 대화 히스토리 (최근 N턴, API에 전달) */
  history?: { role: "user" | "assistant"; text: string }[];
}

export interface SuggestedQuestion {
  emoji: string;
  text: string;
}

export interface AIFeedbackEntry {
  date: string;
  messageId: string;
  intent: string;
  rating: "up" | "down";
}
