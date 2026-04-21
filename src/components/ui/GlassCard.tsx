import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

interface GlassCardProps {
  variant?: "light" | "dark" | "strong";
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  palette?: AdaptivePalette;
}

export function GlassCard({
  variant = "light",
  children,
  style,
  onPress,
  palette,
}: GlassCardProps) {
  const bg = palette ? palette.cardBg : VARIANT_BG[variant];
  const border = palette ? palette.cardBorder : VARIANT_BORDER[variant];

  const cardStyle: ViewStyle = {
    backgroundColor: bg,
    borderColor: border,
    borderWidth: 1,
  };

  const content = (
    <View style={[styles.container, cardStyle, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const VARIANT_BG = {
  light: "rgba(0,0,0,0.25)",
  strong: "rgba(0,0,0,0.30)",
  dark: "rgba(255,255,255,0.10)",
};

const VARIANT_BORDER = {
  light: "rgba(255,255,255,0.15)",
  strong: "rgba(255,255,255,0.20)",
  dark: "rgba(255,255,255,0.12)",
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
});
