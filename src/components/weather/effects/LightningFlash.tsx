import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";

export function LightningFlash() {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // 5~8초 간격으로 이중 번쩍
    opacity.value = withRepeat(
      withDelay(
        4000 + Math.random() * 4000,
        withSequence(
          withTiming(0.25, { duration: 60, easing: Easing.out(Easing.quad) }),
          withTiming(0.05, { duration: 100 }),
          withTiming(0.18, { duration: 50 }),
          withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }),
        ),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.flash, style]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
});
