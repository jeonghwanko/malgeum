/**
 * 통합 에러 로거.
 * - DEV: console.warn 출력
 * - PROD: Sentry로 전송
 */

import * as Sentry from "@sentry/react-native";

type ErrorContext =
  | "weather-api"
  | "storage"
  | "location"
  | "purchase"
  | "remote-config"
  | "notification"
  | "share"
  | "widget-bridge"
  | "ai-chat"
  | "background-weather"
  | "general";

/** unknown 타입 에러에서 메시지 문자열 안전 추출 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 의도된 취소·환경 이슈·업스트림 4xx — Sentry 노이즈로 올리지 않음 */
function isExpectedAbort(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    error.name === "AbortError" ||
    /\baborted\b/i.test(msg) ||
    // iOS 26 유니버설링크 충돌 — affiliate.ts 에서 이미 WebBrowser 폴백함
    /^Unable to open URL/.test(msg) ||
    // k-skill 프록시 4xx (모호한 지역명·미지원 역 등) — 이미 catch+null 처리됨
    /^k-skill 4\d\d:/.test(msg)
  );
}

export function logError(context: ErrorContext, error: unknown): void {
  if (isExpectedAbort(error)) return;
  if (__DEV__) {
    console.warn(`[${context}]`, error);
    return;
  }
  Sentry.withScope((scope) => {
    scope.setTag("context", context);
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), "error");
    }
  });
}
