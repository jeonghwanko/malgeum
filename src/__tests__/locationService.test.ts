import * as Location from "expo-location";
import { getCurrentPosition, requestLocationPermission, reverseGeocode } from "../services/locationService";

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock("../utils/logger", () => ({
  logError: jest.fn(),
  extractErrorMessage: (e: unknown) => e instanceof Error ? e.message : String(e),
}));

const { logError } = require("../utils/logger");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requestLocationPermission", () => {
  it("granted → true", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    expect(await requestLocationPermission()).toBe(true);
  });

  it("denied → false", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    expect(await requestLocationPermission()).toBe(false);
  });
});

describe("getCurrentPosition", () => {
  it("권한 없으면 null", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    expect(await getCurrentPosition()).toBeNull();
  });

  it("성공 시 좌표 반환", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 37.5, longitude: 127.0 },
    });
    expect(await getCurrentPosition()).toEqual({ lat: 37.5, lon: 127.0 });
  });

  it("device settings 에러 → null, logError 미호출", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error("Location request failed due to unsatisfied device settings"),
    );
    expect(await getCurrentPosition()).toBeNull();
    expect(logError).not.toHaveBeenCalled();
  });

  it("기타 에러 → null + logError 호출", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error("unknown"));
    expect(await getCurrentPosition()).toBeNull();
    expect(logError).toHaveBeenCalledWith("location", expect.any(Error));
  });
});

describe("reverseGeocode", () => {
  it("district + city 반환", async () => {
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { district: "강남구", city: "서울" },
    ]);
    expect(await reverseGeocode(37.5, 127.0)).toBe("서울 강남구");
  });

  it("결과 없으면 '알 수 없는 위치'", async () => {
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([null]);
    expect(await reverseGeocode(37.5, 127.0)).toBe("알 수 없는 위치");
  });

  it("에러 시 '현재 위치'", async () => {
    (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(new Error("network"));
    expect(await reverseGeocode(37.5, 127.0)).toBe("현재 위치");
  });
});
