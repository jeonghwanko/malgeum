import {
  getHeroMessage,
  generateActionCards,
  getCommuteComparison,
  detectWeatherChanges,
} from "../utils/recommendations";
import type { WeatherBundle, HourlyWeather } from "../types/weather";

// ─── helpers ───

function makeBundle(overrides: Partial<WeatherBundle["current"]> = {}, extras: Partial<WeatherBundle> = {}): WeatherBundle {
  return {
    current: {
      temp: 22, feelsLike: 20, humidity: 50, windSpeed: 2,
      condition: "clear", description: "맑음", icon: "01d",
      uvIndex: 3, precipitation: 0, sunrise: 0, sunset: 0,
      ...overrides,
    },
    hourly: extras.hourly ?? [],
    hourlyAir: extras.hourlyAir ?? [],
    hourlyUv: extras.hourlyUv ?? [],
    daily: extras.daily ?? [],
    airQuality: extras.airQuality ?? null,
    pollen: extras.pollen ?? null,
    fetchedAt: Date.now(),
  };
}

function makeHourly(hour: number, overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  const dt = new Date();
  dt.setHours(hour, 0, 0, 0);
  return {
    dt: Math.floor(dt.getTime() / 1000),
    temp: 20,
    feelsLike: 18,
    condition: "clear",
    precipitation: 0,
    icon: "01d",
    ...overrides,
  };
}

// ─── getHeroMessage ───

describe("getHeroMessage", () => {
  it("rain → 비 관련 메시지", () => {
    const bundle = makeBundle({ condition: "rain" });
    const hero = getHeroMessage(bundle);
    expect(hero.message.length).toBeGreaterThan(0);
    expect(hero.status).toBe("warn");
  });

  it("snow → 눈 메시지", () => {
    const bundle = makeBundle({ condition: "snow" });
    const hero = getHeroMessage(bundle);
    expect(hero.message.length).toBeGreaterThan(0);
    expect(hero.status).toBe("warn");
  });

  it("bad air quality → 미세먼지 관련", () => {
    const bundle = makeBundle({}, {
      airQuality: { pm25: 80, pm10: 120, aqi: 4, grade: "unhealthy" },
    });
    const hero = getHeroMessage(bundle);
    expect(hero.message.length).toBeGreaterThan(0);
    expect(hero.status).toBe("warn");
  });

  it("freezing → 추위 관련", () => {
    const bundle = makeBundle({ feelsLike: -5 });
    const hero = getHeroMessage(bundle);
    expect(hero.message.length).toBeGreaterThan(0);
    expect(hero.status).toBe("caution");
  });

  it("extreme heat → 더위 관련", () => {
    const bundle = makeBundle({ feelsLike: 35 });
    const hero = getHeroMessage(bundle);
    expect(hero.message.length).toBeGreaterThan(0);
    expect(hero.status).toBe("warn");
  });

  it("nice weather → 가볍게", () => {
    const bundle = makeBundle({ feelsLike: 20, condition: "clear" });
    const hero = getHeroMessage(bundle);
    expect(hero.status).toBe("safe");
  });
});

// ─── generateActionCards ───

describe("generateActionCards", () => {
  it("always includes clothing card", () => {
    const bundle = makeBundle();
    const cards = generateActionCards(bundle);
    expect(cards.some((c) => c.category === "clothing")).toBe(true);
  });

  it("high precipitation → umbrella card", () => {
    const bundle = makeBundle({ precipitation: 70 });
    const cards = generateActionCards(bundle);
    const umbrella = cards.find((c) => c.category === "umbrella");
    expect(umbrella).toBeDefined();
    expect(umbrella!.status).toBe("warn");
  });

  it("clear + good air → outdoor card", () => {
    const bundle = makeBundle(
      { condition: "clear", feelsLike: 20 },
      { airQuality: { pm25: 10, pm10: 20, aqi: 1, grade: "good" } },
    );
    const cards = generateActionCards(bundle);
    expect(cards.some((c) => c.id === "outdoor-activity")).toBe(true);
  });

  it("rain → indoor exercise card", () => {
    const bundle = makeBundle({ condition: "rain" });
    const cards = generateActionCards(bundle);
    expect(cards.some((c) => c.id === "indoor-exercise")).toBe(true);
  });

  it("high UV → sunscreen card", () => {
    const bundle = makeBundle({ uvIndex: 8 });
    const cards = generateActionCards(bundle);
    expect(cards.some((c) => c.id === "sunscreen")).toBe(true);
  });

  it("returns max 6 cards", () => {
    const bundle = makeBundle(
      { condition: "rain", uvIndex: 8, precipitation: 80 },
      { airQuality: { pm25: 80, pm10: 120, aqi: 4, grade: "unhealthy" } },
    );
    const cards = generateActionCards(bundle);
    expect(cards.length).toBeLessThanOrEqual(6);
  });

  it("cards are sorted by priority (ascending)", () => {
    const bundle = makeBundle(
      { condition: "clear", uvIndex: 8, precipitation: 0, feelsLike: 20 },
      { airQuality: { pm25: 10, pm10: 20, aqi: 1, grade: "good" } },
    );
    const cards = generateActionCards(bundle);
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].priority).toBeGreaterThanOrEqual(cards[i - 1].priority);
    }
  });
});

