import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Wind, Sun, Flower, Drop } from "phosphor-react-native";
import type { AirQuality, WeatherCondition } from "@/types/weather";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { getStatusColor, type StatusLevel } from "@/constants/colors";
import { getPm25Status, getPm25Metaphor, getUvStatus, getHumidityStatus, getPollenStatus } from "@/utils/weather";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";

interface HealthGridProps {
  airQuality: AirQuality | null;
  uvIndex: number;
  humidity: number;
  temp?: number;
  windSpeed?: number;
  condition?: WeatherCondition;
  palette?: AdaptivePalette;
  onCardPress?: (healthId: string) => void;
}

interface RowData {
  icon: typeof Wind;
  label: string;
  value: string;
  status: StatusLevel;
  detail: string;
  healthId: string;
}

function HealthRow({ row, onPress, palette }: { row: RowData; onPress: () => void; palette?: AdaptivePalette }) {
  const Icon = row.icon;
  const statusColor = getStatusColor(row.status);

  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onPress(); }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${row.label} ${row.value}. ${row.detail}`}
    >
      <View style={[styles.card, palette && { backgroundColor: palette.cardBg }]}>
        <Icon size={16} weight="duotone" color={palette?.textTertiary ?? "rgba(255,255,255,0.7)"} />
        <Text style={[styles.label, palette && { color: palette.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.0}>{row.label}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText} numberOfLines={1} maxFontSizeMultiplier={1.0}>{row.value}</Text>
        </View>
        <Text style={[styles.detail, palette && { color: palette.textTertiary }]} numberOfLines={1} maxFontSizeMultiplier={1.0}>{row.detail}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function HealthGrid({ airQuality, uvIndex, humidity, temp = 20, windSpeed = 2, condition = "clear", palette, onCardPress }: HealthGridProps) {
  const pm25 = airQuality?.pm25 ?? 0;
  const pm25Status = getPm25Status(pm25);
  const uvStatus = getUvStatus(uvIndex);
  const humStatus = getHumidityStatus(humidity);
  const pollenStatus = getPollenStatus(temp, humidity, windSpeed, condition);

  const rows: RowData[] = [
    { icon: Wind, label: t("health.dust"), value: pm25Status.label, status: pm25Status.status, detail: getPm25Metaphor(pm25), healthId: "pm25" },
    { icon: Sun, label: t("health.uv"), value: uvStatus.label, status: uvStatus.status, detail: t("health.uvDetail", { value: uvIndex }), healthId: "uv" },
    { icon: Flower, label: t("health.pollen"), value: pollenStatus.label, status: pollenStatus.status, detail: pollenStatus.description, healthId: "pollen" },
    { icon: Drop, label: t("health.humidity"), value: humStatus.label, status: humStatus.status, detail: `${humidity}%`, healthId: "humidity" },
  ];

  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <HealthRow
          key={row.label}
          row={row}
          palette={palette}
          onPress={() => onCardPress?.(row.healthId)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 6,
    marginBottom: 20,
    zIndex: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    width: 52,
  },
  badge: {
    width: 62,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detail: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },
});
