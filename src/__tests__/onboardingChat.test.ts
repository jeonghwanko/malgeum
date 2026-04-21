/**
 * D1 온보딩 챗 컨트롤러 테스트
 */
import {
  STEP_FLOW,
  nextStep,
  buildGreetingMessages,
  buildStepMessage,
  buildBriefMessages,
  buildConfirmText,
  buildSummaryItems,
  applyStepAnswer,
} from "../services/onboardingChat";
import type { Action, AppState } from "../context/weatherReducer";
import type { BriefLine } from "../services/microcopy";

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    nickname: "테스트",
    locations: [],
    currentLocationId: null,
    commuteTime: { departure: "08:30", return: "18:00" },
    tempUnit: "C",
    alerts: { commute: false, rain: false, dust: false, uv: false, pollen: false, evening: false, game: false },
    healthProfile: { allergens: [], exercisePreference: "", clothingStyle: "" },
    schoolSettings: null,
    currentWeather: null,
    hourlyForecast: [],
    hourlyAir: [],
    hourlyUv: [],
    dailyForecast: [],
    airQuality: null,
    pollen: null,
    lastFetchedAt: null,
    onboardingDone: true,
    ...overrides,
  };
}

describe("nextStep", () => {
  it("STEP_FLOW 순서대로 진행", () => {
    expect(nextStep("greeting")).toBe("subway");
    expect(nextStep("subway")).toBe("rain-alert");
    expect(nextStep("rain-alert")).toBe("dust-alert");
    expect(nextStep("dust-alert")).toBe("interests-festival");
    expect(nextStep("interests-festival")).toBe("interests-camping");
    expect(nextStep("interests-camping")).toBe("clothing");
    expect(nextStep("clothing")).toBe("try-typing");
    expect(nextStep("try-typing")).toBe("brief");
    expect(nextStep("brief")).toBe("done");
    expect(nextStep("done")).toBe("done");
  });

  it("STEP_FLOW 배열과 일관", () => {
    expect(STEP_FLOW).toEqual([
      "greeting", "subway", "rain-alert", "dust-alert",
      "interests-festival", "interests-camping",
      "clothing", "try-typing", "brief", "done",
    ]);
  });
});

describe("buildGreetingMessages", () => {
  it("2개 메시지 반환 (인사 + 질문카드)", () => {
    const msgs = buildGreetingMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("assistant");
    expect(msgs[1].richContent?.type).toBe("onboarding-quick");
    if (msgs[1].richContent?.type === "onboarding-quick") {
      expect(msgs[1].richContent.step).toBe("greeting");
      expect(msgs[1].richContent.options[0].id).toBe("start");
      expect(msgs[1].richContent.escapeOptions?.[0].id).toBe("skip");
    }
  });
});

describe("buildStepMessage", () => {
  it("subway step — 출근 시간을 인간화해서 주입", () => {
    const state = makeState({ commuteTime: { departure: "08:30", return: "18:00" } });
    const msg = buildStepMessage("subway", state);
    expect(msg?.text).toContain("8시 30분");
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.step).toBe("subway");
      expect(msg.richContent.allowTextInput).toBe(true);
      expect(msg.richContent.options.length).toBe(5);
    }
  });

  it("subway step — 정시 출근 시 '8시'로 표시", () => {
    const state = makeState({ commuteTime: { departure: "08:00", return: "18:00" } });
    const msg = buildStepMessage("subway", state);
    expect(msg?.text).toContain("8시");
    expect(msg?.text).not.toContain("8시 0분");
  });

  it("rain-alert step — 옵션 2개", () => {
    const msg = buildStepMessage("rain-alert", makeState());
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.options.map((o) => o.id)).toEqual(["yes", "no"]);
    }
  });

  it("interests-festival step — Y/N 단일 선택", () => {
    const msg = buildStepMessage("interests-festival", makeState());
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.allowMultiple).toBeFalsy();
      expect(msg.richContent.options.map((o) => o.id)).toEqual(["yes", "no"]);
    }
  });

  it("interests-camping step — Y/N 단일 선택", () => {
    const msg = buildStepMessage("interests-camping", makeState());
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.options.map((o) => o.id)).toEqual(["yes", "no"]);
    }
  });

  it("clothing step — 5스타일 + 나중에", () => {
    const msg = buildStepMessage("clothing", makeState());
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.options).toHaveLength(5);
      expect(msg.richContent.escapeOptions?.[0].id).toBe("later");
    }
  });

  it("greeting/brief/done — null 반환 (별도 builder 사용)", () => {
    expect(buildStepMessage("greeting", makeState())).toBeNull();
    expect(buildStepMessage("brief", makeState())).toBeNull();
    expect(buildStepMessage("done", makeState())).toBeNull();
  });

  it("try-typing step — followUps 3개 + 건너뛰기 escape", () => {
    const msg = buildStepMessage("try-typing", makeState());
    expect(msg?.followUps).toHaveLength(3);
    expect(msg?.followUps?.[0].text).toBe("오늘 뭐 입지?");
    if (msg?.richContent?.type === "onboarding-quick") {
      expect(msg.richContent.step).toBe("try-typing");
      expect(msg.richContent.options).toEqual([]);
      expect(msg.richContent.escapeOptions?.[0].id).toBe("skip");
    }
  });
});

