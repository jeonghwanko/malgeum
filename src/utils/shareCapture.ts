import { Share, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import type React from "react";
import { logError } from "./logger";

/** ViewShot 캡처 후 시스템 공유 시트 열기 */
export async function captureAndShare(
  ref: React.RefObject<ViewShot | null>,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<void> {
  const uri = await ref.current?.capture?.();
  if (!uri) return;
  await Sharing.shareAsync(uri, { mimeType });
}

/** ViewShot 캡처 + 텍스트 메시지와 함께 공유 (이미지+링크) */
export async function captureAndShareWithMessage(
  ref: React.RefObject<ViewShot | null>,
  message: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<void> {
  const uri = await ref.current?.capture?.();
  if (!uri) return;

  if (Platform.OS === "ios") {
    await Share.share({ message, url: uri });
  } else {
    // Android: Share.share는 url 미지원 → expo-sharing으로 이미지 공유
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: message });
  }
}
