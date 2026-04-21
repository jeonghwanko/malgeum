import type { WeatherCondition, TextureWeatherKey } from "@/types/weather";
import type { TempUnit } from "@/types/settings";
import type { StatusLevel } from "@/constants/colors";
import { t } from "@/i18n";

/** 강수 조건 여부 (비/이슬비/뇌우). snow는 별도 처리 필요 시 제외 */
export function isRainCondition(condition: WeatherCondition): boolean {
  return condition === "rain" || condition === "drizzle" || condition === "thunderstorm";
}

/** 섭씨 → 화씨 변환 (반올림) */
export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === "F") return Math.round(celsius * 9 / 5 + 32);
  return Math.round(celsius);
}

/** 온도 + 단위 포맷 문자열: "18°" (C) / "64°F" (F) */
export function formatTemp(celsius: number, unit: TempUnit): string {
  const v = convertTemp(celsius, unit);
  return `${v}${tempUnitSuffix(unit)}`;
}

/** 단위 접미사: "°" (C) / "°F" (F) */
export function tempUnitSuffix(unit: TempUnit): string {
  return unit === "F" ? "°F" : "°";
}

export function mapConditionToTexture(condition: WeatherCondition): TextureWeatherKey {
  switch (condition) {
    case "clear":
      return "sunny";
    case "clouds":
      return "cloudy";
    case "rain":
    case "drizzle":
      return "rainy";
    case "snow":
      return "snowy";
    case "thunderstorm":
      return "stormy";
    case "dust":
      return "dusty";
    case "fog":
      return "cloudy";
    default:
      return "sunny";
  }
}

export function getConditionLabel(condition: WeatherCondition): string {
  const key = `weather.condition.${condition}`;
  return t(key);
}

/** 온도 → 감성 라벨 */
export function getFeelLabel(temp: number): string {
  if (temp <= 0) return t("weather.feel.veryCold");
  if (temp <= 5) return t("weather.feel.cold");
  if (temp <= 10) return t("weather.feel.chilly");
  if (temp <= 16) return t("weather.feel.cool");
  if (temp <= 22) return t("weather.feel.moderate");
  if (temp <= 27) return t("weather.feel.warm");
  if (temp <= 32) return t("weather.feel.hot");
  return t("weather.feel.veryHot");
}

/** 온도 → 옷차림 한마디 (임계값은 recommendations.ts getClothing과 동일하게 유지)
 * @param tempOffset 개인 캘리브레이션 보정값 (-2~+2). 피드백 기반 학습. */
export function getClothingCopy(feelsLike: number, tempOffset = 0): string {
  const fl = feelsLike + tempOffset;
  if (fl <= 0) return t("weather.clothing.freezing");
  if (fl <= 5) return t("weather.clothing.veryCold");
  if (fl <= 10) return t("weather.clothing.cold");
  if (fl <= 16) return t("weather.clothing.cool");
  if (fl <= 22) return t("weather.clothing.mild");
  if (fl <= 27) return t("weather.clothing.warm");
  if (fl <= 32) return t("weather.clothing.hot");
  return t("weather.clothing.veryHot");
}

/** 날씨 → 미니멀 유니코드 심볼 (공유 카드 캡처용 — ViewShot에서 안전) */
export function getConditionSymbol(condition: WeatherCondition): string {
  switch (condition) {
    case "clear": return "○";
    case "clouds": return "◐";
    case "rain": case "drizzle": return "∴";
    case "snow": return "✻";
    case "thunderstorm": return "⚡";
    case "fog": return "≋";
    case "dust": return "◌";
    default: return "○";
  }
}

export function getWeatherIcon(condition: WeatherCondition, isNight: boolean): string {
  if (isNight) {
    switch (condition) {
      case "clear": return "clear-night";
      case "clouds": return "partly-cloudy-night";
      default: return condition;
    }
  }
  switch (condition) {
    case "clear": return "clear-day";
    case "clouds": return "partly-cloudy-day";
    default: return condition;
  }
}

// 바람 체감온도
export function windChill(temp: number, windSpeed: number): number {
  const v = windSpeed * 3.6; // m/s -> km/h
  if (temp > 10 || v < 4.8) return temp;
  return Math.round(
    13.12 + 0.6215 * temp - 11.37 * Math.pow(v, 0.16) + 0.3965 * temp * Math.pow(v, 0.16)
  );
}

