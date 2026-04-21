import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const SCREEN_W = Dimensions.get("window").width;

interface DriftingShadowProps {
  scrollY?: SharedValue<number>;
  tint?: string;
}

function ShadowBlob({ delay, duration, top, size }: { delay: number; duration: number; top: number; size: number }) {
  const tx = useSharedValue(-size);

  React.useEffect(() => {
    tx.value = withRepeat(
      withTiming(SCREEN_W + size, { duration, easing: Easing.linear }),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        { top, width: size, height: size * 0.4, borderRadius: size * 0.2 },
        style,
      ]}
    />
  );
}

export function DriftingShadow({ scrollY, tint }: DriftingShadowProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <ShadowBlob delay={0} duration={18000} top={120} size={SCREEN_W * 1.2} />
      <ShadowBlob delay={6000} duration={22000} top={450} size={SCREEN_W * 0.9} />
      <ShadowBlob delay={12000} duration={25000} top={700} size={SCREEN_W * 1.0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
});
