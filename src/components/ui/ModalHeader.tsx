import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { X } from "phosphor-react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  palette?: AdaptivePalette;
  closeIconColor?: string;
  closeBgColor?: string;
}

export function ModalHeader({ title, subtitle, onClose, palette, closeIconColor: closeIconColorProp, closeBgColor }: ModalHeaderProps) {
  const titleColor = palette?.textPrimary ?? "#F1F5F9";
  const subtitleColor = palette?.textTertiary ?? "rgba(255,255,255,0.3)";
  const closeBg = closeBgColor ?? palette?.pillBg ?? "rgba(255,255,255,0.1)";
  const closeIconColor = closeIconColorProp ?? palette?.textTertiary ?? "rgba(255,255,255,0.6)";

  return (
    <View style={styles.header}>
      <View style={styles.spacer} />
      <View style={styles.center}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>}
      </View>
      <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: closeBg }]} hitSlop={12} accessibilityLabel="닫기" accessibilityRole="button">
        <X size={16} color={closeIconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  spacer: { width: 32 },
  center: { alignItems: "center" },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
