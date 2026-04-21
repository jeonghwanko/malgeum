import React from "react";
import { Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePalette } from "@/context/PaletteContext";

interface WeeklySummaryProps {
  text: string;
}

export function WeeklySummary({ text }: WeeklySummaryProps) {
  const ap = usePalette();
  const gradientStart = ap?.accent ?? "rgba(74,144,217,1)";
  const gradientEnd = "rgba(116,185,255,1)";
  const nb = ap?.notebook;
  const fontFamily = nb && nb.fontFamily !== "system" ? nb.fontFamily : undefined;

  return (
    <LinearGradient
      colors={[gradientStart, gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={[styles.title, { fontFamily, fontWeight: "normal" }]}>이번 주 요약</Text>
      <Text style={styles.text}>{text}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 8,
  },
  text: {
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 30,
  },
});
