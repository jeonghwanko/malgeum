/**
 * Expo Push Token 등록 — Firestore /users/{uid}에 저장
 * Cloud Functions가 이 토큰으로 푸시 알림을 발송
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { logError } from "@/utils/logger";

/** 푸시 토큰을 Firestore에 등록. uid가 없으면 no-op. */
export async function registerPushToken(uid: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    await setDoc(
      doc(db, "users", uid),
      {
        pushToken: token.data,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e: unknown) {
    logError("notification", e);
  }
}

/** 사용자 위치 정보를 Firestore에 업데이트 (Cloud Functions가 날씨 fetch에 사용) */
export async function updateUserLocation(
  uid: string,
  lat: number,
  lon: number,
  locationName: string,
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid),
      { lat, lon, locationName, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (e: unknown) {
    logError("general", e);
  }
}
