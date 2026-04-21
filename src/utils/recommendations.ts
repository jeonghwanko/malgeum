import type { WeatherBundle, WeatherCondition, HourlyWeather, DailyWeather } from "@/types/weather";
import { getClothingCopy, getConditionLabel, formatTemp, isRainCondition } from "@/utils/weather";
import { t } from "@/i18n";
import type { ActionCard, CardCategory } from "@/types/actions";
import type { StatusLevel } from "@/constants/colors";
import type { HealthProfile, TempUnit } from "@/types/settings";
import { applyPersonalBoost, type CardTapCounts } from "@/services/cardPreferenceService";
import {
  HERO_MSG, HERO_SUBTEXT, HERO_BADGE, UMBRELLA_TEXT,
  DELTA_MSG, DELTA_SUBTEXT,
  CARD_TITLE, CARD_BADGE, CARD_DESC,
  EXERCISE_TITLE, CLOTHING_SHORT, CLOTHING, STYLE_TIP,
  DAILY_TIP, COMMUTE_REC, WEATHER_CHANGE_DESC,
} from "@/constants/recommendationMessages";

// ──────────────────────────── Hero Message ────────────────────────────

export function getHeroMessage(
  bundle: WeatherBundle,
  yesterdayDiff?: number | null,
): {
  message: string;
  subText: string;
  status: StatusLevel;
  badge: string;
} {
  const { current, hourly } = bundle;
  const fl = current.feelsLike;
  const cond = current.condition;
  const maxPrecip = Math.max(current.precipitation, ...hourly.slice(0, 4).map((h) => h.precipitation));

  // 위험 날씨는 delta보다 우선
  if (isRainCondition(cond) || maxPrecip >= 50) {
    return {
      message: HERO_MSG.RAIN,
      subText: `${t("rec.rainForecast")} · ${getClothingShort(fl)} · ${UMBRELLA_TEXT.INDOOR}`,
      status: "warn",
      badge: HERO_BADGE.RAIN,
    };
  }
  if (cond === "snow") {
    return {
      message: HERO_MSG.SNOW,
      subText: HERO_SUBTEXT.SNOW,
      status: "warn",
      badge: HERO_BADGE.SNOW,
    };
  }
  if (bundle.airQuality && bundle.airQuality.aqi >= 3) {
    return {
      message: HERO_MSG.DUST,
      subText: HERO_SUBTEXT.DUST,
      status: "warn",
      badge: HERO_BADGE.DUST,
    };
  }
  if (fl <= 0) {
    return {
      message: HERO_MSG.COLD,
      subText: HERO_SUBTEXT.COLD,
      status: "caution",
      badge: HERO_BADGE.COLD,
    };
  }
  if (fl >= 33) {
    return {
      message: HERO_MSG.HEAT,
      subText: HERO_SUBTEXT.HEAT,
      status: "warn",
      badge: HERO_BADGE.HEAT,
    };
  }

  // 어제 대비 기온 변화가 크면 행동 교정 메시지로 대체
  if (yesterdayDiff != null) {
    if (yesterdayDiff >= 8) {
      return {
        message: DELTA_MSG.MUCH_WARMER,
        subText: `${DELTA_SUBTEXT.MUCH_WARMER} · ${getClothingShort(fl)}`,
        status: "caution",
        badge: HERO_BADGE.WARMER,
      };
    }
    if (yesterdayDiff >= 5) {
      return {
        message: DELTA_MSG.WARMER,
        subText: `${DELTA_SUBTEXT.WARMER} · ${getClothingShort(fl)}`,
        status: "safe",
        badge: HERO_BADGE.WARMER,
      };
    }
    if (yesterdayDiff <= -8) {
      return {
        message: DELTA_MSG.MUCH_COLDER,
        subText: `${DELTA_SUBTEXT.MUCH_COLDER} · ${getClothingShort(fl)}`,
        status: "caution",
        badge: HERO_BADGE.COLDER,
      };
    }
    if (yesterdayDiff <= -5) {
      return {
        message: DELTA_MSG.COLDER,
        subText: `${DELTA_SUBTEXT.COLDER} · ${getClothingShort(fl)}`,
        status: "caution",
        badge: HERO_BADGE.COLDER,
      };
    }
  }

  const umbrellaText = maxPrecip >= 30 ? UMBRELLA_TEXT.NEEDED : UMBRELLA_TEXT.NOT_NEEDED;
  const goodOutdoor = cond === "clear" && fl >= 15 && fl <= 25 && (!bundle.airQuality || bundle.airQuality.aqi <= 2);
  const activityText = goodOutdoor ? EXERCISE_TITLE.RUNNING : getConditionLabel(cond);
  const heroMsg =
    fl <= 10 ? HERO_MSG.CHILLY :
    fl <= 16 ? HERO_MSG.COOL :
    fl <= 22 ? HERO_MSG.MILD :
    fl <= 27 ? HERO_MSG.WARM :
               HERO_MSG.HOT;
  return {
    message: heroMsg,
    subText: `${getClothingShort(fl)} · ${umbrellaText} · ${activityText}`,
    status: maxPrecip >= 30 ? "caution" : "safe",
    badge: maxPrecip >= 30 ? HERO_BADGE.UMBRELLA : HERO_BADGE.SAFE,
  };
}

