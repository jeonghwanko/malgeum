import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_H } = Dimensions.get("window");

interface Raindrop {
  id: number;
  left: number;
  height: number;
  duration: number;
  delay: number;
  opacity: number;
  width: number;
}

function generateDrops(count: number, layer: "near" | "far"): Raindrop[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    height: layer === "near" ? 18 + Math.random() * 8 : 10 + Math.random() * 6,
    duration: layer === "near" ? 600 + Math.random() * 200 : 1000 + Math.random() * 300,
    delay: Math.random() * 1000,
    opacity: layer === "near" ? 0.3 : 0.12,
    width: layer === "near" ? 2 : 1,
  }));
}

function RaindropItem({ drop, tint }: { drop: Raindrop; tint?: string }) {
  const translateY = useSharedValue(-20);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(SCREEN_H + 20, {
        duration: drop.duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [drop.duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.drop,
        animatedStyle,
        {
          left: `${drop.left}%`,
          height: drop.height,
          width: drop.width,
          opacity: drop.opacity,
          ...(tint ? { backgroundColor: tint } : {}),
        },
      ]}
    />
  );
}

interface RainOverlayProps {
  tint?: string;
}

export function RainOverlay({ tint }: RainOverlayProps = {}) {
  const drops = useMemo(
    () => [...generateDrops(5, "near"), ...generateDrops(7, "far")],
    []
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {drops.map((drop) => (
        <RaindropItem key={drop.id} drop={drop} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  drop: {
    position: "absolute",
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.4)", // 기본값, tint로 오버라이드
  },
});
