import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, Pressable } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";
import { getInviteInfo, type InviteInfo } from "@/services/inviteService";
import { sanitizeInviteCode } from "@/types/notify";

const BG_IMAGE = require("../../assets/malgeum/A/A01-sunny-day.jpg");

export default function OnboardingInvited() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const clean = sanitizeInviteCode(code ?? "");
    if (clean.length !== 6) {
      setFailed(true);
      return;
    }
    getInviteInfo(clean).then((r) => {
      if (r.success) setInfo(r.info);
      else setFailed(true);
    });
  }, [code]);

  const goNext = () => router.replace("/onboarding/location");

  const senderName = info?.senderDisplayName?.trim() || "";
  const title = senderName
    ? t("onboarding.invited.title", { name: senderName })
    : t("onboarding.invited.titleGeneric");

  return (
    <View style={styles.root}>
      <ImageBackground source={BG_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={["rgba(15,23,42,0.5)", "rgba(15,23,42,0.2)", "rgba(15,23,42,0.85)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        {info ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
            <Text style={styles.eyebrow}>{t("onboarding.invited.eyebrow")}</Text>
            <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
              {title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.subtitle}>
              {t("onboarding.invited.subtitle")}
            </Animated.Text>
            {info.personalMessage ? (
              <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.messageCard}>
                <Text style={styles.messageLabel}>{t("onboarding.invited.messageLabel")}</Text>
                <Text style={styles.messageText}>&ldquo;{info.personalMessage}&rdquo;</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : failed ? (
          <View style={styles.center}>
            <Text style={styles.subtitle}>{t("onboarding.invited.loadFail")}</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}

        <View style={styles.bottom}>
          <Pressable onPress={goNext} style={({ pressed }) => [pressed && styles.ctaPressed]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{t("onboarding.invited.start")}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F172A" },
  content: { flex: 1, justifyContent: "space-between", paddingHorizontal: 28 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  eyebrow: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -0.8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  messageCard: {
    marginTop: 32,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    maxWidth: 320,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  bottom: { minHeight: 54, justifyContent: "center" },
  ctaGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  ctaPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});
