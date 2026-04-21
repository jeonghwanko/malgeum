import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Bell } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { logOnboardingStep } from "@/services/analytics";
import { t } from "@/i18n";
import { useWeatherContext } from "@/context/WeatherContext";
import { OnboardingLayout, onboardingStyles as s } from "@/components/ui/OnboardingLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TimeStepper } from "@/components/ui/TimeStepper";
import type { AlertSettings } from "@/types/settings";

const ALL_OFF: AlertSettings = {
  commute: false, rain: false, dust: false,
  uv: false, pollen: false, evening: false, game: false,
};

export default function OnboardingNotification() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const [busy, setBusy] = useState(false);
  // 08:30 기본값 — TimeStepper minute은 5분 단위 인덱스 (30분 = 인덱스 6)
  const [depHour, setDepHour] = useState(8);
  const [depMinute, setDepMinute] = useState(6);

  const next = () => router.push("/onboarding/complete");

  const saveCommuteTime = () => {
    const departure = `${String(depHour).padStart(2, "0")}:${String(depMinute * 5).padStart(2, "0")}`;
    dispatch({ type: "SET_COMMUTE_TIME", payload: { departure, return: state.commuteTime.return } });
  };

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      logOnboardingStep(status === "granted" ? "notification_allowed" : "notification_denied");
      saveCommuteTime();
      if (status !== "granted") {
        dispatch({ type: "BATCH_SET_ALERTS", payload: ALL_OFF });
      }
    } finally {
      setBusy(false);
      next();
    }
  };

  const handleSkip = () => {
    logOnboardingStep("notification_skipped");
    saveCommuteTime();
    dispatch({ type: "BATCH_SET_ALERTS", payload: ALL_OFF });
    next();
  };

  return (
    <OnboardingLayout
      bottom={
        <PrimaryButton
          label={busy ? t("onboarding.requesting") : t("onboarding.allowNotif")}
          onPress={handleAllow}
          style={s.btn}
        />
      }
      footer={
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>{t("onboarding.skipLater")}</Text>
        </Pressable>
      }
    >
      <View style={s.iconWrap}>
        <Bell size={52} weight="fill" color={COLORS.primaryLight} />
      </View>
      <Text style={s.title}>{t("onboarding.notifHeroTitle")}</Text>
      <Text style={[s.desc, styles.descSpacing]}>
        {t("onboarding.notifHeroDesc")}
      </Text>

      <View style={styles.timeCard}>
        <Text style={styles.timeCardLabel}>{t("onboarding.commuteTimeQ")}</Text>
        <TimeStepper
          hour={depHour}
          minute={depMinute}
          onChangeHour={setDepHour}
          onChangeMinute={setDepMinute}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  descSpacing: {
    marginBottom: 16,
  },
  timeCard: {
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  timeCardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    marginBottom: 2,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
  },
});
