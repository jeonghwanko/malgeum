import * as Location from "expo-location";
import { logError, extractErrorMessage } from "@/utils/logger";

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

const LOCATION_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Location timeout")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function isRetryable(msg: string): boolean {
  return /kCLErrorDomain/i.test(msg) || /Location timeout/i.test(msg);
}

export async function getCurrentPosition(): Promise<{
  lat: number;
  lon: number;
} | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") return null;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const location = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        LOCATION_TIMEOUT_MS,
      );
      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };
    } catch (e: unknown) {
      lastError = e;
      const msg = extractErrorMessage(e);
      if (!isRetryable(msg) || attempt === MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  const msg = extractErrorMessage(lastError);
  const isExpected =
    /unsatisfied device settings/i.test(msg) ||
    /kCLErrorDomain/i.test(msg) ||
    /Location timeout/i.test(msg);
  if (!isExpected) logError("location", lastError);
  return null;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!result) return "알 수 없는 위치";

    const district = result.district ?? result.subregion ?? "";
    const city = result.city ?? result.region ?? "";

    if (district) return `${city} ${district}`;
    return city || "현재 위치";
  } catch (e: unknown) {
    logError("location", e);
    return "현재 위치";
  }
}
