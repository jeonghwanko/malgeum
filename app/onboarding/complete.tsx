import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { logOnboardingComplete } from "@/services/analytics";
import { t } from "@/i18n";
import { OnboardingLayout, onboardingStyles as s } from "@/components/ui/OnboardingLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWeatherContext } from "@/context/WeatherContext";
import { generateActionCards } from "@/utils/recommendations";
import { buildFallbackBundle } from "@/constants/weather-assets";
import { CardStack, type CardStackHandle } from "@/components/onboarding/CardStack";
import { loadJson, removeItem, STORAGE_KEYS } from "@/utils/storage";

export default function OnboardingComplete() {
  const router = useRouter();
  const { state, dispatch, refreshWeather } = useWeatherContext();
  const [cardIndex, setCardIndex] = useState(0);
  const cardStackRef = useRef<CardStackHandle>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    dispatch({ type: "SET_ONBOARDING_DONE" });
    logOnboardingComplete();
    if (!state.currentWeather) {
      void refreshWeather();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bundle = state.currentWeather
    ? { current: state.currentWeather, hourly: state.hourlyForecast, daily: state.dailyForecast, airQuality: state.airQuality, hourlyAir: state.hourlyAir ?? [], hourlyUv: state.hourlyUv ?? [], pollen: state.pollen ?? null, fetchedAt: Date.now() }
    : buildFallbackBundle(null, [], [], null);

  // 마운트 시점 카드 스냅샷 — 날씨 로드 후 카드가 바뀌는 플래시 방지
  const [revealCards] = useState(() =>
    generateActionCards(bundle, state.healthProfile, state.tempUnit).slice(0, 3)
  );

  const handleEnter = useCallback(async () => {
    // 초대 링크로 들어온 유저 → pending 코드 소비 + notify-invite 화면이 자동 claim
    try {
      const pending = await loadJson<string | null>(STORAGE_KEYS.PENDING_INVITE, null);
      if (pending) {
        await removeItem(STORAGE_KEYS.PENDING_INVITE);
        router.replace(`/notify-invite?code=${pending}` as never);
        return;
      }
    } catch { /* 무시하고 홈으로 */ }
    router.replace("/(tabs)");
  }, [router]);

  const handleNext = useCallback(() => {
    const next = cardIndex + 1;
    if (next >= revealCards.length) {
      handleEnter();
    } else {
      setCardIndex(next);
    }
  }, [cardIndex, revealCards.length, handleEnter]);

  const handleNextPress = useCallback(() => {
    cardStackRef.current?.dismiss();
  }, []);

  if (revealCards.length === 0) {
    handleEnter();
    return null;
  }

  const isLast = cardIndex === revealCards.length - 1;

  return (
    <OnboardingLayout
      header={
        <View style={styles.dots}>
          {revealCards.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === cardIndex && styles.dotActive]}
            />
          ))}
        </View>
      }
      bottom={
        <PrimaryButton
          label={isLast ? t("onboarding.letsGo") : t("common.next")}
          onPress={handleNextPress}
          style={s.btn}
        />
      }
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.revealWrap}>
        <CardStack
          ref={cardStackRef}
          cards={revealCards}
          currentIndex={cardIndex}
          onNext={handleNext}
        />
      </Animated.View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  revealWrap: {
    width: "100%",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 20,
    borderRadius: 10,
  },
});