// ──────────────────────────── Action Cards ────────────────────────────

export function generateActionCards(bundle: WeatherBundle, profile?: HealthProfile, tempUnit: TempUnit = "C", tapCounts?: CardTapCounts): ActionCard[] {
  const cards: ActionCard[] = [];
  const { current, hourly, airQuality } = bundle;
  const fl = current.feelsLike;
  const cond = current.condition;
  const maxPrecip = Math.max(current.precipitation, ...hourly.slice(0, 4).map((h) => h.precipitation));

  // 1. 옷차림 (항상) — 복장 스타일 반영
  cards.push(createClothingCard(fl, profile?.clothingStyle, tempUnit));

  // 2. 우산 — "뭘 챙길까?"
  if (maxPrecip >= 50) {
    cards.push({
      id: "umbrella", category: "umbrella", icon: "umbrella",
      title: CARD_TITLE.UMBRELLA_MUST, description: t("rec.precipLabel", { precip: maxPrecip }),
      badge: CARD_BADGE.MUST, status: "warn", priority: 1, tier: "urgent",
    });
  } else if (maxPrecip >= 30) {
    cards.push({
      id: "umbrella-maybe", category: "umbrella", icon: "umbrella",
      title: CARD_TITLE.UMBRELLA_MAYBE, description: t("rec.precipLabel", { precip: maxPrecip }),
      badge: CARD_BADGE.REF, status: "caution", priority: 3, tier: "action",
    });
  }

  // 3. 야외 활동 — 운동 선호도 반영
  const exercisePref = profile?.exercisePreference ?? "outdoor_running";
  const goodOutdoor = cond === "clear" && fl >= 15 && fl <= 25 && (!airQuality || airQuality.aqi <= 2);
  const badOutdoor = cond === "rain" || (airQuality && airQuality.aqi >= 3);

  if (goodOutdoor) {
    const { title: exTitle, icon: exIcon } = getExerciseCard(exercisePref, true);
    cards.push({
      id: "outdoor-activity", category: "outdoor", icon: exIcon,
      title: exTitle, description: t("rec.dustAir", { label: airQuality ? getAirLabel(airQuality.aqi) : CARD_DESC.AIR_GOOD_FALLBACK }),
      badge: CARD_BADGE.GOOD, status: "safe", priority: 4, tier: "action",
    });
  } else if (badOutdoor) {
    const { title: exTitle, icon: exIcon } = getExerciseCard(exercisePref, false);
    cards.push({
      id: "indoor-exercise", category: "outdoor", icon: exIcon,
      title: exTitle, description: cond === "rain" ? CARD_DESC.OUTDOOR_INDOOR_RAIN : CARD_DESC.OUTDOOR_INDOOR_DUST,
      badge: CARD_BADGE.INDOOR, status: "safe", priority: 4, tier: "action",
    });
  }

  // 4. 세차 — "미뤄야 하나?"
  const hasRainForecast = hourly.some((h) => h.precipitation > 30);
  if (!hasRainForecast && cond === "clear") {
    cards.push({
      id: "carwash", category: "lifestyle", icon: "carwash",
      title: CARD_TITLE.CARWASH_GOOD, description: CARD_DESC.CARWASH_GOOD,
      badge: CARD_BADGE.RECOMMEND, status: "safe", priority: 5, tier: "info",
    });
  } else if (hasRainForecast || cond === "rain") {
    cards.push({
      id: "carwash-no", category: "lifestyle", icon: "carwash",
      title: CARD_TITLE.CARWASH_BAD, description: CARD_DESC.CARWASH_BAD,
      badge: CARD_BADGE.BAD, status: "warn", priority: 4, tier: "info",
    });
  }

  // 5. 선크림 — 자외선 민감 사용자는 임계값 낮춤
  const uvSensitive = profile?.allergens?.includes("자외선") || profile?.allergens?.includes("uv");
  const uvThreshold = uvSensitive ? 3 : 6;
  if (current.uvIndex >= uvThreshold) {
    cards.push({
      id: "sunscreen", category: "health", icon: "sunscreen",
      title: uvSensitive ? CARD_TITLE.SUNSCREEN_SENSITIVE : CARD_TITLE.SUNSCREEN,
      description: `UV ${current.uvIndex}${uvSensitive ? CARD_DESC.UV_SENSITIVE_SUFFIX : ""}`,
      badge: CARD_BADGE.CAUTION, status: "caution", priority: 2, tier: "urgent",
    });
  }

  // 6. 미세먼지 — 민감 사용자는 임계값 낮춤
  const dustSensitive = profile?.allergens?.some((a) => a === "미세먼지" || a === "황사" || a === "dust");
  const dustThreshold = dustSensitive ? 2 : 3;
  if (airQuality && airQuality.aqi >= dustThreshold) {
    cards.push({
      id: "mask", category: "health", icon: "mask",
      title: dustSensitive ? CARD_TITLE.MASK_SENSITIVE : CARD_TITLE.MASK,
      description: `${t("rec.dustAir", { label: getAirLabel(airQuality.aqi) })}${dustSensitive ? CARD_DESC.DUST_SENSITIVE_SUFFIX : ""}`,
      badge: CARD_BADGE.MUST, status: "warn", priority: 1, tier: "urgent",
    });
  }

  // 7. 꽃가루 — 알레르기 사용자 전용 카드
  if ((profile?.allergens?.includes("꽃가루") || profile?.allergens?.includes("pollen")) && bundle.pollen) {
    const pollen = bundle.pollen;
    if (pollen.score >= 4) {
      const isDanger = pollen.score >= 7;
      cards.push({
        id: "pollen", category: "health", icon: "pollen",
        title: isDanger ? CARD_TITLE.POLLEN_DANGER : CARD_TITLE.POLLEN_CAUTION,
        description: pollen.description,
        badge: isDanger ? CARD_BADGE.DANGER : CARD_BADGE.CAUTION,
        status: isDanger ? "warn" : "caution",
        priority: isDanger ? 1 : 2,
        tier: "urgent",
      });
    }
  }

  // ── 라이프스타일 카드 (좋은 날씨일수록 많이 노출) ──

  const noRain = maxPrecip < 30 && !isRainCondition(cond);
  const goodAir = !airQuality || airQuality.aqi <= 2;

  // 8. 야외 활동 추천 (데이트 > 산책 중 하나만)
  if (noRain && goodAir && cond === "clear" && fl >= 15 && fl <= 27) {
    if (fl >= 15 && fl <= 25 && current.windSpeed < 5) {
      cards.push({
        id: "date", category: "lifestyle", icon: "date",
        title: CARD_TITLE.DATE, description: `${t("rec.feelsLabel", { temp: formatTemp(fl, tempUnit) })} · ${CARD_DESC.DATE_AIR}`,
        badge: CARD_BADGE.RECOMMEND, status: "safe", priority: 5, tier: "info",
      });
    } else {
      cards.push({
        id: "walk", category: "lifestyle", icon: "walk",
        title: CARD_TITLE.WALK, description: `${t("rec.feelsLabel", { temp: formatTemp(fl, tempUnit) })} · ${getConditionLabel(cond)}`,
        badge: CARD_BADGE.GOOD, status: "safe", priority: 5, tier: "info",
      });
    }
  } else if (noRain && (cond === "clear" || cond === "clouds") && fl >= 10 && fl <= 25) {
    cards.push({
      id: "walk", category: "lifestyle", icon: "walk",
      title: CARD_TITLE.WALK, description: `${t("rec.feelsLabel", { temp: formatTemp(fl, tempUnit) })} · ${getConditionLabel(cond)}`,
      badge: CARD_BADGE.GOOD, status: "safe", priority: 5, tier: "info",
    });
  }

  // 9. 빨래 널기
  if (noRain && (cond === "clear" || cond === "clouds") && current.windSpeed < 3 && current.humidity < 60) {
    cards.push({
      id: "laundry", category: "lifestyle", icon: "laundry",
      title: CARD_TITLE.LAUNDRY_GOOD, description: t("rec.humidityLabel", { value: current.humidity, wind: current.windSpeed }),
      badge: CARD_BADGE.GOOD, status: "safe", priority: 5, tier: "info",
    });
  } else if (!noRain || current.humidity >= 75) {
    cards.push({
      id: "laundry-no", category: "lifestyle", icon: "laundry",
      title: CARD_TITLE.LAUNDRY_BAD,
      description: current.humidity >= 75 ? t("rec.humidityPercent", { value: current.humidity }) : CARD_DESC.LAUNDRY_BAD_RAIN,
      badge: CARD_BADGE.INDOOR, status: "caution", priority: 5, tier: "info",
    });
  }

  // 10. 창문 환기
  if (goodAir && noRain && cond !== "dust") {
    cards.push({
      id: "ventilation", category: "lifestyle", icon: "ventilation",
      title: CARD_TITLE.VENTILATION, description: CARD_DESC.VENTILATION,
      badge: CARD_BADGE.GOOD, status: "safe", priority: 5, tier: "info",
    });
  }

  // 개인화: 탭 빈도 기반 priority 부스트 (tapCounts가 있고 10회+ 탭 시 활성화)
  if (tapCounts) {
    for (const card of cards) {
      card.priority = applyPersonalBoost(card.priority, card.category, tapCounts);
    }
  }
  return cards.sort((a, b) => a.priority - b.priority).slice(0, 6);
}

