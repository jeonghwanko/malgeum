import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { fetchWithCache } from "@/services/weatherApi";
import { getCurrentPosition, reverseGeocode } from "@/services/locationService";
import { syncWidgetData } from "@/services/widgetBridge";
import { recordWeatherSnapshot, seedYesterdayMaxFromApi } from "@/services/predictionGameService";
import { dateKey } from "@/utils/date";
import { logError } from "@/utils/logger";
import { reducer, DEFAULT_STATE, type AppState, type Action } from "./weatherReducer";

export type { AppState, Action } from "./weatherReducer";
export { DEFAULT_STATE } from "./weatherReducer";

// ──────────────────────────── Context ────────────────────────────

interface WeatherDataValue {
  state: AppState;
  loaded: boolean;
}

interface WeatherActionsValue {
  dispatch: React.Dispatch<Action>;
  refreshWeather: () => Promise<void>;
  refreshGPSLocation: () => Promise<void>;
}

/** @deprecated 하위 호환용 — 신규 코드는 useWeatherData / useWeatherActions 사용 */
type WeatherContextValue = WeatherDataValue & WeatherActionsValue;

const WeatherDataContext = createContext<WeatherDataValue | null>(null);
const WeatherActionsContext = createContext<WeatherActionsValue | null>(null);

