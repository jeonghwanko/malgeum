import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useWeatherData, useWeatherActions } from "@/context/WeatherContext";
import { fetchWithCache } from "@/services/weatherApi";
import { getCurrentPosition } from "@/services/locationService";
import { seedYesterdayMaxFromApi } from "@/services/predictionGameService";
import { logError } from "@/utils/logger";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10분

export function useWeatherRefresh() {
  const { state } = useWeatherData();
  const { dispatch, refreshGPSLocation } = useWeatherActions();
  const lastFetchRef = useRef(0);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // useRef로 최신 값 추적 — refresh 콜백의 deps를 안정화
  const locationsRef = useRef(state.locations);
  const currentLocationIdRef = useRef(state.currentLocationId);
  locationsRef.current = state.locations;
  currentLocationIdRef.current = state.currentLocationId;

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < REFRESH_INTERVAL_MS) return;
    lastFetchRef.current = now;

    const location = locationsRef.current.find(
      (l) => l.id === currentLocationIdRef.current
    );

    if (location?.isGps) {
      setAutoRefreshing(true);
      try {
        await refreshGPSLocation();
      } catch {
        lastFetchRef.current = 0;
      } finally {
        setAutoRefreshing(false);
      }
      return;
    }

    let lat: number, lon: number;
    if (location) {
      lat = location.lat;
      lon = location.lon;
    } else {
      const pos = await getCurrentPosition();
      if (!pos) {
        lastFetchRef.current = 0;
        return;
      }
      lat = pos.lat;
      lon = pos.lon;
    }

    setAutoRefreshing(true);
    try {
      const bundle = await fetchWithCache(lat, lon);
      if (typeof bundle.yesterdayActualMax === "number") {
        await seedYesterdayMaxFromApi(bundle.yesterdayActualMax);
      }
      dispatch({
        type: "SET_WEATHER",
        payload: {
          current: bundle.current,
          hourly: bundle.hourly,
          daily: bundle.daily,
          airQuality: bundle.airQuality,
        },
      });
    } catch (e: unknown) {
      logError("weather-api", e);
      lastFetchRef.current = 0;
    } finally {
      setAutoRefreshing(false);
    }
  }, [dispatch, refreshGPSLocation]);

  // 포그라운드 복귀 시 자동 갱신 — refresh가 stable이므로 리스너 재구독 없음
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  // 초기 로드 + 위치 변경 시 즉시 갱신
  const prevLocationIdRef = useRef(state.currentLocationId);
  useEffect(() => {
    if (!state.onboardingDone || !state.currentLocationId) return;
    const locationChanged = prevLocationIdRef.current !== state.currentLocationId;
    prevLocationIdRef.current = state.currentLocationId;
    if (locationChanged) {
      lastFetchRef.current = 0; // TTL 리셋 — 즉시 fetch
    }
    refresh();
  }, [state.onboardingDone, state.currentLocationId, refresh]);

  return { refresh, autoRefreshing };
}
