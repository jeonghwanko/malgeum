import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ArrowUp, ArrowDown, CheckCircle } from "phosphor-react-native";
import type { PredictionChoice, PredictionEntry } from "@/types/predictionGame";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { EVENT_CARD_BG, EVENT_CARD_BORDER, EVENT_CARD_BG_LIGHT, EVENT_CARD_BORDER_LIGHT, LIGHT_TEXT, LIGHT_TEXT_SUB, LIGHT_TEXT_HINT, LIGHT_MARGIN_RESET } from "./cardStyle";
import { t } from "@/i18n";
import { hapticMedium } from "@/hooks/useHaptics";

interface Props {
  baseMax: number | null;
  locationName: string;
  todayPrediction: PredictionEntry | null;
  yesterdayResult: PredictionEntry | null;
  onPredict: (choice: PredictionChoice) => void;
  disabled?: boolean;
  submitting?: boolean;
  palette?: AdaptivePalette;
  variant?: "dark" | "light";
}

export function PredictionCard({
  baseMax,
  locationName,
  todayPrediction,
  yesterdayResult,
  onPredict,
  disabled = false,
  submitting = false,
  palette,
  variant = "dark",
}: Props) {
  const isLight = variant === "light";
  const cardBg = isLight ? EVENT_CARD_BG_LIGHT : (palette?.tabBarBg ?? EVENT_CARD_BG);
  const cardBorder = isLight ? EVENT_CARD_BORDER_LIGHT : (palette?.cardBorder ?? EVENT_CARD_BORDER);
  const textColor = isLight ? LIGHT_TEXT : "#FFFFFF";
  const subColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.78)";
  const hintColor = isLight ? LIGHT_TEXT_HINT : "rgba(255,255,255,0.45)";
  const labelColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.7)";

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isLight && LIGHT_MARGIN_RESET]}>
      {!isLight && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]} maxFontSizeMultiplier={1.2}>
            {t("predCard.title")}
          </Text>
          <Text style={[styles.subtitle, { color: subColor }]} maxFontSizeMultiplier={1.2}>
            {t("predCard.subtitle")}
          </Text>
          <Text style={[styles.ruleHint, { color: hintColor }]} maxFontSizeMultiplier={1.2}>
            {t("predCard.ruleHint")}
          </Text>
        </View>
      )}

      {yesterdayResult && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[
            styles.resultBanner,
            yesterdayResult.result === "win" && styles.resultWin,
            yesterdayResult.result === "lose" && styles.resultLose,
            yesterdayResult.result === "tie" && styles.resultTie,
          ]}
        >
          <Text style={styles.resultEmoji}>
            {yesterdayResult.result === "win" ? "🎉" : yesterdayResult.result === "lose" ? "😅" : "🤝"}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resultTitle, { color: textColor }]} maxFontSizeMultiplier={1.2}>
              {yesterdayResult.result === "win"
                ? t("predCard.resultWin")
                : yesterdayResult.result === "lose"
                ? t("predCard.resultLose")
                : t("predCard.resultTie")}
            </Text>
            <Text style={[styles.resultDetail, { color: subColor }]} maxFontSizeMultiplier={1.2}>
              {t("predCard.resultDetail", {
                base: yesterdayResult.baseMax,
                actual: yesterdayResult.actualMax,
                choice: yesterdayResult.choice === "higher" ? t("predCard.choiceHigherShort") : t("predCard.choiceLowerShort"),
              })}
            </Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.todayInfo}>
        <Text style={[styles.todayLabel, { color: labelColor }]} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit>
          {t("predCard.todayLabel", { location: locationName })}
        </Text>
        <Text style={[styles.baseTemp, { color: textColor }]} maxFontSizeMultiplier={1.2}>
          {baseMax !== null ? `${baseMax}°` : "—"}
          <Text style={[styles.todayHint, { color: hintColor }]}>  {t("predCard.todayHint")}</Text>
        </Text>
      </View>

      {todayPrediction ? (
        <View style={styles.lockedRow}>
          <CheckCircle size={20} weight="fill" color="#10B981" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.lockedTitle, { color: textColor }]} maxFontSizeMultiplier={1.2}>
              {t("event.predicted")}
            </Text>
            <Text style={[styles.lockedSub, { color: subColor }]} maxFontSizeMultiplier={1.2}>
              {t("predCard.yourChoice", { choice: todayPrediction.choice === "higher" ? t("predCard.choiceHigherShort") : t("predCard.choiceLowerShort") })}
            </Text>
          </View>
        </View>
      ) : submitting ? (
        <View style={styles.submittingRow}>
          <ActivityIndicator size="small" color={isLight ? LIGHT_TEXT : "#FFFFFF"} />
          <Text style={[styles.submittingText, { color: subColor }]} maxFontSizeMultiplier={1.2}>{t("predCard.submitting")}</Text>
        </View>
      ) : (
        <View style={styles.btnRow}>
          <ChoiceButton
            choice="higher"
            label={t("predCard.higher")}
            isLight={isLight}
            disabled={disabled}
            onPress={() => { hapticMedium(); onPredict("higher"); }}
          />
          <ChoiceButton
            choice="lower"
            label={t("predCard.lower")}
            isLight={isLight}
            disabled={disabled}
            onPress={() => { hapticMedium(); onPredict("lower"); }}
          />
        </View>
      )}
    </View>
  );
}

