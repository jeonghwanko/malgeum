import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { formatHour } from "@/utils/date";
import { formatTemp, convertTemp, tempUnitSuffix } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { HourlyMiniChart } from "./shared/HourlyMiniChart";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
  cardId: string;
}

export function OutdoorDetail({ bundle, cardId }: Props) {
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const { current, hourly, airQuality } = bundle;
  const isOutdoor = cardId === "outdoor-activity";
  const exercisePref = state.healthProfile?.exercisePreference ?? "야외 러닝";

  const chartData = useMemo(() => {
    return hourly.slice(0, 12).map((h) => ({
      label: formatHour(h.dt),
      value: convertTemp(h.temp, u),
      highlight: h.condition === "clear" && h.temp >= 15 && h.temp <= 25 && h.precipitation < 30,
    }));
  }, [hourly, u]);

  const bestWindow = useMemo(() => {
    const good = hourly.slice(0, 12).filter(
      (h) => h.condition === "clear" && h.temp >= 15 && h.temp <= 25 && h.precipitation < 30,
    );
    if (good.length === 0) return null;
    return {
      start: formatHour(good[0].dt),
      end: formatHour(good[good.length - 1].dt),
    };
  }, [hourly]);

  const aqLabel = airQuality
    ? airQuality.aqi <= 1 ? t("detail.outdoor.aqGood") : airQuality.aqi <= 2 ? t("detail.outdoor.aqModerate") : t("detail.outdoor.aqBad")
    : t("detail.outdoor.aqNoData");

  const tips = [];
  tips.push({ icon: "💧", text: t("detail.outdoor.tipHydrate") });
  tips.push({ icon: "🏋️", text: t("detail.outdoor.tipWarmup") });
  if (current.uvIndex >= 5) {
    tips.push({ icon: "🧴", text: t("detail.outdoor.tipUv") });
  }
  if (!isOutdoor) {
    tips.push({ icon: "🏠", text: t("detail.outdoor.tipIndoor") });
  }
  if (current.feelsLike >= 28) {
    tips.push({ icon: "🌡️", text: t("detail.outdoor.tipHeat") });
  }
  if (current.feelsLike <= 5) {
    tips.push({ icon: "🧤", text: t("detail.outdoor.tipCold") });
  }

  return (
    <View>
      <StatusHeader
        icon={isOutdoor ? "🏃" : "🏋️"}
        value={isOutdoor ? t("detail.outdoor.good") : t("detail.outdoor.indoor")}
        label={isOutdoor ? t("detail.outdoor.goodLabel") : t("detail.outdoor.indoorLabel")}
        status={isOutdoor ? "safe" : "caution"}
        subtitle={t("detail.outdoor.subtitle", { pref: exercisePref, aq: aqLabel })}
      />

      {bestWindow && (
        <View style={styles.bestWindow}>
          <Text style={styles.bestIcon}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bestLabel}>{t("detail.outdoor.recTime")}</Text>
            <Text style={styles.bestValue}>{bestWindow.start} ~ {bestWindow.end}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t("detail.outdoor.chart12h")}</Text>
      <HourlyMiniChart
        data={chartData}
        maxValue={Math.max(...chartData.map((d) => d.value), 1) + 2}
        unit={tempUnitSuffix(u)}
        highlightColor={COLORS.safe}
      />

      <View style={styles.conditionGrid}>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>🌡️</Text>
          <Text style={styles.condLabel}>{t("detail.outdoor.feelsLike")}</Text>
          <Text style={styles.condValue}>{formatTemp(current.feelsLike, u)}</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>💨</Text>
          <Text style={styles.condLabel}>{t("detail.outdoor.wind")}</Text>
          <Text style={styles.condValue}>{current.windSpeed}m/s</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>💧</Text>
          <Text style={styles.condLabel}>{t("detail.outdoor.humidity")}</Text>
          <Text style={styles.condValue}>{current.humidity}%</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>☀️</Text>
          <Text style={styles.condLabel}>UV</Text>
          <Text style={styles.condValue}>{current.uvIndex}</Text>
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
  bestWindow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  bestIcon: {
    fontSize: 24,
  },
  bestLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bestValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
  },
  conditionGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  condItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  condIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  condLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  condValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
});
