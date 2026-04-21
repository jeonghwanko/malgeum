import type { CurrentWeather, WeatherCondition, WeatherBundle } from "@/types/weather";

// ──────────────────────────── 날씨 이모지 맵 (SSOT) ────────────────────────────

export const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: "☀️",
  clouds: "⛅",
  rain: "🌧️",
  drizzle: "🌦️",
  thunderstorm: "⛈️",
  snow: "❄️",
  fog: "🌫️",
  dust: "😷",
};

export function getConditionEmoji(condition: WeatherCondition): string {
  return CONDITION_EMOJI[condition] ?? "🌤️";
}

// ──────────────────────────── 공유/위젯 배경 이미지 맵 (SSOT) ────────────────────────────

export const TEXTURE_BACKGROUNDS: Record<string, any> = {
  sunny: require("../../assets/malgeum/A/A01-sunny-day.jpg"),
  rainy: require("../../assets/malgeum/A/A06-rainy.jpg"),
  cloudy: require("../../assets/malgeum/A/A05-cloudy.jpg"),
  snowy: require("../../assets/malgeum/A/A08-snowy.jpg"),
  stormy: require("../../assets/malgeum/A/A07-thunderstorm.jpg"),
  dusty: require("../../assets/malgeum/A/A10-fine-dust.jpg"),
};

// ──────────────────────────── Fallback 날씨 데이터 (SSOT) ────────────────────────────

export const FALLBACK_CURRENT: CurrentWeather = {
  temp: 24,
  feelsLike: 22,
  humidity: 45,
  windSpeed: 2,
  condition: "clear",
  description: "맑음",
  icon: "01d",
  uvIndex: 5,
  precipitation: 0,
  sunrise: 0,
  sunset: 0,
};

export function buildFallbackBundle(
  current: CurrentWeather | null,
  hourly: any[],
  daily: any[],
  airQuality: any | null,
): WeatherBundle {
  return {
    current: current ?? FALLBACK_CURRENT,
    hourly,
    daily,
    airQuality,
    hourlyAir: [],
    hourlyUv: [],
    pollen: null,
    fetchedAt: Date.now(),
  };
}
