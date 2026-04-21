import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { COLORS } from "@/constants/colors";
import { getHumidityStatus } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { GaugeBar } from "./shared/GaugeBar";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
}

const HUMIDITY_SEGMENTS = [
  { get label() { return t("detail.humidity.dry"); }, max: 30, color: COLORS.warn },
  { get label() { return t("detail.humidity.comfy"); }, max: 60, color: COLORS.safe },
  { get label() { return t("detail.humidity.high"); }, max: 80, color: COLORS.caution },
  { get label() { return t("detail.humidity.veryHigh"); }, max: 100, color: COLORS.warn },
];

export function HumidityDetail({ bundle }: Props) {
  const humidity = bundle.current.humidity;
  const humStatus = getHumidityStatus(humidity);

  const isDry = humidity < 30;
  const isComfortable = humidity >= 30 && humidity <= 60;
  const isHumid = humidity > 60;

  const tips = [];
  if (isDry) {
    tips.push({ icon: "💧", text: t("detail.humidity.tipHumidifier") });
    tips.push({ icon: "🧴", text: t("detail.humidity.tipMoisturizer") });
    tips.push({ icon: "🥤", text: t("detail.humidity.tipDrinkWater") });
    tips.push({ icon: "👁️", text: t("detail.humidity.tipEyedrops") });
  } else if (isComfortable) {
    tips.push({ icon: "😊", text: t("detail.humidity.tipComfy") });
    tips.push({ icon: "👕", text: t("detail.humidity.tipLaundry") });
  } else {
    tips.push({ icon: "🌀", text: t("detail.humidity.tipDehumidifier") });
    tips.push({ icon: "🍞", text: t("detail.humidity.tipFoodStorage") });
    tips.push({ icon: "👕", text: t("detail.humidity.tipLaundryDryer") });
    if (humidity > 80) {
      tips.push({ icon: "🏠", text: t("detail.humidity.tipMold") });
    }
  }

  return (
    <View>
      <StatusHeader
        icon="💧"
        value={`${humidity}%`}
        label={humStatus.label}
        status={humStatus.status}
        subtitle={
          isDry ? t("detail.humidity.subtitleDry") :
          isComfortable ? t("detail.humidity.subtitleComfy") :
          t("detail.humidity.subtitleHumid")
        }
      />

      <Text style={styles.sectionTitle}>{t("detail.humidity.section")}</Text>
      <GaugeBar value={humidity} segments={HUMIDITY_SEGMENTS} unit="%" />

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
});
