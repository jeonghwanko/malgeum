/**
 * 맑음 사용자 등록/갱신 — findthem PostgreSQL `malgeum_user` 테이블에 UPSERT.
 *
 * 앱 진입마다 호출해서:
 *   - platform (ios/android), Expo Push Token 갱신 (서버 주도 푸시 대상)
 *   - 현재 위치 (개인화 날씨 알림, Cloud Functions 분석 등)
 *
 * 이전에는 Firestore /users/{uid}에 썼으나 DB 미생성으로 저장 실패 상태였음.
 * 2026-04-21 findthem `malgeum_user` 테이블로 이전.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { logError } from "@/utils/logger";

const API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL ?? "";
const APP_KEY = process.env.EXPO_PUBLIC_RECOMMENDATION_APP_KEY ?? "";
const TIMEOUT_MS = 8_000;

async function upsertUser(body: Record<string, unknown>): Promise<void> {
  if (!API_URL || !APP_KEY) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(`${API_URL}/malgeum/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-app-key": APP_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** 푸시 토큰 + platform을 서버에 등록. 권한 없으면 platform만 갱신. */
export async function registerPushToken(uid: string): Promise<void> {
  try {
    if (!uid) return;
    const platform =
      Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : undefined;

    let pushToken: string | undefined;
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (projectId) {
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        pushToken = token.data;
      }
    }

    await upsertUser({
      uid,
      ...(platform ? { platform } : {}),
      ...(pushToken ? { pushToken } : {}),
    });
  } catch (e: unknown) {
    logError("notification", e);
  }
}

/** 사용자 위치를 서버에 저장 (개인화 알림/분석용) */
export async function updateUserLocation(
  uid: string,
  lat: number,
  lon: number,
  locationName: string,
): Promise<void> {
  try {
    if (!uid) return;
    await upsertUser({
      uid,
      locationLat: lat,
      locationLon: lon,
      locationName,
    });
  } catch (e: unknown) {
    logError("general", e);
  }
}
