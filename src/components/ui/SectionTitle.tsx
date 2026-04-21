import React from "react";
import { Text, StyleSheet } from "react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

interface SectionTitleProps {
  children: string;
  variant?: "light" | "dark";
  color?: string;
  palette?: AdaptivePalette;
}

export function SectionTitle({ children, variant = "light", color, palette }: SectionTitleProps) {
  const nb = palette?.notebook;
  const isNotebook = nb && nb.fontFamily !== "system";

  const resolvedColor = color ?? palette?.sectionTitle ?? "#FFFFFF";
  const shadowColor = palette?.textShadowColor ?? "rgba(0,0,0,0.35)";
  const shadowR = (palette?.textShadowIntensity ?? 1) * 5;

  return (
    <Text style={[
      styles.text,
      variant === "dark" && styles.dark,
      resolvedColor != null && { color: resolvedColor },
      variant !== "dark" && {
        textShadowColor: shadowColor,
        textShadowRadius: shadowR,
      },
      isNotebook && nb && {
        fontFamily: nb.fontFamily,
        fontWeight: "normal" as const,
      },
    ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dark: {
    color: "#94A3B8",
    textShadowColor: "transparent",
  },
});
