import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

interface DustHazeProps {
  tint?: string;
}

interface ParticleConfig {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(count: number): ParticleConfig[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * SCREEN_W,
    y: Math.random() * SCREEN_H,
    size: 2 + Math.random() * 3,
    driftX: (Math.random() - 0.5) * 60,
    driftY: (Math.random() - 0.5) * 40,
    duration: 5000 + Math.random() * 5000,
    delay: Math.random() * 3000,
    opacity: 0.15 + Math.random() * 0.2,
  }));
}

function DustParticle({ config, tint }: { config: ParticleConfig; tint: string }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  React.useEffect(() => {
    tx.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
    ty.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity: config.opacity,
          backgroundColor: tint,
        },
        style,
      ]}
    />
  );
}

export function DustHaze({ tint = "rgba(180,150,100,0.4)" }: DustHazeProps) {
  const particles = useMemo(() => generateParticles(10), []);

  // tint에서 haze 오버레이 색상 파생 (opacity만 낮춤)
  const hazeColor = tint.replace(/[\d.]+\)$/, "0.05)");

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 전체 헤이즈 오버레이 — tint 기반 */}
      <View style={[styles.haze, { backgroundColor: hazeColor }]} />
      {particles.map((config, i) => (
        <DustParticle key={i} config={config} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  haze: { ...StyleSheet.absoluteFillObject },
  particle: { position: "absolute" },
});
