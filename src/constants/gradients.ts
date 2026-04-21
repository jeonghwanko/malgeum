import type { WeatherCondition } from "@/types/weather";
import type { AllArtStyleKey } from "@/types/settings";
import type { ColorValue } from "react-native";
import { getThemePalette } from "./themePalettes";
import { mapConditionToTexture } from "@/utils/weather";

export interface GradientPreset {
  colors: [ColorValue, ColorValue, ...ColorValue[]];
  locations?: number[];
}

// 맑은 날 (시간대별)
const CLEAR_DAY: GradientPreset = {
  colors: ["rgba(74,144,217,0.25)", "rgba(168,216,234,0.15)", "rgba(248,250,252,0.5)"],
};

const CLEAR_DAWN: GradientPreset = {
  colors: ["rgba(15,23,42,0.35)", "rgba(30,42,59,0.2)", "rgba(30,58,95,0.15)"],
};

const CLEAR_NIGHT: GradientPreset = {
  colors: ["rgba(15,23,42,0.7)", "rgba(30,42,59,0.5)", "rgba(15,23,42,0.6)"],
};

// 비 오는 날
const RAINY: GradientPreset = {
  colors: ["rgba(51,65,85,0.4)", "rgba(71,85,105,0.3)", "rgba(203,213,225,0.35)"],
};

// 흐림
const CLOUDY: GradientPreset = {
  colors: ["rgba(71,85,105,0.3)", "rgba(100,116,139,0.2)", "rgba(203,213,225,0.3)"],
};

// 눈
const SNOWY: GradientPreset = {
  colors: ["rgba(148,163,184,0.3)", "rgba(203,213,225,0.25)", "rgba(241,245,249,0.4)"],
};

// 퇴근 모드 (석양)
export const EVENING_GRADIENT: GradientPreset = {
  colors: ["rgba(20,10,30,0.6)", "rgba(40,20,50,0.5)", "rgba(60,30,50,0.4)"],
};

// 온보딩 완료
export const ONBOARDING_COMPLETE_GRADIENT: GradientPreset = {
  colors: ["#0C1929", "#1A3A5C", "#4A90D9"],
};

// 주간 요약
export const WEEKLY_SUMMARY_GRADIENT: GradientPreset = {
  colors: ["#4A90D9", "#74B9FF"],
};

export function getWeatherGradient(
  condition: WeatherCondition,
  timeOfDay: "dawn" | "morning" | "afternoon" | "evening" | "night",
  artStyle?: AllArtStyleKey,
): GradientPreset {
  // 테마 팔레트가 있으면 테마 전용 그라데이션 반환
  if (artStyle) {
    const textureKey = mapConditionToTexture(condition);
    const palette = getThemePalette(artStyle, textureKey);
    if (palette) {
      return { colors: palette.gradientColors as [ColorValue, ColorValue, ColorValue] };
    }
  }

  // 폴백: 기본 그라데이션
  switch (condition) {
    case "rain":
    case "drizzle":
    case "thunderstorm":
      return RAINY;
    case "snow":
      return SNOWY;
    case "clouds":
      return CLOUDY;
    case "fog":
    case "dust":
      return CLOUDY;
    case "clear":
    default:
      if (timeOfDay === "dawn") return CLEAR_DAWN;
      if (timeOfDay === "night") return CLEAR_NIGHT;
      return CLEAR_DAY;
  }
}