/** 위치 변경 감지 임계값 — 약 1km (위도/경도 0.01도 ≈ 1.1km) */
const LOCATION_CHANGE_THRESHOLD = 0.01;

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  // 1. 저장소에서 로드
  useEffect(() => {
    (async () => {
      const saved = await loadJson<AppState>(STORAGE_KEYS.USER, DEFAULT_STATE);
      dispatch({ type: "LOAD", payload: saved });
      loadedRef.current = true;
      setLoaded(true);
    })();
  }, []);

  // 2. 상태 변경 시 자동 저장 (500ms 디바운스)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveJson(STORAGE_KEYS.USER, state);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  // 2-1. 날씨 데이터 변경 시 위젯 동기화
  //   값이 실제로 변경된 경우만 syncWidgetData 호출 (불필요한 generateActionCards 재실행 방지)
  const prevWidgetKeyRef = useRef("");
  useEffect(() => {
    if (!loadedRef.current) return;
    const key = `${state.currentWeather?.temp}|${state.currentWeather?.condition}|${state.airQuality?.aqi}|${state.currentLocationId}|${state.tempUnit}`;
    if (key === prevWidgetKeyRef.current) return;
    prevWidgetKeyRef.current = key;
    syncWidgetData(state);
  }, [state.currentWeather, state.airQuality, state.currentLocationId, state.tempUnit]);

  // 2-2. 날씨 갱신 시 WEEKLY_MAX 스냅샷 (게임 정산 + 주간 탭 어제 행 공유 데이터)
  //   - 오늘: currentWeather.temp 누적 max (실측치)
  //   - D+1..D+6: forecast tempMax 덮어쓰기
  // recordWeatherSnapshot은 단일 load+save로 atomic 처리 (race condition 방지)
  const lastSnapshotRef = useRef<{ temp: number | null; firstDt: number | null }>({
    temp: null,
    firstDt: null,
  });
  useEffect(() => {
    if (!loadedRef.current) return;
    const currentTemp = state.currentWeather?.temp ?? null;
    const firstDt = state.dailyForecast[0]?.dt ?? null;
    // 변경 없으면 no-op (객체 ref만 새로 생긴 경우)
    if (
      lastSnapshotRef.current.temp === currentTemp &&
      lastSnapshotRef.current.firstDt === firstDt
    ) {
      return;
    }
    lastSnapshotRef.current = { temp: currentTemp, firstDt };

    const futureMap: Record<string, number> = {};
    for (let i = 1; i < state.dailyForecast.length && i < 7; i += 1) {
      const d = state.dailyForecast[i];
      if (!d || typeof d.tempMax !== "number") continue;
      futureMap[dateKey(new Date(d.dt * 1000))] = d.tempMax;
    }
    const todayForecastMax = state.dailyForecast[0]?.tempMax;
    void recordWeatherSnapshot(currentTemp ?? undefined, futureMap, todayForecastMax);
  }, [state.currentWeather, state.dailyForecast]);

  // 3. 날씨 새로고침 (중복 호출 방지)
  const refreshingRef = useRef(false);
  const gpsRefreshingRef = useRef(false);
  const locationsRef = useRef(state.locations);
  const currentLocationIdRef = useRef(state.currentLocationId);
  locationsRef.current = state.locations;
  currentLocationIdRef.current = state.currentLocationId;

  const refreshWeather = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const location = locationsRef.current.find((l) => l.id === currentLocationIdRef.current);
      if (!location) {
        const pos = await getCurrentPosition();
        if (!pos) return;
        const name = await reverseGeocode(pos.lat, pos.lon);
        const bundle = await fetchWithCache(pos.lat, pos.lon, false, name);
        if (typeof bundle.yesterdayActualMax === "number") await seedYesterdayMaxFromApi(bundle.yesterdayActualMax);
        dispatch({ type: "SET_WEATHER", payload: bundle });
        return;
      }
      const bundle = await fetchWithCache(location.lat, location.lon, false, location.name);
      if (typeof bundle.yesterdayActualMax === "number") await seedYesterdayMaxFromApi(bundle.yesterdayActualMax);
      dispatch({ type: "SET_WEATHER", payload: bundle });
    } catch (e: unknown) {
      logError("weather-api", e);
    } finally {
      refreshingRef.current = false;
    }
  }, [dispatch]);

  const refreshGPSLocation = useCallback(async () => {
    if (gpsRefreshingRef.current) return;
    gpsRefreshingRef.current = true;
    try {
      const gpsLoc = locationsRef.current.find((l) => l.isGps);
      const pos = await getCurrentPosition();

      const lat = pos?.lat ?? gpsLoc?.lat;
      const lon = pos?.lon ?? gpsLoc?.lon;
      if (lat == null || lon == null) return;

      const moved = pos != null && gpsLoc != null && (
        Math.abs(pos.lat - gpsLoc.lat) > LOCATION_CHANGE_THRESHOLD ||
        Math.abs(pos.lon - gpsLoc.lon) > LOCATION_CHANGE_THRESHOLD
      );

      const locationName = gpsLoc?.name ?? "현재 위치";
      const [newName, bundle] = await Promise.all([
        moved ? reverseGeocode(lat, lon) : Promise.resolve(null),
        fetchWithCache(lat, lon, moved, moved ? undefined : locationName),
      ]);
      if (moved && gpsLoc && newName) {
        dispatch({ type: "UPDATE_LOCATION", payload: { location: { ...gpsLoc, lat, lon, name: newName } } });
      }
      if (typeof bundle.yesterdayActualMax === "number") await seedYesterdayMaxFromApi(bundle.yesterdayActualMax);
      dispatch({ type: "SET_WEATHER", payload: bundle });
    } catch (e: unknown) {
      logError("location", e);
    } finally {
      gpsRefreshingRef.current = false;
    }
  }, [dispatch]);

  const dataValue = useMemo(
    () => ({ state, loaded }),
    [state, loaded]
  );

  const actionsValue = useMemo(
    () => ({ dispatch, refreshWeather, refreshGPSLocation }),
    [dispatch, refreshWeather, refreshGPSLocation]
  );

  return (
    <WeatherActionsContext.Provider value={actionsValue}>
      <WeatherDataContext.Provider value={dataValue}>
        {children}
      </WeatherDataContext.Provider>
    </WeatherActionsContext.Provider>
  );
}

/** state + loaded 만 필요한 컴포넌트용 — dispatch/refresh 변경에 re-render 안 됨 */
export function useWeatherData(): WeatherDataValue {
  const ctx = useContext(WeatherDataContext);
  if (!ctx) throw new Error("useWeatherData must be inside WeatherProvider");
  return ctx;
}

/** dispatch + refresh 함수만 필요한 컴포넌트용 — state 변경에 re-render 안 됨 */
export function useWeatherActions(): WeatherActionsValue {
  const ctx = useContext(WeatherActionsContext);
  if (!ctx) throw new Error("useWeatherActions must be inside WeatherProvider");
  return ctx;
}

/** 하위 호환용 — 기존 코드 깨지지 않도록 유지. 신규 코드는 useWeatherData/useWeatherActions 사용 */
export function useWeatherContext(): WeatherContextValue {
  const data = useContext(WeatherDataContext);
  const actions = useContext(WeatherActionsContext);
  if (!data || !actions) throw new Error("useWeatherContext must be inside WeatherProvider");
  return { ...data, ...actions };
}
