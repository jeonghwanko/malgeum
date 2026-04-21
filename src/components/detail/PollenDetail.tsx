import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { getPollenStatus } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { GaugeBar } from "./shared/GaugeBar";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
}

const POLLEN_SEGMENTS = [
  { get label() { return t("detail.pollen.low"); }, max: 2, color: COLORS.safe },
  { get label() { return t("detail.pollen.moderate"); }, max: 5, color: COLORS.caution },
  { get label() { return t("detail.pollen.high"); }, max: 7, color: "#F97316" },
  { get label() { return t("detail.pollen.veryHigh"); }, max: 10, color: COLORS.warn },
];

export function PollenDetail({ bundle }: Props) {
  const { current } = bundle;
  const pollen = bundle.pollen;
  const pollenStatus = getPollenStatus(current.temp, current.humidity, current.windSpeed, current.condition);
  const score = pollen?.score ?? Math.round(pollenStatus.progress * 10);

  const month = new Date().getMonth();
  const seasonKey = month >= 2 && month <= 4 ? "spring" : month >= 7 && month <= 9 ? "autumn" : month >= 5 && month <= 6 ? "summer" : "winter";
  const season = t(`detail.pollen.${seasonKey}`);

  const factors = [];
  if (seasonKey === "spring") factors.push({ icon: "🌸", text: t("detail.pollen.springFactor", { season }) });
  else if (seasonKey === "autumn") factors.push({ icon: "🍂", text: t("detail.pollen.autumnFactor", { season }) });
  else factors.push({ icon: "🌿", text: t("detail.pollen.otherFactor", { season }) });

  if (current.windSpeed >= 3) factors.push({ icon: "💨", text: t("detail.pollen.windFactor", { speed: current.windSpeed }) });
  if (current.humidity < 40) factors.push({ icon: "🏜️", text: t("detail.pollen.dryFactor", { humidity: current.humidity }) });
  if (current.humidity > 70) factors.push({ icon: "💧", text: t("detail.pollen.humidFactor", { humidity: current.humidity }) });

  const tips = [];
  if (score >= 5) {
    tips.push({ icon: "😷", text: t("detail.pollen.tipMask") });
    tips.push({ icon: "🪟", text: t("detail.pollen.tipCloseWindows") });
    tips.push({ icon: "👕", text: t("detail.pollen.tipIndoorDry") });
    tips.push({ icon: "🚿", text: t("detail.pollen.tipWash") });
    tips.push({ icon: "💊", text: t("detail.pollen.tipMedicine") });
  } else if (score >= 3) {
    tips.push({ icon: "😷", text: t("detail.pollen.tipMaskAllergy") });
    tips.push({ icon: "🚿", text: t("detail.pollen.tipWashLight") });
  } else {
    tips.push({ icon: "😊", text: t("detail.pollen.tipSafe") });
  }

  return (
    <View>
      <StatusHeader
        icon="🌼"
        value={t("detail.pollen.score", { score })}
        label={pollenStatus.label}
        status={pollenStatus.status}
        subtitle={pollenStatus.description}
      />

      <Text style={styles.sectionTitle}>{t("detail.pollen.section")}</Text>
      <GaugeBar value={score} segments={POLLEN_SEGMENTS} />

      <View style={styles.factorSection}>
        <Text style={styles.sectionTitle}>{t("detail.pollen.factors")}</Text>
        {factors.map((f, i) => (
          <View key={i} style={styles.factorRow}>
            <Text style={styles.factorIcon}>{f.icon}</Text>
            <Text style={styles.factorText}>{f.text}</Text>
          </View>
        ))}
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
  factorSection: {
    marginBottom: 24,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 6,
  },
  factorIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  factorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textTertiary,
  },
});
