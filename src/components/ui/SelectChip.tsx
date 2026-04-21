import React from "react";
import { Text, StyleSheet, Pressable } from "react-native";
import { COLORS } from "@/constants/colors";

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: "primary" | "warn";
}

export function SelectChip({ label, selected, onPress, variant = "primary" }: SelectChipProps) {
  const activeStyle = variant === "warn" ? styles.chipActiveWarn : styles.chipActive;
  const activeTextStyle = variant === "warn" ? styles.chipTextActiveWarn : styles.chipTextActive;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && activeStyle,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && activeTextStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 44,
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  chipActiveWarn: {
    backgroundColor: COLORS.warn,
    borderColor: COLORS.warn,
  },
  chipTextActiveWarn: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  chipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748B",
  },
});