describe("buildConfirmText", () => {
  const s = makeState();

  it("rain-alert yes → 출근 시간 주입된 긍정 확인 멘트", () => {
    const text = buildConfirmText("rain-alert", "yes", s);
    expect(text).toContain("8시 30분");
    expect(text).toContain("비 예보");
  });

  it("rain-alert no → 간결 응답", () => {
    expect(buildConfirmText("rain-alert", "no", s)).toBe("알겠습니다.");
  });

  it("subway 역 이름 → 출근 시간 + 역 이름 주입", () => {
    const text = buildConfirmText("subway", "강남", s);
    expect(text).toContain("8시 30분");
    expect(text).toContain("강남역");
  });

  it("subway '강남역'처럼 이미 '역' 포함된 입력 → 중복 없음", () => {
    const text = buildConfirmText("subway", "강남역", s);
    expect(text).toContain("강남역");
    expect(text).not.toContain("강남역역");
  });

  it("subway 'none' → 간결 응답", () => {
    expect(buildConfirmText("subway", "none", s)).toBe("알겠습니다.");
  });

  it("dust-alert yes → 마스크 언급", () => {
    const text = buildConfirmText("dust-alert", "yes", s);
    expect(text).toContain("마스크");
  });

  it("interests-festival yes + 저장된 위치 → 위치명 + 공연·축제 언급", () => {
    const state = makeState({
      locations: [{ id: "1", name: "서울 강남구", lat: 37.5, lon: 127.0, isGps: true }],
      currentLocationId: "1",
    });
    const text = buildConfirmText("interests-festival", "yes", state);
    expect(text).toContain("강남구");
    expect(text).toContain("공연·축제");
  });

  it("interests-festival yes + 위치 없음 → 기본 메시지", () => {
    const text = buildConfirmText("interests-festival", "yes", s);
    expect(text).toContain("공연·축제");
  });

  it("interests-festival no → 간결 응답", () => {
    expect(buildConfirmText("interests-festival", "no", s)).toBe("알겠습니다.");
  });

  it("interests-camping yes → 캠핑 언급", () => {
    expect(buildConfirmText("interests-camping", "yes", s)).toContain("캠핑");
  });

  it("clothing 스타일 → 스타일명 + 출근 시간 주입", () => {
    const text = buildConfirmText("clothing", "캐주얼", s);
    expect(text).toContain("캐주얼");
    expect(text).toContain("8시 30분");
  });

  it("clothing 'later' → 간결 응답", () => {
    expect(buildConfirmText("clothing", "later", s)).toBe("알겠습니다.");
  });

  it("answer === null → null 반환 (확인 멘트 생략)", () => {
    expect(buildConfirmText("rain-alert", null, s)).toBeNull();
  });

  it("try-typing/brief/greeting → null (확인 멘트 없음)", () => {
    expect(buildConfirmText("try-typing", "skip", s)).toBeNull();
    expect(buildConfirmText("brief", null, s)).toBeNull();
    expect(buildConfirmText("greeting", "start", s)).toBeNull();
  });
});

describe("buildBriefMessages", () => {
  it("요약 카드 + 브리핑 + 후속 안내 = 3개 메시지", () => {
    const lines: BriefLine[] = [
      { emoji: "☀️", label: "맑은 하루" },
      { emoji: "🌡️", label: "최고 22도" },
    ];
    const msgs = buildBriefMessages(lines, makeState());
    expect(msgs).toHaveLength(3);
    // 1) 요약 카드
    expect(msgs[0].text).toContain("다 됐어요");
    expect(msgs[0].richContent?.type).toBe("onboarding-summary");
    // 2) 브리핑 카드
    expect(msgs[1].richContent?.type).toBe("onboarding-brief");
    if (msgs[1].richContent?.type === "onboarding-brief") {
      expect(msgs[1].richContent.lines).toEqual(lines);
    }
    // 3) 후속 안내 + 홈 이동 버튼
    expect(msgs[2].text).toContain("내일부턴");
    expect(msgs[2].text).toContain("설정도 말로");
    if (msgs[2].richContent?.type === "onboarding-quick") {
      const ids = msgs[2].richContent.escapeOptions?.map((o) => o.id) ?? [];
      expect(ids).toContain("close");
      expect(ids).toContain("personality");
    }
  });
});

