import type { WeatherBundle } from "@/types/weather";

export const MOCK_BUNDLE: WeatherBundle = {
  current: {
    temp: 24, feelsLike: 22, humidity: 45, windSpeed: 2.1,
    condition: "clear", description: "맑음", icon: "01d", uvIndex: 5,
    precipitation: 0,
    sunrise: Math.floor(Date.now() / 1000) - 3600 * 4,
    sunset: Math.floor(Date.now() / 1000) + 3600 * 6,
  },
  hourly: Array.from({ length: 8 }, (_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 3600,
    temp: 24 + Math.round(Math.sin(i * 0.5) * 2),
    feelsLike: 22 + Math.round(Math.sin(i * 0.5) * 2),
    condition: i < 6 ? "clear" as const : "clouds" as const,
    precipitation: 0, icon: "01d",
  })),
  daily: Array.from({ length: 7 }, (_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 86400,
    tempMin: 16 + i, tempMax: 26 + i,
    condition: i === 2 || i === 3 ? "rain" as const : "clear" as const,
    precipitation: i === 2 ? 80 : i === 3 ? 40 : 0,
  })),
  airQuality: { pm25: 12, pm10: 25, aqi: 1, grade: "good" },
  hourlyAir: Array.from({ length: 8 }, (_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 3 * 3600,
    pm25: 12 + Math.round(Math.sin(i * 0.7) * 8),
    pm10: 25 + Math.round(Math.sin(i * 0.7) * 12),
  })),
  hourlyUv: Array.from({ length: 12 }, (_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 3600,
    uvIndex: i < 3 ? 0 : i < 5 ? 3 : i < 8 ? 6 : i < 10 ? 4 : 1,
  })),
  pollen: { score: 3, label: "보통", description: "알레르기 주의", grade: "moderate" },
  fetchedAt: Date.now(),
};
