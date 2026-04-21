import React, { useCallback } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const SCREEN_H = Dimensions.get("window").height;

interface SectionRevealProps {
  scrollY: SharedValue<number>;
  children: React.ReactNode;
  glowColor?: string;
}

export function SectionReveal({ scrollY, children, glowColor = "rgba(255,255,255,0.15)" }: SectionRevealProps) {
  const sectionY = useSharedValue(0);
  const measured = useSharedValue(false);

  const onLayout = useCallback((e: any) => {
    sectionY.value = e.nativeEvent.layout.y;
    measured.value = true;
  }, []);

  // 섹션 상단이 화면 하단(scrollY + SCREEN_H)을 넘었는지 계산
  const revealProgress = useDerivedValue(() => {
    if (!measured.value) return 1; // 측정 전 보이게
    // visibleBottom = 현재 스크롤 + 화면 높이
    // diff = 섹션Y - visibleBottom → 음수면 화면 안에 들어옴
    const distFromBottom = sectionY.value - (scrollY.value + SCREEN_H);
    // -200(완전 진입) ~ 0(막 보이기 시작) 구간에서 0→1
    return interpolate(distFromBottom, [0, -200], [0, 1], "clamp");
  });

  const glowOpacity = useDerivedValue(() => {
    if (!measured.value) return 0;
    const distFromBottom = sectionY.value - (scrollY.value + SCREEN_H);
    // 진입 순간(-50 ~ -150)에서 번쩍
    return interpolate(distFromBottom, [-50, -100, -180], [0, 0.5, 0], "clamp");
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [
      { translateY: interpolate(revealProgress.value, [0, 1], [32, 0], "clamp") },
      { scale: interpolate(revealProgress.value, [0, 1], [0.97, 1], "clamp") },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View onLayout={onLayout} style={containerStyle}>
      <Animated.View
        style={[styles.glow, { backgroundColor: glowColor }, glowStyle]}
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    borderRadius: 1,
  },
});
