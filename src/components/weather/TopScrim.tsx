import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface TopScrimProps {
  startOpacity?: number;
  scrimOpacity?: number;
  scrimTint?: string;               // accent 기반 scrim 색상 (rgb 문자열)
}

/** 상단 어둠 그라데이션 + 전체 dim 오버레이 — accent 기반으로 아트 색감 유지 */
export function TopScrim({ startOpacity = 0.50, scrimOpacity = 0.15, scrimTint }: TopScrimProps) {
  // scrimTint가 있으면 순검정 대신 테마 어둠색 사용
  // scrimTint는 "rgba(r,g,b,1)" 형태 — 여기서 rgb 부분만 추출
  const rgb = scrimTint?.match(/rgba?\((\d+),(\d+),(\d+)/);
  const r = rgb ? rgb[1] : "0";
  const g = rgb ? rgb[2] : "0";
  const b = rgb ? rgb[3] : "0";
  const tintBase = `${r},${g},${b}`;

  return (
    <>
      {/* 전체 dim — accent 기반 어둠색 */}
      <View
        style={[styles.dim, { backgroundColor: `rgba(${tintBase},${scrimOpacity})` }]}
        pointerEvents="none"
      />
      {/* 상단 집중 scrim — 상태바 + 히어로 텍스트 보호 */}
      <LinearGradient
        colors={[
          `rgba(${tintBase},${startOpacity})`,
          `rgba(${tintBase},${startOpacity * 0.3})`,
          "transparent",
        ]}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
});
