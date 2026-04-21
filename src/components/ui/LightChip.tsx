import React from "react";
import { Text, StyleSheet, Pressable } from "react-native";
import { COLORS } from "@/constants/colors";

interface LightChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: "primary" | "warn";
}

export function LightChip({ label, selected, onPress, variant = "primary" }: LightChipProps) {
  const isPrimary = variant === "primary";
  const activeBg = isPrimary ? "#EFF6FF" : "#FEF2F2";
  const activeBorder = isPrimary ? COLORS.primary : "#EF4444";
  const activeText = isPrimary ? COLORS.primary : "#EF4444";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: activeBg, borderColor: activeBorder },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected && { color: activeText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 44,
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
});
