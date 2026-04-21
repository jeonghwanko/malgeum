import { Share, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import type React from "react";
import { logError } from "./logger";

type ShareFormat = "png" | "jpg";

function mimeOf(format: ShareFormat): "image/png" | "image/jpeg" {
  return format === "png" ? "image/png" : "image/jpeg";
}

/** 공유 시도 결과.
 *  - "shared": 사용자가 공유 시트에서 공유 완료
 *  - "dismissed": 사용자가 취소 (에러 아님)
 *  - "error": 캡처 실패 / 권한 문제 등 — 상위에서 사용자에게 알림 노출 권장
 */
export type ShareResult = "shared" | "dismissed" | "error";

/** ViewShot 캡처 후 시스템 공유 시트 열기. format은 ViewShot options와 동일해야 함. */
export async function captureAndShare(
  ref: React.RefObject<ViewShot | null>,
  format: ShareFormat = "jpg",
): Promise<ShareResult> {
  try {
    const uri = await ref.current?.capture?.();
    if (!uri) return "error";
    const mimeType = mimeOf(format);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType });
      return "shared";
    }
    return "error";
  } catch (e: unknown) {
    logError("share", e);
    return "error";
  }
}

/** ViewShot 캡처 + 텍스트 메시지와 함께 공유 (이미지+링크).
 *  format은 호출 카드의 ViewShot options 와 반드시 일치해야 함
 *  (예: `<ViewShot options={{format:"png"}}>` → `format: "png"`).
 */
export async function captureAndShareWithMessage(
  ref: React.RefObject<ViewShot | null>,
  message: string,
  format: ShareFormat = "jpg",
): Promise<ShareResult> {
  try {
    const uri = await ref.current?.capture?.();
    if (!uri) return "error";
    const mimeType = mimeOf(format);

    if (Platform.OS === "ios") {
      const result = await Share.share({ message, url: uri });
      return result.action === Share.dismissedAction ? "dismissed" : "shared";
    }
    // Android: Share.share는 url 미지원 → expo-sharing으로 이미지 공유
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle: message });
      return "shared";
    }
    return "error";
  } catch (e: unknown) {
    logError("share", e);
    return "error";
  }
}
