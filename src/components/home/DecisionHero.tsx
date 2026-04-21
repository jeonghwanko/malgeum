import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { formatYesterdayDiff } from "@/constants/recommendationMessages";

interface DecisionHeroProps {
  message: string;
  subText: string;
  badge?: string;
  status?: string;
  palette?: AdaptivePalette;
  yesterdayDiff?: number | null;
  commuteSummary?: string | null;
  onPress?: () => void;
}

export function DecisionHero({ message, subText, palette: ap, yesterdayDiff, commuteSummary, onPress }: DecisionHeroProps) {
  const nb = ap?.notebook;
  const isNotebook = nb && nb.fontFamily !== "system";
  const fontFamily = isNotebook ? nb.fontFamily : undefined;

  const shadowColor = ap?.textShadowColor ?? "rgba(0,0,0,0.5)";
  const shadowR = (ap?.textShadowIntensity ?? 1) * 6;
  const cardBg = ap?.cardBg ?? "rgba(0,0,0,0.30)";
  const cardBorder = ap?.cardBorder ?? "rgba(255,255,255,0.20)";
  const textPrimary = ap?.textPrimary ?? "#FFFFFF";
  const textSecondary = ap?.textSecondary ?? "rgba(255,255,255,0.80)";
  const textTertiary = ap?.textTertiary ?? "rgba(255,255,255,0.50)";

  const yesterdayLine = yesterdayDiff != null ? formatYesterdayDiff(yesterdayDiff) : null;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
          pressed && onPress && { opacity: 0.82, transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={`${yesterdayLine ? yesterdayLine + ". " : ""}${message}. ${subText}`}
      >
        <View style={styles.inner}>
          {ap?.accent && <View style={[styles.accentBar, { backgroundColor: ap.accent }]} />}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {yesterdayLine && (
                <Text
                  style={[styles.infoLine, {
                    fontFamily,
                    color: "#FFFFFF",
                    textShadowColor: shadowColor,
                    textShadowRadius: shadowR * 0.8,
                    fontWeight: isNotebook ? "normal" : "700",
                    fontSize: isNotebook ? 22 : 19,
                  }]}
                  numberOfLines={1}
                >
                  {yesterdayLine}
                </Text>
              )}
              {commuteSummary && (
                <Text
                  style={[styles.infoLine, {
                    fontFamily,
                    color: "#FFFFFF",
                    textShadowColor: shadowColor,
                    textShadowRadius: shadowR * 0.6,
                    fontWeight: isNotebook ? "normal" : "600",
                    fontSize: isNotebook ? 18 : 15,
                  }]}
                  numberOfLines={1}
                >
                  {commuteSummary}
                </Text>
              )}
              <Text
                style={[styles.message, {
                  fontFamily,
                  color: textPrimary,
                  textShadowColor: shadowColor,
                  textShadowRadius: shadowR,
                  fontWeight: isNotebook ? "normal" : (ap?.cardFontWeight ?? "700"),
                  fontSize: isNotebook ? 34 : 28,
                  lineHeight: isNotebook ? 42 : 36,
                  marginTop: yesterdayLine ? 4 : undefined,
                }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {message}
              </Text>
              <View style={[styles.subBadge, {
                backgroundColor: ap?.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.25)",
                marginTop: 8,
              }]}>
                <Text style={[styles.subText, {
                  fontFamily,
                  color: textSecondary,
                  textShadowColor: shadowColor,
                  textShadowRadius: shadowR * 0.6,
                  fontWeight: isNotebook ? "normal" : "500",
                  fontSize: isNotebook ? 18 : 15,
                }]}>
                  {subText}
                </Text>
              </View>
            </View>
            {onPress && (
              <Text style={[styles.chevron, { color: "rgba(255,255,255,0.5)" }]}>›</Text>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 24, marginBottom: 10, zIndex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
  },
  inner: {
    padding: 18,
  },
  accentBar: { width: 24, height: 3, borderRadius: 1.5, marginBottom: 10 },
  infoLine: {
    textShadowOffset: { width: 0, height: 1 },
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: {
    textShadowOffset: { width: 0, height: 1 },
  },
  subBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  subText: {
    lineHeight: 18,
    textShadowOffset: { width: 0, height: 1 },
  },
  chevron: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
    marginLeft: 4,
  },
});
