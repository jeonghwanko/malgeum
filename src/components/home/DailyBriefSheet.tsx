import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Modal, TouchableWithoutFeedback, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { buildBriefLines, type WeatherContext } from "@/services/microcopy";
import { usePalette } from "@/context/PaletteContext";
import { t } from "@/i18n";
import type { WeatherBundle } from "@/types/weather";
import type { ActionCard } from "@/types/actions";
import type { SchoolLunchMenu } from "@/services/kskillProxy";
import type { MalgeumGreeting } from "@/services/malgeumGreeting";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  bundle: WeatherBundle;
  actionCard: ActionCard | undefined;
  tempHigh: number;
  yesterdayDiff: number | null;
  schoolLunch?: SchoolLunchMenu[];
  greeting?: MalgeumGreeting | null;
  onDismiss: () => void;
  onAskMore: () => void;
}

export function DailyBriefSheet({ visible, bundle, actionCard, tempHigh, yesterdayDiff, schoolLunch, greeting, onDismiss, onAskMore }: Props) {
  const insets = useSafeAreaInsets();
  const ap = usePalette();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible, translateY]);

  const animateClose = useCallback((thenAskMore = false) => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, (finished) => {
      if (finished) runOnJS(thenAskMore ? onAskMore : onDismiss)();
    });
  }, [translateY, onDismiss, onAskMore]);

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY > 100 || e.velocityY > 500) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
            if (finished) runOnJS(onDismiss)();
          });
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      }),
  [translateY, onDismiss]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SCREEN_HEIGHT * 0.5], [1, 0], "clamp"),
  }));

  if (!visible) return null;

  const ctx: WeatherContext = {
    current: bundle.current,
    hourly: bundle.hourly,
    airQuality: bundle.airQuality,
    yesterdayDiff,
    locationName: "",
    nickname: "",
  };
  const baseBriefLines = buildBriefLines(ctx, tempHigh, actionCard);

  const lunch = schoolLunch?.find((m) => m.mealType === "중식") ?? schoolLunch?.[0];
  const briefLines = lunch
    ? [...baseBriefLines, { emoji: "🍽️", label: t("briefSheet.schoolLunch", { menu: lunch.dishes.slice(0, 3).join(", ") }) }]
    : baseBriefLines;

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => animateClose()}>
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={() => animateClose()}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.dragZone}>
              <View style={styles.handle} />
            </View>

            <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t("briefSheet.title")}</Text>
              <Pressable
                onPress={() => animateClose()}
                style={styles.closeBtn}
                hitSlop={10}
                accessibilityLabel={t("briefSheet.closeA11y")}
                accessibilityRole="button"
              >
                <X size={16} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {greeting ? (
              <View style={styles.greetingBubble}>
                <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
                <Text style={styles.greetingText}>{greeting.message}</Text>
              </View>
            ) : null}

            <View style={styles.rows}>
              {briefLines.map((line, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowEmoji}>{line.emoji}</Text>
                  <View style={styles.rowTexts}>
                    <Text style={styles.rowLabel} maxFontSizeMultiplier={1.0}>{line.label}</Text>
                    {line.sub ? (
                      <Text style={styles.rowSub} maxFontSizeMultiplier={1.0} numberOfLines={1}>{line.sub}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttons}>
              <Pressable style={styles.dismissBtn} onPress={() => animateClose()} accessibilityRole="button">
                <Text style={styles.dismissText}>{t("brief.gotIt")}</Text>
              </Pressable>
              <Pressable
                style={[styles.askBtn, ap && { backgroundColor: ap.accent }]}
                onPress={() => animateClose(true)}
                accessibilityRole="button"
              >
                <Text style={styles.askText}>{t("brief.askMore")}</Text>
              </Pressable>
            </View>
          </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragZone: {
    paddingVertical: 16,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderMedium,
  },
  content: {
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.textLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBubble: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greetingEmoji: {
    fontSize: 24,
  },
  greetingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textDark,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  rows: {
    gap: 16,
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowEmoji: {
    fontSize: 26,
    width: 34,
    textAlign: "center",
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
  askBtn: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#38BDF8",
    alignItems: "center",
  },
  askText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
