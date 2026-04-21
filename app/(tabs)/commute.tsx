import React, { useMemo, useState, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SunHorizon, MoonStars } from "phosphor-react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { PaletteProvider, usePalette } from "@/context/PaletteContext";
import { useCommuteMode } from "@/hooks/useCommuteMode";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { CommuteCompareCard } from "@/components/commute/CommuteCompareCard";
import { ChecklistItem } from "@/components/commute/ChecklistItem";
import { TimelineItem } from "@/components/commute/TimelineItem";
import { TempDropCard } from "@/components/commute/TempDropCard";
import { getCommuteComparison } from "@/utils/recommendations";
import { getConditionLabel, getFeelLabel, mapConditionToTexture } from "@/utils/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import { getGreeting } from "@/utils/date";
import { t } from "@/i18n";

export default function CommuteScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();
  const bgCondition = state.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(bgCondition);

  return (
    <PaletteProvider artStyle={artStyle} textureKey={textureKey}>
      <CommuteContent />
    </PaletteProvider>
  );
}

const SWIPE_THRESHOLD = 30;

function CommuteContent() {
  const { state } = useWeatherContext();
  const ap = usePalette()!;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const autoMode = useCommuteMode(state.commuteTime.departure, state.commuteTime.return);
  const [manualMode, setManualMode] = useState<"morning" | "evening" | null>(null);
  const mode = manualMode ?? autoMode;
  const isMorning = mode === "morning";
  const greeting = getGreeting();

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animateTransition = useCallback((nextMode: "morning" | "evening", direction: number) => {
    translateX.value = direction * screenWidth * 0.3;
    opacity.value = 0;
    setManualMode(nextMode);
    translateX.value = withTiming(0, { duration: 250 });
    opacity.value = withTiming(1, { duration: 250 });
  }, [screenWidth, translateX, opacity]);

  const handleSwipeEnd = useCallback((translationX: number) => {
    if (translationX < -SWIPE_THRESHOLD && isMorning) {
      animateTransition("evening", -1);
    } else if (translationX > SWIPE_THRESHOLD && !isMorning) {
      animateTransition("morning", 1);
    }
  }, [isMorning, animateTransition]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      runOnJS(handleSwipeEnd)(e.translationX);
    });

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const current = state.currentWeather;
  const hourly = state.hourlyForecast;

  const comparison = useMemo(
    () => getCommuteComparison(hourly, state.commuteTime.departure, state.commuteTime.return),
    [hourly, state.commuteTime]
  );

  const bgCondition = current?.condition ?? "clear";
  const depTemp = comparison?.departure.temp ?? current?.temp ?? 18;
  const retTemp = comparison?.returnTrip.temp ?? (current?.temp ?? 18) + 4;
  const depCond = comparison?.departure.condition ?? bgCondition;
  const retCond = comparison?.returnTrip.condition ?? bgCondition;
  const tempDiff = comparison?.tempDiff ?? 0;
  const depFL = comparison?.departure.feelsLike ?? current?.feelsLike ?? depTemp;
  const retFL = comparison?.returnTrip.feelsLike ?? retTemp;

  // 체크리스트
  const checklist = useMemo(() => {
    const items: { label: string; sub: string; status: "safe" | "caution" }[] = [];
    const fl = current?.feelsLike ?? depTemp;
    const maxPrecip = Math.max(
      comparison?.departure.precipitation ?? 0,
      comparison?.returnTrip.precipitation ?? 0,
    );

    if (fl <= 10) items.push({ label: t("commuteChecklist.heavyCoat"), sub: t("commuteChecklist.heavyCoatSub", { fl }), status: "caution" });
    else if (fl <= 16) items.push({ label: t("commuteChecklist.cardiganSweat"), sub: t("commuteChecklist.cardiganSweatSub", { hint: retTemp >= 20 ? t("commuteChecklist.noCardiganOk") : t("commuteChecklist.chillier") }), status: "safe" });
    else if (fl <= 22) items.push({ label: t("commuteChecklist.tshirtCardigan"), sub: t("commuteChecklist.tshirtCardiganSub", { dep: depTemp, ret: retTemp, dir: tempDiff > 0 ? t("commuteChecklist.goingUp") : t("commuteChecklist.similar") }), status: "safe" });
    else items.push({ label: t("commuteChecklist.tshirtEnough"), sub: t("commuteChecklist.tshirtEnoughSub", { dep: depTemp, ret: retTemp }), status: "safe" });

    const needUmbrella = comparison?.needUmbrella ?? false;
    items.push(needUmbrella
      ? { label: t("commuteChecklist.bringUmbrella"), sub: t("commuteChecklist.bringUmbrellaSub", { precip: maxPrecip }), status: "caution" }
      : { label: t("commuteChecklist.noUmbrella"), sub: t("commuteChecklist.noUmbrellaSub", { precip: maxPrecip }), status: "safe" }
    );

    if (state.airQuality && state.airQuality.aqi >= 3) {
      items.push({ label: t("commuteChecklist.maskRecommend"), sub: t("commuteChecklist.maskSub"), status: "caution" });
    } else if (state.airQuality && state.airQuality.aqi <= 1) {
      items.push({ label: t("commuteChecklist.goodWalk"), sub: t("commuteChecklist.goodWalkSub"), status: "safe" });
    }

    if (Math.abs(tempDiff) >= 5) {
      items.push({
        label: isMorning ? t("commuteChecklist.eveningDiff", { diff: Math.abs(tempDiff), dir: tempDiff < 0 ? t("commuteChecklist.drops") : t("commuteChecklist.rises") }) : t("commuteChecklist.checkTomorrow"),
        sub: isMorning ? t("commuteChecklist.eveningDiffSub", { ret: retTemp, detail: tempDiff < 0 ? t("commuteChecklist.lowerThanMorning", { diff: Math.abs(tempDiff) }) : t("commuteChecklist.muchWarmer") }) : t("commuteChecklist.tempChangeExpected", { diff: Math.abs(tempDiff) }),
        status: "caution",
      });
    }

    return items;
  }, [current, comparison, state.airQuality, tempDiff, depTemp, retTemp, isMorning]);

  // 타임라인
  const timeline = useMemo(() => {
    if (hourly.length === 0) return [];

    const depHour = parseInt(state.commuteTime.departure.split(":")[0], 10);
    const retHour = parseInt(state.commuteTime.return.split(":")[0], 10);
    const rangeStart = Math.max(0, depHour - 1);
    const rangeEnd = Math.min(23, retHour + 1);

    const filtered = hourly.filter((h) => {
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= rangeStart && hour <= rangeEnd;
    });

    return filtered.map((h, i) => {
      const hour = new Date(h.dt * 1000).getHours();
      const icon = getConditionEmoji(h.condition);
      const feel = getFeelLabel(h.temp);

      let detail: string | undefined;
      if (hour === depHour) {
        detail = t("commuteTimeline.departure", { temp: h.temp, feel, tip: h.temp <= 16 ? t("commuteTimeline.grabCardigan") : t("commuteTimeline.lightOk") });
      } else if (hour === retHour) {
        detail = t("commuteTimeline.return", { info: Math.abs(tempDiff) >= 5 ? t("commuteTimeline.diffFromMorning", { diff: Math.abs(tempDiff), dir: tempDiff < 0 ? t("commuteChecklist.drops") : t("commuteChecklist.rises") }) : t("commuteTimeline.goodWork") });
      } else if (hour >= 12 && hour <= 13) {
        detail = h.temp >= 25 ? t("commuteTimeline.lunchHot", { temp: h.temp, feel }) : t("commuteTimeline.lunch", { temp: h.temp, feel });
      } else if (hour >= 14 && hour <= 15 && current && current.uvIndex >= 6) {
        detail = t("commuteTimeline.uvPeak");
      }

      const isHighlight = hour === depHour || hour === retHour || hour === 12;

      return {
        time: `${hour}:00`,
        icon,
        title: `${h.temp}° ${feel}`,
        detail,
        highlight: isHighlight,
        isLast: i === filtered.length - 1,
      };
    });
  }, [hourly, state.commuteTime, current, tempDiff]);

  const heroText = useMemo(() => {
    if (isMorning) return comparison?.recommendation ?? t("commute.havAGoodDay");
    if (comparison?.needUmbrella) return t("commute.dontForgetUmbrella");
    if (state.airQuality && state.airQuality.aqi >= 3) return t("commute.grabMask");
    if (tempDiff <= -5) return t("commute.grabCardigan");
    if (tempDiff >= 5) return t("commute.warmerEvening");
    return t("commute.comfyEvening");
  }, [isMorning, comparison, state.airQuality, tempDiff]);

  const showTempDropCard = !isMorning && Math.abs(tempDiff) >= 5;
  const nb = ap.notebook;
  const fontFamily = nb && nb.fontFamily !== "system" ? nb.fontFamily : undefined;

  return (
    <WeatherBackground condition={bgCondition} isNight={!isMorning} sideGradient={true}>
      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 브랜딩 + 토글 */}
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.brand, { fontFamily, fontWeight: "normal" }]}>{t("commute.brand")}</Text>
              <Text style={styles.greetingSub}>{greeting.text}</Text>
            </View>
            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => animateTransition("morning", 1)}
                style={[styles.modeBtn, isMorning && styles.modeBtnActive]}
              >
                <SunHorizon size={16} weight={isMorning ? "fill" : "regular"} color={isMorning ? "#FFFFFF" : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.modeBtnText, isMorning && styles.modeBtnTextActive]}>{t("commute.morning")}</Text>
              </Pressable>
              <Pressable
                onPress={() => animateTransition("evening", -1)}
                style={[styles.modeBtn, !isMorning && styles.modeBtnActive]}
              >
                <MoonStars size={16} weight={!isMorning ? "fill" : "regular"} color={!isMorning ? "#FFFFFF" : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.modeBtnText, !isMorning && styles.modeBtnTextActive]}>{t("commute.evening")}</Text>
              </Pressable>
            </View>
          </View>

          <Animated.View style={animatedContentStyle}>
            {/* 히어로 */}
            <View style={styles.heroSection}>
              <Text style={[styles.heroTitle, { fontFamily, fontWeight: "normal" }]}>
                {isMorning ? t("commute.goingOut") : t("commute.commuteHome")}
              </Text>
              <Text style={[styles.heroAccent, { fontFamily, fontWeight: "normal", color: ap.accent }]}>
                {heroText}
              </Text>
            </View>

            {/* 기온 변화 카드 */}
            {showTempDropCard && (
              <View style={styles.section}>
                <TempDropCard fromTemp={depTemp} toTemp={retTemp} tempDiff={tempDiff} />
              </View>
            )}

            {/* 출퇴근 비교 */}
            <View style={styles.section}>
              <CommuteCompareCard
                departure={{
                  label: t("commute.depHour", { hour: state.commuteTime.departure.split(":")[0] }),
                  temp: depTemp,
                  feelsLike: depFL,
                  condition: depCond,
                  precipitation: comparison?.departure.precipitation ?? 0,
                  description: getFeelLabel(depFL),
                }}
                returnTrip={{
                  label: t("commute.retHour", { hour: state.commuteTime.return.split(":")[0] }),
                  temp: retTemp,
                  feelsLike: retFL,
                  condition: retCond,
                  precipitation: comparison?.returnTrip.precipitation ?? 0,
                  description: getFeelLabel(retFL),
                }}
              />
            </View>

            {/* 체크리스트 */}
            <View style={[styles.section, { marginTop: 20 }]}>
              <Text style={[styles.sectionLabel, { fontFamily, fontWeight: "normal" }]}>
                {isMorning ? t("commute.morningChecklist") : t("commute.eveningChecklist")}
              </Text>
              {checklist.map((item, i) => (
                <ChecklistItem key={i} label={item.label} sub={item.sub} status={item.status} />
              ))}
            </View>

            {/* 타임라인 */}
            {timeline.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { fontFamily, fontWeight: "normal" }]}>
                  {t("commute.timeline")}
                </Text>
                {timeline.map((item, i) => (
                  <TimelineItem
                    key={i}
                    time={item.time}
                    icon={item.icon}
                    title={item.title}
                    detail={item.detail}
                    highlight={item.highlight}
                    isLast={item.isLast}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </GestureDetector>
    </WeatherBackground>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.45)",
  textShadowOffset: { width: 0, height: 2 } as const,
  textShadowRadius: 10,
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 110 },

  // 상단: 브랜딩 + 토글
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  brand: {
    fontSize: 24, color: "#FFFFFF",
    ...shadow,
  },
  greetingSub: {
    fontSize: 14, fontWeight: "500", color: "#FFFFFF",
    ...shadow, textShadowRadius: 6,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  modeBtnActive: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
  },

  // 섹션
  section: { paddingHorizontal: 24, marginBottom: 16, zIndex: 1 },

  // 히어로 (플로팅 텍스트)
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32, color: "#FFFFFF",
    lineHeight: 40, letterSpacing: -0.5,
    ...shadow,
  },
  heroAccent: {
    fontSize: 32, lineHeight: 40, letterSpacing: -0.5,
    ...shadow,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 22, color: "#FFFFFF",
    marginBottom: 10,
    ...shadow, textShadowRadius: 6,
  },
});
