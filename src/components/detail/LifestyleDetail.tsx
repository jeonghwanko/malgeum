import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { getConditionLabel, formatTemp } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
  cardId: string;
}

export function LifestyleDetail({ bundle, cardId }: Props) {
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const { daily, hourly, current } = bundle;
  const isRecommended = cardId === "carwash";

  const next3Days = daily.slice(0, 3);

  const tips = [];
  if (isRecommended) {
    tips.push({ icon: "🚗", text: t("detail.lifestyle.tipGoodNoRain") });
    tips.push({ icon: "💨", text: t("detail.lifestyle.tipWind", { speed: current.windSpeed, desc: current.windSpeed < 5 ? t("detail.lifestyle.tipWindLow") : t("detail.lifestyle.tipWindHigh") }) });
    tips.push({ icon: "☀️", text: t("detail.lifestyle.tipNaturalDry") });
  } else {
    tips.push({ icon: "🌧️", text: t("detail.lifestyle.tipRainDelay") });
    tips.push({ icon: "⏰", text: t("detail.lifestyle.tipAfterRain") });
    tips.push({ icon: "🧽", text: t("detail.lifestyle.tipWipeRain") });
  }

  return (
    <View>
      <StatusHeader
        icon="🚗"
        value={isRecommended ? t("detail.lifestyle.carwashRec") : t("detail.lifestyle.carwashNo")}
        label={isRecommended ? t("detail.lifestyle.recLabel") : t("detail.lifestyle.noLabel")}
        status={isRecommended ? "safe" : "warn"}
        subtitle={isRecommended ? t("detail.lifestyle.noRainSubtitle") : t("detail.lifestyle.rainSubtitle")}
      />

      <View style={styles.forecastSection}>
        <Text style={styles.sectionTitle}>{t("detail.lifestyle.forecast3day")}</Text>
        {next3Days.map((day, i) => {
          const date = new Date(day.dt * 1000);
          const dayLabel = i === 0 ? t("detail.lifestyle.today") : i === 1 ? t("detail.lifestyle.tomorrow") : t("detail.lifestyle.dayAfter");
          const hasRain = day.precipitation > 30;
          return (
            <View key={i} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{dayLabel}</Text>
              <Text style={styles.dayCondition}>{getConditionLabel(day.condition)}</Text>
              <View style={[styles.rainBadge, hasRain ? styles.rainBadgeWarn : styles.rainBadgeSafe]}>
                <Text style={[styles.rainText, hasRain ? styles.rainTextWarn : styles.rainTextSafe]}>
                  {hasRain ? t("detail.lifestyle.rainPercent", { precip: day.precipitation }) : t("detail.lifestyle.clear")}
                </Text>
              </View>
              <Text style={styles.dayTemp}>{formatTemp(day.tempMin, u)} / {formatTemp(day.tempMax, u)}</Text>
            </View>
          );
        })}
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
  forecastSection: {
    marginBottom: 24,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 6,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    width: 36,
  },
  dayCondition: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 50,
  },
  rainBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rainBadgeSafe: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  rainBadgeWarn: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  rainText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rainTextSafe: {
    color: COLORS.safe,
  },
  rainTextWarn: {
    color: COLORS.warn,
  },
  dayTemp: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "right",
  },
});