// ──────────────────────────── Daily Tip ────────────────────────────

/** 일별 예보 기반 한 줄 행동 추천 (주간 탭용). 특별한 날만 반환, 평범한 날은 null */
export function getDailyTip(d: DailyWeather): string | null {
  if (d.condition === "thunderstorm") return DAILY_TIP.THUNDERSTORM;
  if (d.condition === "snow")         return DAILY_TIP.SNOW;
  if (d.precipitation >= 60)          return DAILY_TIP.HEAVY_RAIN;
  if (d.precipitation >= 40)          return DAILY_TIP.RAIN;
  if (d.tempMax >= 35)                return DAILY_TIP.EXTREME_HEAT;
  if (d.tempMax >= 30)                return DAILY_TIP.HOT;
  if (d.tempMin <= -5)                return DAILY_TIP.EXTREME_COLD;
  if (d.tempMin <= 0)                 return DAILY_TIP.COLD;
  if (d.condition === "dust")         return DAILY_TIP.DUST;
  if (d.condition === "fog")          return DAILY_TIP.FOG;

  const avg = (d.tempMin + d.tempMax) / 2;
  if (d.condition === "clear" && avg >= 18 && avg <= 26 && d.precipitation < 20) return DAILY_TIP.NICE_DAY;
  if (avg <= 5) return DAILY_TIP.COLD_AVG;

  return null;
}

