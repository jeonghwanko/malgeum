import React, { useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useBottomSheetAnim } from "@/hooks/useBottomSheetAnim";
import { t } from "@/i18n";

interface Props {
  visible: boolean;
  onShare: () => void;
  onDismiss: () => void;
}

const SHEET_HEIGHT = 320;

export function EmotionalPromoSheet({ visible, onShare, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const { open, animateClose, panGesture, sheetStyle, backdropStyle } = useBottomSheetAnim(SHEET_HEIGHT, onDismiss);

  useEffect(() => {
    if (visible) open();
  }, [visible, open]);

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => animateClose(onDismiss)} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }, sheetStyle]}
          >
          <View style={styles.handle} />

          <View style={styles.heroRow}>
            <Text style={styles.heroEmoji}>💌</Text>
            <View style={styles.heroTexts}>
              <Text style={styles.title}>{t("emotionalPromo.title")}</Text>
              <Text style={styles.desc}>
                {t("emotionalPromo.desc")}
              </Text>
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewItem}>{t("emotionalPromo.music")}</Text>
            <Text style={styles.previewItem}>{t("emotionalPromo.art")}</Text>
            <Text style={styles.previewItem}>{t("emotionalPromo.message")}</Text>
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.dismissBtn} onPress={() => animateClose(onDismiss)}>
              <Text style={styles.dismissText}>{t("emotionalPromo.later")}</Text>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={() => animateClose(onShare)}>
              <Text style={styles.shareText}>{t("emotionalPromo.createCard")}</Text>
            </Pressable>
          </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderMedium,
    alignSelf: "center",
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  heroEmoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  heroTexts: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  preview: {
    backgroundColor: "#F5F7FA",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  previewItem: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textDark,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
  },
  dismissText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  shareBtn: {
    flex: 1.8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#C13584",
    alignItems: "center",
  },
  shareText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
