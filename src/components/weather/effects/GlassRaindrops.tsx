import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

interface GlassRaindropsProps {
  scrollY?: SharedValue<number>;
  tint?: string;
  intensity?: "low" | "medium" | "high";
}

interface DropConfig {
  x: number;
  delay: number;
  duration: number;
  size: number;
  trailHeight: number;
  wobbleX: number;
}

function generateDrops(count: number): DropConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * (SCREEN_W - 20) + 10,
    delay: Math.random() * 3000,
    duration: 2000 + Math.random() * 2500,
    size: 4 + Math.random() * 4,
    trailHeight: 30 + Math.random() * 50,
    wobbleX: (Math.random() - 0.5) * 16,
  }));
}

function Raindrop({ config, tint }: { config: DropConfig; tint: string }) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 0 }),
          withTiming(SCREEN_H * 0.4, { duration: config.duration * 0.3, easing: Easing.in(Easing.quad) }),
          // 중간에 살짝 멈추는 느낌 (유리에 물방울이 걸렸다 흐르는)
          withTiming(SCREEN_H * 0.45, { duration: config.duration * 0.15, easing: Easing.linear }),
          withTiming(SCREEN_H + 20, { duration: config.duration * 0.55, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(0.6, { duration: 300 }),
          withTiming(0.5, { duration: config.duration * 0.8 }),
          withTiming(0, { duration: config.duration * 0.2 }),
        ),
        -1,
      ),
    );
  }, []);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: config.wobbleX * (translateY.value / SCREEN_H) },
    ],
    opacity: opacity.value,
  }));

  const trailStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.3,
    height: config.trailHeight * Math.min(1, Math.max(0, translateY.value / (SCREEN_H * 0.3))),
  }));

  return (
    <Animated.View style={[styles.dropContainer, { left: config.x }, dropStyle]}>
      {/* 물방울 본체 */}
      <View style={[styles.drop, { width: config.size, height: config.size * 1.4, borderRadius: config.size, backgroundColor: tint }]} />
      {/* 흔적 */}
      <Animated.View style={[styles.trail, { width: config.size * 0.4, backgroundColor: tint }, trailStyle]} />
    </Animated.View>
  );
}

export function GlassRaindrops({ scrollY, tint = "rgba(180,210,240,0.35)", intensity = "medium" }: GlassRaindropsProps) {
  const count = intensity === "low" ? 5 : intensity === "high" ? 12 : 8;
  const drops = useMemo(() => generateDrops(count), [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {drops.map((config, i) => (
        <Raindrop key={i} config={config} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  dropContainer: { position: "absolute", alignItems: "center" },
  drop: {},
  trail: { borderRadius: 1, marginTop: -2 },
});
