import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { hapticLight } from "@/hooks/useHaptics";

interface SettingRowProps {
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}

export function SettingRow({ label, value, onPress, last }: SettingRowProps) {
  return (
    <Pressable onPress={() => { if (onPress) { hapticLight(); onPress(); } }} style={({ pressed }) => [pressed && onPress ? { opacity: 0.7 } : undefined]} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.row, !last && styles.border]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
});
