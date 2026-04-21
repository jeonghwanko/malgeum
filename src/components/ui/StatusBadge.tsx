import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { type StatusLevel, getStatusColor } from "@/constants/colors";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

interface StatusBadgeProps {
  text: string;
  status: StatusLevel;
  size?: "sm" | "md";
  palette?: AdaptivePalette;
  mood?: any;
}

export function StatusBadge({ text, status, size = "sm", palette }: StatusBadgeProps) {
  const dotColor = getStatusColor(status);
  const textColor = palette?.textPrimary ?? "#FFFFFF";
  const isWarn = status === "warn";
  const isMd = size === "md";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          isWarn && {
            shadowColor: dotColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      />
      <Text style={[styles.text, isMd && styles.textMd, { color: textColor }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 14,
  },
});
