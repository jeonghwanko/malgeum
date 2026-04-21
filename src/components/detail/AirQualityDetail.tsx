import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { getPm25Status, getPm25Metaphor } from "@/utils/weather";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { GaugeBar } from "./shared/GaugeBar";
import { TipList } from "./shared/TipList";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
}

const PM25_SEGMENTS = [
  { get label() { return t("detail.air.good"); }, max: 15, color: COLORS.safe },
  { get label() { return t("detail.air.moderate"); }, max: 35, color: COLORS.caution },
  { get label() { return t("detail.air.bad"); }, max: 75, color: COLORS.warn },
  { get label() { return t("detail.air.veryBad"); }, max: 100, color: COLORS.danger },
];

const PM10_SEGMENTS = [
  { get label() { return t("detail.air.good"); }, max: 30, color: COLORS.safe },
  { get label() { return t("detail.air.moderate"); }, max: 80, color: COLORS.caution },
  { get label() { return t("detail.air.bad"); }, max: 150, color: COLORS.warn },
  { get label() { return t("detail.air.veryBad"); }, max: 200, color: COLORS.danger },
];

type CheckStatus = "ok" | "shortOk" | "withMask" | "avoid" | "indoorOnly";

interface CheckItem {
  label: string;
  status: CheckStatus;
}

const CHECK_COLORS: Record<CheckStatus, string> = {
  ok: COLORS.safe,
  shortOk: COLORS.safeMild,
  withMask: COLORS.caution,
  avoid: COLORS.warn,
  indoorOnly: COLORS.danger,
};

function getCheckItems(pm25: number): CheckItem[] {
  if (pm25 <= 15) {
    return [
      { label: t("detail.air.actVent"), status: "ok" },
      { label: t("detail.air.actOutdoor"), status: "ok" },
      { label: t("detail.air.actExercise"), status: "ok" },
      { label: t("detail.air.actLaundry"), status: "ok" },
    ];
  }
  if (pm25 <= 35) {
    return [
      { label: t("detail.air.actVent"), status: "shortOk" },
      { label: t("detail.air.actOutdoor"), status: "ok" },
      { label: t("detail.air.actExercise"), status: "ok" },
      { label: t("detail.air.actLaundry"), status: "avoid" },
    ];
  }
  if (pm25 <= 75) {
    return [
      { label: t("detail.air.actVent"), status: "avoid" },
      { label: t("detail.air.actOutdoor"), status: "withMask" },
      { label: t("detail.air.actExercise"), status: "indoorOnly" },
      { label: t("detail.air.actLaundry"), status: "indoorOnly" },
    ];
  }
  return [
    { label: t("detail.air.actVent"), status: "avoid" },
    { label: t("detail.air.actOutdoor"), status: "avoid" },
    { label: t("detail.air.actExercise"), status: "indoorOnly" },
    { label: t("detail.air.actLaundry"), status: "indoorOnly" },
  ];
}

const STATUS_LABEL_KEY: Record<CheckStatus, string> = {
  ok: "detail.air.ok",
  shortOk: "detail.air.shortOk",
  withMask: "detail.air.withMask",
  avoid: "detail.air.avoid",
  indoorOnly: "detail.air.indoorOnly",
};

export function AirQualityDetail({ bundle }: Props) {
  const { state } = useWeatherContext();
  const aq = bundle.airQuality;
  const pm25 = aq?.pm25 ?? 0;
  const pm10 = aq?.pm10 ?? 0;
  const pm25Status = getPm25Status(pm25);
  const isDustSensitive = state.healthProfile?.allergens?.some((a) => a === "미세먼지" || a === "황사");

  const checkItems = getCheckItems(pm25);

  const tips = [];
  if (pm25 > 35) {
    tips.push({ icon: "😷", text: t("detail.air.tipMask") });
    tips.push({ icon: "🏠", text: t("detail.air.tipCloseWindows") });
    tips.push({ icon: "🏃", text: t("detail.air.tipIndoorExercise") });
    tips.push({ icon: "🌀", text: t("detail.air.tipPurifier") });
  } else if (pm25 > 15) {
    tips.push({ icon: "😷", text: t("detail.air.tipMaskSensitive") });
    tips.push({ icon: "🪟", text: t("detail.air.tipShortVent") });
  } else {
    tips.push({ icon: "🪟", text: t("detail.air.tipGoodVent") });
    tips.push({ icon: "🏃", text: t("detail.air.tipGoodOutdoor") });
  }

  if (isDustSensitive) {
    tips.push({ icon: "⚠️", text: t("detail.air.tipSensitiveWarn") });
  }

  return (
    <View>
      <StatusHeader
        icon="😷"
        value={t("detail.air.pm25Label", { value: pm25 })}
        label={pm25Status.label}
        status={pm25Status.status}
        subtitle={aq ? t("detail.air.pm10Subtitle", { pm10, aqi: aq.aqi }) : t("detail.air.noData")}
      />

      {/* 비유 문구 */}
      <Text style={styles.metaphor}>{getPm25Metaphor(pm25)}</Text>

      {/* 행동 체크리스트 */}
      <Text style={styles.sectionTitle}>{t("detail.air.checklistTitle")}</Text>
      <View style={styles.checklist}>
        {checkItems.map((item) => {
          const color = CHECK_COLORS[item.status];
          return (
            <View key={item.label} style={styles.checkRow}>
              <Text style={styles.checkLabel}>{item.label}</Text>
              <View style={[styles.checkBadge, { backgroundColor: color + "1A" }]}>
                <View style={[styles.checkDot, { backgroundColor: color }]} />
                <Text style={[styles.checkBadgeText, { color }]}>{t(STATUS_LABEL_KEY[item.status])}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{t("detail.air.pm25Section")}</Text>
      <GaugeBar value={pm25} segments={PM25_SEGMENTS} unit="㎍" />

      <Text style={styles.sectionTitle}>{t("detail.air.pm10Section")}</Text>
      <GaugeBar value={pm10} segments={PM10_SEGMENTS} unit="㎍" />

      {isDustSensitive && (
        <View style={styles.sensitiveAlert}>
          <Text style={styles.sensitiveIcon}>⚠️</Text>
          <Text style={styles.sensitiveText}>{t("detail.air.sensitiveAlert")}</Text>
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
  metaphor: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  checklist: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  checkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  checkBadgeText: {
    fontSize: 12,
    fontWeight: "700",
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
