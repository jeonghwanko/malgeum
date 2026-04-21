import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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

const SCREEN_W = Dimensions.get("window").width;

interface FogLayersProps {
  scrollY?: SharedValue<number>;
  tint?: string;
}

function FogBand({ top, baseOpacity, scrollY, color }: { top: number; baseOpacity: number; scrollY?: SharedValue<number>; color: string }) {
  const tx = useSharedValue(0);

  React.useEffect(() => {
    tx.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    // 스크롤하면 안개가 갈라지며 사라짐
    const scrollFade = scrollY
      ? interpolate(scrollY.value, [0, 300], [1, 0.05], "clamp")
      : 1;
    const scrollSpread = scrollY
      ? interpolate(scrollY.value, [0, 300], [1, 1.5], "clamp")
      : 1;

    return {
      opacity: baseOpacity * scrollFade,
      transform: [
        { translateX: tx.value },
        { scaleX: scrollSpread },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.band,
        { top, width: SCREEN_W * 1.4, left: -SCREEN_W * 0.2, backgroundColor: color },
        style,
      ]}
    />
  );
}

export function FogLayers({ scrollY, tint }: FogLayersProps) {
  const fogColor = tint ?? "rgba(200,210,220,0.35)";

  return (
    <View style={styles.container} pointerEvents="none">
      <FogBand top={100} baseOpacity={0.35} scrollY={scrollY} color={fogColor} />
      <FogBand top={350} baseOpacity={0.25} scrollY={scrollY} color={fogColor} />
      <FogBand top={600} baseOpacity={0.18} scrollY={scrollY} color={fogColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  band: {
    position: "absolute",
    height: 80,
    borderRadius: 40,
  },
});
