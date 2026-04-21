/**
 * 설정 변경 의도 파서
 *
 * 유저의 자연어 메시지에서 설정 변경 의도를 추출.
 * 예: "화씨로 바꿔줘" → SET_TEMP_UNIT, "비오면 알려줘" → SET_ALERT(rain)
 *
 * 사용처:
 *   - ChatSheet.sendMessage → parseSettingsAction → settings-pending 카드
 *   - appQueryRouter.parseSettingsQuery → settings-link 조회 카드
 */

import type { AlertSettings } from "@/types/settings";
import type { SettingsActionResult } from "@/types/chat";

/** 메시지를 소문자 + 공백 정규화. 파서 간 공통 전처리. */
export function normalizeMessage(message: string): string {
  return message.toLowerCase().replace(/\s+/g, " ");
}

// ── 알림 파서 (공통 템플릿) ────────────────────────────────

function alertResult(key: keyof AlertSettings, label: string, on: boolean): SettingsActionResult {
  return {
    action: { type: "SET_ALERT", key, enabled: on },
    confirmText: `${label}을 ${on ? "켤" : "끌"}까요?`,
    summary: `${label} ${on ? "ON" : "OFF"}`,
    route: "/(tabs)/settings",
  };
}

// 알림 종류별 파서 entry 생성
// - 명시적: "비 알림 켜/꺼", "꽃가루 경고 설정"
// - 암묵적 ON: "비오면 알려줘", "꽃가루 있으면 알려줘"
const ALERT_ENTRIES: Array<{ keys: string; key: keyof AlertSettings; label: string }> = [
  { keys: "비|rain", key: "rain", label: "비 알림" },
  { keys: "미세먼지|먼지|dust", key: "dust", label: "미세먼지 알림" },
  { keys: "자외선|uv", key: "uv", label: "자외선 알림" },
  { keys: "꽃가루|pollen", key: "pollen", label: "꽃가루 알림" },
  { keys: "저녁(?:\\s*브리핑)?|evening", key: "evening", label: "저녁 브리핑" },
  { keys: "출퇴근|통근", key: "commute", label: "출퇴근 알림" },
  { keys: "예측(?:\\s*게임)?|game", key: "game", label: "예측 게임 알림" },
];

function buildAlertParsers() {
  return ALERT_ENTRIES.flatMap(({ keys, key, label }) => [
    {
      pattern: new RegExp(`(?:${keys})\\s*(?:알림|알려|통보|노티|경고|브리핑)\\s*(켜|꺼|끄|설정|해제|활성|비활성|on|off)`, "i"),
      parse: (m: RegExpMatchArray) => alertResult(key, label, !/꺼|끄|해제|비활성|off/i.test(m[1])),
    },
    {
      pattern: new RegExp(`(?:${keys})\\s*(?:오면|올\\s*때|내리면|있으면|있을\\s*때|심하면)[^끄꺼해]*?(?:알림|알려|받)`, "i"),
      parse: () => alertResult(key, label, true),
    },
  ]);
}

// ── 파서 테이블 ───────────────────────────────────────────

