import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { formatTemp } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
  cardId: string;
}

export function LaundryDetail({ bundle, cardId }: Props) {
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const { current, hourly } = bundle;
  const isGood = cardId === "laundry";
  const hasRainForecast = hourly.some((h) => h.precipitation > 30);

  const tips = [];
  if (isGood) {
    tips.push({ icon: "👕", text: t("detail.laundry.tipOutdoorGood") });
    if (current.windSpeed >= 1.5) tips.push({ icon: "💨", text: t("detail.laundry.tipWindDry") });
    tips.push({ icon: "☀️", text: t("detail.laundry.tipThick") });
    if (current.uvIndex >= 4) tips.push({ icon: "⚠️", text: t("detail.laundry.tipUvFlip") });
  } else {
    tips.push({ icon: "🏠", text: t("detail.laundry.tipIndoor") });
    if (current.humidity >= 75) tips.push({ icon: "💧", text: t("detail.laundry.tipHumid") });
    if (hasRainForecast) tips.push({ icon: "🌧️", text: t("detail.laundry.tipRainAvoid") });
    tips.push({ icon: "🌀", text: t("detail.laundry.tipDryer") });
  }

  return (
    <View>
      <StatusHeader
        icon="👔"
        value={isGood ? t("detail.laundry.good") : t("detail.laundry.indoor")}
        label={isGood ? t("detail.laundry.goodLabel") : t("detail.laundry.indoorLabel")}
        status={isGood ? "safe" : "caution"}
        subtitle={isGood ? t("detail.laundry.goodSubtitle") : t("detail.laundry.indoorSubtitle")}
      />

      <View style={styles.condSection}>
        <Text style={styles.sectionTitle}>{t("detail.laundry.condSection")}</Text>
        <View style={styles.condGrid}>
          <View style={styles.condItem}>
            <Text style={styles.condIcon}>💧</Text>
            <Text style={styles.condLabel}>{t("detail.laundry.humidity")}</Text>
            <Text style={[styles.condValue, current.humidity < 60 ? styles.good : styles.bad]}>
              {current.humidity}%
            </Text>
          </View>
          <View style={styles.condItem}>
            <Text style={styles.condIcon}>💨</Text>
            <Text style={styles.condLabel}>{t("detail.laundry.wind")}</Text>
            <Text style={[styles.condValue, current.windSpeed < 3 ? styles.good : styles.neutral]}>
              {current.windSpeed}m/s
            </Text>
          </View>
          <View style={styles.condItem}>
            <Text style={styles.condIcon}>🌧️</Text>
            <Text style={styles.condLabel}>{t("detail.laundry.rainForecast")}</Text>
            <Text style={[styles.condValue, !hasRainForecast ? styles.good : styles.bad]}>
              {hasRainForecast ? t("detail.laundry.yes") : t("detail.laundry.no")}
            </Text>
          </View>
          <View style={styles.condItem}>
            <Text style={styles.condIcon}>🌡️</Text>
            <Text style={styles.condLabel}>{t("detail.laundry.temp")}</Text>
            <Text style={styles.condValue}>{formatTemp(current.temp, u)}</Text>
          </View>
        </View>
      </View>

      <TipList tips={tips} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  condSection: {
    marginBottom: 24,
  },
  condGrid: {
    flexDirection: "row",
    gap: 8,
  },
  condItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  condIcon: { fontSize: 20, marginBottom: 4 },
  condLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  condValue: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  good: { color: COLORS.safe },
  bad: { color: COLORS.warn },
  neutral: { color: COLORS.textDark },
});