/**
 * 예측 버튼 — View(시각) + Pressable(터치) 분리 구조.
 *
 * 과거 여러 번의 fix 시도(commits 8884f1e, acd0671, 01d8cf9)에도
 * iOS TestFlight에서 배경색이 안 먹는 증상이 재발. 원인 특정 안 되어
 * 가장 방어적인 구조로 재작성:
 *   - 색상은 StyleSheet.absoluteFillObject 로 깔아두는 View가 책임
 *   - Pressable은 투명 오버레이로 터치만 담당
 * 이 구조면 Pressable 의 어떤 렌더 이슈도 배경에 영향 없음.
 */
interface ChoiceButtonProps {
  choice: PredictionChoice;
  label: string;
  isLight: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ChoiceButton({ choice, label, isLight, disabled, onPress }: ChoiceButtonProps) {
  const bg = choice === "higher" ? "#F47252" : "#3B82F6";
  const border = choice === "higher"
    ? (isLight ? "#E5593A" : "#FFB39A")
    : (isLight ? "#2563EB" : "#93C5FD");
  const Icon = choice === "higher" ? ArrowUp : ArrowDown;

  return (
    <View
      style={[
        styles.choiceBtn,
        { backgroundColor: bg, borderColor: border },
        disabled && styles.choiceDim,
      ]}
    >
      <Icon size={28} weight="bold" color="#FFFFFF" />
      <Text style={styles.choiceLabel} maxFontSizeMultiplier={1.2}>{label}</Text>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 18,
    backgroundColor: EVENT_CARD_BG,
    borderColor: EVENT_CARD_BORDER,
  },
  header: { gap: 4 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
  },
  ruleHint: {
    fontSize: 11,
    fontWeight: "400",
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultWin: {
    backgroundColor: "rgba(16,185,129,0.22)",
    borderColor: "rgba(16,185,129,0.5)",
  },
  resultLose: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.45)",
  },
  resultTie: {
    backgroundColor: "rgba(148,163,184,0.22)",
    borderColor: "rgba(148,163,184,0.45)",
  },
  resultEmoji: { fontSize: 28 },
  resultTitle: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  resultDetail: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
  },
  todayInfo: { alignItems: "center", gap: 4 },
  todayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  baseTemp: {
    fontSize: 60,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  todayHint: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
  },
  btnRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  choiceBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  higherBg: {
    backgroundColor: "#F47252",
    borderColor: "#FFB39A",
  },
  higherBgLight: {
    borderColor: "#E5593A",
  },
  lowerBg: {
    backgroundColor: "#3B82F6",
    borderColor: "#93C5FD",
  },
  lowerBgLight: {
    borderColor: "#2563EB",
  },
  choiceDim: {
    opacity: 0.55,
  },
  choiceLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.45)",
  },
  lockedTitle: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  lockedSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
  },
  submittingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.78)",
  },
});
