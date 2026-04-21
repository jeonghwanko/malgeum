/**
 * Firebase Analytics 이벤트 로깅 서비스.
 * - DEV: console.debug 출력
 * - PROD: Firebase Analytics 전송
 */

import analytics from "@react-native-firebase/analytics";

// ── Screen Views ──

export function logScreenView(screenName: string) {
  if (__DEV__) {
    console.debug(`[analytics] screen_view: ${screenName}`);
    return;
  }
  analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
}

// ── Onboarding ──

export function logOnboardingStep(step: string) {
  fire("onboarding_step", { step });
}

export function logOnboardingComplete() {
  fire("onboarding_complete");
}

// ── Action Cards ──

export function logActionCardTap(cardId: string, category: string) {
  fire("action_card_tap", { card_id: cardId, category });
}

// ── Daily Actions ──

export function logDailyActionTap(actionId: string) {
  fire("daily_action_tap", { action_id: actionId });
}

// ── Theme ──

export function logThemeChange(from: string, to: string, isPremium: boolean) {
  fire("theme_change", { from, to, is_premium: String(isPremium) });
}

// ── AI Chat ──

export function logAiChatMessage(intent: string, isFollowUp: boolean) {
  fire("ai_chat_message", { intent, is_follow_up: String(isFollowUp) });
}

export function logAiChatLimitHit(isPremium: boolean) {
  fire("ai_chat_limit_hit", { is_premium: String(isPremium) });
}

export function logAiChatOpen() {
  fire("ai_chat_open");
}

// ── Subscription ──

export function logSubscriptionView() {
  fire("subscription_view");
}

export function logSubscriptionStart(priceLabel: string) {
  fire("subscription_start", { price: priceLabel });
}

export function logSubscriptionRestore(success: boolean) {
  fire("subscription_restore", { success: String(success) });
}

// ── Share ──

export function logShareCreate(mode?: "weather" | "emotional" | "challenge" | "personality") {
  fire("share_card_create", mode ? { mode } : undefined);
}

// ── Feedback ──

export function logFeedbackSubmit(accurate: boolean) {
  fire("feedback_submit", { accurate: String(accurate) });
}

// ── Notification ──

export function logNotificationOpen(screen: string, alertType?: string, actionId?: string) {
  fire("noti_opened", { screen, alert_type: alertType ?? "unknown", ...(actionId && { action_id: actionId }) });
}

export function logNotificationAction(actionId: string, alertType: string) {
  fire("noti_action", { action_id: actionId, alert_type: alertType });
}

// ── Musinsa Affiliate ──

export function logMusinsaTap(source: string, query: string, category: string) {
  fire("musinsa_tap", { source, query, category });
}

// ── Widget ──

export function logWidgetInstall() {
  fire("widget_install");
}

// ── Helpers ──

function fire(name: string, params?: Record<string, string>) {
  if (__DEV__) {
    console.debug(`[analytics] ${name}`, params ?? "");
    return;
  }
  analytics().logEvent(name, params);
}
