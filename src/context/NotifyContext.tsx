/**
 * 잔소리 대상자 관리 — AsyncStorage 로컬 캐시 + Firestore 동기화
 * 로컬을 SSOT으로 사용하되, uid가 있으면 Firestore에도 반영.
 */
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { useAuth } from "@/context/AuthContext";
import {
  createInvite,
  updateConnection,
  deleteConnection,
  loadSenderConnections,
  generateInviteCode,
} from "@/services/inviteService";
import { registerPushToken, updateUserLocation } from "@/services/pushTokenService";
import { syncNagNotifications } from "@/services/nagNotificationService";
import { getCurrentPosition, reverseGeocode } from "@/services/locationService";
import { logError } from "@/utils/logger";
import type { Recipient, NotifySchedule } from "@/types/notify";
import { DEFAULT_SCHEDULES, MAX_RECIPIENTS } from "@/types/notify";

// ──────────────────────────── State ────────────────────────────

interface NotifyState {
  recipients: Recipient[];
}

const DEFAULT_STATE: NotifyState = { recipients: [] };

type Action =
  | { type: "LOAD"; payload: NotifyState }
  | { type: "SET_RECIPIENTS"; payload: Recipient[] }
  | { type: "ADD_RECIPIENT"; payload: { recipient: Recipient } }
  | { type: "UPDATE_RECIPIENT"; payload: { id: string; updates: Partial<Recipient> } }
  | { type: "REMOVE_RECIPIENT"; payload: { id: string } };

function reducer(state: NotifyState, action: Action): NotifyState {
  switch (action.type) {
    case "LOAD":
      return { ...DEFAULT_STATE, ...action.payload };
    case "SET_RECIPIENTS":
      return { ...state, recipients: action.payload };
    case "ADD_RECIPIENT":
      if (state.recipients.length >= MAX_RECIPIENTS) return state;
      return { ...state, recipients: [...state.recipients, action.payload.recipient] };
    case "UPDATE_RECIPIENT":
      return {
        ...state,
        recipients: state.recipients.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r,
        ),
      };
    case "REMOVE_RECIPIENT":
      return {
        ...state,
        recipients: state.recipients.filter((r) => r.id !== action.payload.id),
      };
    default:
      return state;
  }
}

// ──────────────────────────── Context ────────────────────────────

interface NotifyContextValue {
  state: NotifyState;
  loaded: boolean;
  addRecipient: (nickname: string, senderDisplayName: string) => Promise<Recipient>;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  removeRecipient: (id: string) => void;
  syncFromFirestore: () => Promise<void>;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const { uid } = useAuth();
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const uidRef = useRef(uid);
  uidRef.current = uid;
  const recipientsRef = useRef(state.recipients);
  recipientsRef.current = state.recipients;

  // 로드 + 마이그레이션
  useEffect(() => {
    (async () => {
      const saved = await loadJson<NotifyState>(STORAGE_KEYS.NOTIFY_RECIPIENTS, DEFAULT_STATE);
      const migrated: NotifyState = {
        ...saved,
        recipients: (saved.recipients ?? []).map((r) => ({
          ...r,
          schedules: (r.schedules ?? []).map((s) => ({
            ...s,
            message: s.message ?? "",
          })),
        })),
      };
      dispatch({ type: "LOAD", payload: migrated });
      loadedRef.current = true;
      setLoaded(true);
    })();
  }, []);

  // uid 확보 시: 푸시 토큰 + 위치 등록 + sender 데이터 로드 + receiver 잔소리 알림 스케줄
  useEffect(() => {
    if (!uid || !loadedRef.current) return;
    registerPushToken(uid).catch(() => {});
    // receiver 위치 등록 (Cloud Functions이 날씨 fetch에 사용)
    getCurrentPosition().then(async (pos) => {
      if (!pos) return;
      const name = await reverseGeocode(pos.lat, pos.lon).catch(() => "");
      updateUserLocation(uid, pos.lat, pos.lon, name).catch(() => {});
    }).catch(() => {});
    loadSenderConnections(uid).then((remote) => {
      if (remote.length > 0) {
        dispatch({ type: "SET_RECIPIENTS", payload: remote });
      }
    }).catch(() => {});
    // receiver로서 받는 잔소리 알림 스케줄 (앱 실행 시 1회)
    syncNagNotifications(uid).catch(() => {});
  }, [uid]);

  // 자동 저장 (로컬 캐시)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveJson(STORAGE_KEYS.NOTIFY_RECIPIENTS, state);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  // ── Actions ──

  const addRecipient = useCallback(async (nickname: string, senderDisplayName: string): Promise<Recipient> => {
    const inviteCode = generateInviteCode();
    const schedules = [...DEFAULT_SCHEDULES];

    let id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 서버에 초대 생성 (uid가 있으면)
    if (uidRef.current) {
      const result = await createInvite(
        uidRef.current, inviteCode, nickname, senderDisplayName, "", schedules,
      );
      if (result.success) id = result.connectionId;
      else logError("general", new Error(`createInvite failed: ${result.reason}`));
    }

    const recipient: Recipient = {
      id,
      nickname,
      senderDisplayName,
      personalMessage: "",
      schedules,
      inviteCode,
      status: "pending",
      recipientUid: null,
      createdAt: new Date().toISOString(),
      lastSentAt: null,
    };
    dispatch({ type: "ADD_RECIPIENT", payload: { recipient } });
    return recipient;
  }, []);

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    dispatch({ type: "UPDATE_RECIPIENT", payload: { id, updates } });
    if (uidRef.current) {
      updateConnection(id, uidRef.current, updates).catch(() => {});
    }
  }, []);

  const removeRecipient = useCallback((id: string) => {
    dispatch({ type: "REMOVE_RECIPIENT", payload: { id } });
    if (uidRef.current) {
      deleteConnection(id, uidRef.current).catch(() => {});
    }
  }, []);

  const syncFromFirestore = useCallback(async () => {
    if (!uidRef.current) return;
    try {
      const remote = await loadSenderConnections(uidRef.current);
      dispatch({ type: "SET_RECIPIENTS", payload: remote });
    } catch (e: unknown) {
      logError("general", e);
    }
  }, []);

  return (
    <NotifyContext.Provider value={{ state, loaded, addRecipient, updateRecipient, removeRecipient, syncFromFirestore }}>
      {children}
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be inside NotifyProvider");
  return ctx;
}
