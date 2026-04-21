import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, Platform, useWindowDimensions, ImageBackground, Pressable, type ImageSourcePropType } from "react-native";
import ViewShot from "react-native-view-shot";
import { captureAndShare } from "@/utils/shareCapture";
import { ShareNetwork } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { Toggle } from "@/components/ui/Toggle";
import { useWeatherContext } from "@/context/WeatherContext";
import { getConditionLabel, mapConditionToTexture } from "@/utils/weather";
import { getHeroMessage, generateActionCards } from "@/utils/recommendations";
import { getConditionEmoji, buildFallbackBundle } from "@/constants/weather-assets";
import { getArtworkImage } from "@/widgets/android/widgetAssets";
import { useTheme } from "@/context/ThemeContext";
import { buildWidgetData, syncWidgetData } from "@/services/widgetBridge";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import type { WidgetData } from "@/types/widget";
import { t } from "@/i18n";
import { getLocalizedDay } from "@/utils/date";

// Android 전용: 실제 위젯 네이티브 프리뷰
let WidgetPreview: any = null;
let SmallWidgetReal: any = null;
let MediumWidgetReal: any = null;
if (Platform.OS === "android") {
  try {
    WidgetPreview = require("react-native-android-widget").WidgetPreview;
    SmallWidgetReal = require("@/widgets/android/SmallWidget").SmallWidget;
    MediumWidgetReal = require("@/widgets/android/MediumWidget").MediumWidget;
  } catch {
    // 위젯 패키지 미설치 시 무시
  }
}

const PADDING = 24;
const GAP = 12;

/** 두 번째 Small 위젯 샘플 데이터 (비/마포구) — 렌더마다 재생성 방지 */
const RAIN_SAMPLE: WidgetData = {
  temp: 17,
  tempDisplay: "17°",
  feelsLike: 15,
  feelsLikeDisplay: "15°",
  tempUnit: "C",
  condition: "rain",
  get conditionLabel() { return t("weather.condition.rain"); },
  conditionEmoji: "🌧️",
  get district() { return t("widget.sampleDistrict"); },
  get locationName() { return t("widget.sampleLocation"); },
  get heroMessage() { return t("rec.card.umbrellaMust"); },
  textureKey: "rainy",
  updatedAt: 0,
  cards: [],
  aiSummary: "",
  artStyle: "default",
};

