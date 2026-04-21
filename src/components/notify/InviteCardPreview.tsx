import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";

interface InviteCardPreviewProps {
  nickname: string;
  inviteCode: string;
  senderName: string;
  backgroundImage: any;
  previewMessage?: string;
}

export const InviteCardPreview = forwardRef<ViewShot, InviteCardPreviewProps>(
  ({ nickname, inviteCode, senderName, backgroundImage, previewMessage }, ref) => (
    <ViewShot ref={ref} options={{ format: "png", quality: 1 }}>
      <ImageBackground source={backgroundImage} style={styles.card} resizeMode="cover">
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          {/* 상단 */}
          <View>
            <Text style={styles.appName}>{t("inviteCard.appName")}</Text>
            <Text style={styles.tagline}>{t("inviteCard.tagline")}</Text>
          </View>

          {/* 중앙 — 초대 메시지 + 코드 */}
          <View style={styles.center}>
            <Text style={styles.inviteMsg}>
              {t("inviteCard.inviteMsg", { sender: senderName || t("inviteCard.someone"), recipient: nickname })}
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>{t("notify.inviteCode")}</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            {previewMessage ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>{t("inviteCard.previewLabel")}</Text>
                <Text style={styles.previewText} numberOfLines={3}>{previewMessage}</Text>
              </View>
            ) : null}
          </View>

          {/* 하단 — 안내 */}
          <View>
            <Text style={styles.guide}>
              {t("inviteCard.guide")}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </ViewShot>
  ),
);

const styles = StyleSheet.create({
  card: {
    width: 340,
    aspectRatio: 9 / 16,
    overflow: "hidden",
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 28,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
  center: {
    alignItems: "center",
    gap: 20,
  },
  inviteMsg: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 6,
  },
  codeBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  codeText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 8,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
  previewBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 18,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
  guide: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 18,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
});
