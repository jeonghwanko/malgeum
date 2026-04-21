import React from "react";
import { useLocalSearchParams } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { DetailContentResolver, getDetailTitle } from "@/components/detail/DetailContentResolver";
import { MOCK_BUNDLE } from "@/constants/mockData";
import type { WeatherBundle } from "@/types/weather";

export default function CardDetailScreen() {
  const { type = "action", id = "" } = useLocalSearchParams<{ type: string; id: string }>();
  const { state } = useWeatherContext();

  const bundle: WeatherBundle = state.currentWeather
    ? {
        current: state.currentWeather,
        hourly: state.hourlyForecast,
        daily: state.dailyForecast,
        airQuality: state.airQuality,
        hourlyAir: state.hourlyAir ?? [],
        hourlyUv: state.hourlyUv ?? [],
        pollen: state.pollen ?? null,
        fetchedAt: Date.now(),
      }
    : MOCK_BUNDLE;

  return (
    <ScreenSheet title={getDetailTitle(id)}>
      <DetailContentResolver type={type} id={id} bundle={bundle} />
    </ScreenSheet>
  );
}
