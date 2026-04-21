/**
 * 잔소리 로컬 알림 스케줄러
 *
 * receiver가 앱을 열면:
 *   1. Firestore에서 나에게 연결된 잔소리(active connections) 로드
 *   2. 기존 잔소리 알림 전부 취소
 *   3. 각 connection의 스케줄마다 로컬 알림 등록
 *
 * 알림 identifier: "nag-{connectionId}-{idx}" (날씨 알림 "malgeum-*"과 구분)
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { loadReceiverConnections, type ReceivedNag } from "@/services/inviteService";
import { CHANNEL_IDS } from "@/services/notificationCategories";
import { logError } from "@/utils/logger";

const NAG_PREFIX = "nag-";

/** 잔소리 알림만 취소 (nag-*) — 날씨 알림(malgeum-*), 다이어리 등은 보존 */
async function cancelNagNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const targets = all.filter((n) => n.identifier.startsWith(NAG_PREFIX));
  await Promise.all(
    targets.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Firestore에서 잔소리를 로드하고 로컬 알림으로 스케줄
 * 앱 실행 시 1회 호출
 */
export async function syncNagNotifications(receiverUid: string): Promise<void> {
  try {
    const connections = await loadReceiverConnections(receiverUid);
    await cancelNagNotifications();

    if (connections.length === 0) return;

    const tasks: Promise<void>[] = [];
    for (const conn of connections) {
      for (let idx = 0; idx < conn.schedules.length; idx++) {
        const schedule = conn.schedules[idx];
        const msg = schedule.message || conn.personalMessage || "오늘도 화이팅!";
        const senderName = conn.senderDisplayName || "소중한 사람";

        tasks.push(scheduleNagNotification(
          conn.connectionId,
          idx,
          senderName,
          msg,
          schedule.hour,
          schedule.minute,
        ));
      }
    }

    await Promise.all(tasks);
  } catch (e: unknown) {
    logError("notification", e);
  }
}

async function scheduleNagNotification(
  connectionId: string,
  idx: number,
  senderName: string,
  message: string,
  hour: number,
  minute: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `${NAG_PREFIX}${connectionId}-${idx}`,
    content: {
      title: `📢 ${senderName}의 잔소리`,
      body: message,
      data: { screen: "/(tabs)/notify", alertType: "nag", connectionId },
      ...(Platform.OS === "android" && { channelId: CHANNEL_IDS.nag }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.max(0, Math.min(23, hour)),
      minute: Math.max(0, Math.min(59, minute)),
    } as any,
  });
}