// 열 체감지수
export function heatIndex(temp: number, humidity: number): number {
  if (temp < 27 || humidity < 40) return temp;
  const t = temp;
  const h = humidity;
  let hi =
    -8.78469 +
    1.61139 * t +
    2.33854 * h -
    0.14612 * t * h -
    0.01231 * t * t -
    0.01642 * h * h +
    0.00221 * t * t * h +
    0.00072 * t * h * h -
    0.00000358 * t * t * h * h;
  return Math.round(hi);
}

// PM2.5 -> StatusLevel
export function getPm25Status(pm25: number): { label: string; status: StatusLevel } {
  if (pm25 <= 15) return { label: t("weather.pm25.good"), status: "safe" };
  if (pm25 <= 35) return { label: t("weather.pm25.moderate"), status: "caution" };
  return { label: t("weather.pm25.bad"), status: "warn" };
}

/** PM2.5 → 감각적 비유 한 줄 */
export function getPm25Metaphor(pm25: number): string {
  if (pm25 <= 15) return t("health.pm25Metaphor.good");
  if (pm25 <= 35) return t("health.pm25Metaphor.moderate");
  if (pm25 <= 75) return t("health.pm25Metaphor.bad");
  return t("health.pm25Metaphor.veryBad");
}

// UV -> StatusLevel
export function getUvStatus(uv: number): { label: string; status: StatusLevel } {
  if (uv <= 2) return { label: t("weather.uv.low"), status: "safe" };
  if (uv <= 5) return { label: t("weather.uv.moderate"), status: "caution" };
  return { label: t("weather.uv.high"), status: "warn" };
}

// 습도 -> StatusLevel
export function getHumidityStatus(humidity: number): { label: string; status: StatusLevel } {
  if (humidity >= 30 && humidity <= 60) return { label: t("weather.humidity.comfortable"), status: "safe" };
  if (humidity > 60 && humidity <= 80) return { label: t("weather.humidity.high"), status: "caution" };
  return { label: humidity < 30 ? t("weather.humidity.dry") : t("weather.humidity.veryHigh"), status: "warn" };
}

// 꽃가루 지수 (계절/기온/풍속 기반 추정)
export function getPollenStatus(
  temp: number,
  humidity: number,
  windSpeed: number,
  condition: WeatherCondition,
): { label: string; status: StatusLevel; description: string; progress: number } {
  const month = new Date().getMonth(); // 0-11

  // 비/눈 오는 날은 꽃가루 낮음
  if (isRainCondition(condition) || condition === "snow") {
    return { label: t("weather.pollen.low"), status: "safe", description: t("weather.pollen.safeRain"), progress: 0.1 };
  }

  // 계절별 기본 수치 (한국 기준)
  let score = 0;

  // 봄 (3~5월): 꽃가루 피크
  if (month >= 2 && month <= 4) {
    score = 6;
    if (month === 3) score = 8; // 4월이 최고
  }
  // 가을 (8~10월): 돼지풀 등
  else if (month >= 7 && month <= 9) {
    score = 4;
  }
  // 여름/겨울: 낮음
  else {
    score = 1;
  }

  // 기온 보정: 따뜻할수록 꽃가루 활성
  if (temp >= 15 && temp <= 25) score += 2;
  else if (temp >= 10) score += 1;

  // 풍속 보정: 바람 불면 꽃가루 확산
  if (windSpeed >= 3) score += 1;
  if (windSpeed >= 6) score += 1;

  // 습도 보정: 건조하면 꽃가루 많음
  if (humidity < 40) score += 1;
  else if (humidity > 70) score -= 1;

  score = Math.max(0, Math.min(10, score));

  if (score <= 2) return { label: t("weather.pollen.low"), status: "safe", description: t("weather.pollen.safe"), progress: score / 10 };
  if (score <= 5) return { label: t("weather.pollen.moderate"), status: "caution", description: t("weather.pollen.caution"), progress: score / 10 };
  if (score <= 7) return { label: t("weather.pollen.high"), status: "warn", description: t("weather.pollen.warnMask"), progress: score / 10 };
  return { label: t("weather.pollen.veryHigh"), status: "warn", description: t("weather.pollen.warnOutdoor"), progress: score / 10 };
}