// ──────────────────────────── Commute ────────────────────────────

export interface CommuteSlot {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
}

export interface CommuteComparison {
  departure: CommuteSlot;
  returnTrip: CommuteSlot;
  tempDiff: number;
  needUmbrella: boolean;
  recommendation: string;
}

export function getCommuteComparison(
  hourly: HourlyWeather[],
  departureTime: string,
  returnTime: string
): CommuteComparison | null {
  const depHour = parseInt(departureTime.split(":")[0], 10);
  const retHour = parseInt(returnTime.split(":")[0], 10);

  const depWeather = findClosestHour(hourly, depHour);
  const retWeather = findClosestHour(hourly, retHour);

  if (!depWeather || !retWeather) return null;

  const tempDiff = retWeather.temp - depWeather.temp;
  const needUmbrella = depWeather.precipitation > 30 || retWeather.precipitation > 30;

  let recommendation = "";
  if (needUmbrella)      recommendation = COMMUTE_REC.UMBRELLA;
  else if (tempDiff <= -5) recommendation = COMMUTE_REC.EXTRA_LAYER;
  else                   recommendation = getClothingCopy(depWeather.feelsLike);

  return {
    departure: { temp: depWeather.temp, feelsLike: depWeather.feelsLike, condition: depWeather.condition, precipitation: depWeather.precipitation },
    returnTrip: { temp: retWeather.temp, feelsLike: retWeather.feelsLike, condition: retWeather.condition, precipitation: retWeather.precipitation },
    tempDiff,
    needUmbrella,
    recommendation,
  };
}

