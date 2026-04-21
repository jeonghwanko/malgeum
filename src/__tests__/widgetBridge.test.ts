import { buildWidgetData } from "../services/widgetBridge";
import { getWidgetTheme, getWeatherIconSvg } from "../widgets/android/widgetTheme";
import { getArtworkImage, ART_STYLE_LABELS } from "../widgets/android/widgetAssets";
import { FREE_STYLE_KEYS, PREMIUM_STYLE_KEYS } from "../constants/themes";
import type { AppState } from "../context/WeatherContext";
import type { CurrentWeather } from "../types/weather";

// ─── helpers ───

function makeState(
  overrides: Partial<CurrentWeather> = {},
  stateOverrides: Partial<AppState> = {},
): AppState {
  return {
    nickname: "",
    locations: [
      { id: "loc1", name: "서울 강남구", lat: 37.5, lon: 127.0, isGps: false },
    ],
    currentLocationId: "loc1",
    commuteTime: { departure: "08:30", return: "18:00" },
    tempUnit: "C",
    alerts: {
      commute: true, rain: true, dust: true,
      uv: false, pollen: false, evening: true, game: true,
    },
    healthProfile: {
      allergens: [],
      exercisePreference: "야외 러닝",
      clothingStyle: "비즈니스 캐주얼",
    },
    schoolSettings: null,
    currentWeather: {
      temp: 22,
      feelsLike: 20,
      humidity: 50,
      windSpeed: 2,
      condition: "clear",
      description: "맑음",
      icon: "01d",
      uvIndex: 3,
      precipitation: 0,
      sunrise: 0,
      sunset: 0,
      ...overrides,
    },
    hourlyForecast: [],
    hourlyAir: [],
    hourlyUv: [],
    dailyForecast: [],
    airQuality: null,
    pollen: null,
    lastFetchedAt: new Date().toISOString(),
    onboardingDone: true,
    ...stateOverrides,
  };
}

// ─── buildWidgetData ───

