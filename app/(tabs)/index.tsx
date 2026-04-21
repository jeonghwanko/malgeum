import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TouchableOpacity, TouchableWithoutFeedback, Pressable, Alert, Linking, Platform, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, withTiming, runOnJS } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { MapPin, Check } from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { usePurchase } from "@/context/PurchaseContext";
import { useToast } from "@/context/ToastContext";
import { useWeatherScroll } from "@/hooks/useWeatherScroll";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { WeatherRefreshIndicator } from "@/components/weather/WeatherRefreshIndicator";
import { SectionReveal } from "@/components/weather/SectionReveal";
import { mapConditionToTexture } from "@/utils/weather";
import { HeroSection } from "@/components/home/HeroSection";
import { DecisionHero } from "@/components/home/DecisionHero";
import { DailyBriefSheet } from "@/components/home/DailyBriefSheet";
import { EmotionalPromoSheet } from "@/components/home/EmotionalPromoSheet";
import { ActionGrid } from "@/components/home/ActionGrid";
import { DailyActionPills } from "@/components/home/DailyActionPills";
import { HourlyScroll } from "@/components/home/HourlyScroll";
import { HealthGrid } from "@/components/home/HealthGrid";
import { HourlyAirScroll } from "@/components/home/HourlyAirScroll";
import { HourlyUvScroll } from "@/components/home/HourlyUvScroll";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ChatSheet } from "@/components/ui/ChatSheet";
import { DetailContentResolver, getDetailTitle } from "@/components/detail/DetailContentResolver";
import { generateActionCards, getHeroMessage, getCommuteComparison } from "@/utils/recommendations";
import { useWeatherRefresh } from "@/hooks/useWeatherRefresh";
import { requestLocationPermission } from "@/services/locationService";
import { getYesterdayMax } from "@/services/predictionGameService";
import { isNighttime, formatHour, getGreeting } from "@/utils/date";
import { usePalette } from "@/context/PaletteContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { logActionCardTap, logAiChatOpen } from "@/services/analytics";
import { recordCardTap, loadCardTapCounts, type CardTapCounts } from "@/services/cardPreferenceService";
import { hasBriefedToday, markBriefedToday, hasSeenOnboardingShare, markOnboardingShareSeen, hasCompletedOnboardingChat } from "@/utils/storage";
import { useMalgeumGreeting } from "@/hooks/useMalgeumGreeting";
import { recordVisit } from "@/services/visitStreakService";
import { fetchNearbyFestivals, type FestivalItem, formatFestivalPeriod, shortAddr } from "@/services/festivalService";
import { fetchPerformances, type PerformanceItem, formatPerfPeriod } from "@/services/performanceService";
import { fetchNearbyCamping, isCampingWeather, type CampingItem, shortCampAddr } from "@/services/campingService";
import { getLocale } from "@/i18n";
import { useSchoolLunch } from "@/hooks/useSchoolLunch";
import { MOCK_BUNDLE } from "@/constants/mockData";
import type { AllArtStyleKey } from "@/types/settings";
import type { WeatherBundle } from "@/types/weather";
import { t } from "@/i18n";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const EMPTY_ARR: never[] = [];

function CardDetailModal({ cardDetail, bundle, onClose }: { cardDetail: { type: string; id: string }; bundle: WeatherBundle; onClose: () => void }) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
  }, [translateY]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, translateY]);

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationY > 0) translateY.value = e.translationY;
      })
      .onEnd((e) => {
        if (e.translationY > 100 || e.velocityY > 500) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
            if (finished) runOnJS(onClose)();
          });
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      }),
  [translateY, onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SCREEN_HEIGHT * 0.5], [1, 0], "clamp"),
  }));

  const handleScrollEndDrag = useCallback((e: any) => {
    if (e.nativeEvent.contentOffset.y < -60) dismiss();
  }, [dismiss]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.cardDetailOverlay, backdropStyle]}>
          <TouchableWithoutFeedback onPress={dismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardDetailSheet, sheetStyle]}>
            <View style={styles.cardDetailDragZone}>
              <View style={styles.cardDetailHandle} />
            </View>
            <View style={styles.cardDetailHeader}>
            <Text style={styles.cardDetailTitle}>{getDetailTitle(cardDetail.id)}</Text>
            <Pressable onPress={dismiss} style={styles.cardDetailClose} hitSlop={10}>
              <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
            showsVerticalScrollIndicator={false}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            bounces
          >
            <DetailContentResolver type={cardDetail.type} id={cardDetail.id} bundle={bundle} />
          </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

