import type { AppState } from "@/context/WeatherContext";
import type { WidgetData, WidgetCard } from "@/types/widget";
import { setWidgetData } from "../../modules/widget-bridge";
import { getConditionLabel, mapConditionToTexture, convertTemp, formatTemp } from "@/utils/weather";
import { getHeroMessage, generateActionCards } from "@/utils/recommendations";
import { getConditionEmoji, buildFallbackBundle } from "@/constants/weather-assets";
import { pickSoulMessage } from "@/services/microcopy";
import { logError } from "@/utils/logger";
import { loadJson, STORAGE_KEYS } from "@/utils/storage";
import { loadPredictions, computeDailyStreak } from "@/services/predictionGameService";
import type { TempUnit } from "@/types/settings";

/** 액션카드 icon → Phosphor 아이콘 키 매핑 */
const WIDGET_ICON_MAP: Record<string, string> = {
  tshirt: "t-shirt", jacket: "coat-hanger", padded: "coat-hanger",
  umbrella: "umbrella", sunscreen: "sun", mask: "mask-sad",
  run: "person-simple-run", dumbbell: "barbell",
  carwash: "car", walk: "person-simple-walk", picnic: "basket",
  date: "heart", laundry: "wind", ventilation: "wind",
  pollen: "flower", default: "info",
};

function toWidgetIcon(icon: string): string {
  return WIDGET_ICON_MAP[icon] ?? WIDGET_ICON_MAP.default;
}

/** AppState → WidgetData 변환 (순수 함수, 테스트 가능) */
export function buildWidgetData(state: AppState): WidgetData | null {
  const current = state.currentWeather;
  if (!current) return null;

  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? "현재 위치";
  const district = locationName.split(" ").pop() ?? locationName;

  const bundle = buildFallbackBundle(
    current,
    state.hourlyForecast,
    state.dailyForecast,
    state.airQuality,
  );
  const hero = getHeroMessage(bundle);
  const u: TempUnit = state.tempUnit ?? "C";

  // 액션카드 생성 (최대 4장)
  const actionCards = generateActionCards(bundle, state.healthProfile, u);
  const cards: WidgetCard[] = actionCards.slice(0, 4).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: toWidgetIcon(c.icon),
  }));

  return {
    temp: convertTemp(current.temp, u),
    feelsLike: convertTemp(current.feelsLike, u),
    tempDisplay: formatTemp(current.temp, u),
    feelsLikeDisplay: formatTemp(current.feelsLike, u),
    tempUnit: u,
    condition: current.condition,
    conditionLabel: getConditionLabel(current.condition),
    conditionEmoji: getConditionEmoji(current.condition),
    locationName,
    district,
    heroMessage: hero.badge,
    textureKey: mapConditionToTexture(current.condition),
    updatedAt: Date.now(),
    cards,
    aiSummary: pickSoulMessage(current.condition),
    artStyle: "default", // syncWidgetData에서 덮어씀
  };
}

export async function syncWidgetData(state: AppState): Promise<void> {
  try {
    const data = buildWidgetData(state);
    if (!data) return;
    const [themeState, glassMode, predictions] = await Promise.all([
      loadJson<{ style: string } | null>(STORAGE_KEYS.THEME, null),
      loadJson<boolean>(STORAGE_KEYS.WIDGET_GLASS, false),
      loadPredictions(),
    ]);
    data.artStyle = themeState?.style ?? "default";
    data.glassMode = glassMode;
    data.predictionStreak = computeDailyStreak(predictions);
    await setWidgetData(JSON.stringify(data));
  } catch (e: unknown) {
    logError("widget-bridge", e);
  }
}
