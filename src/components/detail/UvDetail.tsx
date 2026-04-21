import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { getUvStatus } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { GaugeBar } from "./shared/GaugeBar";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
}

const UV_SEGMENTS = [
  { get label() { return t("detail.uv.low"); }, max: 2, color: COLORS.safe },
  { get label() { return t("detail.uv.moderate"); }, max: 5, color: COLORS.caution },
  { get label() { return t("detail.uv.high"); }, max: 7, color: "#F97316" },
  { get label() { return t("detail.uv.veryHigh"); }, max: 10, color: COLORS.warn },
  { get label() { return t("detail.uv.danger"); }, max: 12, color: "#B91C1C" },
];

function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function UvDetail({ bundle }: Props) {
  const { state } = useWeatherContext();
  const uv = bundle.current.uvIndex;
  const uvStatus = getUvStatus(uv);
  const isUvSensitive = state.healthProfile?.allergens?.includes("자외선");

  const sunrise = bundle.current.sunrise;
  const sunset = bundle.current.sunset;
  const solarNoon = new Date(((sunrise + sunset) / 2) * 1000);
  const peakStart = new Date(solarNoon.getTime() - 2 * 3600 * 1000);
  const peakEnd = new Date(solarNoon.getTime() + 2 * 3600 * 1000);
  const peakText = t("detail.uv.peakTime", { start: peakStart.getHours(), end: peakEnd.getHours() });

  const tips = [];
  if (uv >= 6) {
    tips.push({ icon: "🧴", text: t("detail.uv.tipSpf50") });
    tips.push({ icon: "🧢", text: t("detail.uv.tipHatSunglasses") });
    tips.push({ icon: "☀️", text: t("detail.uv.tipAvoidPeak", { time: peakText }) });
    tips.push({ icon: "👕", text: t("detail.uv.tipLongSleeve") });
  } else if (uv >= 3) {
    tips.push({ icon: "🧴", text: t("detail.uv.tipSunscreen") });
    tips.push({ icon: "🧢", text: t("detail.uv.tipHatLong") });
  } else {
    tips.push({ icon: "😊", text: t("detail.uv.tipSafe") });
  }

  if (isUvSensitive) {
    tips.push({ icon: "⚠️", text: t("detail.uv.tipSensitive") });
  }

  return (
    <View>
      <StatusHeader
        icon="☀️"
        value={`UV ${uv}`}
        label={uvStatus.label}
        status={uvStatus.status}
        subtitle={t("detail.uv.peakSubtitle", { time: peakText })}
      />

      <Text style={styles.sectionTitle}>{t("detail.uv.section")}</Text>
      <GaugeBar value={uv} segments={UV_SEGMENTS} />

      <View style={styles.peakSection}>
        <Text style={styles.sectionTitle}>{t("detail.uv.sunInfo")}</Text>
        <View style={styles.sunRow}>
          <View style={styles.sunItem}>
            <Text style={styles.sunIcon}>🌅</Text>
            <Text style={styles.sunLabel}>{t("detail.uv.sunrise")}</Text>
            <Text style={styles.sunValue}>{formatTime(sunrise)}</Text>
          </View>
          <View style={styles.sunItem}>
            <Text style={styles.sunIcon}>☀️</Text>
            <Text style={styles.sunLabel}>{t("detail.uv.peak")}</Text>
            <Text style={styles.sunValue}>{peakText}</Text>
          </View>
          <View style={styles.sunItem}>
            <Text style={styles.sunIcon}>🌇</Text>
            <Text style={styles.sunLabel}>{t("detail.uv.sunset")}</Text>
            <Text style={styles.sunValue}>{formatTime(sunset)}</Text>
          </View>
        </View>
      </View>

      {isUvSensitive && (
        <View style={styles.sensitiveAlert}>
          <Text style={styles.sensitiveIcon}>⚠️</Text>
          <Text style={styles.sensitiveText}>{t("detail.uv.sensitiveAlert")}</Text>
        </View>
      )}

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
  peakSection: {
    marginBottom: 24,
  },
  sunRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  sunItem: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  sunIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  sunLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  sunValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  sensitiveAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  sensitiveIcon: {
    fontSize: 18,
  },
  sensitiveText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.cautionDark,
  },
});
