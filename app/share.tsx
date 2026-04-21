import React, { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, LayoutChangeEvent, Linking } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Sun, Sparkle, HeartHalf, Star } from "phosphor-react-native";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import { useWeatherContext } from "@/context/WeatherContext";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { ShareCardPreview } from "@/components/share/ShareCardPreview";
import { EmotionalCardPreview } from "@/components/share/EmotionalCardPreview";
import { PersonalityCardPreview } from "@/components/share/PersonalityCardPreview";
import { computePersonalityProfile } from "@/services/personalityService";
import type { PersonalityProfile } from "@/types/personality";
import { useTheme } from "@/context/ThemeContext";
import { PaletteProvider } from "@/context/PaletteContext";
import { getConditionLabel, mapConditionToTexture, formatTemp } from "@/utils/weather";
import { getHeroMessage } from "@/utils/recommendations";
import { COLORS } from "@/constants/colors";
import { buildFallbackBundle } from "@/constants/weather-assets";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import { logError } from "@/utils/logger";
import { useToast } from "@/context/ToastContext";
import { t } from "@/i18n";
import { logShareCreate } from "@/services/analytics";
import { captureAndShareWithMessage } from "@/utils/shareCapture";
import { getDownloadUrl } from "@/services/microcopy";
import { LocationCompareCard } from "@/components/share/LocationCompareCard";
import { fetchWithCache } from "@/services/weatherApi";
import {
  getEmotionalTheme,
  getSeasonalMusic,
  getSeasonLabel,
  pickRandom,
  type MusicRec,
  type ArtworkRec,
} from "@/constants/emotionalThemes";

type ShareMode = "weather" | "emotional" | "compare" | "personality";

interface ModeConfig {
  key: ShareMode;
  icon: React.ComponentType<{ size: number; color: string }>;
  labelKey: string;
}
const SHARE_MODES: ModeConfig[] = [
  { key: "weather", icon: Sun, labelKey: "share.modeWeather" },
  { key: "emotional", icon: Sparkle, labelKey: "share.modeEmotional" },
  { key: "compare", icon: HeartHalf, labelKey: "share.modeCompare" },
  { key: "personality", icon: Star, labelKey: "share.modePersonality" },
];

export default function ShareScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();
  const bgCondition = state.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(bgCondition);

  return (
    <PaletteProvider artStyle={artStyle} textureKey={textureKey}>
      <ShareContent />
    </PaletteProvider>
  );
}

function ShareContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const viewShotRef = useRef<ViewShot>(null);
  const { state } = useWeatherContext();
  const { artStyle, isPremium } = useTheme();

  const current = state.currentWeather;
  const temp = current?.temp ?? 24;
  const condition = current?.condition ?? "clear";
  const condLabel = getConditionLabel(condition);

  const bundle = useMemo(
    () => buildFallbackBundle(current, state.hourlyForecast, state.dailyForecast, state.airQuality),
    [current, state.hourlyForecast, state.dailyForecast, state.airQuality],
  );

  const hero = useMemo(() => getHeroMessage(bundle), [bundle]);
  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? t("home.defaultLocation");
  const dateStr = useMemo(() => {
    const d = new Date();
    return t("share.dateFormat", { month: d.getMonth() + 1, day: d.getDate() });
  }, []);
  const backgroundImage = getTextureSource(artStyle, mapConditionToTexture(condition));

  // ── 감성 카드 상태 ──
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<ShareMode>(() => {
    if (initialMode === "emotional") return "emotional";
    if (initialMode === "personality") return "personality";
    if (initialMode === "compare") return "compare";
    return "weather";
  });
  // ── 성격 카드 상태 ──
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  useEffect(() => {
    if (mode === "personality" && !personalityProfile) {
      computePersonalityProfile()
        .then(setPersonalityProfile)
        .catch((e) => logError("general", e));
    }
  }, [mode, personalityProfile]);
  const emotionalTheme = useMemo(() => getEmotionalTheme(condition), [condition]);
  const [message, setMessage]   = useState<string>(() => pickRandom(emotionalTheme.messages));
  const [music,   setMusic]     = useState<MusicRec>(() => pickRandom(emotionalTheme.music));
  const [artwork, setArtwork]   = useState<ArtworkRec>(() => pickRandom(emotionalTheme.artwork));
  const [userMessage, setUserMessage] = useState("");

  // ── 커플 비교 상태 ──
  interface CityOption { id: string; name: string; lat: number; lon: number }

  const cityPresets = useMemo<CityOption[]>(() => [
    { id: "seoul", name: "서울", lat: 37.5665, lon: 126.978 },
    { id: "busan", name: "부산", lat: 35.1796, lon: 129.0756 },
    { id: "daegu", name: "대구", lat: 35.8714, lon: 128.6014 },
    { id: "incheon", name: "인천", lat: 37.4563, lon: 126.7052 },
    { id: "gwangju", name: "광주", lat: 35.1595, lon: 126.8526 },
    { id: "daejeon", name: "대전", lat: 36.3504, lon: 127.3845 },
    { id: "jeju", name: "제주", lat: 33.4996, lon: 126.5312 },
    { id: "chuncheon", name: "춘천", lat: 37.8813, lon: 127.7298 },
    ...state.locations
      .filter((l) => l.id !== state.currentLocationId)
      .map((l) => ({ id: l.id, name: l.name, lat: l.lat, lon: l.lon })),
  ], [state.locations, state.currentLocationId]);

  const availableCities = useMemo(() => {
    const myName = locationName.split(" ")[0];
    return cityPresets.filter((c) => c.name !== myName);
  }, [cityPresets, locationName]);

  const [compareTarget, setCompareTarget] = useState<CityOption | null>(null);
  const [compareWeather, setCompareWeather] = useState<{
    temp: number; feelsLike: number; condition: import("@/types/weather").WeatherCondition; precipitation: number;
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // 비교 대상 변경 시 날씨 fetch
  useEffect(() => {
    if (mode !== "compare" || !compareTarget) return;
    let cancelled = false;
    setCompareLoading(true);
    setCompareWeather(null);
    fetchWithCache(compareTarget.lat, compareTarget.lon)
      .then((b) => {
        if (cancelled) return;
        setCompareWeather({
          temp: b.current.temp,
          feelsLike: b.current.feelsLike,
          condition: b.current.condition,
          precipitation: b.current.precipitation,
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCompareLoading(false); });
    return () => { cancelled = true; };
  }, [mode, compareTarget]);

  // ── 콜랩서블 헤더 ──
  const scrollY      = useSharedValue(0);
  const headerHeight = useSharedValue(0);
  const [headerPad, setHeaderPad] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const headerAnim = useAnimatedStyle(() => ({
    transform: [{
      translateY: -Math.min(Math.max(scrollY.value, 0), headerHeight.value),
    }],
  }));

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    headerHeight.value = h;
    setHeaderPad(h);
  }, [headerHeight]);

  const shuffleMessage = useCallback(() => setMessage(pickRandom(emotionalTheme.messages)), [emotionalTheme]);
  const shuffleMusic   = useCallback(() => setMusic(pickRandom(emotionalTheme.music)), [emotionalTheme]);
  const shuffleArtwork = useCallback(() => setArtwork(pickRandom(emotionalTheme.artwork)), [emotionalTheme]);
  const handleShuffle  = useCallback(() => { shuffleMessage(); shuffleMusic(); shuffleArtwork(); }, [shuffleMessage, shuffleMusic, shuffleArtwork]);

  const handleShare = useCallback(async () => {
    try {
      let msg: string;
      if (mode === "compare" && compareTarget && compareWeather) {
        msg = [
          t("share.shareCompareMsg", { myCity: locationName, myTemp: formatTemp(temp, state.tempUnit), theirCity: compareTarget.name, theirTemp: formatTemp(compareWeather.temp, state.tempUnit) }),
          "",
          `${t("share.downloadLabel")}${getDownloadUrl("compare", { condition })}`,
        ].join("\n");
      } else if (mode === "personality" && personalityProfile?.ready) {
        msg = [
          t("share.sharePersonalityMsg", { label: personalityProfile.personalityLabel }),
          "",
          `${t("share.downloadLabel")}${getDownloadUrl("personality", { condition })}`,
        ].join("\n");
      } else {
        const utmMode = mode === "emotional" ? "emotional" : "weather";
        msg = [
          mode === "emotional"
            ? t("share.shareEmotionalMsg")
            : t("share.shareWeatherMsg", { location: locationName, temp: formatTemp(temp, state.tempUnit), cond: condLabel }),
          "",
          `${t("share.downloadLabel")}${getDownloadUrl(utmMode, { condition, emotion: emotionalTheme.emotion })}`,
        ].join("\n");
      }
      logShareCreate(mode === "compare" ? "weather" : mode);
      // ViewShot format과 mimeType 일치 필수 (카드별)
      const shareFormat: "png" | "jpg" =
        mode === "emotional" || mode === "compare" ? "jpg" : "png";
      const result = await captureAndShareWithMessage(viewShotRef, msg, shareFormat);
      if (result === "error") {
        showToast(t("share.shareFailed"));
      }
    } catch (e) {
      logError("share", e);
      showToast(t("share.shareFailed"));
    }
  }, [mode, locationName, temp, state.tempUnit, condLabel, condition, compareTarget, compareWeather, personalityProfile, emotionalTheme, showToast]);

  return (
    <WeatherBackground condition={condition} isNight={false}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── X 버튼 (항상 고정) ── */}
      <Pressable
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel={t("common.close")}
        accessibilityRole="button"
      >
        <X size={16} color="rgba(255,255,255,0.6)" />
      </Pressable>

      {/* ── 콜랩서블 헤더 ── */}
      <Animated.View
        style={[styles.collapseHeader, { paddingTop: insets.top + 16 }, headerAnim]}
        onLayout={onHeaderLayout}
        pointerEvents="box-none"
      >
        <Text style={styles.headerTitle}>{t("share.title")}</Text>
        <Text style={styles.headerSubtitle}>
          {mode === "weather" ? t("share.weatherSubtitle") : mode === "emotional" ? t("share.emotionalSubtitle") : t("share.compareSubtitle")}
        </Text>

        {/* 모드 토글 */}
        <View style={styles.modeToggle} pointerEvents="box-none">
          {SHARE_MODES.map(({ key, icon: Icon, labelKey }) => {
            const active = mode === key;
            return (
              <Pressable
                key={key}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                onPress={() => setMode(key)}
              >
                <Icon size={14} color={active ? "#FFFFFF" : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                  {t(labelKey as "share.modeWeather")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── 스크롤 콘텐츠 ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerPad, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 카드 미리보기 */}
        <View style={styles.previewWrap}>
          {mode === "weather" ? (
            <ShareCardPreview
              ref={viewShotRef}
              location={locationName}
              date={dateStr}
              temp={temp}
              condition={condLabel}
              conditionKey={condition}
              actionMessage={hero.message}
              backgroundImage={backgroundImage}
              showWatermark={!isPremium}
              tempUnit={state.tempUnit}
              userMessage={userMessage || undefined}
            />
          ) : mode === "emotional" ? (
            <EmotionalCardPreview
              ref={viewShotRef}
              location={locationName}
              date={dateStr}
              temp={temp}
              condition={condLabel}
              backgroundImage={backgroundImage}
              theme={emotionalTheme}
              message={message}
              music={music}
              artwork={artwork}
              showWatermark={!isPremium}
              tempUnit={state.tempUnit}
              userMessage={userMessage || undefined}
            />
          ) : mode === "personality" && personalityProfile?.ready ? (
            <PersonalityCardPreview
              ref={viewShotRef}
              profile={personalityProfile}
              backgroundImage={backgroundImage}
              showWatermark={!isPremium}
            />
          ) : mode === "personality" ? (
            <View style={styles.comparePlaceholder}>
              <Text style={styles.comparePlaceholderEmoji}>☁️</Text>
              <Text style={styles.comparePlaceholderTitle}>{t("personality.emptyText")}</Text>
              <Text style={styles.comparePlaceholderText}>{t("personality.emptyHint")}</Text>
            </View>
          ) : compareTarget && compareWeather ? (
            <LocationCompareCard
              ref={viewShotRef}
              mine={{
                name: locationName,
                temp,
                feelsLike: current?.feelsLike ?? temp,
                condition,
                precipitation: current?.precipitation ?? 0,
              }}
              theirs={{
                name: compareTarget.name,
                ...compareWeather,
              }}
              date={dateStr}
              tempUnit={state.tempUnit}
              backgroundImage={backgroundImage}
              showWatermark={!isPremium}
              userMessage={userMessage || undefined}
            />
          ) : (
            <View style={styles.comparePlaceholder}>
              <Text style={styles.comparePlaceholderEmoji}>💕</Text>
              <Text style={styles.comparePlaceholderTitle}>
                {compareLoading ? t("share.compareLoading") : t("share.comparePlaceholder")}
              </Text>
              {!compareLoading && (
                <Text style={styles.comparePlaceholderText}>{t("share.comparePlaceholderSub")}</Text>
              )}
            </View>
          )}
        </View>

        {/* 한 문장 입력 */}
        <View style={styles.msgInputWrap}>
          <TextInput
            style={styles.msgInput}
            placeholder={t("share.msgPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={userMessage}
            onChangeText={setUserMessage}
            maxLength={40}
            returnKeyType="done"
            blurOnSubmit
          />
          {userMessage.length > 0 ? (
            <Text style={styles.msgCounter}>{userMessage.length}/40</Text>
          ) : (
            <Text style={styles.msgHint}>{t("share.msgHint")}</Text>
          )}
        </View>

        {/* 커플: 도시 선택 칩 */}
        {mode === "compare" && (
          <View style={styles.locationPicker}>
            {availableCities.map((city) => (
              <Pressable
                key={city.id}
                style={[styles.locationChip, compareTarget?.id === city.id && styles.locationChipActive]}
                onPress={() => setCompareTarget(city)}
              >
                <Text style={[styles.locationChipText, compareTarget?.id === city.id && styles.locationChipTextActive]} numberOfLines={1}>
                  {city.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 감성 카드: 독립 셔플 + 음악 링크 */}
        {mode === "emotional" && (
          <>
            <View style={styles.shuffleRow}>
              <Pressable style={styles.shufflePill} onPress={shuffleMessage}>
                <Text style={styles.shufflePillText}>{t("share.shuffleMsg")}</Text>
              </Pressable>
              <Pressable style={styles.shufflePill} onPress={shuffleMusic}>
                <Text style={styles.shufflePillText}>{t("share.shuffleMusic")}</Text>
              </Pressable>
              <Pressable style={styles.shufflePill} onPress={shuffleArtwork}>
                <Text style={styles.shufflePillText}>{t("share.shuffleArt")}</Text>
              </Pressable>
              <Pressable style={styles.shufflePill} onPress={handleShuffle}>
                <Text style={styles.shufflePillText}>{t("share.shuffleAll")}</Text>
              </Pressable>
            </View>
            {music.url && (
              <Pressable style={styles.musicLinkBtn} onPress={() => Linking.openURL(music.url!)}>
                <Text style={styles.musicLinkText}>{t("share.listenMusic", { title: music.title, artist: music.artist })}</Text>
              </Pressable>
            )}
            <View style={styles.seasonalSection}>
              <Text style={styles.seasonalTitle}>{t("share.seasonalPlaylist", { season: getSeasonLabel() })}</Text>
              {getSeasonalMusic().map((s) => (
                <Pressable
                  key={s.title}
                  style={styles.seasonalRow}
                  onPress={() => s.url && Linking.openURL(s.url)}
                >
                  <Text style={styles.seasonalSong} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.seasonalArtist} numberOfLines={1}>{s.artist}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* 공유 버튼 */}
        <Pressable style={styles.shareCta} onPress={handleShare}>
          <Text style={styles.shareCtaText}>{t("share.share")}</Text>
        </Pressable>

        {/* 안내 텍스트 */}
        <Text style={styles.shareHint}>
          {mode === "emotional" ? t("share.emotionalHint") : t("share.deeplinkHint")}
        </Text>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },

  // X 버튼 (고정)
  closeBtn: {
    position: "absolute",
    right: 24,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 콜랩서블 헤더
  collapseHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginBottom: 16,
  },

  // 모드 토글
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },

  // 스크롤 콘텐츠
  scrollContent: {
    paddingHorizontal: 24,
  },

  // 카드 미리보기
  previewWrap: {
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },

  // 한 문장 입력
  msgInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    marginBottom: 14,
    minHeight: 48,
  },
  msgInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.white,
    paddingVertical: 12,
  },
  msgCounter: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginLeft: 8,
  },
  msgHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.25)",
    marginLeft: 8,
  },

  shuffleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  shufflePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  shufflePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  musicLinkBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "rgba(30,215,96,0.15)",
    borderWidth: 1,
    borderColor: "rgba(30,215,96,0.3)",
    marginTop: 8,
  },
  musicLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1ED760",
  },
  seasonalSection: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  seasonalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  seasonalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seasonalSong: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    flex: 1,
  },
  seasonalArtist: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
    marginLeft: 8,
  },

  // 공유 CTA
  shareCta: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  shareCtaText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  shareHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },

  // 커플 비교
  comparePlaceholder: {
    width: "100%",
    aspectRatio: 832 / 1216,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  comparePlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  comparePlaceholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  comparePlaceholderText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  locationPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  locationChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  locationChipActive: {
    backgroundColor: "rgba(255,100,150,0.2)",
    borderColor: "rgba(255,100,150,0.4)",
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  locationChipTextActive: {
    color: "#FFFFFF",
  },
});
