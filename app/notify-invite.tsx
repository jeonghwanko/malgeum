import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ticket, CheckCircle, Bell, MapPin, Warning } from "phosphor-react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { sanitizeInviteCode } from "@/types/notify";
import { claimInvite, type ClaimResult } from "@/services/inviteService";
import { t } from "@/i18n";

const CLAIM_ERROR_KEYS: Record<string, string> = {
  not_found: "notifyInvite.notFound",
  expired: "notifyInvite.expired",
  already_used: "notifyInvite.alreadyUsed",
  error: "notifyInvite.error",
};

type ClaimErrorReason = "not_found" | "expired" | "already_used" | "error";

function goHomeSafely(router: ReturnType<typeof useRouter>) {
  // transparentModal 위에서 dismiss + tabs 이동. cold-launch 스택 안정성을 위해
  // dismissAll이 있으면 먼저 써서 모달을 정리한 뒤 tabs로 replace.
  try {
    (router as { dismissAll?: () => void }).dismissAll?.();
  } catch {
    /* no-op */
  }
  router.replace("/(tabs)");
}

export default function NotifyInviteScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { uid } = useAuth();
  const { code: urlCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [errorReason, setErrorReason] = useState<ClaimErrorReason | null>(null);

  const doClaim = async (inviteCode: string) => {
    if (!uid) {
      showToast(t("notifyInvite.tryLater"));
      return;
    }
    setErrorReason(null);
    setClaiming(true);
    try {
      const result: ClaimResult = await claimInvite(inviteCode, uid);
      if (result.success) {
        setSenderName(result.senderDisplayName);
        setConnected(true);
      } else {
        showToast(t(CLAIM_ERROR_KEYS[result.reason] ?? CLAIM_ERROR_KEYS.error));
        setErrorReason(result.reason);
      }
    } catch {
      showToast(t(CLAIM_ERROR_KEYS.error));
      setErrorReason("error");
    } finally {
      setClaiming(false);
    }
  };

  // 딥링크로 코드가 전달되면 자동 입력 + 자동 연결
  const claimedRef = React.useRef(false);
  useEffect(() => {
    if (!urlCode || urlCode.length !== 6 || !uid || claimedRef.current) return;
    claimedRef.current = true;
    const cleaned = sanitizeInviteCode(urlCode);
    setCode(cleaned);
    doClaim(cleaned);
  }, [urlCode, uid]);

  const handleSubmit = () => {
    const trimmed = sanitizeInviteCode(code);
    if (trimmed.length !== 6) {
      showToast(t("notifyInvite.invalidCode"));
      return;
    }
    doClaim(trimmed);
  };

  if (connected) {
    return (
      <ConnectedScreen
        senderName={senderName}
        code={code}
        onDone={() => {
          // 딥링크 cold-launch 시 back할 대상이 없으면 흰 화면 → 항상 tabs로 안착
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)" as never);
        }}
      />
    );
  }

  // 딥링크로 들어왔는데 에러가 발생하면 명시적 에러 화면으로 전환 —
  // 자동 타이머 redirect 대신 사용자가 버튼으로 벗어나게 (Android BottomSheet 충돌 방지)
  if (errorReason && urlCode) {
    return (
      <ErrorScreen
        reason={errorReason}
        onGoHome={() => goHomeSafely(router)}
        onRetry={() => {
          claimedRef.current = false;
          setErrorReason(null);
        }}
      />
    );
  }

  return (
    <ScreenSheet title={t("notifyInvite.title")} footer={<SaveButton label={t("notifyInvite.connect")} onPress={handleSubmit} loading={claiming} />}>
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <View style={styles.iconBox}>
            <Ticket size={24} weight="fill" color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.description}>
          {t("notifyInvite.desc")}
        </Text>
        <BottomSheetTextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(sanitizeInviteCode(t))}
          placeholder="AB3K9F"
          placeholderTextColor="#CBD5E1"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          textAlign="center"
        />
      </View>
    </ScreenSheet>
  );
}

// ── 에러 화면 (이미 사용 / 만료 / 없음) ──
function ErrorScreen({
  reason,
  onGoHome,
  onRetry,
}: {
  reason: ClaimErrorReason;
  onGoHome: () => void;
  onRetry: () => void;
}) {
  const msgKey = CLAIM_ERROR_KEYS[reason] ?? CLAIM_ERROR_KEYS.error;
  return (
    <ScreenSheet
      title={t("notifyInvite.title")}
      footer={<SaveButton label={t("common.goHome")} onPress={onGoHome} />}
    >
      <View style={styles.section}>
        <Warning size={56} weight="fill" color="#F59E0B" />
        <Text style={styles.connectedTitle}>{t(msgKey)}</Text>
        <Text style={styles.connectedDesc}>{t("notifyInvite.errorGuide")}</Text>
        <Pressable onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>{t("notifyInvite.enterAnotherCode")}</Text>
        </Pressable>
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    alignItems: "center",
    paddingVertical: 24,
  },
  iconRow: {
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(96,165,250,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 8,
    fontVariant: ["tabular-nums"],
    width: "80%",
    textAlign: "center",
  },
  connectedTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 16,
  },
  connectedDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  codeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },
  checklist: {
    width: "100%",
    gap: 10,
    marginTop: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  checkItemWarn: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
  },
  checkAction: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
});

// ── 연결 완료 화면 (권한 상태 체크 포함) ──

function ConnectedScreen({ senderName, code, onDone }: { senderName: string; code: string; onDone: () => void }) {
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((r) => setNotifGranted(r.granted));
    Location.getForegroundPermissionsAsync().then((r) => setLocationGranted(r.granted));
  }, []);

  const requestNotif = async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    setNotifGranted(granted);
    if (!granted) Linking.openSettings().catch(() => {});
  };

  const requestLocation = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(granted);
    if (!granted) Linking.openSettings().catch(() => {});
  };

  const allGood = notifGranted === true && locationGranted === true;

  return (
    <ScreenSheet title={t("notifyInvite.connectedTitle")} footer={<SaveButton label={t("common.confirm")} onPress={onDone} />}>
      <View style={styles.section}>
        <CheckCircle size={56} weight="fill" color="#10B981" />
        <Text style={styles.connectedTitle}>{t("notifyInvite.connected")}</Text>
        <Text style={styles.connectedDesc}>
          {senderName ? t("notifyInvite.connectedDesc", { name: senderName }) : t("notifyInvite.connectedDescGeneric")}
        </Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{code}</Text>
        </View>

        {!allGood && (
          <View style={styles.checklist}>
            {notifGranted === false && (
              <Pressable style={[styles.checkItem, styles.checkItemWarn]} onPress={requestNotif}>
                <Bell size={18} weight="fill" color="#F59E0B" />
                <Text style={styles.checkLabel}>{t("notifyInvite.notifOff")}</Text>
                <Text style={styles.checkAction}>{t("notifyInvite.notifOn")}</Text>
              </Pressable>
            )}
            {locationGranted === false && (
              <Pressable style={[styles.checkItem, styles.checkItemWarn]} onPress={requestLocation}>
                <MapPin size={18} weight="fill" color="#F59E0B" />
                <Text style={styles.checkLabel}>{t("notifyInvite.locationNeeded")}</Text>
                <Text style={styles.checkAction}>{t("notifyInvite.locationAllow")}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </ScreenSheet>
  );
}