const SETTINGS_PARSERS: Array<{
  pattern: RegExp;
  parse: (match: RegExpMatchArray) => SettingsActionResult | null;
}> = [
  // 온도 단위
  {
    pattern: /화씨|°F|fahrenheit/i,
    parse: () => ({
      action: { type: "SET_TEMP_UNIT", unit: "F" },
      confirmText: "온도 단위를 °F(화씨)로 변경할까요?",
      summary: "온도 단위 → °F",
      route: "/edit-temp-unit",
    }),
  },
  {
    pattern: /섭씨|°C|celsius/i,
    parse: () => ({
      action: { type: "SET_TEMP_UNIT", unit: "C" },
      confirmText: "온도 단위를 °C(섭씨)로 변경할까요?",
      summary: "온도 단위 → °C",
      route: "/edit-temp-unit",
    }),
  },
  // 알림 7종 (rain/dust/uv/pollen/evening/commute/game)
  ...buildAlertParsers(),
  // 언어
  {
    pattern: /영어(?:로)?|english(?:\s*로)?/i,
    parse: () => ({
      action: { type: "SET_LOCALE", locale: "en" },
      confirmText: "언어를 English로 바꿀까요?",
      summary: "언어 → English",
      route: "/edit-language",
    }),
  },
  {
    pattern: /한국어|한글|korean/i,
    parse: () => ({
      action: { type: "SET_LOCALE", locale: "ko" },
      confirmText: "언어를 한국어로 바꿀까요?",
      summary: "언어 → 한국어",
      route: "/edit-language",
    }),
  },
  // 옷차림 스타일 (edit-clothing.tsx의 id 값 그대로)
  {
    pattern: /옷차림(?:\s*스타일)?.*?(비즈니스\s*캐주얼|캐주얼|스포티|포멀|미니멀)/,
    parse: (m) => {
      const style = m[1].replace(/\s+/g, " ");
      return {
        action: { type: "SET_PROFILE", field: "clothingStyle", value: style },
        confirmText: `옷차림 스타일을 '${style}'로 바꿀까요?`,
        summary: `옷차림 → ${style}`,
        route: "/edit-clothing",
      };
    },
  },
  // 출근 시간: "출근 시간 9시 30분", "9시 반에 출근", "9:30에 출근해"
  {
    pattern: /(?:출근|가는\s*시간).*?(\d{1,2})\s*[:시]\s*(\d{0,2})\s*(반)?/,
    parse: (m) => {
      const h = m[1].padStart(2, "0");
      const min = m[3] === "반" ? "30" : (m[2] || "00").padStart(2, "0");
      return {
        action: { type: "SET_COMMUTE_TIME", departure: `${h}:${min}` },
        confirmText: `출근 시간을 ${h}:${min}으로 변경할까요?`,
        summary: `출근 시간 → ${h}:${min}`,
        route: "/edit-commute",
      };
    },
  },
  {
    pattern: /(\d{1,2})\s*[:시]\s*(\d{0,2})\s*(반)?\s*(?:에|부터)?\s*(?:출근|가)/,
    parse: (m) => {
      const h = m[1].padStart(2, "0");
      const min = m[3] === "반" ? "30" : (m[2] || "00").padStart(2, "0");
      return {
        action: { type: "SET_COMMUTE_TIME", departure: `${h}:${min}` },
        confirmText: `출근 시간을 ${h}:${min}으로 변경할까요?`,
        summary: `출근 시간 → ${h}:${min}`,
        route: "/edit-commute",
      };
    },
  },
  // 퇴근 시간: "퇴근 시간 6시", "18시에 퇴근", "6시 반에 퇴근"
  {
    pattern: /(?:퇴근|퇴근\s*시간).*?(\d{1,2})\s*[:시]\s*(\d{0,2})\s*(반)?/,
    parse: (m) => {
      const h = m[1].padStart(2, "0");
      const min = m[3] === "반" ? "30" : (m[2] || "00").padStart(2, "0");
      return {
        action: { type: "SET_COMMUTE_TIME", return: `${h}:${min}` },
        confirmText: `퇴근 시간을 ${h}:${min}으로 변경할까요?`,
        summary: `퇴근 시간 → ${h}:${min}`,
        route: "/edit-commute",
      };
    },
  },
  {
    pattern: /(\d{1,2})\s*[:시]\s*(\d{0,2})\s*(반)?\s*(?:에|부터)?\s*퇴근/,
    parse: (m) => {
      const h = m[1].padStart(2, "0");
      const min = m[3] === "반" ? "30" : (m[2] || "00").padStart(2, "0");
      return {
        action: { type: "SET_COMMUTE_TIME", return: `${h}:${min}` },
        confirmText: `퇴근 시간을 ${h}:${min}으로 변경할까요?`,
        summary: `퇴근 시간 → ${h}:${min}`,
        route: "/edit-commute",
      };
    },
  },
];

// ── Public API ────────────────────────────────────────────

/**
 * 유저 메시지에서 설정 변경 의도를 파싱.
 * 매칭되면 SettingsActionResult 반환, 아니면 null.
 */
export function parseSettingsAction(message: string): SettingsActionResult | null {
  const text = normalizeMessage(message);
  for (const { pattern, parse } of SETTINGS_PARSERS) {
    const match = text.match(pattern);
    if (match) return parse(match);
  }
  return null;
}