export default function HomeScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();

  // fetchedAt을 Date.now()로 인라인 생성하면 매 렌더마다 새 객체 → 하위 useMemo 전부 무효화
  const bundle = useMemo((): WeatherBundle => {
    if (!state.currentWeather) return MOCK_BUNDLE;
    return {
      current: state.currentWeather,
      hourly: state.hourlyForecast,
      daily: state.dailyForecast,
      airQuality: state.airQuality,
      hourlyAir: state.hourlyAir ?? EMPTY_ARR,
      hourlyUv: state.hourlyUv ?? EMPTY_ARR,
      pollen: state.pollen ?? null,
      fetchedAt: state.lastFetchedAt ? new Date(state.lastFetchedAt).getTime() : 0,
    };
  }, [state.currentWeather, state.hourlyForecast, state.dailyForecast, state.airQuality, state.hourlyAir, state.hourlyUv, state.pollen, state.lastFetchedAt]);

  const isNight = isNighttime(bundle.current.sunrise, bundle.current.sunset);
  const textureKey = mapConditionToTexture(bundle.current.condition);

  return (
    <HomeContent bundle={bundle} isNight={isNight} artStyle={artStyle} textureKey={textureKey} />
  );
}

function HomeContent({
  bundle,
  isNight,
  artStyle,
  textureKey,
}: {
  bundle: WeatherBundle;
  isNight: boolean;
  artStyle: AllArtStyleKey;
  textureKey: import("@/types/weather").TextureWeatherKey;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch, refreshWeather, refreshGPSLocation } = useWeatherContext();
  const { scrollY, scrollHandler } = useWeatherScroll();
  const { refresh, autoRefreshing } = useWeatherRefresh();
  const { isPremium, customerId } = usePurchase();
  const { showToast } = useToast();
  const ap = usePalette()!;
  const [refreshing, setRefreshing] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [chatMode, setChatMode] = useState<"closed" | "normal" | "onboarding">("closed");
  const chatVisible = chatMode !== "closed";
  const [chatHintCounter, setChatHintCounter] = useState(0);
  const [yesterdayMax, setYesterdayMax] = useState<number | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showEmotionalPromo, setShowEmotionalPromo] = useState(false);
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [campingSites, setCampingSites] = useState<CampingItem[]>([]);
  const [cardDetail, setCardDetail] = useState<{ type: string; id: string } | null>(null);
  const briefChecked = useRef(false);
  const visitRecorded = useRef(false);
  const malgeumGreeting = useMalgeumGreeting(bundle, state.nickname);
  const notebook = ap.notebook;
  const [tapCounts, setTapCounts] = useState<CardTapCounts>({});
  const { menus: schoolLunchMenus } = useSchoolLunch(state.schoolSettings);

  // 카드 탭 빈도 로드 (마운트 시 1회)
  useEffect(() => { loadCardTapCounts().then(setTapCounts); }, []);

  // 날씨 갱신 후 yesterdayMax 업데이트 + 브리핑/프로모 판단.
  // 브리핑은 신선한 첫 fetch 이후에만 — saved state 로드 시점엔 seedYesterdayMaxFromApi가 아직 실행 전이라 null
  const initialLastFetchedAtRef = useRef(state.lastFetchedAt);
  useEffect(() => {
    if (!state.lastFetchedAt) return;
    const isFresh = state.lastFetchedAt !== initialLastFetchedAtRef.current;
    // yesterdayMax는 매 갱신마다 업데이트 (pull-to-refresh 포함)
    if (!visitRecorded.current) { visitRecorded.current = true; recordVisit(); }
    getYesterdayMax().then((yMax) => {
      setYesterdayMax(yMax);
      // 브리핑/프로모는 신선한 fetch 이후 1회만
      if (!isFresh || briefChecked.current) return;
      briefChecked.current = true;
      Promise.all([
        hasCompletedOnboardingChat(),
        hasSeenOnboardingShare(),
        hasBriefedToday(),
      ]).then(([chatDone, seen, briefed]) => {
        if (!chatDone) {
          setChatMode("onboarding");
        } else if (!seen) {
          setShowEmotionalPromo(true);
        } else if (!briefed) {
          setShowBrief(true);
        }
      });
    });
  }, [state.lastFetchedAt]);

  // 축제+공연+캠핑: location 변경 시만 fetch (매 refresh 아닌)
  useEffect(() => {
    if (getLocale() !== "ko") return;
    const loc = state.locations.find((l) => l.id === state.currentLocationId);
    if (!loc) return;
    const cond = state.currentWeather?.condition ?? "clear";
    fetchNearbyFestivals(loc.lat, loc.lon).then(setFestivals).catch(() => {});
    fetchPerformances(loc.lat, loc.lon, cond).then(setPerformances).catch(() => {});
    fetchNearbyCamping(loc.lat, loc.lon).then(setCampingSites).catch(() => {});
  }, [state.currentLocationId]);

  const handleSharePress = useCallback(() => router.push("/share"), [router]);
  const handleChatPress = useCallback(() => { logAiChatOpen(); setChatMode("normal"); }, []);

  // 온보딩 채팅이 닫힐 때, 0.2초 뒤 우측 채팅 숏컷에 한 번 번쩍 힌트
  const handleChatClose = useCallback(() => {
    const wasOnboarding = chatMode === "onboarding";
    setChatMode("closed");
    if (wasOnboarding) {
      setTimeout(() => setChatHintCounter((c) => c + 1), 200);
    }
  }, [chatMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleBriefDismiss = useCallback(async () => {
    await markBriefedToday();
    setShowBrief(false);
  }, []);

  const handleBriefAskMore = useCallback(async () => {
    await markBriefedToday();
    setShowBrief(false);
    logAiChatOpen();
    setChatMode("normal");
  }, []);

  const handleEmotionalPromoDismiss = useCallback(async () => {
    await markOnboardingShareSeen();
    setShowEmotionalPromo(false);
  }, []);

  const handleEmotionalPromoShare = useCallback(async () => {
    await markOnboardingShareSeen();
    setShowEmotionalPromo(false);
    router.push({ pathname: "/share", params: { mode: "emotional" } });
  }, [router]);

  const handleLocationTap = useCallback(async () => {
    if (state.locations.length > 1) {
      setLocationPickerVisible(true);
      return;
    }
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert(
        t("home.locationPermission"),
        t("home.locationPermissionDesc"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("home.openSettings"), onPress: () => { Linking.openSettings().catch(() => {}); } },
        ]
      );
      return;
    }
    await refreshGPSLocation();
  }, [state.locations, refreshGPSLocation]);

  const actionCards = useMemo(() => generateActionCards(bundle, state.healthProfile, state.tempUnit, tapCounts), [bundle, state.healthProfile, state.tempUnit, tapCounts]);

  const handleActionCardPress = useCallback((cardId: string) => {
    const card = actionCards.find((c) => c.id === cardId);
    const category = card?.category ?? "unknown";
    logActionCardTap(cardId, category);
    // 개인화: 탭 빈도 기록 → 다음 렌더에 카드 순서 반영
    if (card) {
      recordCardTap(card.category).then(() => loadCardTapCounts().then(setTapCounts));
    }
    setCardDetail({ type: "action", id: cardId });
  }, [actionCards]);

  const handleHealthCardPress = useCallback((healthId: string) => {
    setCardDetail({ type: "health", id: healthId });
  }, []);

  const commuteSummary = useMemo(() => {
    const comp = getCommuteComparison(bundle.hourly, state.commuteTime.departure, state.commuteTime.return);
    if (!comp) return null;
    const diff = Math.round(comp.tempDiff);
    const sign = diff > 0 ? "+" : "";
    return t("home.commuteSummary", { dep: Math.round(comp.departure.temp), ret: Math.round(comp.returnTrip.temp), sign, diff });
  }, [bundle.hourly, state.commuteTime]);
  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? t("home.defaultLocation");
  const todayDaily = bundle.daily[0];
  const tempLow = todayDaily?.tempMin ?? bundle.current.temp - 4;
  const tempHigh = todayDaily?.tempMax ?? bundle.current.temp + 4;
  const yesterdayDiff = yesterdayMax !== null ? Math.round(tempHigh - yesterdayMax) : null;
  const hero = useMemo(() => getHeroMessage(bundle, yesterdayDiff), [bundle, yesterdayDiff]);

  const glowColor = ap.animationTint;

  const hourlySummary = useMemo(() => {
    if (bundle.hourly.length === 0) return "";
    const maxH = bundle.hourly.reduce((a, b) => (b.temp > a.temp ? b : a));
    return t("home.warmestAt", { hour: formatHour(maxH.dt) });
  }, [bundle.hourly]);

  // isEvening: 렌더마다 계산해도 Date().getHours() 비교는 무시할 수준으로 저렴
  // (useMemo([])이면 마운트 시 1회만 계산되어 18시 이후 앱 진입 시 배너 미노출)
  const isEvening = new Date().getHours() >= 18;

  // getGreeting: 매 렌더마다 new Date() 호출 + 객체 생성 → HeroSection prop 불안정
  const greeting = useMemo(getGreeting, []);

  const aqLabel = bundle.airQuality
    ? bundle.airQuality.aqi <= 1 ? t("rec.airLabel.good") : bundle.airQuality.aqi <= 2 ? t("rec.airLabel.moderate") : t("rec.airLabel.bad")
    : undefined;

  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [160, 220], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [160, 220], [-8, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <WeatherBackground condition={bundle.current.condition} isNight={isNight} scrollY={scrollY}>
      <WeatherRefreshIndicator
        scrollY={scrollY}
        refreshing={refreshing}
        condition={bundle.current.condition}
        topInset={insets.top}
      />

      <Animated.View
        style={[styles.stickyHeader, { paddingTop: insets.top + 6, backgroundColor: ap.cardBg }, stickyHeaderStyle]}
        pointerEvents="none"
      >
        <Text style={[styles.stickyLocation, { color: ap.textTertiary }]} numberOfLines={1}>{locationName}</Text>
        <Text style={[styles.stickyTemp, { color: ap.textPrimary }]}>{bundle.current.temp}°</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        {...{ delayContentTouches: false }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
            {...(Platform.OS === "android" && { progressViewOffset: -100 })}
          />
        }
      >
        <HeroSection
          temp={bundle.current.temp}
          feelsLike={bundle.current.feelsLike}
          condition={bundle.current.condition}
          tempLow={tempLow}
          tempHigh={tempHigh}
          precipitation={bundle.current.precipitation}
          airQualityLabel={aqLabel}
          scrollY={scrollY}
          palette={ap}
          greeting={greeting}
          location={locationName}
          onSharePress={() => router.push("/share")}
          onRefresh={onRefresh}
          lastFetchedAt={state.lastFetchedAt}
          onLocationPress={handleLocationTap}
          tempUnit={state.tempUnit}
          autoRefreshing={autoRefreshing}
        />

        {/* 네트워크 실패 시 캐시 데이터 안내 */}
        {!state.currentWeather && (
          <Pressable style={styles.offlineBanner} onPress={onRefresh}>
            <Text style={styles.offlineBannerText}>{t("home.offline")}</Text>
          </Pressable>
        )}

        <View style={{ marginTop: 40 }}>
          <SectionReveal scrollY={scrollY} glowColor={glowColor}>
            <DecisionHero
              message={hero.message}
              subText={hero.subText}
              badge={hero.badge}
              status={hero.status}
              palette={ap}
              yesterdayDiff={yesterdayDiff}
              commuteSummary={commuteSummary}
              onPress={() => setShowBrief(true)}
            />
          </SectionReveal>

          <ActionGrid cards={actionCards} onCardPress={handleActionCardPress} />
        </View>

        <SectionReveal scrollY={scrollY} glowColor={glowColor}>
          <View style={{ paddingHorizontal: 24, marginTop: 16, marginBottom: 4 }}>
            <SectionTitle palette={ap}>{t("home.hourlyChange")}</SectionTitle>
          </View>
          {hourlySummary ? (
            <Text style={[styles.summary, {
              color: ap.textSecondary,
              textShadowColor: ap.textShadowColor,
            }]}>
              {hourlySummary}
            </Text>
          ) : null}
          <HourlyScroll data={bundle.hourly} palette={ap} tempUnit={state.tempUnit} />
        </SectionReveal>


        <SectionReveal scrollY={scrollY} glowColor={glowColor}>
          {bundle.hourlyAir.length > 0 && (
            <>
              <View style={{ paddingHorizontal: 24, marginTop: 16, marginBottom: 4 }}>
                <Text style={[styles.subSectionTitle, { color: ap.textSecondary, textShadowColor: ap.textShadowColor }]}>
                  {t("home.hourlyAir")}
                </Text>
              </View>
              <HourlyAirScroll data={bundle.hourlyAir} palette={ap} />
            </>
          )}
          {bundle.hourlyUv.length > 0 && (
            <>
              <View style={{ paddingHorizontal: 24, marginTop: 8, marginBottom: 4 }}>
                <Text style={[styles.subSectionTitle, { color: ap.textSecondary, textShadowColor: ap.textShadowColor }]}>
                  {t("home.hourlyUv")}
                </Text>
              </View>
              <HourlyUvScroll data={bundle.hourlyUv} palette={ap} />
            </>
          )}
          <HealthGrid
            airQuality={bundle.airQuality}
            uvIndex={bundle.current.uvIndex}
            humidity={bundle.current.humidity}
            temp={bundle.current.temp}
            windSpeed={bundle.current.windSpeed}
            condition={bundle.current.condition}
            palette={ap}
            onCardPress={handleHealthCardPress}
          />
        </SectionReveal>

        {/* 커피콩 크로스 프로모 배너 */}
        <SectionReveal scrollY={scrollY} glowColor={glowColor}>
          <Pressable
            style={[styles.coffeeBanner, { backgroundColor: ap.pillBg, borderColor: ap.pillBorder }]}
            onPress={() => Linking.openURL(
              Platform.OS === "ios"
                ? "https://apps.apple.com/kr/app/%EC%BB%A4%ED%94%BC%EC%BD%A9/id6761358222"
                : "https://play.google.com/store/apps/details?id=gg.pryzm.coffee"
            )}
          >
            <Text style={styles.coffeeBannerEmoji}>☕</Text>
            <View style={styles.bannerFlex}>
              <Text style={[styles.coffeeBannerTitle, { color: ap.textPrimary }]}>습관 체크하고 커피 받아가세요</Text>
              <Text style={[styles.coffeeBannerSub, { color: ap.textTertiary }]}>매일 미션 완료하면 진짜 상품권 교환!</Text>
            </View>
            <Text style={[styles.feedbackArrow, { color: ap.textTertiary }]}>›</Text>
          </Pressable>
        </SectionReveal>

        {/* 근처 축제/행사 배너 (ko only, 데이터 있을 때만) */}
        {festivals.length > 0 && (
          <SectionReveal scrollY={scrollY} glowColor={glowColor}>
            <Pressable onPress={() => router.push("/(tabs)/event")}>
              {({ pressed }) => (
                <View style={[styles.festivalBanner, { backgroundColor: ap.pillBg, borderColor: ap.pillBorder, opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={styles.festivalEmoji}>🎪</Text>
                  <View style={styles.bannerFlex}>
                    <Text style={[styles.festivalTitle, { color: ap.textPrimary }]}>{t("mg.festival.bannerTitle")}</Text>
                    <Text style={[styles.festivalName, { color: ap.textSecondary }]} numberOfLines={1}>
                      {festivals[0].title} · {shortAddr(festivals[0].addr)} · {formatFestivalPeriod(festivals[0].startDate, festivals[0].endDate)}
                    </Text>
                  </View>
                  <Text style={[styles.bannerArrow, { color: ap.textTertiary }]}>›</Text>
                </View>
              )}
            </Pressable>
          </SectionReveal>
        )}

        {/* 근처 공연 추천 배너 (ko only, 데이터 있을 때만) */}
        {performances.length > 0 && (
          <SectionReveal scrollY={scrollY} glowColor={glowColor}>
            <Pressable onPress={() => router.push("/(tabs)/event")}>
              {({ pressed }) => (
                <View style={[styles.perfBanner, { backgroundColor: ap.pillBg, borderColor: ap.pillBorder, opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={styles.perfEmoji}>🎭</Text>
                  <View style={styles.bannerFlex}>
                    <Text style={[styles.perfTitle, { color: ap.textPrimary }]}>{t("mg.perf.bannerTitle")}</Text>
                    <Text style={[styles.perfName, { color: ap.textSecondary }]} numberOfLines={1}>
                      {performances[0].genre} · {performances[0].title} · {performances[0].venue}
                    </Text>
                    {performances.length > 1 && (
                      <Text style={[styles.perfMore, { color: ap.textTertiary }]} numberOfLines={1}>
                        {performances[1].genre} · {performances[1].title}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.bannerArrow, { color: ap.textTertiary }]}>›</Text>
                </View>
              )}
            </Pressable>
          </SectionReveal>
        )}

        {/* 캠핑 추천 배너 (맑음+따뜻+비없음, ko only) */}
        {campingSites.length > 0 && isCampingWeather(bundle.current.condition, bundle.current.feelsLike, bundle.current.precipitation >= 30) && (
          <SectionReveal scrollY={scrollY} glowColor={glowColor}>
            <Pressable onPress={() => router.push("/(tabs)/event")}>
              {({ pressed }) => (
                <View style={[styles.campingBanner, { backgroundColor: ap.pillBg, borderColor: ap.pillBorder, opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={styles.campingEmoji}>⛺</Text>
                  <View style={styles.bannerFlex}>
                    <Text style={[styles.campingTitle, { color: ap.textPrimary }]}>{t("mg.camping.bannerTitle")}</Text>
                    <Text style={[styles.campingName, { color: ap.textSecondary }]} numberOfLines={1}>
                      {campingSites[0].name} · {shortCampAddr(campingSites[0].addr)}
                    </Text>
                  </View>
                  <Text style={[styles.bannerArrow, { color: ap.textTertiary }]}>›</Text>
                </View>
              )}
            </Pressable>
          </SectionReveal>
        )}

        {/* 저녁 시간 피드백 배너 (18~23시) */}
        {isEvening && (
          <SectionReveal scrollY={scrollY} glowColor={glowColor}>
            <Pressable
              style={[styles.feedbackBanner, { backgroundColor: ap.pillBg, borderColor: ap.pillBorder }]}
              onPress={() => router.push("/feedback")}
            >
              <Text style={styles.feedbackEmoji}>🤔</Text>
              <View style={styles.bannerFlex}>
                <Text style={[styles.feedbackTitle, { color: ap.textPrimary }]}>{t("home.feedback.title")}</Text>
                <Text style={[styles.feedbackSub, { color: ap.textTertiary }]}>{t("home.feedback.desc")}</Text>
              </View>
              <Text style={[styles.feedbackArrow, { color: ap.textTertiary }]}>›</Text>
            </Pressable>
          </SectionReveal>
        )}

      </ScrollView>

      {/* 플로팅 테마 + 채팅 — 채팅 열려있으면 숨김 */}
      {state.currentWeather && !chatVisible && (
        <DailyActionPills
          onChatPress={handleChatPress}
          topInset={insets.top}
          textureKey={textureKey}
          chatHintTrigger={chatHintCounter}
        />
      )}

      {/* 첫 설치 유저 — 감성 카드 소개 */}
      <EmotionalPromoSheet
        visible={showEmotionalPromo}
        onShare={handleEmotionalPromoShare}
        onDismiss={handleEmotionalPromoDismiss}
      />

      {/* 재방문 유저 — 일일 브리핑 시트 */}
      <DailyBriefSheet
        visible={showBrief}
        bundle={bundle}
        actionCard={actionCards[0]}
        tempHigh={tempHigh}
        yesterdayDiff={yesterdayDiff}
        schoolLunch={schoolLunchMenus}
        greeting={malgeumGreeting}
        onDismiss={handleBriefDismiss}
        onAskMore={handleBriefAskMore}
      />

      {/* AI 채팅 시트 */}
      {chatVisible && (
        <ChatSheet
          visible={chatVisible}
          onClose={handleChatClose}
          state={state}
          bundle={bundle}
          artStyle={artStyle}
          rcUserId={customerId}
          isPremium={isPremium}
          dispatch={dispatch}
          onShowToast={showToast}
          inkColor={notebook.inkColor}
          paperBg={notebook.paperBg}
          onboardingMode={chatMode === "onboarding"}
        />
      )}

      {/* 카드 상세 모달 (네비게이션 대신 인라인 — RNGH 우회) */}
      {cardDetail !== null && (
        <CardDetailModal
          cardDetail={cardDetail}
          bundle={bundle}
          onClose={() => setCardDetail(null)}
        />
      )}

      {/* 위치 빠른 전환 모달 */}
      <Modal
        visible={locationPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLocationPickerVisible(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerSheet, { backgroundColor: ap.tabBarBg }]}>
                <Text style={styles.pickerTitle}>{t("home.locationSelect")}</Text>
                {state.locations.map((loc) => {
                  const isActive = loc.id === state.currentLocationId;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.pickerRow, isActive && { backgroundColor: ap.accent + "1F" }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!isActive) {
                          dispatch({ type: "SET_LOCATION", payload: { location: loc } });
                          refreshWeather();
                        }
                        setLocationPickerVisible(false);
                      }}
                    >
                      <MapPin size={18} weight={loc.isGps ? "fill" : "regular"} color={isActive ? ap.accent : ap.textTertiary} />
                      <Text style={[styles.pickerName, { color: ap.textTertiary }, isActive && { color: "#FFFFFF", fontWeight: "700" }]}>
                        {loc.name}
                      </Text>
                      {isActive && <Check size={18} weight="bold" color={ap.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 110 },

  // 카드 상세 모달
  cardDetailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  cardDetailSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardDetailDragZone: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cardDetailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(100,120,180,0.4)",
  },
  cardDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 16,
  },
  cardDetailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  cardDetailClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(200,210,230,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 위치 선택 모달
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pickerSheet: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pickerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  alertBanner: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertText: {
    fontSize: 14,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  summary: {
    fontSize: 14,
    paddingHorizontal: 24,
    marginBottom: 10,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 오프라인 배너
  offlineBanner: {
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    alignItems: "center",
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FCD34D",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 피드백 배너
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  feedbackEmoji: { fontSize: 28 },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  feedbackSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  feedbackArrow: {
    fontSize: 24,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "300",
  },
  bannerArrow: {
    fontSize: 22,
    fontWeight: "300",
    marginLeft: 4,
  },

  // 커피콩 프로모 배너
  coffeeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  coffeeBannerEmoji: { fontSize: 28 },
  coffeeBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  coffeeBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },

  bannerFlex: { flex: 1 },

  perfBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  perfEmoji: { fontSize: 28 },
  perfTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  perfName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  perfMore: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginTop: 1,
  },
  campingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  campingEmoji: { fontSize: 28 },
  campingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  campingName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  festivalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  festivalEmoji: { fontSize: 28 },
  festivalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  festivalName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },

  // Sticky 미니 헤더
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  stickyLocation: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    flex: 1,
  },
  stickyTemp: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

});
