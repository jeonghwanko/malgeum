/**
 * WeatherContext reducer — 순수 함수, 테스트 가능
 */
import type {
  CurrentWeather,
  HourlyWeather,
  HourlyAirQuality,
  HourlyUv,
  DailyWeather,
  AirQuality,
  PollenData,
  SavedLocation,
} from "@/types/weather";
import type { CommuteSettings, AlertSettings, HealthProfile, TempUnit, SchoolSettings } from "@/types/settings";

// ──────────────────────────── State ────────────────────────────

export interface AppState {
  nickname: string;
  locations: SavedLocation[];
  currentLocationId: string | null;
  commuteTime: CommuteSettings;
  tempUnit: TempUnit;
  alerts: AlertSettings;
  healthProfile: HealthProfile;
  schoolSettings: SchoolSettings | null;
  currentWeather: CurrentWeather | null;
  hourlyForecast: HourlyWeather[];
  hourlyAir: HourlyAirQuality[];
  hourlyUv: HourlyUv[];
  dailyForecast: DailyWeather[];
  airQuality: AirQuality | null;
  pollen: PollenData | null;
  lastFetchedAt: string | null;
  onboardingDone: boolean;
}

export const DEFAULT_STATE: AppState = {
  nickname: "",
  locations: [],
  currentLocationId: null,
  commuteTime: { departure: "08:30", return: "18:00" },
  tempUnit: "C",
  alerts: {
    commute: true,
    rain: true,
    dust: true,
    uv: false,
    pollen: false,
    evening: true,
    game: true,
  },
  healthProfile: {
    allergens: [],
    exercisePreference: "야외 러닝",
    clothingStyle: "비즈니스 캐주얼",
  },
  schoolSettings: null,
  currentWeather: null,
  hourlyForecast: [],
  hourlyAir: [],
  hourlyUv: [],
  dailyForecast: [],
  airQuality: null,
  pollen: null,
  lastFetchedAt: null,
  onboardingDone: false,
};

// ──────────────────────────── Actions ────────────────────────────

export type Action =
  | { type: "LOAD"; payload: AppState }
  | { type: "SET_WEATHER"; payload: { current: CurrentWeather; hourly: HourlyWeather[]; hourlyAir?: HourlyAirQuality[]; hourlyUv?: HourlyUv[]; daily: DailyWeather[]; airQuality: AirQuality | null; pollen?: PollenData | null } }
  | { type: "SET_LOCATION"; payload: { location: SavedLocation } }
  | { type: "ADD_LOCATION"; payload: { location: SavedLocation } }
  | { type: "UPDATE_LOCATION"; payload: { location: SavedLocation } }
  | { type: "REMOVE_LOCATION"; payload: { locationId: string } }
  | { type: "SET_COMMUTE_TIME"; payload: CommuteSettings }
  | { type: "SET_TEMP_UNIT"; payload: { unit: TempUnit } }
  | { type: "SET_ALERT"; payload: { key: keyof AlertSettings; enabled: boolean } }
  | { type: "BATCH_SET_ALERTS"; payload: AlertSettings }
  | { type: "SET_PROFILE"; payload: Partial<HealthProfile> }
  | { type: "SET_SCHOOL"; payload: SchoolSettings | null }
  | { type: "SET_ONBOARDING_DONE" };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD":
      return {
        ...DEFAULT_STATE,
        ...action.payload,
        alerts: { ...DEFAULT_STATE.alerts, ...(action.payload.alerts ?? {}) },
      };

    case "SET_WEATHER":
      return {
        ...state,
        currentWeather: action.payload.current,
        hourlyForecast: action.payload.hourly,
        hourlyAir: action.payload.hourlyAir ?? [],
        hourlyUv: action.payload.hourlyUv ?? [],
        dailyForecast: action.payload.daily,
        airQuality: action.payload.airQuality,
        pollen: action.payload.pollen ?? null,
        lastFetchedAt: new Date().toISOString(),
      };

    case "SET_LOCATION":
      return { ...state, currentLocationId: action.payload.location.id };

    case "ADD_LOCATION":
      return {
        ...state,
        locations: [...state.locations, action.payload.location],
        currentLocationId: action.payload.location.id,
      };

    case "UPDATE_LOCATION":
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.payload.location.id ? action.payload.location : l
        ),
      };

    case "REMOVE_LOCATION": {
      const remaining = state.locations.filter((l) => l.id !== action.payload.locationId);
      return {
        ...state,
        locations: remaining,
        currentLocationId:
          state.currentLocationId === action.payload.locationId
            ? remaining[0]?.id ?? null
            : state.currentLocationId,
      };
    }

    case "SET_COMMUTE_TIME":
      return { ...state, commuteTime: action.payload };

    case "SET_TEMP_UNIT":
      return { ...state, tempUnit: action.payload.unit };

    case "SET_ALERT":
      return {
        ...state,
        alerts: { ...state.alerts, [action.payload.key]: action.payload.enabled },
      };

    case "BATCH_SET_ALERTS":
      return { ...state, alerts: action.payload };

    case "SET_PROFILE":
      return {
        ...state,
        healthProfile: { ...state.healthProfile, ...action.payload },
      };

    case "SET_SCHOOL":
      return { ...state, schoolSettings: action.payload };

    case "SET_ONBOARDING_DONE":
      return { ...state, onboardingDone: true };

    default:
      return state;
  }
}
