import { getConditionEmoji, buildFallbackBundle, FALLBACK_CURRENT } from "../constants/weather-assets";
import type { CurrentWeather, WeatherCondition } from "../types/weather";

// ─── getConditionEmoji ───

describe("getConditionEmoji", () => {
  const cases: [WeatherCondition, string][] = [
    ["clear", "☀️"],
    ["rain", "🌧️"],
    ["snow", "❄️"],
    ["thunderstorm", "⛈️"],
    ["fog", "🌫️"],
    ["dust", "😷"],
    ["clouds", "⛅"],
    ["drizzle", "🌦️"],
  ];

  it.each(cases)("%s → %s", (condition, expected) => {
    expect(getConditionEmoji(condition)).toBe(expected);
  });
});

// ─── buildFallbackBundle ───

describe("buildFallbackBundle", () => {
  it("uses FALLBACK_CURRENT when current is null", () => {
    const bundle = buildFallbackBundle(null, [], [], null);
    expect(bundle.current).toBe(FALLBACK_CURRENT);
    expect(bundle.current.temp).toBe(24);
    expect(bundle.current.condition).toBe("clear");
  });

  it("uses provided current when available", () => {
    const current: CurrentWeather = {
      temp: 10, feelsLike: 8, humidity: 80, windSpeed: 5,
      condition: "rain", description: "비", icon: "09d",
      uvIndex: 1, precipitation: 90, sunrise: 0, sunset: 0,
    };
    const bundle = buildFallbackBundle(current, [], [], null);
    expect(bundle.current.temp).toBe(10);
    expect(bundle.current.condition).toBe("rain");
  });

  it("passes through hourly, daily, airQuality", () => {
    const hourly = [{ dt: 123, temp: 20, feelsLike: 18, condition: "clear" as const, precipitation: 0, icon: "01d" }];
    const daily = [{ dt: 456, tempMin: 15, tempMax: 25, condition: "clear" as const, precipitation: 0 }];
    const aq = { pm25: 12, pm10: 25, aqi: 1, grade: "good" as const };

    const bundle = buildFallbackBundle(null, hourly, daily, aq);
    expect(bundle.hourly).toHaveLength(1);
    expect(bundle.daily).toHaveLength(1);
    expect(bundle.airQuality?.grade).toBe("good");
  });

  it("always sets pollen to null", () => {
    const bundle = buildFallbackBundle(null, [], [], null);
    expect(bundle.pollen).toBeNull();
  });

  it("sets fetchedAt to current time", () => {
    const before = Date.now();
    const bundle = buildFallbackBundle(null, [], [], null);
    expect(bundle.fetchedAt).toBeGreaterThanOrEqual(before);
    expect(bundle.fetchedAt).toBeLessThanOrEqual(Date.now());
  });
});
