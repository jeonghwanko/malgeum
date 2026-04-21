import type { WeatherCondition } from "./weather";

export interface DiaryEntry {
  date: string;           // "2026-04-11" (todayKey)
  condition: WeatherCondition;
  temp: number;           // 오늘 최고기온
  memo: string;           // 사용자 한 줄 메모 (최대 60자)
  createdAt: string;      // ISO timestamp
  anniversaryId?: string; // expo-notifications identifier
}
