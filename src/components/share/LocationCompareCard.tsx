import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import ViewShot from "react-native-view-shot";
import { formatTemp, getConditionLabel, getConditionSymbol } from "@/utils/weather";
import type { TempUnit } from "@/types/settings";
import type { WeatherCondition } from "@/types/weather";
import { t } from "@/i18n";

interface LocationWeather {
  name: string;
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
}

interface LocationCompareCardProps {
  mine: LocationWeather;
  theirs: LocationWeather;
  date: string;
  tempUnit?: TempUnit;
  backgroundImage: ImageSourcePropType;
  showWatermark?: boolean;
  userMessage?: string;
}

export const LocationCompareCard = forwardRef<ViewShot, LocationCompareCardProps>(
  ({ mine, theirs, date, tempUnit = "C", backgroundImage, showWatermark = true, userMessage }, ref) => {
    const tempDiff = Math.round(mine.temp - theirs.temp);
    const diffAbs = Math.abs(tempDiff);
    const diffLabel =
      tempDiff > 0 ? t("compareCard.warmerBy", { diff: diffAbs }) :
      tempDiff < 0 ? t("compareCard.colderBy", { diff: diffAbs }) :
      t("compareCard.sameTemp");

    const needUmbrella = mine.precipitation >= 50 || theirs.precipitation >= 50;
    const headline = userMessage
      ? `"${userMessage}"`
      : needUmbrella
      ? t("compareCard.shareUmbrella")
      : tempDiff > 3
      ? t("compareCard.theirChilly")
      : tempDiff < -3
      ? t("compareCard.theirWarmer")
      : t("compareCard.similarWeather");

    return (
      <ViewShot ref={ref} options={{ format: "jpg", quality: 0.95 }}>
        <ImageBackground source={backgroundImage} style={styles.card} resizeMode="cover">
          <LinearGradient
            colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.68)"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            {/* 상단 */}
            <View style={styles.top}>
              <Text style={styles.topLabel} maxFontSizeMultiplier={1.0}>{t("compareCard.ourWeather")}</Text>
              <Text style={styles.headline} maxFontSizeMultiplier={1.0}>{headline}</Text>
            </View>

            {/* 비교 영역 — 좌우 배치 */}
            <View style={styles.compareRow}>
              <SlotCard label={t("compareCard.me")} w={mine} tempUnit={tempUnit} tint="rgba(255,180,200,0.12)" />
              <View style={styles.vsCol}>
                <View style={styles.vsCircle}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={styles.diffPill}>
                  <Text style={styles.diffArrow}>{tempDiff > 0 ? "▲" : tempDiff < 0 ? "▼" : "="}</Text>
                  <Text style={styles.diffValue}>{diffLabel}</Text>
                </View>
              </View>
              <SlotCard label={t("compareCard.you")} w={theirs} tempUnit={tempUnit} tint="rgba(180,200,255,0.12)" />
            </View>

            {/* 하단 */}
            <View style={styles.bottom}>
              <Text style={styles.dateText} maxFontSizeMultiplier={1.0}>{date}</Text>
              {showWatermark && (
                <Text style={styles.watermark} maxFontSizeMultiplier={1.0}>맑음 Malgeum</Text>
              )}
            </View>
          </View>
        </ImageBackground>
      </ViewShot>
    );
  },
);

LocationCompareCard.displayName = "LocationCompareCard";

function SlotCard({ label, w, tempUnit, tint }: {
  label: string; w: LocationWeather; tempUnit: TempUnit; tint: string;
}) {
  return (
    <View style={[styles.slot, { backgroundColor: tint }]}>
      <Text style={styles.slotLabel} maxFontSizeMultiplier={1.0}>{label}</Text>
      <Text style={styles.slotCity} maxFontSizeMultiplier={1.0} numberOfLines={1}>{w.name}</Text>
      <Text style={styles.slotIcon}>{getConditionSymbol(w.condition)}</Text>
      <Text style={styles.slotTemp} maxFontSizeMultiplier={1.0}>{formatTemp(w.temp, tempUnit)}</Text>
      <Text style={styles.slotCond} maxFontSizeMultiplier={1.0}>{getConditionLabel(w.condition)}</Text>
      {w.precipitation > 0 && (
        <View style={styles.rainPill}>
          <Text style={styles.rainText} maxFontSizeMultiplier={1.0}>{w.precipitation}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 832 / 1216,
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: "space-between",
  },

  // ── TOP ──
  top: { gap: 10 },
  topLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 30,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // ── COMPARE ROW ──
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 6,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
  },
  slotCity: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  slotIcon: {
    fontSize: 28,
    color: "rgba(255,255,255,0.7)",
    marginVertical: 4,
  },
  slotTemp: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -2,
  },
  slotCond: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
  },
  rainPill: {
    marginTop: 4,
    backgroundColor: "rgba(100,180,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rainText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(130,200,255,0.9)",
  },

  // ── VS COLUMN ──
  vsCol: {
    alignItems: "center",
    gap: 10,
    width: 48,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  diffPill: {
    alignItems: "center",
    gap: 2,
  },
  diffArrow: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  diffValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },

  // ── BOTTOM ──
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  watermark: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