describe("buildSummaryItems", () => {
  it("지하철 역 + 출근 시간 한 줄로 표시", () => {
    const state = makeState({
      commuteTime: { departure: "08:30", return: "18:00", subwayStation: "강남" },
    });
    const items = buildSummaryItems(state);
    expect(items[0].label).toContain("강남역");
    expect(items[0].label).toContain("8:30");
  });

  it("지하철 없으면 위치명 fallback", () => {
    const state = makeState({
      locations: [{ id: "1", name: "서울 강남구", lat: 37.5, lon: 127.0, isGps: true }],
      currentLocationId: "1",
      commuteTime: { departure: "08:00", return: "18:00" },
    });
    const items = buildSummaryItems(state);
    expect(items[0].label).toContain("서울 강남구");
  });

  it("알림 켜진 것들 조합 (비 · 미세먼지)", () => {
    const state = makeState({
      alerts: { commute: false, rain: true, dust: true, uv: false, pollen: false, evening: false, game: false },
    });
    const items = buildSummaryItems(state);
    const alertRow = items.find((i) => i.emoji === "🔔");
    expect(alertRow?.label).toContain("비");
    expect(alertRow?.label).toContain("미세먼지");
  });

  it("관심사 2개 선택 시 두 개 모두 표시", () => {
    const state = makeState({
      healthProfile: { allergens: [], exercisePreference: "", clothingStyle: "", discoverInterests: ["performance-festival", "camping"] },
    });
    const items = buildSummaryItems(state);
    const interestRow = items.find((i) => i.label.includes("공연·축제") || i.label.includes("캠핑"));
    expect(interestRow?.label).toContain("공연·축제");
    expect(interestRow?.label).toContain("캠핑");
  });

  it("옷차림 스타일 단독 표시", () => {
    const state = makeState({
      healthProfile: { allergens: [], exercisePreference: "", clothingStyle: "캐주얼" },
    });
    const items = buildSummaryItems(state);
    expect(items.some((i) => i.label.includes("캐주얼"))).toBe(true);
  });

  it("아무 알림·관심사도 없으면 해당 행 생략", () => {
    const state = makeState();  // 기본값 (alerts 모두 false, interests 없음)
    const items = buildSummaryItems(state);
    expect(items.some((i) => i.emoji === "🔔")).toBe(false);
    expect(items.some((i) => i.emoji === "✨")).toBe(false);
  });
});

describe("applyStepAnswer", () => {
  it("subway — 역 이름으로 dispatch", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    const state = makeState();
    applyStepAnswer("subway", "강남", dispatch, state);
    expect(calls[0]).toEqual({
      type: "SET_COMMUTE_TIME",
      payload: { departure: "08:30", return: "18:00", subwayStation: "강남" },
    });
  });

  it("subway — 'none' (지하철 안 타요) → subwayStation undefined", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("subway", "none", dispatch, makeState());
    expect(calls[0].type).toBe("SET_COMMUTE_TIME");
    if (calls[0].type === "SET_COMMUTE_TIME") {
      expect(calls[0].payload.subwayStation).toBeUndefined();
    }
  });

  it("rain-alert 'yes' → SET_ALERT rain enabled", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("rain-alert", "yes", dispatch, makeState());
    expect(calls[0]).toEqual({ type: "SET_ALERT", payload: { key: "rain", enabled: true } });
  });

  it("rain-alert 'no' → SET_ALERT rain disabled", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("rain-alert", "no", dispatch, makeState());
    expect(calls[0]).toEqual({ type: "SET_ALERT", payload: { key: "rain", enabled: false } });
  });

  it("dust-alert 'yes' → SET_ALERT dust enabled", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("dust-alert", "yes", dispatch, makeState());
    expect(calls[0]).toEqual({ type: "SET_ALERT", payload: { key: "dust", enabled: true } });
  });

  it("interests-festival yes → discoverInterests에 performance-festival 추가", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("interests-festival", "yes", dispatch, makeState());
    expect(calls[0]).toEqual({
      type: "SET_PROFILE",
      payload: { discoverInterests: ["performance-festival"] },
    });
  });

  it("interests-camping yes → 기존 값에 camping 추가 (누적)", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    const state = makeState({
      healthProfile: { allergens: [], exercisePreference: "", clothingStyle: "", discoverInterests: ["performance-festival"] },
    });
    applyStepAnswer("interests-camping", "yes", dispatch, state);
    expect(calls[0]).toEqual({
      type: "SET_PROFILE",
      payload: { discoverInterests: ["performance-festival", "camping"] },
    });
  });

  it("interests-festival no → discoverInterests에 추가 안 함 (빈 배열)", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("interests-festival", "no", dispatch, makeState());
    expect(calls[0]).toEqual({
      type: "SET_PROFILE",
      payload: { discoverInterests: [] },
    });
  });

  it("clothing — 스타일 값 저장", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("clothing", "캐주얼", dispatch, makeState());
    expect(calls[0]).toEqual({
      type: "SET_PROFILE",
      payload: { clothingStyle: "캐주얼" },
    });
  });

  it("clothing — 'later' → dispatch 없음", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("clothing", "later", dispatch, makeState());
    expect(calls).toHaveLength(0);
  });

  it("answer === null → dispatch 없음", () => {
    const calls: Action[] = [];
    const dispatch = (a: Action) => calls.push(a);
    applyStepAnswer("rain-alert", null, dispatch, makeState());
    expect(calls).toHaveLength(0);
  });
});
