import { reducer, DEFAULT_STATE, type Action } from "../context/weatherReducer";
import type { SavedLocation, CurrentWeather, HourlyWeather, DailyWeather, AirQuality } from "../types/weather";

const mockLocation: SavedLocation = { id: "loc-1", name: "서울 강남구", lat: 37.5, lon: 127.0, isGps: false };
const mockLocation2: SavedLocation = { id: "loc-2", name: "부산 해운대구", lat: 35.1, lon: 129.0, isGps: false };

const mockCurrent: CurrentWeather = {
  temp: 20, feelsLike: 18, humidity: 55, windSpeed: 3,
  condition: "clear", description: "맑음", icon: "01d",
  uvIndex: 5, precipitation: 0, sunrise: 1000, sunset: 2000,
};
const mockHourly: HourlyWeather[] = [
  { dt: 100, temp: 20, feelsLike: 18, condition: "clear", precipitation: 0, icon: "01d" },
];
const mockDaily: DailyWeather[] = [
  { dt: 100, tempMin: 15, tempMax: 25, condition: "clear", precipitation: 0 },
];
const mockAir: AirQuality = { pm25: 10, pm10: 20, aqi: 1, grade: "good" };

describe("WeatherContext reducer", () => {
  // ── LOAD ──
  it("LOAD — 저장된 상태를 DEFAULT_STATE에 병합", () => {
    const saved = { ...DEFAULT_STATE, nickname: "테스트", onboardingDone: true };
    const result = reducer(DEFAULT_STATE, { type: "LOAD", payload: saved });
    expect(result.nickname).toBe("테스트");
    expect(result.onboardingDone).toBe(true);
  });

  // ── SET_WEATHER ──
  it("SET_WEATHER — 날씨 데이터 갱신 + lastFetchedAt 설정", () => {
    const result = reducer(DEFAULT_STATE, {
      type: "SET_WEATHER",
      payload: { current: mockCurrent, hourly: mockHourly, daily: mockDaily, airQuality: mockAir },
    });
    expect(result.currentWeather).toEqual(mockCurrent);
    expect(result.hourlyForecast).toEqual(mockHourly);
    expect(result.dailyForecast).toEqual(mockDaily);
    expect(result.airQuality).toEqual(mockAir);
    expect(result.lastFetchedAt).toBeTruthy();
  });

  it("SET_WEATHER — pollen 없으면 null", () => {
    const result = reducer(DEFAULT_STATE, {
      type: "SET_WEATHER",
      payload: { current: mockCurrent, hourly: mockHourly, daily: mockDaily, airQuality: null },
    });
    expect(result.pollen).toBeNull();
  });

  // ── SET_LOCATION ──
  it("SET_LOCATION — currentLocationId 변경", () => {
    const state = { ...DEFAULT_STATE, locations: [mockLocation] };
    const result = reducer(state, { type: "SET_LOCATION", payload: { location: mockLocation } });
    expect(result.currentLocationId).toBe("loc-1");
  });

  // ── ADD_LOCATION ──
  it("ADD_LOCATION — 위치 추가 + 자동 선택", () => {
    const result = reducer(DEFAULT_STATE, { type: "ADD_LOCATION", payload: { location: mockLocation } });
    expect(result.locations).toHaveLength(1);
    expect(result.currentLocationId).toBe("loc-1");
  });

  // ── REMOVE_LOCATION ──
  it("REMOVE_LOCATION — 위치 삭제", () => {
    const state = { ...DEFAULT_STATE, locations: [mockLocation, mockLocation2], currentLocationId: "loc-2" };
    const result = reducer(state, { type: "REMOVE_LOCATION", payload: { locationId: "loc-1" } });
    expect(result.locations).toHaveLength(1);
    expect(result.currentLocationId).toBe("loc-2"); // 현재 선택된 위치가 아니므로 유지
  });

  it("REMOVE_LOCATION — 현재 위치 삭제 시 첫 번째로 폴백", () => {
    const state = { ...DEFAULT_STATE, locations: [mockLocation, mockLocation2], currentLocationId: "loc-1" };
    const result = reducer(state, { type: "REMOVE_LOCATION", payload: { locationId: "loc-1" } });
    expect(result.currentLocationId).toBe("loc-2");
  });

  it("REMOVE_LOCATION — 마지막 위치 삭제 시 null", () => {
    const state = { ...DEFAULT_STATE, locations: [mockLocation], currentLocationId: "loc-1" };
    const result = reducer(state, { type: "REMOVE_LOCATION", payload: { locationId: "loc-1" } });
    expect(result.currentLocationId).toBeNull();
  });

  // ── SET_COMMUTE_TIME ──
  it("SET_COMMUTE_TIME — 출퇴근 시간 설정", () => {
    const result = reducer(DEFAULT_STATE, {
      type: "SET_COMMUTE_TIME",
      payload: { departure: "09:00", return: "19:00" },
    });
    expect(result.commuteTime).toEqual({ departure: "09:00", return: "19:00" });
  });

  // ── SET_TEMP_UNIT ──
  it("SET_TEMP_UNIT — 온도 단위 변경", () => {
    const result = reducer(DEFAULT_STATE, { type: "SET_TEMP_UNIT", payload: { unit: "F" } });
    expect(result.tempUnit).toBe("F");
  });

  // ── SET_ALERT ──
  it("SET_ALERT — 개별 알림 토글", () => {
    const result = reducer(DEFAULT_STATE, { type: "SET_ALERT", payload: { key: "uv", enabled: true } });
    expect(result.alerts.uv).toBe(true);
    expect(result.alerts.commute).toBe(true); // 다른 알림 유지
  });

  // ── BATCH_SET_ALERTS ──
  it("BATCH_SET_ALERTS — 전체 알림 교체", () => {
    const newAlerts = { commute: false, rain: false, dust: false, uv: true, pollen: true, evening: false, game: false };
    const result = reducer(DEFAULT_STATE, { type: "BATCH_SET_ALERTS", payload: newAlerts });
    expect(result.alerts).toEqual(newAlerts);
  });

  // ── SET_PROFILE ──
  it("SET_PROFILE — 부분 병합", () => {
    const result = reducer(DEFAULT_STATE, {
      type: "SET_PROFILE",
      payload: { clothingStyle: "스트릿" },
    });
    expect(result.healthProfile.clothingStyle).toBe("스트릿");
    expect(result.healthProfile.exercisePreference).toBe("야외 러닝"); // 기존 유지
  });

  // ── SET_ONBOARDING_DONE ──
  it("SET_ONBOARDING_DONE — true 설정", () => {
    const result = reducer(DEFAULT_STATE, { type: "SET_ONBOARDING_DONE" });
    expect(result.onboardingDone).toBe(true);
  });

  // ── default ──
  it("unknown action — 동일 상태 반환", () => {
    const result = reducer(DEFAULT_STATE, { type: "UNKNOWN" } as unknown as Action);
    expect(result).toBe(DEFAULT_STATE);
  });
});