// ──────────────────────────── Weather Changes ────────────────────────────

export interface WeatherChange {
  type: "rain_start" | "rain_stop" | "temp_drop";
  fromHour: number;
  description: string;
}

export function detectWeatherChanges(hourly: HourlyWeather[], tempUnit: TempUnit = "C"): WeatherChange[] {
  const changes: WeatherChange[] = [];
  if (hourly.length < 2) return changes;

  for (let i = 1; i < Math.min(hourly.length, 6); i++) {
    const prev = hourly[i - 1];
    const curr = hourly[i];
    const hour = new Date(curr.dt * 1000).getHours();

    if (prev.precipitation < 30 && curr.precipitation >= 50) {
      changes.push({ type: "rain_start", fromHour: hour, description: WEATHER_CHANGE_DESC.rainStart(hour) });
    }
    if (prev.precipitation >= 50 && curr.precipitation < 10) {
      changes.push({ type: "rain_stop", fromHour: hour, description: WEATHER_CHANGE_DESC.rainStop(hour) });
    }
    if (prev.temp - curr.temp >= 5) {
      changes.push({
        type: "temp_drop", fromHour: hour,
        description: WEATHER_CHANGE_DESC.tempDrop(hour, formatTemp(prev.temp, tempUnit), formatTemp(curr.temp, tempUnit)),
      });
    }
  }

  return changes;
}

// ──────────────────────────── Helpers ────────────────────────────

function createClothingCard(feelsLike: number, clothingStyle?: string, tempUnit: TempUnit = "C"): ActionCard {
  const cl = getClothing(feelsLike, tempUnit);
  const icon = feelsLike <= 5 ? "padded" : feelsLike <= 16 ? "jacket" : "tshirt";
  const styleTip = getStyleTip(feelsLike, clothingStyle);
  return {
    id: "clothing",
    category: "clothing",
    icon,
    title: cl.title,
    description: styleTip ? `${cl.description} · ${styleTip}` : cl.description,
    badge: cl.badge,
    status: cl.status,
    priority: cl.priority,
    tier: "action" as const,
  };
}

function getStyleTip(fl: number, style?: string): string {
  if (!style) return "";
  const isFormal = style === "포멀" || style === "비즈니스 캐주얼" || style === "formal";
  const isSporty = style === "스포티" || style === "sporty";
  const isCasual = style === "캐주얼" || style === "casual";
  const isMinimal = style === "미니멀" || style === "minimal";
  if (isFormal) {
    if (fl <= 10) return STYLE_TIP.FORMAL_COLD;
    if (fl <= 20) return STYLE_TIP.FORMAL_MILD;
    return STYLE_TIP.FORMAL_WARM;
  }
  if (isSporty) {
    if (fl <= 10) return STYLE_TIP.SPORTY_COLD;
    if (fl <= 20) return STYLE_TIP.SPORTY_MILD;
    return STYLE_TIP.SPORTY_WARM;
  }
  if (isCasual) {
    if (fl <= 10) return STYLE_TIP.CASUAL_COLD;
    if (fl <= 20) return STYLE_TIP.CASUAL_MILD;
    return STYLE_TIP.CASUAL_WARM;
  }
  if (isMinimal) {
    if (fl <= 10) return STYLE_TIP.MINIMAL_COLD;
    if (fl <= 20) return STYLE_TIP.MINIMAL_MILD;
    return STYLE_TIP.MINIMAL_WARM;
  }
  return "";
}

