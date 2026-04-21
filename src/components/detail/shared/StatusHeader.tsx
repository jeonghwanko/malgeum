import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, getStatusColor, type StatusLevel } from "@/constants/colors";

interface StatusHeaderProps {
  icon: string;
  value: string;
  label: string;
  status: StatusLevel;
  subtitle?: string;
}

export function StatusHeader({ icon, value, label, status, subtitle }: StatusHeaderProps) {
  const statusColor = getStatusColor(status);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textArea}>
        <View style={styles.row}>
          <Text style={styles.value}>{value}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  icon: {
    fontSize: 40,
  },
  textArea: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
