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

function getCardConfig(id: string) {
  const configs: Record<string, { icon: string; titleKey: string; descKey: string }> = {
    date: { icon: "💑", titleKey: "detail.activity.date", descKey: "detail.activity.dateDesc" },
    picnic: { icon: "🧺", titleKey: "detail.activity.picnic", descKey: "detail.activity.picnicDesc" },
    walk: { icon: "🚶", titleKey: "detail.activity.walk", descKey: "detail.activity.walkDesc" },
  };
  const c = configs[id] ?? configs.walk;
  return { icon: c.icon, title: t(c.titleKey), desc: t(c.descKey) };
}

export function ActivityDetail({ bundle, cardId }: Props) {
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const { current, hourly } = bundle;
  const config = getCardConfig(cardId);

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
    return { start: formatHour(good[0].dt), end: formatHour(good[good.length - 1].dt) };
  }, [hourly]);

  const tips = getActivityTips(cardId, current);

  return (
    <View>
      <StatusHeader
        icon={config.icon}
        value={config.title}
        label={t("detail.activity.rec")}
        status="safe"
        subtitle={config.desc}
      />

      {bestWindow && (
        <View style={styles.bestWindow}>
          <Text style={styles.bestIcon}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bestLabel}>{t("detail.activity.recTime")}</Text>
            <Text style={styles.bestValue}>{bestWindow.start} ~ {bestWindow.end}</Text>
          </View>
        </View>
      )}

      <View style={styles.condGrid}>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>🌡️</Text>
          <Text style={styles.condLabel}>{t("detail.activity.feelsLike")}</Text>
          <Text style={styles.condValue}>{formatTemp(current.feelsLike, u)}</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>💨</Text>
          <Text style={styles.condLabel}>{t("detail.activity.wind")}</Text>
          <Text style={styles.condValue}>{current.windSpeed}m/s</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>💧</Text>
          <Text style={styles.condLabel}>{t("detail.activity.humidity")}</Text>
          <Text style={styles.condValue}>{current.humidity}%</Text>
        </View>
        <View style={styles.condItem}>
          <Text style={styles.condIcon}>☀️</Text>
          <Text style={styles.condLabel}>UV</Text>
          <Text style={styles.condValue}>{current.uvIndex}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t("detail.activity.chart12h")}</Text>
      <HourlyMiniChart
        data={chartData}
        maxValue={chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) + 2 : 30}
        unit={tempUnitSuffix(u)}
        highlightColor={COLORS.safe}
      />

      <TipList tips={tips} />
    </View>
  );
}

function getActivityTips(cardId: string, current: WeatherBundle["current"]) {
  const tips = [];

  if (cardId === "date") {
    tips.push({ icon: "☀️", text: t("detail.activity.tipCafe") });
    if (current.uvIndex >= 5) tips.push({ icon: "🧴", text: t("detail.activity.tipUv") });
    tips.push({ icon: "📸", text: t("detail.activity.tipPhoto") });
    if (current.feelsLike >= 25) tips.push({ icon: "🍦", text: t("detail.activity.tipCoolDrink") });
  } else if (cardId === "picnic") {
    tips.push({ icon: "🧺", text: t("detail.activity.tipBlanket") });
    if (current.windSpeed >= 3) tips.push({ icon: "💨", text: t("detail.activity.tipWindyBlanket") });
    tips.push({ icon: "🧴", text: t("detail.activity.tipSunscreenPicnic") });
    tips.push({ icon: "🗑️", text: t("detail.activity.tipTrash") });
  } else {
    tips.push({ icon: "🚶", text: t("detail.activity.tipWalk30") });
    if (current.feelsLike <= 15) tips.push({ icon: "🧥", text: t("detail.activity.tipJacket") });
    if (current.uvIndex >= 5) tips.push({ icon: "🧢", text: t("detail.activity.tipHat") });
    tips.push({ icon: "💧", text: t("detail.activity.tipWater") });
  }

  return tips;
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
  bestIcon: { fontSize: 24 },
  bestLabel: { fontSize: 12, color: COLORS.textSecondary },
  bestValue: { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginTop: 2 },
  condGrid: {
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
  condIcon: { fontSize: 20, marginBottom: 4 },
  condLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  condValue: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
});
