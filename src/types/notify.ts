/**
 * 잔소리 — 소중한 사람에게 날씨 + 메시지를 정해진 시간에 푸시 전송
 *
 * 역할:
 *   sender (잔소리하는 사람) — 대상자 추가, 메시지/시간 설정, 초대 코드 생성
 *   receiver (잔소리 듣는 사람) — 앱 설치 후 코드 입력, 설정된 시간에 푸시 수신
 *
 * 푸시 내용: sender가 설정한 메시지 + receiver 위치 기준 날씨
 * 스케줄: receiver의 로컬 시간 기준
 */

export interface NotifySchedule {
  hour: number;   // 0-23
  minute: number; // 0-59
  message: string; // 해당 시간에 보낼 잔소리 메시지
}

/** sender가 관리하는 대상자 (내가 잔소리를 보내는 사람) */
export interface Recipient {
  id: string;                  // Firestore connection doc ID (or local UUID)
  nickname: string;            // sender가 receiver를 부르는 이름 ("여자친구", "아들")
  senderDisplayName: string;   // receiver에게 표시될 sender 이름 ("엄마", "남자친구")
  personalMessage: string;     // 잔소리 메시지 ("밥 먹었어?")
  schedules: NotifySchedule[]; // 알림 시간 — receiver의 로컬 시간 기준
  inviteCode: string;          // 6자리 초대 코드
  status: "pending" | "active" | "paused";
  recipientUid: string | null; // receiver의 Firebase uid (연결 전 null)
  createdAt: string;           // ISO
  lastSentAt: string | null;   // ISO
}

export const DEFAULT_SCHEDULES: NotifySchedule[] = [
  { hour: 7, minute: 30, message: "" },
];

export const MAX_SCHEDULES = 5;
export const MAX_RECIPIENTS = 5;

/** "07:30" 형식으로 포맷 */
export function formatScheduleTime(s: NotifySchedule): string {
  return `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`;
}

/** 초대 딥링크 생성 (앱 설치된 경우에만 작동) */
export function buildInviteDeepLink(code: string): string {
  return `malgeum://notify-invite?code=${code}`;
}

/**
 * 초대 웹 수신 URL — 앱 미설치자도 즉시 잔소리 미리보기 가능.
 * 공유 메시지에 이 URL을 넣으면 K계수 상승: 받는 사람이 앱 설치 전에 가치 체험.
 */
const INVITE_WEB_BASE =
  (process.env.EXPO_PUBLIC_INVITE_WEB_BASE ?? "https://example.com/n").replace(/\/$/, "");
export function buildInviteWebLink(code: string): string {
  return `${INVITE_WEB_BASE}/${code}`;
}

/**
 * 초대 공유 메시지 — 이미지 카드에 정보가 다 있으므로 텍스트는 감성 + 링크만.
 * 카톡/메시지 미리보기에서 링크 OG 이미지로 확장되는 링크 중심 구성.
 */
export function buildInviteShareMessage(params: {
  nickname: string;
  senderName?: string;
  webLink: string;
  emotionalLine: string;
}): string {
  const who = params.senderName?.trim() || "";
  const header = who ? `💌 ${who} → ${params.nickname}` : `💌 ${params.nickname}`;
  return `${header}\n${params.emotionalLine}\n\n${params.webLink}`;
}

/** 초대 코드 정제 — 대문자 + 숫자만, 최대 6자 */
export function sanitizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

/**
 * URL에서 초대 코드 파싱 — 6자리가 아니면 null
 * 지원 포맷:
 *   malgeum://notify-invite?code=ABC123        (custom scheme)
 *   https://example.com/n/ABC123            (Universal / App Link)
 *   https://example.com/n/ABC123?utm=...    (쿼리 무시)
 */
export function parseInviteCode(url: string): string | null {
  try {
    const query = url.match(/[?&]code=([A-Za-z0-9]{6})(?:&|$)/);
    if (query) return query[1].toUpperCase();
    const path = url.match(/\/n\/([A-Za-z0-9]{6})(?:[/?#]|$)/);
    if (path) return path[1].toUpperCase();
    return null;
  } catch {
    return null;
  }
}
