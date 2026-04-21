import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

interface SunLensFlareProps {
  scrollY?: SharedValue<number>;
  tint?: string;
}

export function SunLensFlare({ scrollY, tint = "rgba(255,224,102,0.25)" }: SunLensFlareProps) {
  const phase = useSharedValue(0);

  React.useEffect(() => {
    phase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  // 큰 수평 광선
  const flareH = useAnimatedStyle(() => {
    const scrollOffset = scrollY ? interpolate(scrollY.value, [0, 400], [0, -80], "clamp") : 0;
    return {
      opacity: interpolate(phase.value, [0, 1], [0.2, 0.5]),
      transform: [
        { translateY: 80 + scrollOffset },
        { scaleX: interpolate(phase.value, [0, 1], [0.9, 1.2]) },
      ],
    };
  });

  // 사선 광선
  const flareD = useAnimatedStyle(() => {
    const scrollOffset = scrollY ? interpolate(scrollY.value, [0, 400], [0, -50], "clamp") : 0;
    return {
      opacity: interpolate(phase.value, [0, 1], [0.12, 0.35]),
      transform: [
        { translateY: 120 + scrollOffset },
        { rotate: "35deg" },
        { scaleX: interpolate(phase.value, [0, 1], [0.85, 1.15]) },
      ],
    };
  });

  // 글로우 원형
  const glowStyle = useAnimatedStyle(() => {
    const scrollOffset = scrollY ? interpolate(scrollY.value, [0, 300], [0, -40], "clamp") : 0;
    return {
      opacity: interpolate(phase.value, [0, 1], [0.15, 0.3]),
      transform: [
        { translateY: scrollOffset },
        { scale: interpolate(phase.value, [0, 1], [1, 1.15]) },
      ],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 글로우 원 */}
      <Animated.View style={[styles.glow, { backgroundColor: tint }, glowStyle]} />
      {/* 수평 광선 */}
      <Animated.View style={[styles.flareH, { backgroundColor: tint }, flareH]} />
      {/* 사선 광선 */}
      <Animated.View style={[styles.flareD, { backgroundColor: tint }, flareD]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  glow: {
    position: "absolute",
    top: 10,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  flareH: {
    position: "absolute",
    right: -60,
    width: 340,
    height: 14,
    borderRadius: 7,
  },
  flareD: {
    position: "absolute",
    right: -40,
    width: 260,
    height: 8,
    borderRadius: 4,
  },
});