function getExerciseCard(pref: string, goodWeather: boolean): { title: string; icon: string } {
  if (!goodWeather) {
    if (pref === "수영" || pref === "swimming") return { title: EXERCISE_TITLE.INDOOR_SWIMMING, icon: "dumbbell" };
    return { title: EXERCISE_TITLE.INDOOR_DEFAULT, icon: "dumbbell" };
  }
  switch (pref) {
    case "야외 러닝": case "outdoor_running": return { title: EXERCISE_TITLE.RUNNING,          icon: "run" };
    case "자전거":   case "cycling":   return { title: EXERCISE_TITLE.CYCLING,           icon: "run" };
    case "등산":     case "hiking":     return { title: EXERCISE_TITLE.HIKING,            icon: "run" };
    case "산책":     case "walking":    return { title: EXERCISE_TITLE.WALKING,           icon: "run" };
    case "수영":     case "swimming":   return { title: EXERCISE_TITLE.SWIMMING_OUTDOOR,  icon: "run" };
    case "실내 운동": case "indoor":    return { title: EXERCISE_TITLE.INDOOR_WORKOUT,   icon: "dumbbell" };
    default:         return { title: EXERCISE_TITLE.RUNNING,           icon: "run" };
  }
}

function getClothing(fl: number, tempUnit: TempUnit = "C"): {
  title: string; description: string; badge: string; status: StatusLevel; priority: number;
} {
  const flt = formatTemp(fl, tempUnit);
  const desc = t("rec.feelsLabel", { temp: flt });
  if (fl <= 0)  return { ...CLOTHING.FREEZING,    description: desc, status: "warn",    priority: 1 };
  if (fl <= 5)  return { ...CLOTHING.VERY_COLD,   description: desc, status: "caution", priority: 2 };
  if (fl <= 10) return { ...CLOTHING.COLD,        description: desc, status: "caution", priority: 2 };
  if (fl <= 16) return { ...CLOTHING.COOL,        description: desc, status: "safe",    priority: 3 };
  if (fl <= 22) return { ...CLOTHING.MILD,        description: desc, status: "safe",    priority: 3 };
  if (fl <= 27) return { ...CLOTHING.WARM,        description: desc, status: "safe",    priority: 4 };
  if (fl <= 32) return { ...CLOTHING.HOT,         description: desc, status: "caution", priority: 2 };
  return              { ...CLOTHING.EXTREME_HOT,  description: desc, status: "warn",    priority: 1 };
}

function getClothingShort(fl: number): string {
  if (fl <= 0)  return CLOTHING_SHORT.EXTREME_COLD;
  if (fl <= 10) return CLOTHING_SHORT.COLD;
  if (fl <= 16) return CLOTHING_SHORT.COOL;
  if (fl <= 22) return CLOTHING_SHORT.MILD;
  if (fl <= 27) return CLOTHING_SHORT.WARM;
  return CLOTHING_SHORT.HOT;
}

function getAirLabel(aqi: number): string {
  if (aqi <= 1) return t("rec.airLabel.good");
  if (aqi <= 2) return t("rec.airLabel.moderate");
  if (aqi <= 3) return t("rec.airLabel.bad");
  return t("rec.airLabel.veryBad");
}

function findClosestHour(hourly: HourlyWeather[], targetHour: number): HourlyWeather | null {
  if (hourly.length === 0) return null;
  const hourDiff = (a: number, b: number) => { const d = Math.abs(a - b); return Math.min(d, 24 - d); };
  return hourly.reduce((closest, h) => {
    const hHour = new Date(h.dt * 1000).getHours();
    const cHour = new Date(closest.dt * 1000).getHours();
    return hourDiff(hHour, targetHour) < hourDiff(cHour, targetHour) ? h : closest;
  });
}