describe("buildWidgetData", () => {
  it("returns null when currentWeather is null", () => {
    const state = makeState({}, { currentWeather: null });
    expect(buildWidgetData(state)).toBeNull();
  });

  it("returns WidgetData with correct temp (Celsius)", () => {
    const state = makeState({ temp: 23.7 });
    const data = buildWidgetData(state)!;
    expect(data.temp).toBe(24);
    expect(data.tempDisplay).toBe("24°");
    expect(data.tempUnit).toBe("C");
  });

  it("converts temp when unit is F", () => {
    const state = makeState({ temp: 20 }, { tempUnit: "F" });
    const data = buildWidgetData(state)!;
    expect(data.temp).toBe(68);
    expect(data.tempDisplay).toBe("68°F");
    expect(data.tempUnit).toBe("F");
  });

  it("rounds feelsLike", () => {
    const state = makeState({ feelsLike: 18.3 });
    const data = buildWidgetData(state)!;
    expect(data.feelsLike).toBe(18);
    expect(data.feelsLikeDisplay).toBe("18°");
  });

  it("maps condition to correct label", () => {
    const state = makeState({ condition: "rain" });
    expect(buildWidgetData(state)!.conditionLabel).toBe("비");
  });

  it("maps condition to correct emoji", () => {
    const state = makeState({ condition: "snow" });
    expect(buildWidgetData(state)!.conditionEmoji).toBe("❄️");
  });

  it("maps condition to correct textureKey", () => {
    const cases: Array<[string, string]> = [
      ["clear", "sunny"],
      ["clouds", "cloudy"],
      ["rain", "rainy"],
      ["drizzle", "rainy"],
      ["snow", "snowy"],
      ["thunderstorm", "stormy"],
      ["dust", "dusty"],
      ["fog", "cloudy"],
    ];
    for (const [condition, expected] of cases) {
      const state = makeState({ condition: condition as any });
      expect(buildWidgetData(state)!.textureKey).toBe(expected);
    }
  });

  it("extracts location name from saved locations", () => {
    const state = makeState();
    expect(buildWidgetData(state)!.locationName).toBe("서울 강남구");
  });

  it("extracts district (last segment of location name)", () => {
    const state = makeState();
    expect(buildWidgetData(state)!.district).toBe("강남구");
  });

  it("falls back to '현재 위치' when no location matched", () => {
    const state = makeState({}, { currentLocationId: "nonexistent" });
    const data = buildWidgetData(state)!;
    expect(data.locationName).toBe("현재 위치");
    expect(data.district).toBe("위치");
  });

  it("falls back when locations is empty", () => {
    const state = makeState({}, { locations: [], currentLocationId: null });
    const data = buildWidgetData(state)!;
    expect(data.locationName).toBe("현재 위치");
  });

  it("heroMessage reflects rain condition", () => {
    const state = makeState({ condition: "rain" });
    expect(buildWidgetData(state)!.heroMessage).toBe("우산 필수");
  });

  it("heroMessage reflects freezing condition", () => {
    const state = makeState({ feelsLike: -5 });
    expect(buildWidgetData(state)!.heroMessage).toBe("추위 주의");
  });

  it("heroMessage reflects good weather", () => {
    const state = makeState({ feelsLike: 20, condition: "clear" });
    expect(buildWidgetData(state)!.heroMessage).toBe("외출 좋음");
  });

  it("heroMessage reflects bad air quality", () => {
    const state = makeState({}, {
      airQuality: { pm25: 80, pm10: 120, aqi: 4, grade: "unhealthy" },
    });
    expect(buildWidgetData(state)!.heroMessage).toBe("대기질 나쁨");
  });

  it("heroMessage reflects extreme heat", () => {
    const state = makeState({ feelsLike: 35 });
    expect(buildWidgetData(state)!.heroMessage).toBe("폭염 주의");
  });

  it("heroMessage reflects snow", () => {
    const state = makeState({ condition: "snow" });
    expect(buildWidgetData(state)!.heroMessage).toBe("눈 주의");
  });

  it("updatedAt is a recent timestamp", () => {
    const before = Date.now();
    const data = buildWidgetData(makeState())!;
    expect(data.updatedAt).toBeGreaterThanOrEqual(before);
    expect(data.updatedAt).toBeLessThanOrEqual(Date.now());
  });

  it("artStyle defaults to 'default'", () => {
    const data = buildWidgetData(makeState())!;
    expect(data.artStyle).toBe("default");
  });

  it("handles single-word location name", () => {
    const state = makeState({}, {
      locations: [{ id: "loc1", name: "제주", lat: 33.5, lon: 126.5, isGps: false }],
    });
    const data = buildWidgetData(state)!;
    expect(data.locationName).toBe("제주");
    expect(data.district).toBe("제주");
  });

  it("handles multi-segment location name", () => {
    const state = makeState({}, {
      locations: [
        { id: "loc1", name: "경기도 성남시 분당구", lat: 37.4, lon: 127.1, isGps: false },
      ],
    });
    const data = buildWidgetData(state)!;
    expect(data.locationName).toBe("경기도 성남시 분당구");
    expect(data.district).toBe("분당구");
  });
});

// ─── WidgetData JSON serialization ───

describe("WidgetData serialization", () => {
  it("JSON roundtrip preserves all fields", () => {
    const state = makeState({ condition: "rain", temp: 15.6, feelsLike: 12.3 });
    const data = buildWidgetData(state)!;
    const parsed = JSON.parse(JSON.stringify(data));

    expect(parsed.temp).toBe(16);
    expect(parsed.feelsLike).toBe(12);
    expect(parsed.tempDisplay).toBe("16°");
    expect(parsed.feelsLikeDisplay).toBe("12°");
    expect(parsed.tempUnit).toBe("C");
    expect(parsed.condition).toBe("rain");
    expect(parsed.conditionLabel).toBe("비");
    expect(parsed.conditionEmoji).toBe("🌧️");
    expect(parsed.locationName).toBe("서울 강남구");
    expect(parsed.district).toBe("강남구");
    expect(parsed.heroMessage).toBe("우산 필수");
    expect(parsed.textureKey).toBe("rainy");
    expect(parsed.artStyle).toBe("default");
    expect(typeof parsed.updatedAt).toBe("number");
  });

  it("all required fields are present in serialized output", () => {
    const data = buildWidgetData(makeState())!;
    const expected = [
      "temp", "feelsLike", "tempDisplay", "feelsLikeDisplay", "tempUnit",
      "condition", "conditionLabel", "conditionEmoji",
      "locationName", "district", "heroMessage",
      "textureKey", "updatedAt", "cards", "aiSummary", "artStyle",
    ];
    for (const key of expected) {
      expect(data).toHaveProperty(key);
    }
  });
});

