import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Wind, Sun, Flower, Drop } from "phosphor-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { type StatusLevel, getStatusColor } from "@/constants/colors";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

type HealthIconKey = "dust" | "uv" | "pollen" | "humidity";

const ICON_MAP: Record<HealthIconKey, typeof Wind> = {
  dust: Wind, uv: Sun, pollen: Flower, humidity: Drop,
};

interface HealthCardProps {
  icon: HealthIconKey;
  label: string;
  value: string;
  status: StatusLevel;
  description: string;
  palette?: AdaptivePalette;
}

export function HealthCard({ icon, label, value, status, description, palette: ap }: HealthCardProps) {
  const statusColor = getStatusColor(status);
  const Icon = ICON_MAP[icon];
  const nb = ap?.notebook;
  const isNotebook = nb && nb.fontFamily !== "system";

  if (isNotebook && nb) {
    const shadow = {
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 1 } as const,
      textShadowRadius: 4,
    };
    return (
      <GlassCard style={styles.glassCard} palette={ap}>
        <View style={styles.noteInner}>
          <View style={styles.noteHeader}>
            <Icon size={15} weight="duotone" color="#FFFFFF" />
            <Text style={[styles.noteLabel, {
              color: "#FFFFFF",
              fontFamily: nb.fontFamily,
              fontWeight: "normal",
              ...shadow,
            }]}>{label}</Text>
          </View>
          <View style={styles.noteValueRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.noteValue, {
              color: "#FFFFFF",
              ...shadow,
            }]}>{value}</Text>
          </View>
          <Text style={[styles.noteDesc, {
            color: "rgba(255,255,255,0.75)",
            ...shadow,
          }]}>{description}</Text>
        </View>
      </GlassCard>
    );
  }

  // ── 기본 글라스 스타일 ──
  const shadowColor = ap?.textShadowColor ?? "rgba(0,0,0,0.5)";
  const shadowR = (ap?.textShadowIntensity ?? 1) * 3;

  return (
    <GlassCard style={styles.glassCard} palette={ap}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Icon size={14} weight="duotone" color={ap?.textTertiary ?? "rgba(255,255,255,0.7)"} />
          <Text style={[styles.label, {
            color: ap?.textTertiary ?? "rgba(255,255,255,0.7)",
            textShadowColor: shadowColor, textShadowRadius: shadowR,
          }]}>{label}</Text>
        </View>

        <View style={styles.valueRow}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.value, {
            color: ap?.textPrimary ?? "#FFFFFF",
            textShadowColor: shadowColor,
            textShadowRadius: shadowR,
          }]}>{value}</Text>
        </View>

        <Text style={[styles.desc, {
          color: ap?.textSecondary ?? "rgba(255,255,255,0.8)",
          textShadowColor: shadowColor, textShadowRadius: shadowR * 0.7,
        }]}>{description}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  glassCard: { flex: 1, overflow: "hidden" },
  inner: { padding: 12 },
  noteInner: { padding: 14, alignItems: "center" },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  header: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  label: {
    fontSize: 15, fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
  },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  // 글라스 value
  value: {
    fontSize: 20, fontWeight: "800",
    textShadowOffset: { width: 0, height: 1 },
  },
  // 글라스 desc — 숫자 정보 전달력 강화
  desc: {
    fontSize: 15, fontWeight: "600",
    textShadowOffset: { width: 0, height: 1 },
  },
  noteLabel: {
    fontSize: 20, marginBottom: 6,
  },
  noteValueRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4,
  },
  noteValue: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 4,
  },
  noteDesc: {
    fontSize: 12,
  },
});
