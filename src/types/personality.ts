/** 날씨 성격 유형 (바이럴 라벨 — 감성·의외성) */
export type WeatherPersonalityType =
  | "우산 낭만가"
  | "아침 전략가"
  | "미세먼지 감시자"
  | "주말 계획가"
  | "비의 낭만가"
  | "폭풍 관전자";

/** 개별 인사이트 항목 */
export interface PersonalityInsight {
  id: string;
  emoji: string;
  title: string;
  detail: string;
}

/** 전체 성격 프로필 */
export interface PersonalityProfile {
  ready: boolean;
  personalityType: WeatherPersonalityType | null;
  personalityEmoji: string;
  personalityLabel: string;
  personalityDesc: string;
  /** "X지만 사실은 Y" 형태의 역설 문장 — 공개 상태일 때만 */
  personalityParadox: string | null;
  /** 추정 희귀도 (%). 공개 상태일 때만 숫자, 아니면 null */
  rarity: number | null;
  /** 0~1. "알아가는 중" 진행도 (ready=true 이후에도 누적 증가) */
  progress: number;
  insights: PersonalityInsight[];
  totalDays: number;
  /** 설정 화면에서 별도 호출 없이 적중률 표시용 */
  fbRate: number;
  fbTotal: number;
}
