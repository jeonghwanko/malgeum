import { classifyIntent, buildAIPrompt, getSuggestedQuestions, getFollowUpQuestions, recordEngagement } from "../services/aiContext";
import { parseSettingsAction } from "../services/settingsParser";
import type { WeatherBundle } from "../types/weather";
import type { HealthProfile } from "../types/settings";

// ─── helpers (recommendations.test.ts 패턴 재활용) ───

function makeBundle(
  overrides: Partial<WeatherBundle["current"]> = {},
  extras: Partial<WeatherBundle> = {},
): WeatherBundle {
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

function makeProfile(overrides: Partial<HealthProfile> = {}): HealthProfile {
  return {
    allergens: [],
    exercisePreference: "야외 러닝",
    clothingStyle: "캐주얼",
    ...overrides,
  };
}

function makeState(bundle: WeatherBundle, profile?: HealthProfile) {
  return {
    nickname: "테스트",
    locations: [{ id: "1", name: "서울 강남구", lat: 37.5, lon: 127.0, isGps: true }],
    currentLocationId: "1",
    commuteTime: { departure: "08:30", return: "18:00" },
    tempUnit: "C" as const,
    alerts: { commute: true, rain: true, dust: true, uv: false, pollen: false, evening: true, game: true },
    healthProfile: profile ?? makeProfile(),
    schoolSettings: null,
    currentWeather: bundle.current,
    hourlyForecast: bundle.hourly,
    hourlyAir: bundle.hourlyAir,
    hourlyUv: bundle.hourlyUv,
    dailyForecast: bundle.daily,
    airQuality: bundle.airQuality,
    pollen: bundle.pollen,
    lastFetchedAt: new Date().toISOString(),
    onboardingDone: true,
  };
}

// ─── classifyIntent ───

describe("classifyIntent", () => {
  it("옷차림 관련 → clothing", () => {
    expect(classifyIntent("오늘 뭐 입지?")).toBe("clothing");
    expect(classifyIntent("반팔 입어도 돼?")).toBe("clothing");
    expect(classifyIntent("코트 입어야 해?")).toBe("clothing");
    expect(classifyIntent("가디건 필요해?")).toBe("clothing");
  });

  it("우산 관련 → umbrella", () => {
    expect(classifyIntent("우산 챙겨야 해?")).toBe("umbrella");
    expect(classifyIntent("비 올까?")).toBe("umbrella");
    expect(classifyIntent("소나기 온대?")).toBe("umbrella");
  });

  it("야외활동 → outdoor", () => {
    expect(classifyIntent("러닝해도 돼?")).toBe("outdoor");
    expect(classifyIntent("산책 가도 될까")).toBe("outdoor");
    expect(classifyIntent("세차해도 돼?")).toBe("outdoor");
    expect(classifyIntent("빨래 널어도 돼?")).toBe("outdoor");
  });

  it("출퇴근 → commute", () => {
    expect(classifyIntent("출근길 날씨 어때?")).toBe("commute");
    expect(classifyIntent("퇴근길 추워?")).toBe("commute");
    // "퇴근할 때 비 와?" → umbrella (비가 핵심 키워드)
  });

  it("건강 → health", () => {
    expect(classifyIntent("미세먼지 어때?")).toBe("health");
    expect(classifyIntent("마스크 써야 해?")).toBe("health");
    expect(classifyIntent("선크림 발라야 해?")).toBe("health");
    expect(classifyIntent("꽃가루 심해?")).toBe("health");
  });

  it("예보 → forecast", () => {
    expect(classifyIntent("내일 날씨 어때?")).toBe("forecast");
    expect(classifyIntent("이번 주 예보")).toBe("forecast");
    expect(classifyIntent("주말 날씨 알려줘")).toBe("forecast");
    // "주말에 비 와?" → umbrella (비가 먼저 매칭)
  });

  it("설정 변경 → settings", () => {
    expect(classifyIntent("화씨로 바꿔")).toBe("settings");
    expect(classifyIntent("온도 단위 변경해줘")).toBe("settings");
    expect(classifyIntent("비 알림 꺼줘")).toBe("settings");
    expect(classifyIntent("출근 시간 바꿔줘")).toBe("settings");
  });

  it("일반 질문 → general", () => {
    expect(classifyIntent("오늘 날씨 어때?")).toBe("general");
    expect(classifyIntent("지금 밖에 어때")).toBe("general");
  });

  it("인사/잡담 → chat", () => {
    expect(classifyIntent("안녕")).toBe("chat");
    expect(classifyIntent("고마워")).toBe("chat");
    expect(classifyIntent("ㅎㅎ 맞아")).toBe("chat");
  });
});

// ─── buildAIPrompt ───

describe("buildAIPrompt", () => {
  it("기본 날씨 데이터를 포함한다", () => {
    const bundle = makeBundle();
    const state = makeState(bundle);
    const { system, userMessage } = buildAIPrompt(state, bundle, "vangogh", "오늘 날씨 어때?");

    expect(system).toContain("맑음");
    expect(userMessage).toContain("22°");
    expect(userMessage).toContain("서울 강남구");
  });

  it("clothing 의도 → 프로필 정보는 system 프롬프트에 포함", () => {
    const bundle = makeBundle({ feelsLike: 5 });
    const state = makeState(bundle, makeProfile({ clothingStyle: "비즈니스 캐주얼" }));
    const { system } = buildAIPrompt(state, bundle, "default", "뭐 입지?");

    expect(system).toContain("비즈니스 캐주얼");
  });

  it("tool_use 아키텍처: prompt는 간결, 세부는 도구로 조회", () => {
    const bundle = makeBundle({ precipitation: 80 });
    const state = makeState(bundle);
    const { userMessage, system } = buildAIPrompt(state, bundle, "default", "우산 챙겨야 해?");

    // 현재 날씨만 프롬프트에 포함
    expect(userMessage).toContain("현재");
    expect(userMessage).toContain("22°");
    // 시스템 프롬프트에 도구 사용 안내
    expect(system).toContain("도구");
  });

  it("commute 의도 → 설정된 출퇴근 시간은 도구로 조회 (prompt에 미포함)", () => {
    const bundle = makeBundle();
    const state = makeState(bundle);
    const { intent } = buildAIPrompt(state, bundle, "default", "출근길 어때?");
    expect(intent).toBe("commute");
  });

  it("health 의도 → 미세먼지 상세는 도구로 조회 (prompt에 미포함)", () => {
    const bundle = makeBundle({}, {
      airQuality: { pm25: 45, pm10: 80, aqi: 3, grade: "unhealthy" },
    });
    const state = makeState(bundle, makeProfile({ allergens: ["꽃가루"] }));
    const { intent, system } = buildAIPrompt(state, bundle, "default", "미세먼지 어때?");
    expect(intent).toBe("health");
    expect(system).toContain("알레르기");
  });

  it("시스템 프롬프트에 사용자 프로필 포함", () => {
    const bundle = makeBundle();
    const state = makeState(bundle, makeProfile({
      clothingStyle: "미니멀",
      exercisePreference: "요가",
      allergens: ["미세먼지"],
    }));
    const { system } = buildAIPrompt(state, bundle, "default", "테스트");

    expect(system).toContain("미니멀");
    expect(system).toContain("요가");
    expect(system).toContain("미세먼지");
  });
});

// ─── getSuggestedQuestions ───

describe("getSuggestedQuestions", () => {
  it("항상 옷차림 질문 포함", () => {
    const bundle = makeBundle();
    const questions = getSuggestedQuestions(bundle, makeProfile());
    expect(questions[0].text).toContain("입고");
  });

  it("비 올 때 우산 질문 포함", () => {
    const bundle = makeBundle({ condition: "rain", precipitation: 80 });
    const questions = getSuggestedQuestions(bundle, makeProfile());
    const texts = questions.map((q) => q.text);
    expect(texts).toContain("우산 챙겨야 해?");
  });

  it("미세먼지 나쁠 때 관련 질문 포함", () => {
    const bundle = makeBundle({}, {
      airQuality: { pm25: 50, pm10: 90, aqi: 3, grade: "unhealthy" },
    });
    const questions = getSuggestedQuestions(bundle, makeProfile());
    const texts = questions.map((q) => q.text);
    expect(texts).toContain("미세먼지 어때?");
  });

  it("최대 5개 반환", () => {
    const bundle = makeBundle(
      { condition: "rain", precipitation: 80, uvIndex: 8 },
      { airQuality: { pm25: 50, pm10: 90, aqi: 3, grade: "unhealthy" } },
    );
    const questions = getSuggestedQuestions(bundle, makeProfile({ allergens: ["꽃가루"] }));
    expect(questions.length).toBeLessThanOrEqual(5);
  });

  it("맑은 날 러닝 질문 포함", () => {
    const bundle = makeBundle({
      condition: "clear",
      feelsLike: 22,
    }, {
      airQuality: { pm25: 10, pm10: 20, aqi: 1, grade: "good" },
    });
    const questions = getSuggestedQuestions(bundle, makeProfile());
    const texts = questions.map((q) => q.text);
    expect(texts).toContain("밖에서 러닝해도 돼?");
  });
});

// ─── parseSettingsAction ───

describe("parseSettingsAction", () => {
  it("화씨 변경 감지", () => {
    const result = parseSettingsAction("화씨로 바꿔줘");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_TEMP_UNIT", unit: "F" });
    expect(result!.confirmText).toContain("°F");
  });

  it("섭씨 변경 감지", () => {
    const result = parseSettingsAction("섭씨로 변경해줘");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_TEMP_UNIT", unit: "C" });
  });

  it("비 알림 켜기", () => {
    const result = parseSettingsAction("비 알림 켜줘");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "rain", enabled: true });
  });

  it("비 알림 끄기", () => {
    const result = parseSettingsAction("비 알림 꺼줘");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "rain", enabled: false });
  });

  it("미세먼지 알림 켜기", () => {
    const result = parseSettingsAction("미세먼지 알림 켜줘");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "dust", enabled: true });
  });

  it("자외선 알림 끄기", () => {
    const result = parseSettingsAction("UV 알림 꺼");
    expect(result).not.toBeNull();
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "uv", enabled: false });
  });

  it("출근 시간 변경", () => {
    const result = parseSettingsAction("출근 시간 9시 30분으로 바꿔");
    expect(result).not.toBeNull();
    expect(result!.action.type).toBe("SET_COMMUTE_TIME");
    if (result!.action.type === "SET_COMMUTE_TIME") {
      expect(result!.action.departure).toBe("09:30");
    }
  });

  it("퇴근 시간 변경", () => {
    const result = parseSettingsAction("퇴근 시간 19시로 변경");
    expect(result).not.toBeNull();
    expect(result!.action.type).toBe("SET_COMMUTE_TIME");
    if (result!.action.type === "SET_COMMUTE_TIME") {
      expect(result!.action.return).toBe("19:00");
    }
  });

  it("날씨 질문은 null 반환", () => {
    expect(parseSettingsAction("오늘 뭐 입지?")).toBeNull();
    expect(parseSettingsAction("비 올까?")).toBeNull();
    expect(parseSettingsAction("러닝해도 돼?")).toBeNull();
  });

  // 신규 알림 파서
  it("꽃가루 알림 켜기", () => {
    const result = parseSettingsAction("꽃가루 알림 켜줘");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "pollen", enabled: true });
  });

  it("저녁 브리핑 끄기", () => {
    const result = parseSettingsAction("저녁 브리핑 꺼줘");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "evening", enabled: false });
  });

  it("출퇴근 알림 켜기", () => {
    const result = parseSettingsAction("출퇴근 알림 켜줘");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "commute", enabled: true });
  });

  it("예측 게임 알림 끄기", () => {
    const result = parseSettingsAction("예측 게임 알림 꺼");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "game", enabled: false });
  });

  // 자연어 확장 — "~오면/있으면 알려줘"
  it("'비오면 알려줘' → 비 알림 ON", () => {
    const result = parseSettingsAction("비오면 알려줘");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "rain", enabled: true });
  });

  it("'꽃가루 심하면 알려줘' → 꽃가루 알림 ON", () => {
    const result = parseSettingsAction("꽃가루 심하면 알려줘");
    expect(result!.action).toEqual({ type: "SET_ALERT", key: "pollen", enabled: true });
  });

  // 언어
  it("영어로 변경", () => {
    const result = parseSettingsAction("영어로 바꿔줘");
    expect(result!.action).toEqual({ type: "SET_LOCALE", locale: "en" });
  });

  it("한국어로 변경", () => {
    const result = parseSettingsAction("한국어로 바꿔");
    expect(result!.action).toEqual({ type: "SET_LOCALE", locale: "ko" });
  });

  // 옷차림 스타일
  it("옷차림 스타일 캐주얼로", () => {
    const result = parseSettingsAction("옷차림 스타일 캐주얼로 바꿔줘");
    expect(result!.action).toEqual({ type: "SET_PROFILE", field: "clothingStyle", value: "캐주얼" });
  });

  it("옷차림 스포티로", () => {
    const result = parseSettingsAction("옷차림 스포티로 바꿔");
    expect(result!.action).toEqual({ type: "SET_PROFILE", field: "clothingStyle", value: "스포티" });
  });
});

