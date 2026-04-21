import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import ViewShot from "react-native-view-shot";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { UserCirclePlus, Megaphone } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { useNotify } from "@/context/NotifyContext";
import { useToast } from "@/context/ToastContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { buildInviteShareMessage, buildInviteWebLink, MAX_RECIPIENTS } from "@/types/notify";
import { buildPreviewCopy } from "@/services/microcopy";
import { mapConditionToTexture } from "@/utils/weather";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import { InviteCardPreview } from "@/components/notify/InviteCardPreview";
import { captureAndShareWithMessage } from "@/utils/shareCapture";
import { t } from "@/i18n";

export default function NotifyAddScreen() {
  const router = useRouter();
  const { state, addRecipient } = useNotify();
  const { state: weatherState } = useWeatherContext();
  const { artStyle } = useTheme();
  const { showToast } = useToast();
  const viewShotRef = useRef<ViewShot>(null);

  const [nickname, setNickname] = useState("");
  const [senderName, setSenderName] = useState("");
  const [created, setCreated] = useState<{ inviteCode: string; nickname: string; senderName: string } | null>(null);

  const [creating, setCreating] = useState(false);

  const condition = weatherState.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(condition);
  const bgImage = getTextureSource(artStyle, textureKey);

  const previewCopy = useMemo(() => {
    if (!created || !weatherState.currentWeather) return null;
    return buildPreviewCopy(
      weatherState.currentWeather,
      weatherState.hourlyForecast,
      weatherState.airQuality,
      created.nickname,
    );
  }, [created, weatherState.currentWeather, weatherState.hourlyForecast, weatherState.airQuality]);

  const handleCreate = async () => {
    if (state.recipients.length >= MAX_RECIPIENTS) {
      showToast(t("notifyAdd.maxReached", { max: MAX_RECIPIENTS }));
      return;
    }
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast(t("notifyAdd.enterName"));
      return;
    }
    setCreating(true);
    let code = "";
    try {
      const recipient = await addRecipient(trimmed, senderName.trim());
      code = recipient.inviteCode;
      setCreated({ inviteCode: code, nickname: trimmed, senderName: senderName.trim() });
    } catch {
      showToast(t("notifyAdd.createFail"));
      setCreating(false);
      return;
    }
    setCreating(false);
    try {
      await Clipboard.setStringAsync(code);
      showToast(t("notifyAdd.codeCopied"));
    } catch { /* 클립보드 실패는 무시 — 생성은 이미 성공 */ }
  };

  const handleCopyCode = async () => {
    if (!created) return;
    await Clipboard.setStringAsync(created.inviteCode);
    showToast(t("notifyAdd.codeCopied"));
  };

  const handleShare = async () => {
    if (!created) return;
    const webLink = buildInviteWebLink(created.inviteCode);
    const msg = buildInviteShareMessage({
      nickname: created.nickname,
      senderName: created.senderName,
      webLink,
      emotionalLine: t("notifyAdd.shareMsg"),
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

  const handleDone = () => {
    router.back();
  };

  if (created) {
    return (
      <ScreenSheet
        title={t("notifyAdd.codeCreated")}
        footer={
          <SaveButton
            label={t("notifyAdd.shareCard")}
            onPress={handleShare}
          />
        }
      >
        <View style={styles.codeSection}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successText}>
            {t("notifyAdd.successText", { name: created.nickname })}
          </Text>

          {previewCopy ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>{t("notifyAdd.previewLabel")}</Text>
              <View style={styles.previewBubble}>
                <Text style={styles.previewTitle}>{previewCopy.title}</Text>
                <Text style={styles.previewBody}>{previewCopy.body}</Text>
              </View>
              <Text style={styles.previewHint}>{t("notifyAdd.previewHint")}</Text>
            </View>
          ) : null}

          <InviteCardPreview
            ref={viewShotRef}
            nickname={created.nickname}
            inviteCode={created.inviteCode}
            senderName={created.senderName}
            backgroundImage={bgImage}
            previewMessage={previewCopy?.body}
          />

          <Pressable onPress={handleCopyCode} style={styles.codeChip}>
            <Text style={styles.codeChipText}>{created.inviteCode}</Text>
            <Text style={styles.codeChipHint}>{t("notifyAdd.tapToCopy")}</Text>
          </Pressable>

          <Pressable onPress={handleDone}>
            <Text style={styles.shareLater}>{t("notifyAdd.shareLater")}</Text>
          </Pressable>
        </View>
      </ScreenSheet>
    );
  }

  return (
    <ScreenSheet title={t("notifyAdd.title")} footer={<SaveButton label={t("notifyAdd.createCode")} onPress={handleCreate} loading={creating} />}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <UserCirclePlus size={20} weight="fill" color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t("notifyAdd.recipientName")}</Text>
            <Text style={styles.sectionSub}>{t("notifyAdd.recipientSub")}</Text>
          </View>
        </View>
        <BottomSheetTextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t("notifyAdd.recipientPlaceholder")}
          placeholderTextColor="#94A3B8"
          maxLength={10}
          autoFocus
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Megaphone size={20} weight="fill" color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t("notifyAdd.senderName")}</Text>
            <Text style={styles.sectionSub}>{t("notifyAdd.senderSub")}</Text>
          </View>
        </View>
        <BottomSheetTextInput
          style={styles.input}
          value={senderName}
          onChangeText={setSenderName}
          placeholder={t("notifyAdd.senderPlaceholder")}
          placeholderTextColor="#94A3B8"
          maxLength={10}
        />
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>{t("notifyAdd.guideTitle")}</Text>
        <Text style={styles.guideStep}>{t("notifyAdd.guideStep1")}</Text>
        <Text style={styles.guideStep}>{t("notifyAdd.guideStep2")}</Text>
        <Text style={styles.guideStep}>{t("notifyAdd.guideStep3")}</Text>
        <Text style={styles.guideStep}>{t("notifyAdd.guideStep4")}</Text>
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(96,165,250,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
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
  guideCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  guideStep: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  codeSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  successEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 20,
    gap: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  previewBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  previewBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  previewHint: {
    fontSize: 12,
    color: "#94A3B8",
  },
  codeChip: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    gap: 2,
  },
  codeChipText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 6,
  },
  codeChipHint: {
    fontSize: 11,
    color: "#94A3B8",
  },
  shareLater: {
    fontSize: 14,
    color: "#94A3B8",
    textDecorationLine: "underline",
    marginTop: 12,
    paddingVertical: 8,
  },
});
