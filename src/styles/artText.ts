import { StyleSheet, type TextStyle } from "react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";

/** 팔레트 기반 텍스트 그림자 — 카드/배경 위 가독성용 */
export function getTextShadow(palette: AdaptivePalette, radius = 6): TextStyle {
  return {
    textShadowColor: palette.textShadowColor,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: radius,
  };
}

/**
 * 아트 배경 위 텍스트 가독성 프리셋.
 * 핵심 숫자만 완전 흰색, 나머지는 80~85% 흰색.
 */
export const artText = StyleSheet.create({
  // 핵심 숫자 (온도, 값)
  primary: {
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  // 중요 텍스트 (조건, 카드 제목)
  secondary: {
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // 보조 텍스트 (설명, 캡션)
  tertiary: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
