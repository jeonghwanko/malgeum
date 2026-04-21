import {
  mapConditionToTexture,
  getConditionLabel,
  getWeatherIcon,
  windChill,
  heatIndex,
  getPm25Status,
  getUvStatus,
  getHumidityStatus,
  convertTemp,
  formatTemp,
  getFeelLabel,
  getClothingCopy,
  isRainCondition,
  getPollenStatus,
} from "../utils/weather";

// ─── mapConditionToTexture ───

describe("mapConditionToTexture", () => {
  it("clear → sunny", () => {
    expect(mapConditionToTexture("clear")).toBe("sunny");
  });

  it("clouds → cloudy", () => {
    expect(mapConditionToTexture("clouds")).toBe("cloudy");
  });

  it("rain → rainy", () => {
    expect(mapConditionToTexture("rain")).toBe("rainy");
  });

  it("drizzle → rainy", () => {
    expect(mapConditionToTexture("drizzle")).toBe("rainy");
  });

  it("snow → snowy", () => {
    expect(mapConditionToTexture("snow")).toBe("snowy");
  });

  it("thunderstorm → stormy", () => {
    expect(mapConditionToTexture("thunderstorm")).toBe("stormy");
  });

  it("dust → dusty", () => {
    expect(mapConditionToTexture("dust")).toBe("dusty");
  });

  it("fog → cloudy", () => {
    expect(mapConditionToTexture("fog")).toBe("cloudy");
  });
});

// ─── getConditionLabel ───

describe("getConditionLabel", () => {
  it("returns 한글 labels for all conditions", () => {
    expect(getConditionLabel("clear")).toBe("맑음");
    expect(getConditionLabel("rain")).toBe("비");
    expect(getConditionLabel("snow")).toBe("눈");
    expect(getConditionLabel("thunderstorm")).toBe("뇌우");
    expect(getConditionLabel("fog")).toBe("안개");
    expect(getConditionLabel("dust")).toBe("미세먼지");
  });
});

// ─── getWeatherIcon ───

describe("getWeatherIcon", () => {
  it("daytime clear → clear-day", () => {
    expect(getWeatherIcon("clear", false)).toBe("clear-day");
  });

  it("nighttime clear → clear-night", () => {
    expect(getWeatherIcon("clear", true)).toBe("clear-night");
  });

  it("daytime clouds → partly-cloudy-day", () => {
    expect(getWeatherIcon("clouds", false)).toBe("partly-cloudy-day");
  });

  it("rain is same day/night", () => {
    expect(getWeatherIcon("rain", false)).toBe("rain");
    expect(getWeatherIcon("rain", true)).toBe("rain");
  });
});

// ─── windChill ───

describe("windChill", () => {
  it("returns temp unchanged when temp > 10", () => {
    expect(windChill(15, 5)).toBe(15);
  });

  it("returns temp unchanged when wind too low", () => {
    // 1 m/s = 3.6 km/h < 4.8
    expect(windChill(5, 1)).toBe(5);
  });

  it("calculates wind chill for cold + windy", () => {
    const result = windChill(0, 5); // 0°C, 5 m/s = 18 km/h
    expect(result).toBeLessThan(0);
    expect(typeof result).toBe("number");
  });

  it("colder with stronger wind", () => {
    const mild = windChill(5, 3); // 10.8 km/h
    const strong = windChill(5, 8); // 28.8 km/h
    expect(strong).toBeLessThan(mild);
  });
});

// ─── heatIndex ───

describe("heatIndex", () => {
  it("returns temp unchanged when temp < 27", () => {
    expect(heatIndex(25, 80)).toBe(25);
  });

  it("returns temp unchanged when humidity < 40", () => {
    expect(heatIndex(30, 30)).toBe(30);
  });

  it("calculates heat index for hot + humid", () => {
    const result = heatIndex(35, 70);
    expect(result).toBeGreaterThan(35);
  });

  it("higher humidity → higher heat index", () => {
    const low = heatIndex(32, 50);
    const high = heatIndex(32, 80);
    expect(high).toBeGreaterThan(low);
  });
});

// ─── getPm25Status ───

describe("getPm25Status", () => {
  it("좋음 for low values", () => {
    expect(getPm25Status(10)).toEqual({ label: "좋음", status: "safe" });
  });

  it("보통 for moderate values", () => {
    expect(getPm25Status(25)).toEqual({ label: "보통", status: "caution" });
  });

  it("나쁨 for high values", () => {
    expect(getPm25Status(50)).toEqual({ label: "나쁨", status: "warn" });
  });

  it("boundary: 15 is 좋음", () => {
    expect(getPm25Status(15).status).toBe("safe");
  });

  it("boundary: 16 is 보통", () => {
    expect(getPm25Status(16).status).toBe("caution");
  });

  it("boundary: 35 is 보통", () => {
    expect(getPm25Status(35).status).toBe("caution");
  });

  it("boundary: 36 is 나쁨", () => {
    expect(getPm25Status(36).status).toBe("warn");
  });
});

// ─── getUvStatus ───

