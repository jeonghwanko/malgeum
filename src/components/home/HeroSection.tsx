import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, type StyleProp, type TextStyle } from "react-native";
import Animated, {
  useAnimatedStyle, useSharedValue, useAnimatedReaction,
  interpolate, withTiming, Easing, runOnJS,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { WeatherCondition } from "@/types/weather";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getConditionLabel, formatTemp } from "@/utils/weather";
import type { TempUnit } from "@/types/settings";
import { timeAgo, isStaleData } from "@/utils/date";
import { MapPin, CaretDown, ShareNetwork } from "phosphor-react-native";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";

interface HeroSectionProps {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  tempLow: number;
  tempHigh: number;
  precipitation?: number;
  airQualityLabel?: string;
  scrollY?: SharedValue<number>;
  palette?: AdaptivePalette;
  greeting?: { text: string; emoji: string };
  location?: string;
  onLocationPress?: () => void;
  onSharePress?: () => void;
  onRefresh?: () => void;
  lastFetchedAt?: string | null;
  tempUnit?: TempUnit;
  autoRefreshing?: boolean;
}

export function HeroSection({
  temp, feelsLike, condition, tempLow, tempHigh,
  precipitation = 0, airQualityLabel, scrollY, palette: ap,
  greeting, location, onLocationPress, onSharePress, onRefresh, lastFetchedAt,
  tempUnit = "C", autoRefreshing = false,
}: HeroSectionProps) {
  const insets = useSafeAreaInsets();
  const u = tempUnit;
  const condLabel = getConditionLabel(condition);
  const fetchedLabel = timeAgo(lastFetchedAt ?? null);
  const isStale = isStaleData(lastFetchedAt ?? null);
  const nb = ap?.notebook;
  const isNotebook = nb && nb.fontFamily !== "system";

  const refreshingIndicator = autoRefreshing ? (
    <View style={styles.refreshingRow}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ transform: [{ scale: 0.7 }] }} />
      <Text style={styles.fetchedAt}>{t("common.updating")}</Text>
    </View>
  ) : null;

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      opacity: interpolate(scrollY.value, [0, 220], [1, 0], "clamp"),
      transform: [
        { scale: interpolate(scrollY.value, [0, 220], [1, 0.92], "clamp") },
        { translateY: interpolate(scrollY.value, [0, 220], [0, -20], "clamp") },
      ],
    };
  });

  if (isNotebook && nb) {
    // ── 노트북 스타일: 배경 없이 흰색 폰트로 강조 ──
    const fontSize = Math.round(46 * nb.fontSizeScale);

    return (
      <Animated.View style={[styles.container, parallaxStyle]}>
        <View style={[styles.noteHeroClean, { paddingTop: insets.top + 16 }]}>
          {/* 상단: 온도(좌) + 인사말/위치(우) */}
            <View style={styles.heroTopRow}>
              <AnimatedTemp
                value={temp}
                unit={u}
                style={[styles.noteTemp, {
                  fontSize,
                  fontFamily: nb.fontFamily,
                  color: "#FFFFFF",
                  textShadowColor: "rgba(0,0,0,0.5)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 14,
                }]}
                maxFontSizeMultiplier={1.0}
                accessibilityLabel={`${formatTemp(temp, u)}`}
              />
              <View style={styles.heroRight}>
                <View style={styles.heroRightTopRow}>
                  {location && (
                    <TouchableOpacity
                      onPress={() => { hapticLight(); onLocationPress?.(); }}
                      activeOpacity={0.7}
                      style={styles.heroLocationRow}
                      accessibilityRole="button"
                      accessibilityLabel={location}
                    >
                      <MapPin size={13} weight="fill" color="rgba(255,255,255,0.7)" />
                      <Text style={[styles.heroLocation, {
                        textShadowColor: "rgba(0,0,0,0.4)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 5,
                      }]} maxFontSizeMultiplier={1.3}>
                        {location}
                      </Text>
                      <CaretDown size={11} weight="bold" color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  )}
                  {onSharePress && (
                    <TouchableOpacity
                      onPress={() => { hapticLight(); onSharePress(); }}
                      activeOpacity={0.7}
                      style={styles.shareBtn}
                      accessibilityRole="button"
                      accessibilityLabel={t("share.share")}
                    >
                      <ShareNetwork size={18} weight="bold" color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  )}
                </View>
                {greeting && (
                  <Text style={[styles.heroGreeting, {
                    fontFamily: nb.fontFamily,
                    textShadowColor: "rgba(0,0,0,0.4)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 6,
                  }]}>
                    {greeting.emoji} {greeting.text}
                  </Text>
                )}
              </View>
            </View>

            {/* 날씨 상태 */}
            <View style={styles.noteCondRow}>
              <Text style={styles.noteCondEmoji}>
                {condition === "clear" ? "☀️" : condition === "rain" ? "🌧️" : condition === "snow" ? "❄️" : "⛅"}
              </Text>
              <Text style={[styles.noteCondLabel, {
                fontFamily: nb.fontFamily,
                color: "rgba(255,255,255,0.9)",
                textShadowColor: "rgba(0,0,0,0.4)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }]}>
                {condLabel}
              </Text>
            </View>

            {/* 상세 정보 */}
            <View style={styles.noteDetailsList}>
              <NoteDetailRow
                label={t("common.feelsLike")}
                value={formatTemp(feelsLike, u)}
                fontFamily={nb.fontFamily}
                inkColor="#FFFFFF"
                inkLight="rgba(255,255,255,0.7)"
              />
              <NoteDetailRow
                label={t("home.highLow")}
                value={`${formatTemp(tempHigh, u)} / ${formatTemp(tempLow, u)}`}
                fontFamily={nb.fontFamily}
                inkColor="#FFFFFF"
                inkLight="rgba(255,255,255,0.7)"
              />
              <NoteDetailRow
                label={t("common.precipitation")}
                value={`${precipitation}%`}
                fontFamily={nb.fontFamily}
                inkColor="#FFFFFF"
                inkLight="rgba(255,255,255,0.7)"
              />
              {airQualityLabel && (
                <NoteDetailRow
                  label={t("common.dust")}
                  value={airQualityLabel}
                  fontFamily={nb.fontFamily}
                  inkColor="#FFFFFF"
                  inkLight="rgba(255,255,255,0.7)"
                />
              )}
            </View>
            {refreshingIndicator ?? (isStale && onRefresh ? (
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.7} style={styles.staleBanner}>
                <Text style={styles.staleText}>{t("common.staleData")} · </Text>
                <Text style={styles.staleRefresh}>{t("common.refresh")}</Text>
              </TouchableOpacity>
            ) : fetchedLabel ? (
              <Text style={styles.fetchedAt}>{fetchedLabel}</Text>
            ) : null)}
          </View>
      </Animated.View>
    );
  }

  // ── 기본 글라스 스타일 ──
  const shadowR = (ap?.textShadowIntensity ?? 1) * 10;
  const shadowColor = ap?.textShadowColor ?? "rgba(0,0,0,0.5)";
  const glowColor = ap?.textGlowColor ?? "transparent";
  const glowR = ap?.textGlowRadius ?? 0;

  const tags = [
    t("home.precipPercent", { precip: precipitation }),
    t("home.feelsLikeTemp", { temp: formatTemp(feelsLike, u) }),
    ...(airQualityLabel ? [t("home.dustLabel", { label: airQualityLabel })] : []),
  ];

  return (
    <Animated.View style={[styles.container, parallaxStyle]}>
      <View style={styles.glassTopRow}>
        {location && (
          <TouchableOpacity
            onPress={() => { if (onLocationPress) { hapticLight(); onLocationPress(); } }}
            activeOpacity={onLocationPress ? 0.7 : 1}
            disabled={!onLocationPress}
            style={styles.glassLocationRow}
            accessibilityRole={onLocationPress ? "button" : "text"}
            accessibilityLabel={onLocationPress ? `위치: ${location}. 탭하여 변경` : `위치: ${location}`}
          >
            <MapPin size={13} weight="fill" color={ap?.textSecondary ?? "rgba(255,255,255,0.7)"} />
            <Text style={[styles.glassLocation, {
              color: ap?.textSecondary ?? "rgba(255,255,255,0.7)",
              textShadowColor: shadowColor,
              textShadowRadius: shadowR * 0.8,
            }]} maxFontSizeMultiplier={1.3}>
              {location}
            </Text>
            {onLocationPress && <CaretDown size={11} weight="bold" color={ap?.textSecondary ?? "rgba(255,255,255,0.5)"} />}
          </TouchableOpacity>
        )}
        {onSharePress && (
          <TouchableOpacity
            onPress={() => { hapticLight(); onSharePress(); }}
            activeOpacity={0.7}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel={t("share.share")}
          >
            <ShareNetwork size={18} weight="bold" color={ap?.textSecondary ?? "rgba(255,255,255,0.7)"} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.heroRow}>
        <Text style={styles.iconPlaceholder}>
          {condition === "clear" ? "☀️" : condition === "rain" ? "🌧️" : "⛅"}
        </Text>
        <View style={{
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowR > 0 ? 0.9 : 0,
          shadowRadius: glowR,
          elevation: 0,
        }}>
          <AnimatedTemp
            value={temp}
            unit={u}
            style={[styles.temp, {
              color: ap?.textPrimary ?? "#FFFFFF",
              fontWeight: ap?.tempFontWeight ?? "800",
              letterSpacing: ap?.tempLetterSpacing ?? -2,
              textShadowColor: shadowColor,
              textShadowRadius: shadowR * 1.5,
            }]}
            maxFontSizeMultiplier={1.0}
            accessibilityLabel={`${formatTemp(temp, u)}, ${condLabel}`}
          />
        </View>
      </View>
      <View style={[styles.meta, {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowR > 0 ? 0.7 : 0,
        shadowRadius: glowR * 0.6,
      }]}>
        <Text style={[styles.desc, {
          color: ap?.textSecondary ?? "rgba(255,255,255,0.88)",
          textShadowColor: shadowColor,
          textShadowRadius: shadowR * 1.2,
        }]}>
          {t("home.heroDesc", { cond: condLabel, feels: formatTemp(feelsLike, u), high: formatTemp(tempHigh, u), low: formatTemp(tempLow, u) })}
        </Text>
      </View>
      <View style={styles.tags}>
        {tags.map((tag) => (
          <View key={tag} style={[styles.tagPill, {
            backgroundColor: ap?.pillBg ?? "rgba(0,0,0,0.30)",
            borderColor: ap?.pillBorder ?? "rgba(255,255,255,0.15)",
          }]}>
            <Text style={[styles.tagText, {
              color: ap?.pillText ?? "#FFFFFF",
              textShadowColor: shadowColor,
            }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
      {autoRefreshing ? (
        <View style={styles.refreshingRow}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ transform: [{ scale: 0.7 }] }} />
          <Text style={styles.fetchedAt}>{t("common.updating")}</Text>
        </View>
      ) : isStale && onRefresh ? (
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.7} style={styles.staleBanner}>
          <Text style={styles.staleText}>최신 정보가 아닐 수 있어요 · </Text>
          <Text style={styles.staleRefresh}>새로고침</Text>
        </TouchableOpacity>
      ) : fetchedLabel ? (
        <Text style={styles.fetchedAt}>{fetchedLabel}</Text>
      ) : null}
    </Animated.View>
  );
}

/** 온도 카운트업 애니메이션 — 0°에서 실제 기온까지 롤링 */
function AnimatedTemp({ value, unit, style, accessibilityLabel, maxFontSizeMultiplier }: {
  value: number; unit: TempUnit; style: StyleProp<TextStyle>; accessibilityLabel?: string; maxFontSizeMultiplier?: number;
}) {
  const sv = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    sv.value = withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [value, sv]);

  useAnimatedReaction(
    () => Math.round(sv.value),
    (rounded, prev) => {
      if (rounded !== prev) runOnJS(setDisplay)(rounded);
    },
  );

  return (
    <Text
      style={style}
      accessibilityLabel={accessibilityLabel}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    >
      {formatTemp(display, unit)}
    </Text>
  );
}

/** 노트 상세 행 */
function NoteDetailRow({ label, value, fontFamily, inkColor, inkLight }: {
  label: string; value: string; fontFamily: string; inkColor: string; inkLight: string;
}) {
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 } as const,
    textShadowRadius: 4,
  };
  return (
    <View style={styles.noteRow}>
      <Text style={[styles.noteRowLabel, { fontFamily, color: inkLight, ...shadow }]}>{label}</Text>
      <Text style={[styles.noteRowValue, { fontFamily, color: inkColor, ...shadow }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 2 },

  // ── 노트북 히어로 (좌측 정렬) ──
  noteHeroClean: {
    paddingBottom: 16,
    paddingLeft: 28,
    paddingRight: 28,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  noteTemp: {
    fontSize: 46,
    fontWeight: "700",
    lineHeight: 54,
    letterSpacing: -2,
  },
  heroRight: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: 3,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  noteCondRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 10,
  },
  noteCondEmoji: { fontSize: 20 },
  noteCondLabel: {
    fontSize: 20,
    fontWeight: "500",
  },
  noteDetailsList: {
    gap: 3,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteRowLabel: {
    fontSize: 20,
    fontWeight: "500",
    width: 85,
  },
  noteRowValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  // ── 공유 버튼 ──
  heroRightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── 기본 글라스 히어로 ──
  glassTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 4,
  },
  glassLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  glassLocation: {
    fontSize: 14,
    fontWeight: "600",
    textShadowOffset: { width: 0, height: 1 },
  },
  heroRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 4, marginBottom: 6,
  },
  iconPlaceholder: { fontSize: 44 },
  temp: {
    fontSize: 52, lineHeight: 56,
    textShadowOffset: { width: 0, height: 2 },
  },
  meta: { alignItems: "center", marginBottom: 10 },
  desc: {
    fontSize: 13, fontWeight: "600",
    textShadowOffset: { width: 0, height: 1 },
  },
  tags: {
    flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 18,
  },
  tagPill: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12, fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fetchedAt: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  refreshingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 2,
  },
  staleBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  staleText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,200,100,0.75)",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  staleRefresh: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,200,100,0.95)",
    textDecorationLine: "underline",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
