import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

interface SnowParticlesProps {
  tint?: string;
  intensity?: "low" | "medium" | "high";
  isDark?: boolean;
}

interface FlakeConfig {
  x: number;
  size: number;
  fallDuration: number;
  swayAmount: number;
  swayDuration: number;
  delay: number;
  opacity: number;
}

function generateFlakes(count: number, isDark: boolean): FlakeConfig[] {
  // 어두운 배경에서 눈이 더 잘 보이도록 opacity 범위 상향
  const baseOpacity = isDark ? 0.5 : 0.3;
  const opacityRange = isDark ? 0.4 : 0.4;

  return Array.from({ length: count }, () => ({
    x: Math.random() * SCREEN_W,
    size: 3 + Math.random() * 5,
    fallDuration: 4000 + Math.random() * 4000,
    swayAmount: 20 + Math.random() * 30,
    swayDuration: 2000 + Math.random() * 2000,
    delay: Math.random() * 4000,
    opacity: baseOpacity + Math.random() * opacityRange,
  }));
}

function Snowflake({ config, tint }: { config: FlakeConfig; tint: string }) {
  const ty = useSharedValue(-20);
  const tx = useSharedValue(0);

  React.useEffect(() => {
    ty.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 0 }),
          withTiming(SCREEN_H + 20, { duration: config.fallDuration, easing: Easing.linear }),
        ),
        -1,
      ),
    );
    tx.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.swayAmount, { duration: config.swayDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(-config.swayAmount, { duration: config.swayDuration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: tx.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.flake,
        {
          left: config.x,
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

export function SnowParticles({ tint = "rgba(255,255,255,0.7)", intensity = "medium", isDark = false }: SnowParticlesProps) {
  const count = intensity === "low" ? 8 : intensity === "high" ? 20 : 14;
  const flakes = useMemo(() => generateFlakes(count, isDark), [count, isDark]);

  return (
    <View style={styles.container} pointerEvents="none">
      {flakes.map((config, i) => (
        <Snowflake key={i} config={config} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  flake: { position: "absolute" },
});
