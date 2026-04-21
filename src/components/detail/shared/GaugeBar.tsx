import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface GaugeSegment {
  label: string;
  max: number;
  color: string;
}

interface GaugeBarProps {
  value: number;
  segments: GaugeSegment[];
  unit?: string;
}

export function GaugeBar({ value, segments, unit = "" }: GaugeBarProps) {
  const totalMax = segments[segments.length - 1].max;
  const clampedValue = Math.min(Math.max(value, 0), totalMax);
  const markerPosition = (clampedValue / totalMax) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.barOuter}>
        <View style={styles.barContainer}>
          {segments.map((seg, i) => {
            const prevMax = i === 0 ? 0 : segments[i - 1].max;
            const width = ((seg.max - prevMax) / totalMax) * 100;
            return (
              <View
                key={seg.label}
                style={[styles.segment, { width: `${width}%`, backgroundColor: seg.color }]}
              />
            );
          })}
        </View>
        <View style={[styles.marker, { left: `${markerPosition}%` }]}>
          <View style={styles.markerDot} />
          <Text style={styles.markerText}>{value}{unit}</Text>
        </View>
      </View>
      <View style={styles.labels}>
        {segments.map((seg, i) => {
          const prevMax = i === 0 ? 0 : segments[i - 1].max;
          const width = ((seg.max - prevMax) / totalMax) * 100;
          return (
            <View key={seg.label} style={{ width: `${width}%` }}>
              <Text style={styles.segLabel}>{seg.label}</Text>
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
  barOuter: {
    position: "relative",
    paddingTop: 2,
    paddingBottom: 22,
  },
  barContainer: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  segment: {
    height: 12,
  },
  marker: {
    position: "absolute",
    top: -6,
    alignItems: "center",
    transform: [{ translateX: -8 }],
  },
  markerDot: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.textDark,
  },
  markerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 4,
  },
  labels: {
    flexDirection: "row",
    marginTop: 8,
  },
  segLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