export default function WidgetPreviewScreen() {
  const { width: screenWidth } = useWindowDimensions();

  const { state } = useWeatherContext();
  const { artStyle } = useTheme();

  const current = state.currentWeather;
  const temp = current?.temp ?? 24;
  const condition = current?.condition ?? "clear";
  const condLabel = getConditionLabel(condition);
  const textureKey = mapConditionToTexture(condition);
  const bgImage = getArtworkImage(artStyle, textureKey);

  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? t("home.defaultLocation");
  const district = locationName.split(" ").pop() ?? locationName;

  const bundle = useMemo(
    () => buildFallbackBundle(current, state.hourlyForecast, state.dailyForecast, state.airQuality),
    [current, state.hourlyForecast, state.dailyForecast, state.airQuality],
  );
  const hero = useMemo(() => getHeroMessage(bundle), [bundle]);
  const actionCards = useMemo(
    () => generateActionCards(bundle, state.healthProfile, state.tempUnit),
    [bundle, state.healthProfile, state.tempUnit],
  );

  const makeDate = useCallback(() => {
    const d = new Date();
    return t("widget.dateFormat", { month: d.getMonth() + 1, day: d.getDate(), dow: getLocalizedDay(d.getDay()) });
  }, []);
  const [dateStr, setDateStr] = useState(makeDate);
  useFocusEffect(useCallback(() => { setDateStr(makeDate()); }, [makeDate]));

  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await captureAndShare(viewShotRef);
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  const [glassMode, setGlassMode] = useState(false);
  useEffect(() => {
    loadJson<boolean>(STORAGE_KEYS.WIDGET_GLASS, false).then(setGlassMode);
  }, []);
  const toggleGlass = useCallback(async (value: boolean) => {
    setGlassMode(value);
    await saveJson(STORAGE_KEYS.WIDGET_GLASS, value);
    syncWidgetData(state);
  }, [state]);

  // Android 네이티브 프리뷰용 WidgetData
  const widgetData = useMemo((): WidgetData | null => {
    const data = buildWidgetData(state);
    if (!data) return null;
    data.artStyle = artStyle;
    data.glassMode = glassMode;
    return data;
  }, [state, artStyle, glassMode]);

  // renderWidget은 useCallback으로 안정화 — WidgetPreview 내부 useEffect가
  // renderWidget 참조 변경 시마다 네이티브 createPreview()를 재호출하기 때문
  const renderSmall1 = useCallback(() => <SmallWidgetReal data={widgetData} />, [widgetData]);
  const renderSmall2 = useCallback(() => <SmallWidgetReal data={RAIN_SAMPLE} />, []);
  const renderMedium = useCallback(() => <MediumWidgetReal data={widgetData} />, [widgetData]);

  // 폰 배경 안의 콘텐츠 너비 (padding 고려)
  const phonePadding = 20;
  const contentWidth = screenWidth - PADDING * 2 - phonePadding * 2;
  const smallSize = Math.floor((contentWidth - GAP) / 2);
  // Medium: 가로 전체, 세로는 Small 높이와 동일하게
  const mediumWidth = contentWidth;
  const mediumHeight = Math.floor(smallSize * 0.65);

  const isAndroid = Platform.OS === "android" && WidgetPreview && SmallWidgetReal && MediumWidgetReal;

  return (
    <ScreenSheet title={t("widgetPreview.title")} subtitle={t("widgetPreview.subtitle")}>
        {/* 폰 화면 배경 — ViewShot으로 캡처 */}
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.92 }}>
        <View style={styles.phoneBg}>
          <Text style={styles.phoneTime}>9:41</Text>
          <Text style={styles.phoneDate}>{dateStr}</Text>

          {/* Small 위젯 x2 */}
          <Text style={styles.widgetLabel}>{t("widgetPreview.smallWidget")}</Text>
          <View style={styles.smallRow}>
            {isAndroid ? (
              <>
                <View style={[styles.nativePreviewWrap, { width: smallSize, height: smallSize }]}>
                  <WidgetPreview
                    renderWidget={renderSmall1}
                    width={smallSize}
                    height={smallSize}
                  />
                </View>
                <View style={[styles.nativePreviewWrap, { width: smallSize, height: smallSize }]}>
                  <WidgetPreview
                    renderWidget={renderSmall2}
                    width={smallSize}
                    height={smallSize}
                  />
                </View>
              </>
            ) : (
              <>
                <IOSSmallWidget
                  bgImage={bgImage}
                  district={district}
                  temp={temp}
                  action={hero.message.replace(/!$/, "")}
                  condEmoji={getConditionEmoji(condition)}
                />
                <IOSSmallWidget
                  bgImage={getArtworkImage("default", "rainy")}
                  district={t("widget.sampleDistrict")}
                  temp={17}
                  action={t("widgetPreview.umbrellaRequired")}
                  condEmoji="🌧️"
                />
              </>
            )}
          </View>

          {/* Medium 위젯 */}
          <Text style={[styles.widgetLabel, { marginTop: 20 }]}>{t("widgetPreview.mediumWidget")}</Text>
          {isAndroid ? (
            <View style={[styles.nativePreviewWrap, { width: mediumWidth, height: mediumHeight }]}>
              <WidgetPreview
                renderWidget={renderMedium}
                width={mediumWidth}
                height={mediumHeight}
              />
            </View>
          ) : (
            <ImageBackground
              source={bgImage}
              style={styles.mediumWidget}
              imageStyle={styles.widgetImageStyle}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.55)"]}
                style={styles.mediumOverlay}
              >
                <View style={styles.mediumTop}>
                  <Text style={styles.mediumEmoji}>{getConditionEmoji(condition)}</Text>
                  <Text style={styles.mediumLocation}>{locationName}</Text>
                </View>
                <View style={styles.mediumBottom}>
                  <View>
                    <Text style={styles.mediumTemp}>{temp}°</Text>
                    <Text style={styles.mediumCond}>{condLabel}</Text>
                  </View>
                  <View style={styles.mediumCards}>
                    {actionCards.slice(0, 3).map((card) => (
                      <View key={card.id} style={styles.mediumPill}>
                        <Text style={styles.mediumPillText}>{card.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          )}

          {/* 워터마크 */}
          <Text style={styles.watermark}>☀️ 맑음 Malgeum</Text>
        </View>
        </ViewShot>

        {/* 공유 버튼 */}
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.75 }]}
          onPress={handleShare}
          disabled={sharing}
        >
          <ShareNetwork size={18} weight="bold" color="#FFFFFF" />
          <Text style={styles.shareBtnText}>{sharing ? t("widgetPreview.sharing") : t("widgetPreview.shareBtn")}</Text>
        </Pressable>

        {/* 투명 모드 토글 */}
        <View style={styles.glassToggleCard}>
          <View style={styles.glassToggleText}>
            <Text style={styles.glassToggleTitle}>{t("widgetPreview.glassTitle")}</Text>
            <Text style={styles.glassToggleDesc}>{t("widgetPreview.glassDesc")}</Text>
          </View>
          <Toggle value={glassMode} onToggle={toggleGlass} />
        </View>

        {/* 안내 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoText}>
            {t("widgetPreview.iosHint")}{"\n"}
            {t("widgetPreview.androidHint")}
          </Text>
        </View>
    </ScreenSheet>
  );
}

/** iOS 전용 목업 Small 위젯 */
function IOSSmallWidget({
  bgImage,
  district,
  temp,
  action,
  condEmoji,
}: {
  bgImage: ImageSourcePropType;
  district: string;
  temp: number;
  action: string;
  condEmoji: string;
}) {
  return (
    <ImageBackground
      source={bgImage}
      style={styles.smallWidget}
      imageStyle={styles.widgetImageStyle}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.55)"]}
        style={styles.smallOverlay}
      >
        <Text style={styles.smallDistrict}>{district}</Text>
        <View style={styles.smallCenter}>
          <Text style={styles.smallEmoji}>{condEmoji}</Text>
          <Text style={styles.smallTemp}>{temp}°</Text>
        </View>
        <Text style={styles.smallAction}>{action}</Text>
      </LinearGradient>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    paddingHorizontal: 24,
  },
  phoneBg: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    marginBottom: 16,
  },
  phoneTime: {
    fontSize: 44,
    fontWeight: "700",
    color: COLORS.textLight,
    textAlign: "center",
    letterSpacing: 1,
  },
  phoneDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 20,
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  smallRow: {
    flexDirection: "row",
    gap: 12,
  },
  nativePreviewWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  smallWidget: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  widgetImageStyle: {
    borderRadius: 20,
  },
  smallOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    borderRadius: 20,
  },
  smallDistrict: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  smallCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallEmoji: {
    fontSize: 22,
  },
  smallTemp: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
  },
  smallAction: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  mediumWidget: {
    width: "100%",
    aspectRatio: 2.5,
    borderRadius: 20,
    overflow: "hidden",
  },
  mediumOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    borderRadius: 20,
  },
  mediumTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mediumEmoji: {
    fontSize: 18,
  },
  mediumLocation: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  mediumBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  mediumTemp: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.white,
  },
  mediumCond: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: -2,
  },
  mediumCards: {
    alignItems: "flex-end" as const,
    gap: 3,
  },
  mediumPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mediumPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  watermark: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  glassToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  glassToggleText: {
    flex: 1,
  },
  glassToggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 2,
  },
  glassToggleDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  infoEmoji: { fontSize: 18 },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 18,
  },
});
