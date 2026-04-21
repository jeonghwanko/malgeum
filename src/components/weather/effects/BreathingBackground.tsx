import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface BreathingBackgroundProps {
  scrollY?: SharedValue<number>;
  tint?: string;
}

/* ── Light Caustics blob 설정 ── */
interface BlobConfig {
  top: number;
  left: number;
  size: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

const BLOB_CONFIGS: BlobConfig[] = [
  { top: SCREEN_H * 0.05, left: -40, size: 200, driftX: 60, driftY: 30, duration: 10000, delay: 0 },
  { top: SCREEN_H * 0.35, left: SCREEN_W * 0.6, size: 180, driftX: 50, driftY: 25, duration: 13000, delay: 1500 },
  { top: SCREEN_H * 0.65, left: SCREEN_W * 0.1, size: 160, driftX: 55, driftY: 35, duration: 15000, delay: 3000 },
];

/* ── Caustic Blob 개별 컴포넌트 ── */
function CausticBlob({
  config,
  tint,
  scrollY,
}: {
  config: BlobConfig;
  tint: string;
  scrollY?: SharedValue<number>;
}) {
  const phase = useSharedValue(0);

  React.useEffect(() => {
    phase.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, { duration: config.duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => {
    const scrollOffset = scrollY
      ? interpolate(scrollY.value, [0, 400], [0, -60], "clamp")
      : 0;
    return {
      opacity: interpolate(phase.value, [0, 0.5, 1], [0.06, 0.25, 0.06]),
      transform: [
        { translateX: interpolate(phase.value, [0, 1], [-config.driftX, config.driftX]) },
        { translateY: interpolate(phase.value, [0, 1], [-config.driftY, config.driftY]) + scrollOffset },
        { scale: interpolate(phase.value, [0, 0.5, 1], [0.9, 1.2, 0.9]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: config.top,
          left: config.left,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: tint,
        },
        blobStyle,
      ]}
    />
  );
}

/* ── 메인 컴포넌트 ── */
export function BreathingBackground({
  scrollY,
  tint = "rgba(255,224,102,0.25)",
}: BreathingBackgroundProps) {
  /* 1. Color Shift — tint overlay opacity 변화 */
  const colorPhase = useSharedValue(0);
  React.useEffect(() => {
    colorPhase.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const colorShiftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(colorPhase.value, [0, 1], [0.03, 0.15]),
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Color Shift overlay */}
      <Animated.View style={[styles.colorShift, { backgroundColor: tint }, colorShiftStyle]} />

      {/* Light Caustics — 3 blobs */}
      {BLOB_CONFIGS.map((config, i) => (
        <CausticBlob key={i} config={config} tint={tint} scrollY={scrollY} />
      ))}
    </View>
  );
}

/* ── Breathing scale (ImageBackground 래퍼용 hook) ── */
export function useBreathingScale(scrollY?: SharedValue<number>) {
  const breathPhase = useSharedValue(0);

  React.useEffect(() => {
    breathPhase.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // reverse: 1→0으로 부드럽게 되돌아감
    );
  }, []);

  const breathingStyle = useAnimatedStyle(() => {
    const scrollDampen = scrollY
      ? interpolate(scrollY.value, [0, 300], [1, 0.3], "clamp")
      : 1;
    const baseScale = interpolate(breathPhase.value, [0, 1], [1, 1.08]);
    const scale = 1 + (baseScale - 1) * scrollDampen;
    return {
      transform: [{ scale }],
    };
  });

  return breathingStyle;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: "hidden",
  },
  colorShift: {
    ...StyleSheet.absoluteFillObject,
  },
});
