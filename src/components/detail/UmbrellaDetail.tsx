import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, getStatusColor } from "@/constants/colors";
import { formatHour } from "@/utils/date";
import { useWeatherContext } from "@/context/WeatherContext";
import { detectWeatherChanges } from "@/utils/recommendations";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { HourlyMiniChart } from "./shared/HourlyMiniChart";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
  cardId: string;
}

export function UmbrellaDetail({ bundle, cardId }: Props) {
  const { state } = useWeatherContext();
  const { current, hourly } = bundle;
  const maxPrecip = Math.max(current.precipitation, ...hourly.slice(0, 8).map((h) => h.precipitation));
  const isUrgent = cardId === "umbrella";

  const chartData = useMemo(() => {
    return hourly.slice(0, 12).map((h) => ({
      label: formatHour(h.dt),
      value: h.precipitation,
      highlight: h.precipitation >= 50,
    }));
  }, [hourly]);

  const changes = useMemo(() => detectWeatherChanges(hourly, state.tempUnit), [hourly, state.tempUnit]);

  const tips = [];
  tips.push({ icon: "☂️", text: t("detail.umbrella.tipFoldable") });
  if (maxPrecip >= 70) {
    tips.push({ icon: "👟", text: t("detail.umbrella.tipWaterproof") });
  }
  tips.push({ icon: "👕", text: t("detail.umbrella.tipIndoorDry") });
  if (maxPrecip >= 50) {
    tips.push({ icon: "🚗", text: t("detail.umbrella.tipDelayCarwash") });
  }

  return (
    <View>
      <StatusHeader
        icon="☂️"
        value={t("detail.umbrella.precip", { value: maxPrecip })}
        label={isUrgent ? t("detail.umbrella.must") : t("detail.umbrella.maybe")}
        status={isUrgent ? "warn" : "caution"}
        subtitle={isUrgent ? t("detail.umbrella.highChance") : t("detail.umbrella.justInCase")}
      />

      {changes.length > 0 && (
        <View style={styles.changeSection}>
          <Text style={styles.sectionTitle}>{t("detail.umbrella.weatherChange")}</Text>
          {changes.map((ch, i) => (
            <View key={i} style={styles.changeRow}>
              <Text style={styles.changeIcon}>
                {ch.type === "rain_start" ? "🌧️" : ch.type === "rain_stop" ? "🌤️" : "🌡️"}
              </Text>
              <Text style={styles.changeText}>{ch.description}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>{t("detail.umbrella.chart")}</Text>
      <HourlyMiniChart
        data={chartData}
        maxValue={100}
        unit="%"
        accentColor={COLORS.primary}
        highlightColor={COLORS.warn}
      />

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
  changeSection: {
    marginBottom: 24,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderRadius: 12,
    marginBottom: 6,
  },
  changeIcon: {
    fontSize: 20,
  },
  changeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
});
