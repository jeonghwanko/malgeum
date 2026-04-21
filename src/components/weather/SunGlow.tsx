import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SunGlowProps {
  tint?: string;
  isDark?: boolean;
}

export function SunGlow({ tint, isDark = false }: SunGlowProps = {}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  // 어두운 배경에서 glow 더 강하게
  const minOpacity = isDark ? 0.8 : 0.6;
  const maxOpacity = isDark ? 1.0 : 1.0;
  const maxScale = isDark ? 1.15 : 1.1;

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(minOpacity, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale, opacity, minOpacity, maxOpacity, maxScale]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.glow,
        glowStyle,
        tint ? { backgroundColor: tint, shadowColor: tint } : {},
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: 50,
    right: 10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,224,102,0.15)",
    shadowColor: "#FFE066",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
});
