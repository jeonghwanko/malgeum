import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface ChartDataPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

interface HourlyMiniChartProps {
  data: ChartDataPoint[];
  maxValue: number;
  unit?: string;
  accentColor?: string;
  highlightColor?: string;
}

const BAR_HEIGHT = 100;

export function HourlyMiniChart({
  data,
  maxValue,
  unit = "",
  accentColor = COLORS.primary,
  highlightColor = COLORS.caution,
}: HourlyMiniChartProps) {
  if (data.length === 0) return null;

  const minValue = Math.min(...data.map((d) => d.value));
  const effectiveMin = Math.min(minValue, 0);
  const range = maxValue - effectiveMin;

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((point, i) => {
          const height = range > 0 ? ((point.value - effectiveMin) / range) * BAR_HEIGHT : 0;
          const barColor = point.highlight ? highlightColor : accentColor;

          return (
            <View key={i} style={styles.column}>
              <Text style={styles.valueLabel}>
                {Math.round(point.value)}{unit}
              </Text>
              <View style={styles.barWrap}>
                <View
                  style={[styles.bar, {
                    height: Math.max(height, 4),
                    backgroundColor: barColor,
                  }]}
                />
              </View>
              <Text style={styles.hourLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_HEIGHT + 44,
    paddingTop: 20,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  barWrap: {
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  bar: {
    width: 14,
    borderRadius: 7,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
