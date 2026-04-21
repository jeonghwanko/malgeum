/**
 * 초대 코드 서비스 — findthem REST API 호출.
 *
 * 흐름:
 *   sender: createInvite() → 초대 코드 + connection 생성
 *   receiver: claimInvite() → 코드 검증 + connection 활성화
 *   sender: loadSenderConnections() → 본인이 보낸 잔소리 목록
 *   receiver: loadReceiverConnections() → 본인이 받은 active 잔소리
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { logError } from "@/utils/logger";
import type { Recipient, NotifySchedule } from "@/types/notify";

const API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL ?? "";
const APP_KEY = process.env.EXPO_PUBLIC_RECOMMENDATION_APP_KEY ?? "";
const TIMEOUT_MS = 8_000;

function apiHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-app-key": APP_KEY,
  };
}

/** 타임아웃 포함 fetch — 네트워크 행 방지 */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...apiHeaders(), ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ──────────────────────────── Invite 생성 (Sender) ────────────────────────────

export type CreateInviteResult =
  | { success: true; connectionId: string; inviteCode: string }
  | { success: false; reason: "error" | "collision" };

export async function createInvite(
  senderUid: string,
  inviteCode: string,
  nickname: string,
  senderDisplayName: string,
  personalMessage: string,
  schedules: NotifySchedule[],
): Promise<CreateInviteResult> {
  try {
    const res = await apiFetch(`/malgeum/invite`, {
      method: "POST",
      body: JSON.stringify({
        senderUid, inviteCode, nickname, senderDisplayName, personalMessage, schedules,
      }),
    });
    if (res.status === 503) return { success: false, reason: "collision" };
    if (!res.ok) return { success: false, reason: "error" };
    const data = (await res.json()) as { connectionId: string; inviteCode: string };
    return { success: true, ...data };
  } catch (e: unknown) {
    logError("general", e);
    return { success: false, reason: "error" };
  }
}

// ──────────────────────────── Invite 조회 (미리보기 — sender 정보만) ────────────────────────────

export type InviteInfo = {
  inviteCode: string;
  nickname: string;
  senderDisplayName: string;
  personalMessage: string;
};

export type InviteInfoResult =
  | { success: true; info: InviteInfo }
  | { success: false; reason: "not_found" | "expired" | "already_used" | "error" };

/** 초대 코드로 sender 정보 미리보기 — claim 없이 조회만. 서버는 항상 200 + status 필드 */
export async function getInviteInfo(inviteCode: string): Promise<InviteInfoResult> {
  try {
    const res = await apiFetch(`/malgeum/invite/${encodeURIComponent(inviteCode)}`);
    if (!res.ok) return { success: false, reason: "error" };
    const data = (await res.json()) as Record<string, unknown>;
    const status = String(data.status ?? "error");
    if (status === "not_found") return { success: false, reason: "not_found" };
    if (status === "expired") return { success: false, reason: "expired" };
    if (status !== "ok") return { success: false, reason: "error" };
    return {
      success: true,
      info: {
        inviteCode,
        nickname: String(data.nickname ?? ""),
        senderDisplayName: String(data.senderDisplayName ?? ""),
        personalMessage: String(data.personalMessage ?? ""),
      },
    };
  } catch (e: unknown) {
    logError("general", e);
    return { success: false, reason: "error" };
  }
}

// ──────────────────────────── Invite 수락 (Receiver) ────────────────────────────

export type ClaimResult =
  | { success: true; senderDisplayName: string; connectionId: string }
  | { success: false; reason: "not_found" | "expired" | "already_used" | "error" };

/** Expo Push Token 획득 — 권한 미허용/프로젝트ID 누락 시 null (claim은 그대로 진행) */
async function fetchExpoPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data ?? null;
  } catch {
    return null;
  }
}

export async function claimInvite(
  inviteCode: string,
  receiverUid: string,
): Promise<ClaimResult> {
  try {
    const pushToken = await fetchExpoPushToken();
    const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : undefined;
    const res = await apiFetch(
      `/malgeum/invite/${encodeURIComponent(inviteCode)}/claim`,
      {
        method: "POST",
        body: JSON.stringify({
          receiverUid,
          ...(platform ? { platform } : {}),
          ...(pushToken ? { pushToken } : {}),
        }),
      },
    );
    if (!res.ok) return { success: false, reason: "error" };
    return (await res.json()) as ClaimResult;
  } catch (e: unknown) {
    logError("general", e);
    return { success: false, reason: "error" };
  }
}

// ──────────────────────────── Connection 조회 ────────────────────────────

export async function loadSenderConnections(senderUid: string): Promise<Recipient[]> {
  try {
    const res = await apiFetch(
      `/malgeum/connections?uid=${encodeURIComponent(senderUid)}&role=sender`,
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((d) => ({
      id: String(d.id),
      nickname: String(d.nickname ?? ""),
      senderDisplayName: String(d.senderDisplayName ?? ""),
      personalMessage: String(d.personalMessage ?? ""),
      schedules: ((d.schedules ?? []) as NotifySchedule[]).map((s) => ({
        hour: Number(s.hour ?? 0),
        minute: Number(s.minute ?? 0),
        message: String(s.message ?? ""),
      })),
      inviteCode: String(d.inviteCode ?? ""),
      status: (d.status ?? "pending") as "pending" | "active",
      recipientUid: (d.recipientUid ?? null) as string | null,
      createdAt: String(d.createdAt ?? new Date().toISOString()),
      lastSentAt: (d.lastSentAt ?? null) as string | null,
    }));
  } catch (e: unknown) {
    logError("general", e);
    return [];
  }
}

export interface ReceivedNag {
  connectionId: string;
  senderDisplayName: string;
  personalMessage: string;
  schedules: NotifySchedule[];
}

export async function loadReceiverConnections(receiverUid: string): Promise<ReceivedNag[]> {
  try {
    const res = await apiFetch(
      `/malgeum/connections?uid=${encodeURIComponent(receiverUid)}&role=receiver`,
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((d) => ({
      connectionId: String(d.id),
      senderDisplayName: String(d.senderDisplayName ?? ""),
      personalMessage: String(d.personalMessage ?? ""),
      schedules: ((d.schedules ?? []) as NotifySchedule[]).map((s) => ({
        hour: Number(s.hour ?? 0),
        minute: Number(s.minute ?? 0),
        message: String(s.message ?? ""),
      })),
    }));
  } catch (e: unknown) {
    logError("general", e);
    return [];
  }
}

export async function updateConnection(
  connectionId: string,
  senderUid: string,
  updates: Partial<Pick<Recipient, "nickname" | "senderDisplayName" | "personalMessage" | "schedules" | "status">>,
): Promise<void> {
  try {
    await apiFetch(`/malgeum/connections/${encodeURIComponent(connectionId)}`, {
      method: "PATCH",
      body: JSON.stringify({ senderUid, ...updates }),
    });
  } catch (e: unknown) {
    logError("general", e);
  }
}

export async function deleteConnection(connectionId: string, senderUid: string): Promise<void> {
  try {
    await apiFetch(`/malgeum/connections/${encodeURIComponent(connectionId)}`, {
      method: "DELETE",
      body: JSON.stringify({ senderUid }),
    });
  } catch (e: unknown) {
    logError("general", e);
  }
}
