/**
 * ChatBubble 내부에 렌더되는 인라인 리치 카드.
 *
 * 7종:
 *  - forecast / commute       (AI 답변 맥락 카드)
 *  - settings-pending / applied / link  (설정 변경 embed 플로우)
 *  - onboarding-quick / onboarding-brief  (D1 온보딩 챗)
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { CommuteSlotInfo, OnboardingStep, RichContent, SettingsAction } from "@/types/chat";
import { COLORS } from "@/constants/colors";
import { CUSTOM_TEXT_INPUT_ID } from "@/services/onboardingChat";
import { getConditionLabel } from "@/utils/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import { formatDay } from "@/utils/date";
import { t } from "@/i18n";

interface RichCardProps {
  richContent: RichContent;
  messageId: string;
  inkColor?: string;
  onNavigate?: (route: string) => void;
  onConfirmSettings?: (messageId: string, action: SettingsAction, summary: string, route: string) => void;
  onCancelSettings?: (messageId: string) => void;
  onOnboardingPick?: (messageId: string, step: OnboardingStep, optionId: string, isEscape: boolean) => void;
  onOnboardingSubmit?: (messageId: string, step: OnboardingStep) => void;
  onOnboardingTextInput?: () => void;
}

export function RichCard({
  richContent,
  messageId,
  inkColor,
  onNavigate,
  onConfirmSettings,
  onCancelSettings,
  onOnboardingPick,
  onOnboardingSubmit,
  onOnboardingTextInput,
}: RichCardProps) {
  const textColor = inkColor ?? COLORS.textDark;

  if (richContent.type === "onboarding-quick") {
    const { step, options, escapeOptions, allowMultiple, allowTextInput, selectedIds, resolved } = richContent;
    const selected = new Set(selectedIds ?? []);
    return (
      <View style={richStyles.onboardingCard}>
        <View style={richStyles.onboardingOptionRow}>
          {options.map((o) => {
            const isSelected = selected.has(o.id);
            return (
              <Pressable
                key={o.id}
                disabled={resolved}
                onPress={() => onOnboardingPick?.(messageId, step, o.id, false)}
                style={[richStyles.onboardingChip, isSelected && richStyles.onboardingChipSelected]}
              >
                {o.emoji ? <Text style={richStyles.onboardingChipEmoji}>{o.emoji}</Text> : null}
                <Text style={[richStyles.onboardingChipText, isSelected && richStyles.onboardingChipTextSelected]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {(escapeOptions?.length || allowTextInput || allowMultiple) ? (
          <View style={richStyles.onboardingFooterRow}>
            {allowTextInput ? (
              <Pressable
                disabled={resolved}
                onPress={() => onOnboardingTextInput?.()}
                style={richStyles.onboardingEscapeChip}
              >
                <Text style={richStyles.onboardingEscapeText}>직접 입력</Text>
              </Pressable>
            ) : null}
            {escapeOptions?.filter((o) => o.id !== CUSTOM_TEXT_INPUT_ID).map((o) => (
              <Pressable
                key={o.id}
                disabled={resolved}
                onPress={() => onOnboardingPick?.(messageId, step, o.id, true)}
                style={richStyles.onboardingEscapeChip}
              >
                <Text style={richStyles.onboardingEscapeText}>{o.label}</Text>
              </Pressable>
            ))}
            {allowMultiple ? (
              <Pressable
                disabled={resolved}
                onPress={() => onOnboardingSubmit?.(messageId, step)}
                style={[richStyles.onboardingSubmitBtn, resolved && richStyles.btnDisabled]}
              >
                <Text style={richStyles.onboardingSubmitText}>다음 →</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (richContent.type === "onboarding-brief") {
    return (
      <View style={richStyles.briefCard}>
        {richContent.lines.map((line, i) => (
          <View key={i} style={richStyles.briefRow}>
            <Text style={richStyles.briefEmoji}>{line.emoji}</Text>
            <Text style={[richStyles.briefText, { color: textColor }]} numberOfLines={2}>
              {line.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (richContent.type === "onboarding-summary") {
    return (
      <View style={richStyles.summaryCard}>
        {richContent.items.map((item, i) => (
          <View key={i} style={richStyles.summaryRow}>
            <Text style={richStyles.summaryEmoji}>{item.emoji}</Text>
            <Text
              style={[richStyles.summaryText, { color: textColor }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (richContent.type === "settings-pending") {
    const { resolved, summary, action, route } = richContent;
    const applied = resolved === "applied";
    const cancelled = resolved === "cancelled";
    return (
      <View style={richStyles.pendingCard}>
        <Text style={[richStyles.pendingSummary, { color: textColor }]}>{summary}</Text>
        <View style={richStyles.pendingBtnRow}>
          <Pressable
            disabled={!!resolved}
            style={[richStyles.confirmBtn, applied && richStyles.btnDone, cancelled && richStyles.btnDisabled]}
            onPress={() => onConfirmSettings?.(messageId, action, summary, route)}
          >
            <Text style={richStyles.confirmBtnText}>
              {applied ? t("chatUI.applied") : t("chatUI.apply")}
            </Text>
          </Pressable>
          <Pressable
            disabled={!!resolved}
            style={[richStyles.cancelBtn, cancelled && richStyles.btnDone, applied && richStyles.btnDisabled]}
            onPress={() => onCancelSettings?.(messageId)}
          >
            <Text style={[richStyles.cancelBtnText, { color: textColor }]}>
              {cancelled ? t("chatUI.cancelled") : t("chatUI.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (richContent.type === "settings-applied") {
    return (
      <View style={richStyles.appliedCard}>
        <View style={richStyles.appliedRow}>
          <Text style={richStyles.checkIcon}>✓</Text>
          <Text style={[richStyles.appliedSummary, { color: textColor }]} numberOfLines={2}>
            {richContent.summary}
          </Text>
        </View>
        <Pressable
          style={richStyles.linkBtn}
          onPress={() => onNavigate?.(richContent.route)}
        >
          <Text style={richStyles.linkBtnText}>{t("chatUI.openSettings")} →</Text>
        </Pressable>
      </View>
    );
  }

  if (richContent.type === "settings-link") {
    return (
      <View style={richStyles.linkCard}>
        {richContent.reason ? (
          <Text style={[richStyles.linkReason, { color: textColor, opacity: 0.75 }]}>
            {richContent.reason}
          </Text>
        ) : null}
        <Pressable
          style={richStyles.linkBtn}
          onPress={() => onNavigate?.(richContent.route)}
        >
          <Text style={richStyles.linkBtnText}>{richContent.label} →</Text>
        </Pressable>
      </View>
    );
  }

  if (richContent.type === "forecast") {
    return (
      <View style={richStyles.card}>
        {richContent.days.map((day, i) => {
          const { day: dayLabel } = formatDay(day.dt);
          const emoji = getConditionEmoji(day.condition);
          return (
            <View key={i} style={richStyles.forecastRow}>
              <Text style={[richStyles.forecastDay, { color: textColor }]}>
                {i === 0 ? t("chatUI.today") : dayLabel}
              </Text>
              <Text style={richStyles.forecastEmoji}>{emoji}</Text>
              <Text style={[richStyles.forecastCondition, { color: textColor, opacity: 0.7 }]}>
                {getConditionLabel(day.condition)}
              </Text>
              <Text style={[richStyles.forecastTemp, { color: textColor }]}>
                {day.tempMin}° / {day.tempMax}°
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  if (richContent.type === "commute") {
    const { departure, returnTrip, tempDiff, needUmbrella } = richContent;
    const diffText = tempDiff > 0 ? `+${tempDiff}°` : `${tempDiff}°`;
    return (
      <View style={richStyles.card}>
        <View style={richStyles.commuteRow}>
          <CommuteSlot label={t("home.commute.departure")} slot={departure} textColor={textColor} />
          <View style={richStyles.commuteMid}>
            <Text style={[richStyles.commuteDiff, { color: textColor }]}>{diffText}</Text>
            {needUmbrella && <Text style={richStyles.umbrellaHint}>☂️</Text>}
          </View>
          <CommuteSlot label={t("home.commute.return")} slot={returnTrip} textColor={textColor} />
        </View>
      </View>
    );
  }

  return null;
}

function CommuteSlot({
  label,
  slot,
  textColor,
}: {
  label: string;
  slot: Pick<CommuteSlotInfo, "temp" | "condition" | "precipitation">;
  textColor: string;
}) {
  return (
    <View style={richStyles.commuteSlot}>
      <Text style={[richStyles.commuteLabel, { color: textColor, opacity: 0.6 }]}>{label}</Text>
      <Text style={richStyles.commuteEmoji}>{getConditionEmoji(slot.condition)}</Text>
      <Text style={[richStyles.commuteTemp, { color: textColor }]}>{slot.temp}°</Text>
      {slot.precipitation > 0 && (
        <Text style={[richStyles.commutePrec, { color: textColor, opacity: 0.6 }]}>
          {slot.precipitation}%
        </Text>
      )}
    </View>
  );
}

// 카드마다 반복되는 구분선 스타일 (AI 버블 본문과 분리되는 상단 경계)
const DIVIDER = {
  marginTop: 10,
  borderTopWidth: 1,
  borderTopColor: "rgba(0,0,0,0.08)",
  paddingTop: 10,
} as const;

const richStyles = StyleSheet.create({
  card: {
    ...DIVIDER,
    gap: 6,
  },
  pendingCard: {
    ...DIVIDER,
    gap: 10,
  },
  pendingSummary: {
    fontSize: 14,
    fontWeight: "700",
  },
  pendingBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  btnDone: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.35,
  },

  appliedCard: {
    ...DIVIDER,
    gap: 10,
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
  appliedSummary: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(74,144,217,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,144,217,0.3)",
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  linkCard: {
    ...DIVIDER,
    gap: 8,
  },
  linkReason: {
    fontSize: 13,
    lineHeight: 19,
  },

  // 온보딩 퀵탭 카드
  onboardingCard: {
    marginTop: 10,
    gap: 10,
  },
  onboardingOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  onboardingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(59,130,246,0.3)",
  },
  onboardingChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  onboardingChipEmoji: {
    fontSize: 14,
  },
  onboardingChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  onboardingChipTextSelected: {
    color: "#FFFFFF",
  },
  onboardingFooterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  onboardingEscapeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  onboardingEscapeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  onboardingSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    marginLeft: "auto",
  },
  onboardingSubmitText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  briefCard: {
    ...DIVIDER,
    alignSelf: "stretch",
    gap: 8,
  },

  // 프로필 요약 카드 (onboarding-summary)
  summaryCard: {
    alignSelf: "stretch",
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryEmoji: {
    fontSize: 16,
    width: 22,
    textAlign: "center",
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  briefRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  briefEmoji: {
    fontSize: 16,
    width: 22,
  },
  briefText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  // 주간 예보
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  forecastDay: {
    width: 30,
    fontSize: 12,
    fontWeight: "700",
  },
  forecastEmoji: {
    fontSize: 14,
    width: 22,
  },
  forecastCondition: {
    flex: 1,
    fontSize: 12,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: "600",
  },

  // 출퇴근 비교
  commuteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commuteSlot: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  commuteLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  commuteEmoji: {
    fontSize: 20,
  },
  commuteTemp: {
    fontSize: 15,
    fontWeight: "700",
  },
  commutePrec: {
    fontSize: 11,
  },
  commuteMid: {
    alignItems: "center",
    gap: 2,
  },
  commuteDiff: {
    fontSize: 12,
    fontWeight: "600",
  },
  umbrellaHint: {
    fontSize: 14,
  },
});
