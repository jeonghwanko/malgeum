import React, { useEffect, useCallback } from "react";
import { Text, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hapticLight, hapticSuccess } from "@/hooks/useHaptics";

export type ToastTone = "info" | "success" | "warn" | "error";

interface ToastProps {
  message: string;
  seq: number;
  tone?: ToastTone;
  icon?: string;
  onDismiss: () => void;
}

const DURATION_MS = 2500;

const TONE_STYLES: Record<ToastTone, { bg: string; border: string; defaultIcon: string }> = {
  info:    { bg: "#0F1423", border: "rgba(96,165,250,0.35)", defaultIcon: "✨" },
  success: { bg: "#0B3B2E", border: "rgba(34,197,94,0.45)",  defaultIcon: "✓" },
  warn:    { bg: "#4A2F0B", border: "rgba(251,191,36,0.45)", defaultIcon: "⚠️" },
  error:   { bg: "#4A0F17", border: "rgba(248,113,113,0.45)",defaultIcon: "✕" },
};

export function Toast({ message, seq, tone = "info", icon, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const toneStyle = TONE_STYLES[tone];
  const displayIcon = icon ?? toneStyle.defaultIcon;

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-80, { duration: 250, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  useEffect(() => {
    // 진입: slide-down + fade + subtle scale bounce
    translateY.value = -80;
    opacity.value = 0;
    scale.value = 0.96;
    translateY.value = withSpring(0, { damping: 18, stiffness: 260, mass: 0.8 });
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSequence(
      withSpring(1.02, { damping: 12, stiffness: 220, mass: 0.6 }),
      withSpring(1, { damping: 20, stiffness: 260, mass: 0.6 }),
    );

    // haptic — success tone엔 더 강한 피드백
    if (tone === "success") hapticSuccess();
    else hapticLight();

    const timer = setTimeout(() => dismiss(), DURATION_MS);
    return () => clearTimeout(timer);
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        <Text style={styles.icon}>{displayIcon}</Text>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
});
