import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Check, Warning } from "phosphor-react-native";
import { COLORS, type StatusLevel } from "@/constants/colors";
import { usePalette } from "@/context/PaletteContext";

interface ChecklistItemProps {
  label: string;
  sub: string;
  status: StatusLevel;
}

export function ChecklistItem({ label, sub, status }: ChecklistItemProps) {
  const ap = usePalette();
  const isSafe = status === "safe";
  const checkBg = isSafe ? COLORS.safe : COLORS.caution;

  return (
    <View style={styles.item}>
      <View style={[styles.check, { backgroundColor: checkBg }]}>
        {isSafe ? (
          <Check size={14} weight="bold" color="#FFFFFF" />
        ) : (
          <Warning size={14} weight="fill" color="#FFFFFF" />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.80)",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
