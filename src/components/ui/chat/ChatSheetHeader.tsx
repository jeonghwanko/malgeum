import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { X } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";

interface ChatSheetHeaderProps {
  onClose: () => void;
}

export function ChatSheetHeader({ onClose }: ChatSheetHeaderProps) {
  return (
    <View style={styles.dragZone}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("chatUI.botName")}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10} accessibilityLabel={t("chatUI.closeA11y")} accessibilityRole="button">
          <X size={16} color={COLORS.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragZone: {
    paddingTop: 4,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.textLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