// ─── getCommuteComparison ───

describe("getCommuteComparison", () => {
  it("returns null for empty hourly", () => {
    expect(getCommuteComparison([], "08:00", "18:00")).toBeNull();
  });

  it("computes temp diff correctly", () => {
    const hourly = [
      makeHourly(8, { temp: 15, feelsLike: 13 }),
      makeHourly(12, { temp: 22, feelsLike: 20 }),
      makeHourly(18, { temp: 20, feelsLike: 18 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result).not.toBeNull();
    expect(result!.tempDiff).toBe(5); // 20 - 15
  });

  it("needUmbrella when departure has rain", () => {
    const hourly = [
      makeHourly(8, { precipitation: 60 }),
      makeHourly(18, { precipitation: 10 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result!.needUmbrella).toBe(true);
  });

  it("needUmbrella when return has rain", () => {
    const hourly = [
      makeHourly(8, { precipitation: 10 }),
      makeHourly(18, { precipitation: 50 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result!.needUmbrella).toBe(true);
  });

  it("no umbrella when both dry", () => {
    const hourly = [
      makeHourly(8, { precipitation: 10 }),
      makeHourly(18, { precipitation: 20 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result!.needUmbrella).toBe(false);
  });

  it("big temp drop → 겉옷 recommendation", () => {
    const hourly = [
      makeHourly(8, { temp: 20, feelsLike: 18 }),
      makeHourly(18, { temp: 10, feelsLike: 8 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result!.recommendation).toContain("겉옷");
  });

  it("includes feelsLike in slots", () => {
    const hourly = [
      makeHourly(8, { temp: 15, feelsLike: 12 }),
      makeHourly(18, { temp: 20, feelsLike: 18 }),
    ];
    const result = getCommuteComparison(hourly, "08:00", "18:00");
    expect(result!.departure.feelsLike).toBe(12);
    expect(result!.returnTrip.feelsLike).toBe(18);
  });
});

// ─── detectWeatherChanges ───

describe("detectWeatherChanges", () => {
  it("returns empty for insufficient data", () => {
    expect(detectWeatherChanges([])).toEqual([]);
    expect(detectWeatherChanges([makeHourly(8)])).toEqual([]);
  });

  it("detects rain start", () => {
    const hourly = [
      makeHourly(8, { precipitation: 10 }),
      makeHourly(9, { precipitation: 60 }),
    ];
    const changes = detectWeatherChanges(hourly);
    expect(changes.some((c) => c.type === "rain_start")).toBe(true);
  });

  it("detects rain stop", () => {
    const hourly = [
      makeHourly(14, { precipitation: 70 }),
      makeHourly(15, { precipitation: 5 }),
    ];
    const changes = detectWeatherChanges(hourly);
    expect(changes.some((c) => c.type === "rain_stop")).toBe(true);
  });

  it("detects temp drop", () => {
    const hourly = [
      makeHourly(14, { temp: 25 }),
      makeHourly(15, { temp: 19 }),
    ];
    const changes = detectWeatherChanges(hourly);
    expect(changes.some((c) => c.type === "temp_drop")).toBe(true);
  });

  it("no change when weather is stable", () => {
    const hourly = [
      makeHourly(8, { temp: 20, precipitation: 10 }),
      makeHourly(9, { temp: 21, precipitation: 15 }),
      makeHourly(10, { temp: 22, precipitation: 12 }),
    ];
    const changes = detectWeatherChanges(hourly);
    expect(changes).toEqual([]);
  });
});
