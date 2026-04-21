import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import ViewShot from "react-native-view-shot";
import * as Clipboard from "expo-clipboard";
import { useRouter, useLocalSearchParams } from "expo-router";
import { UserCircle, Trash, ShareNetwork } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { useNotify } from "@/context/NotifyContext";
import { useToast } from "@/context/ToastContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { ScheduleEditor } from "@/components/notify/ScheduleEditor";
import type { NotifySchedule } from "@/types/notify";
import { DEFAULT_SCHEDULES, formatScheduleTime, buildInviteWebLink, buildInviteShareMessage } from "@/types/notify";
import { mapConditionToTexture } from "@/utils/weather";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import { InviteCardPreview } from "@/components/notify/InviteCardPreview";
import { buildPreviewCopy } from "@/services/microcopy";
import { captureAndShareWithMessage } from "@/utils/shareCapture";
import { t } from "@/i18n";

export default function NotifyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateRecipient, removeRecipient } = useNotify();
  const { state: weatherState } = useWeatherContext();
  const { artStyle } = useTheme();
  const { showToast } = useToast();
  const viewShotRef = useRef<ViewShot>(null);

  const recipient = state.recipients.find((r) => r.id === id);

  const [nickname, setNickname] = useState(recipient?.nickname ?? "");
  const [senderName, setSenderName] = useState(recipient?.senderDisplayName ?? "");
  const [message, setMessage] = useState(recipient?.personalMessage ?? "");
  const [schedules, setSchedules] = useState<NotifySchedule[]>(
    recipient ? [...recipient.schedules] : [...DEFAULT_SCHEDULES],
  );

  const previewCopy = useMemo(() => {
    if (!recipient || !weatherState.currentWeather) return null;
    return buildPreviewCopy(
      weatherState.currentWeather,
      weatherState.hourlyForecast,
      weatherState.airQuality,
      recipient.nickname,
    );
  }, [recipient, weatherState.currentWeather, weatherState.hourlyForecast, weatherState.airQuality]);

  if (!recipient) {
    return (
      <ScreenSheet title={t("notifyDetail.title")}>
        <Text style={styles.notFound}>{t("notifyDetail.notFound")}</Text>
      </ScreenSheet>
    );
  }

  const saveCurrentState = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast(t("notifyDetail.enterName"));
      return false;
    }
    updateRecipient(recipient.id, {
      nickname: trimmed,
      senderDisplayName: senderName.trim(),
      personalMessage: message.trim(),
      schedules,
    });
    return true;
  };

  const handleSave = () => {
    if (saveCurrentState()) {
      showToast(t("notifyDetail.saved"));
      router.back();
    }
  };

  const condition = weatherState.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(condition);
  const bgImage = getTextureSource(artStyle, textureKey);

  const handleSend = async () => {
    if (!saveCurrentState()) return;

    const webLink = buildInviteWebLink(recipient.inviteCode);
    const msg = buildInviteShareMessage({
      nickname: recipient.nickname,
      senderName: senderName.trim(),
      webLink,
      emotionalLine: t("notifyDetail.sendShareMsg"),
    });
    // 공유 시트 취소/카톡에서 붙여넣기 실패 대비 — 링크만 클립보드에 미리 복사
    try {
      await Clipboard.setStringAsync(webLink);
      showToast(t("notifyAdd.linkCopied"));
    } catch { /* 무시 */ }
    const result = await captureAndShareWithMessage(viewShotRef, msg, "png");
    if (result === "error") {
      showToast(t("share.shareFailed"));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("notifyDetail.deleteTitle"),
      t("notifyDetail.deleteConfirm", { name: recipient.nickname }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            removeRecipient(recipient.id);
            router.back();
          },
        },
      ],
    );
  };

  const statusLabel = recipient.status === "active" ? t("notifyDetail.statusActive") : t("notifyDetail.statusPending");
  const statusColor = recipient.status === "active" ? "#10B981" : "#F59E0B";

  const footer = (
    <View style={styles.footerRow}>
      {recipient.status !== "active" && (
        <Pressable onPress={handleSend} style={styles.sendBtn}>
          <ShareNetwork size={18} weight="bold" color={COLORS.primary} />
          <Text style={styles.sendBtnText}>{t("notifyDetail.shareInvite")}</Text>
        </Pressable>
      )}
      <View style={styles.saveWrap}>
        <SaveButton onPress={handleSave} />
      </View>
    </View>
  );

  return (
    <ScreenSheet title={t("notifyDetail.title")} footer={footer}>
      {/* 화면 밖 — ViewShot 캡처용 */}
      <View style={styles.offscreen} pointerEvents="none">
        <InviteCardPreview
          ref={viewShotRef}
          nickname={nickname}
          inviteCode={recipient.inviteCode}
          senderName={senderName}
          backgroundImage={bgImage}
          previewMessage={previewCopy?.body}
        />
      </View>

      <View style={styles.profileSection}>
        <UserCircle size={56} weight="fill" color={COLORS.primary} />
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{t("notifyDetail.statusLabel")}</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.codeLabel}>{t("notifyDetail.inviteCodeLabel", { code: recipient.inviteCode })}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>{t("notifyDetail.nameLabel")}</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholderTextColor="#94A3B8"
          maxLength={10}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>{t("notifyDetail.senderLabel")}</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={senderName}
          onChangeText={setSenderName}
          placeholder={t("notifyDetail.senderPlaceholder")}
          placeholderTextColor="#94A3B8"
          maxLength={10}
        />
      </View>

      <View style={styles.section}>
        <ScheduleEditor
          schedules={schedules}
          onChange={setSchedules}
          onAddBlocked={() => showToast(t("notifyDetail.updatePlanned"))}
        />
      </View>

      {schedules.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{t("notifyDetail.defaultMsg")}</Text>
          <BottomSheetTextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder={t("notifyDetail.defaultMsgPlaceholder")}
            placeholderTextColor="#94A3B8"
            maxLength={50}
            multiline
          />
        </View>
      )}

      <Pressable onPress={handleDelete} style={styles.deleteBtn}>
        <Trash size={18} color={COLORS.warn} />
        <Text style={styles.deleteText}>{t("notifyDetail.deleteTitle")}</Text>
      </Pressable>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  notFound: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  offscreen: {
    position: "absolute",
    left: -9999,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontVariant: ["tabular-nums"],
  },
  section: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  messageInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  saveWrap: {
    flex: 1,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
});