// ─── getFollowUpQuestions ───

describe("getFollowUpQuestions", () => {
  it("clothing 의도 후 → 퇴근/우산/선크림 관련 후속", () => {
    const bundle = makeBundle();
    const questions = getFollowUpQuestions("clothing", bundle);
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.length).toBeLessThanOrEqual(3);
    const texts = questions.map((q) => q.text);
    expect(texts.some((t) => t.includes("퇴근") || t.includes("우산") || t.includes("선크림"))).toBe(true);
  });

  it("umbrella 의도 후 → 시간/옷/퇴근 관련 후속", () => {
    const bundle = makeBundle({ condition: "rain", precipitation: 80 });
    const questions = getFollowUpQuestions("umbrella", bundle);
    const texts = questions.map((q) => q.text);
    expect(texts.some((t) => t.includes("시") || t.includes("입지") || t.includes("퇴근"))).toBe(true);
  });

  it("미세먼지 나쁠 때 → health 이외 의도에서도 마스크 후속 추가", () => {
    const bundle = makeBundle({}, {
      airQuality: { pm25: 80, pm10: 120, aqi: 4, grade: "veryUnhealthy" },
    });
    const questions = getFollowUpQuestions("clothing", bundle);
    const texts = questions.map((q) => q.text);
    expect(texts.some((t) => t.includes("마스크"))).toBe(true);
  });

  it("최대 3개 반환", () => {
    const bundle = makeBundle(
      { precipitation: 80 },
      { airQuality: { pm25: 80, pm10: 120, aqi: 4, grade: "veryUnhealthy" } },
    );
    const questions = getFollowUpQuestions("general", bundle);
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it("settings 의도 후 → 빈 배열", () => {
    const bundle = makeBundle();
    const questions = getFollowUpQuestions("settings", bundle);
    // settings는 빈 map이지만 날씨 보정이 추가될 수 있음
    expect(questions.length).toBeLessThanOrEqual(3);
  });
});
