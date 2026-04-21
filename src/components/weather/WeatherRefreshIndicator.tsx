/**
 * 날씨 테마 커스텀 Pull-to-Refresh 인디케이터.
 *
 * 기본 RefreshControl 스피너를 대체하는 시각+촉각 피드백:
 *   pull → threshold snap(햅틱) → loading pulse → completion burst(파티클+햅틱)
 *
 * iOS: scrollY 음수(overscroll) 기반 pull 애니메이션 + 로딩 + 완료
 * Android: RefreshControl 내부 처리, 로딩 + 완료 애니메이션
 */

import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  cancelAnimation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { getConditionEmoji } from "@/constants/weather-assets";
import { hapticLight, hapticSuccess } from "@/hooks/useHaptics";
import type { WeatherCondition } from "@/types/weather";

const PULL_THRESHOLD = 80;
const PARTICLE_COUNT = 8;
const PARTICLE_RADIUS = 50;
const BURST_INDICES = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);

interface Props {
  scrollY: SharedValue<number>;
  refreshing: boolean;
  condition: WeatherCondition;
  topInset: number;
}

export function WeatherRefreshIndicator({ scrollY, refreshing, condition, topInset }: Props) {
  const refreshingSV = useSharedValue(refreshing);
  const hapticFired = useSharedValue(false);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  const burst = useSharedValue(0);
  const wasRefreshing = useRef(false);

  // refreshing prop → shared value 동기화 (worklet에서 안전하게 읽기 위해)
  useEffect(() => { refreshingSV.value = refreshing; }, [refreshing, refreshingSV]);

  // pull 거리: scrollY 음수(iOS overscroll)를 양수로 변환
  const pull = useDerivedValue(() => (scrollY.value < 0 ? -scrollY.value : 0));

  // 로딩 애니메이션
  useEffect(() => {
    if (refreshing) {
      spin.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
      );
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.92, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    } else {
      cancelAnimation(spin);
      cancelAnimation(pulse);
      spin.value = withTiming(0, { duration: 200 });
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [refreshing, spin, pulse]);

  // 완료 버스트
  useEffect(() => {
    if (wasRefreshing.current && !refreshing) {
      burst.value = 0;
      burst.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      hapticSuccess();
    }
    wasRefreshing.current = refreshing;
  }, [refreshing, burst]);

  // 인디케이터 (이모지 + 유리) 스타일
  const indicatorStyle = useAnimatedStyle(() => {
    const p = pull.value;
    const progress = interpolate(p, [0, PULL_THRESHOLD], [0, 1], Extrapolation.CLAMP);

    // hapticFired 가드: worklet이 매 프레임 평가되므로 1회만 발화
    if (progress >= 1 && !hapticFired.value) {
      hapticFired.value = true;
      runOnJS(hapticLight)();
    } else if (progress < 0.4) {
      hapticFired.value = false;
    }

    const isRefreshing = refreshingSV.value;
    const scale = isRefreshing
      ? pulse.value
      : interpolate(progress, [0, 0.7, 1], [0.15, 0.85, 1], Extrapolation.CLAMP);

    return {
      opacity: isRefreshing ? 1 : interpolate(p, [8, 30], [0, 1], Extrapolation.CLAMP),
      transform: [
        { scale },
        { rotate: `${spin.value * 360}deg` },
      ],
    };
  });

  // 유리 배경
  const glassStyle = useAnimatedStyle(() => {
    const progress = interpolate(pull.value, [0, PULL_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    const ready = progress >= 1 || refreshingSV.value;

    return {
      opacity: ready ? 0.3 : interpolate(progress, [0, 1], [0.06, 0.2], Extrapolation.CLAMP),
      transform: [
        { scale: refreshingSV.value ? 1.25 : interpolate(progress, [0, 1], [0.7, 1.25], Extrapolation.CLAMP) },
      ],
    };
  });

  const emoji = getConditionEmoji(condition);

  return (
    <View style={[styles.anchor, { top: topInset + 24 }]} pointerEvents="none">
      <Animated.View style={[styles.orb, indicatorStyle]}>
        <Animated.View style={[styles.glass, glassStyle]} />
        <Animated.Text style={styles.emoji}>{emoji}</Animated.Text>
      </Animated.View>

      {BURST_INDICES.map((i) => (
        <BurstDot key={i} index={i} burst={burst} />
      ))}
    </View>
  );
}

function BurstDot({ index, burst }: { index: number; burst: SharedValue<number> }) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const dx = Math.cos(angle) * PARTICLE_RADIUS;
  const dy = Math.sin(angle) * PARTICLE_RADIUS;

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.15, 0.6, 1], [0, 1, 0.5, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(burst.value, [0, 1], [0, dx], Extrapolation.CLAMP) },
      { translateY: interpolate(burst.value, [0, 1], [0, dy], Extrapolation.CLAMP) },
      { scale: interpolate(burst.value, [0, 0.15, 1], [0, 1.3, 0.2], Extrapolation.CLAMP) },
    ],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  orb: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  emoji: {
    fontSize: 28,
  },
  dot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