describe("getUvStatus", () => {
  it("낮음 for uv 0~2", () => {
    expect(getUvStatus(1)).toEqual({ label: "낮음", status: "safe" });
  });

  it("보통 for uv 3~5", () => {
    expect(getUvStatus(4)).toEqual({ label: "보통", status: "caution" });
  });

  it("높음 for uv 6+", () => {
    expect(getUvStatus(8)).toEqual({ label: "높음", status: "warn" });
  });
});

// ─── getHumidityStatus ───

describe("getHumidityStatus", () => {
  it("쾌적 for 30~60%", () => {
    expect(getHumidityStatus(50)).toEqual({ label: "쾌적", status: "safe" });
  });

  it("높음 for 61~80%", () => {
    expect(getHumidityStatus(70)).toEqual({ label: "높음", status: "caution" });
  });

  it("건조 for < 30%", () => {
    const result = getHumidityStatus(20);
    expect(result.label).toBe("건조");
    expect(result.status).toBe("warn");
  });

  it("매우 높음 for > 80%", () => {
    const result = getHumidityStatus(90);
    expect(result.label).toBe("매우 높음");
    expect(result.status).toBe("warn");
  });
});

// ─── convertTemp ───

describe("convertTemp", () => {
  it("C → C는 반올림만", () => {
    expect(convertTemp(22.4, "C")).toBe(22);
    expect(convertTemp(22.6, "C")).toBe(23);
  });

  it("C → F 변환", () => {
    expect(convertTemp(0, "F")).toBe(32);
    expect(convertTemp(100, "F")).toBe(212);
    expect(convertTemp(37, "F")).toBe(99); // 체온
  });
});

// ─── formatTemp ───

describe("formatTemp", () => {
  it("C 단위는 '°' suffix", () => {
    expect(formatTemp(22, "C")).toBe("22°");
  });

  it("F 단위는 '°F' suffix", () => {
    expect(formatTemp(0, "F")).toBe("32°F");
  });
});

// ─── getFeelLabel ───

describe("getFeelLabel", () => {
  it("0도 이하 → 매우 추워요", () => {
    expect(getFeelLabel(-5)).toBe("매우 추워요");
    expect(getFeelLabel(0)).toBe("매우 추워요");
  });

  it("22도 → 적당해요", () => {
    expect(getFeelLabel(22)).toBe("적당해요");
  });

  it("33도 → 매우 더워요", () => {
    expect(getFeelLabel(33)).toBe("매우 더워요");
  });
});

// ─── getClothingCopy ───

describe("getClothingCopy", () => {
  it("0도 이하 → 패딩 관련 문구", () => {
    const copy = getClothingCopy(-5);
    expect(copy).toContain("패딩");
  });

  it("5도 이하 → 패딩 문구", () => {
    expect(getClothingCopy(3)).toContain("패딩");
  });

  it("22도 → 반팔 포함", () => {
    expect(getClothingCopy(22)).toContain("반팔");
  });

  it("33도 이상 → 시원하게", () => {
    expect(getClothingCopy(33)).toContain("시원");
  });

  it("tempOffset 적용 — 17도에 offset -2 → 가디건 추천 (15도 기준)", () => {
    expect(getClothingCopy(17, -2)).toContain("가디건");
  });

  it("tempOffset 적용 — 15도에 offset +2 → 반팔 포함 (17도 기준)", () => {
    expect(getClothingCopy(15, 2)).toContain("반팔");
  });

  it("tempOffset 기본값 0 — 기존 동작 유지", () => {
    expect(getClothingCopy(22)).toBe(getClothingCopy(22, 0));
  });
});

// ─── isRainCondition ───

describe("isRainCondition", () => {
  it("rain → true", () => expect(isRainCondition("rain")).toBe(true));
  it("drizzle → true", () => expect(isRainCondition("drizzle")).toBe(true));
  it("thunderstorm → true", () => expect(isRainCondition("thunderstorm")).toBe(true));
  it("clear → false", () => expect(isRainCondition("clear")).toBe(false));
  it("snow → false (별도 처리)", () => expect(isRainCondition("snow")).toBe(false));
  it("clouds → false", () => expect(isRainCondition("clouds")).toBe(false));
});

// ─── getPollenStatus ───

describe("getPollenStatus", () => {
  it("비 오는 날은 낮음", () => {
    const result = getPollenStatus(20, 60, 2, "rain");
    expect(result.status).toBe("safe");
    expect(result.label).toBe("낮음");
  });

  it("눈 오는 날은 낮음", () => {
    const result = getPollenStatus(0, 60, 1, "snow");
    expect(result.label).toBe("낮음");
  });

  it("맑음 날씨에는 safe/caution/warn 중 하나", () => {
    const result = getPollenStatus(20, 40, 3, "clear");
    expect(["safe", "caution", "warn"]).toContain(result.status);
  });

  it("progress는 0~1 사이", () => {
    const result = getPollenStatus(15, 50, 2, "clear");
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(1);
  });

  it("label은 낮음/보통/높음/매우 높음 중 하나", () => {
    const labels = ["낮음", "보통", "높음", "매우 높음"];
    const result = getPollenStatus(20, 40, 5, "clear");
    expect(labels).toContain(result.label);
  });
});