// ─── getWidgetTheme ───

describe("getWidgetTheme", () => {
  it("returns correct palette for known styles", () => {
    expect(getWidgetTheme("vangogh").accent).toBe("#F0C020");
    expect(getWidgetTheme("monet").bg).toBe("#2A5F6C");
    expect(getWidgetTheme("klimt").accent).toBe("#D4A017");
    expect(getWidgetTheme("popart").bg).toBe("#B50000");
    expect(getWidgetTheme("synthwave").accent).toBe("#FF2D78");
  });

  it("falls back to default theme for unknown style", () => {
    const unknown = getWidgetTheme("unknown_style");
    const def = getWidgetTheme("default");
    expect(unknown).toEqual(def);
  });

  it("every theme has bg, accent, text, sub, pill fields", () => {
    const styles = [
      "vangogh", "monet", "klimt", "gauguin", "popart",
      "bauhaus", "ukiyo", "synthwave", "default",
    ];
    for (const style of styles) {
      const t = getWidgetTheme(style);
      expect(t).toHaveProperty("bg");
      expect(t).toHaveProperty("accent");
      expect(t).toHaveProperty("text");
      expect(t).toHaveProperty("sub");
      expect(t).toHaveProperty("pill");
    }
  });

  it("all bg/accent colors are valid hex strings", () => {
    const hexRe = /^#[0-9A-Fa-f]{6,8}$/;
    const styles = ["vangogh", "monet", "default"];
    for (const style of styles) {
      const t = getWidgetTheme(style);
      expect(t.bg).toMatch(hexRe);
      expect(t.accent).toMatch(hexRe);
    }
  });
});

// ─── getWeatherIconSvg ───

describe("getWeatherIconSvg", () => {
  const conditions = ["clear", "clouds", "rain", "drizzle", "snow", "thunderstorm", "fog", "dust"];

  it("returns a non-empty SVG string for all conditions", () => {
    for (const cond of conditions) {
      const svg = getWeatherIconSvg(cond);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    }
  });

  it("falls back to a valid SVG for unknown condition", () => {
    const svg = getWeatherIconSvg("unknown");
    expect(svg).toContain("<svg");
  });

  it("uses the provided accent color in the SVG", () => {
    const svg = getWeatherIconSvg("clear", "#FF0000");
    expect(svg).toContain("#FF0000");
  });

  it("SVG output contains viewBox attribute", () => {
    for (const cond of conditions) {
      expect(getWeatherIconSvg(cond)).toContain("viewBox");
    }
  });
});

// ─── getArtworkImage / ART_STYLE_LABELS ───

describe("getArtworkImage", () => {
  const FREE_STYLES = ["vangogh", "monet", "klimt", "gauguin", "popart", "bauhaus", "ukiyo", "default"];
  const TEXTURES = ["sunny", "cloudy", "rainy", "snowy", "stormy", "dusty"];

  it("returns non-null for all free styles × textures", () => {
    for (const style of FREE_STYLES) {
      for (const tex of TEXTURES) {
        expect(getArtworkImage(style, tex)).not.toBeNull();
      }
    }
  });

  it("returns null for premium styles without artwork", () => {
    // 프리미엄 스타일은 이미지 없음 → default로 폴백
    // getArtworkImage는 ARTWORK[style] 없으면 ARTWORK.default 사용
    const result = getArtworkImage("synthwave", "sunny");
    expect(result).not.toBeNull(); // default 폴백
  });

  it("falls back to sunny when textureKey is unknown", () => {
    const fallback = getArtworkImage("vangogh", "unknown_texture");
    const sunny = getArtworkImage("vangogh", "sunny");
    expect(fallback).toEqual(sunny);
  });
});

describe("ART_STYLE_LABELS", () => {
  it("has labels for all free styles", () => {
    for (const style of FREE_STYLE_KEYS) {
      expect(ART_STYLE_LABELS[style]).toBeTruthy();
    }
  });

  it("has labels for all premium styles", () => {
    for (const style of PREMIUM_STYLE_KEYS) {
      expect(ART_STYLE_LABELS[style]).toBeTruthy();
    }
  });

  it("default style has empty label (no badge shown)", () => {
    expect(ART_STYLE_LABELS["default"]).toBe("");
  });
});
