import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import { FeaturedCard } from "@/components/discover/FeaturedCard";
import { FestivalCard } from "@/components/discover/FestivalCard";
import { PerformanceCard } from "@/components/discover/PerformanceCard";
import { CampingCard } from "@/components/discover/CampingCard";
import { EmptyDiscoverState } from "@/components/discover/EmptyDiscoverState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { fetchNearbyFestivals } from "@/services/festivalService";
import { fetchNearbyCamping, isCampingWeather } from "@/services/campingService";
import { fetchPerformances } from "@/services/performanceService";
import { fetchContentSocialBatch } from "@/services/discoverSocialService";
import type { SocialMap } from "@/services/discoverSocialService";
import { t } from "@/i18n";
import { useLocale } from "@/i18n/useLocale";
import { logError } from "@/utils/logger";
import { getConditionLabel } from "@/utils/weather";
import { Confetti, MusicNotes, Campfire, SquaresFour } from "phosphor-react-native";
import type { FestivalItem } from "@/services/festivalService";
import type { PerformanceItem } from "@/services/performanceService";
import type { CampingItem } from "@/services/campingService";

type FilterType = "all" | "festival" | "performance" | "camping";

const FILTER_KEYS: FilterType[] = ["all", "festival", "performance", "camping"];

const FILTER_ICONS: Record<FilterType, typeof SquaresFour> = {
  all: SquaresFour,
  festival: Confetti,
  performance: MusicNotes,
  camping: Campfire,
};

export default function EventScreen() {
  return <DiscoverContent />;
}

function DiscoverContent() {
  const { state } = useWeatherContext();
  const insets = useSafeAreaInsets();

  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [campingSites, setCampingSites] = useState<CampingItem[]>([]);
  const [socialMap, setSocialMap] = useState<SocialMap>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const { locale } = useLocale();

  const bgCondition = state.currentWeather?.condition ?? "clear";
  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const rawName = location?.name ?? "";
  const locationName = rawName.split(" ").slice(-2).join(" ") || rawName;
  const conditionLabel = getConditionLabel(bgCondition);
  const temp = state.currentWeather?.temp;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!location) {
          setLoading(false);
          return;
        }
        const { lat, lon } = location;
        const condition = state.currentWeather?.condition ?? "clear";
        const feelsLike = state.currentWeather?.feelsLike ?? 20;

        try {
          const [festResult, perfResult, campResult] = await Promise.all([
            fetchNearbyFestivals(lat, lon).catch((e) => { logError("general", e); return []; }),
            fetchPerformances(lat, lon, condition).catch((e) => { logError("general", e); return []; }),
            fetchNearbyCamping(lat, lon).catch((e) => { logError("general", e); return []; }),
          ]);

          if (cancelled) return;
          setFestivals(festResult);
          setPerformances(perfResult);

          const hasRain = (state.currentWeather?.precipitation ?? 0) >= 30;
          if (isCampingWeather(condition, feelsLike, hasRain)) {
            setCampingSites(campResult);
          } else {
            setCampingSites([]);
          }

          const allKeys: string[] = [
            ...festResult.map((f) => `festival:${f.title}`),
            ...perfResult.map((p) => `performance:${p.id}`),
            ...campResult.map((c) => `camping:${c.name}`),
          ];
          if (allKeys.length > 0) {
            fetchContentSocialBatch(allKeys).then((map) => {
              if (!cancelled) setSocialMap(map);
            }).catch(() => {});
          }
        } catch (e) {
          logError("general", e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [state.currentLocationId]),
  );

  const featuredFestival = useMemo(() => festivals[0] ?? null, [festivals]);
  const restFestivals = useMemo(() => festivals.slice(1), [festivals]);
  const hasAnyContent = festivals.length > 0 || performances.length > 0 || campingSites.length > 0;

  const counts = useMemo(() => ({
    festival: festivals.length,
    performance: performances.length,
    camping: campingSites.length,
    all: festivals.length + performances.length + campingSites.length,
  }), [festivals, performances, campingSites]);

  const availableFilters = useMemo(() =>
    FILTER_KEYS
      .filter((key) => key === "all" || counts[key] > 0)
      .map((key) => ({ key, label: t(`discover.filter.${key}`) })),
    [counts, locale],
  );

  const showFestivals = filter === "all" || filter === "festival";
  const showPerformances = filter === "all" || filter === "performance";
  const showCamping = filter === "all" || filter === "camping";

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0F172A", "#162036", "#1A1A40", "#162036", "#0F172A"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={1.2}>
            {t("discover.title")}
          </Text>
          <View style={styles.subtitleRow}>
            <View style={styles.locationDot} />
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {locationName}{temp !== undefined ? ` · ${conditionLabel} ${temp}°` : ""}
            </Text>
          </View>
        </View>

        {loading ? (
          <>
            <SkeletonRow style={styles.heroSkeleton} />
            <SkeletonRow style={styles.cardSkeleton} />
            <SkeletonRow style={styles.cardSkeleton} />
          </>
        ) : !hasAnyContent ? (
          <EmptyDiscoverState />
        ) : (
          <>
            {/* 필터 배지 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {availableFilters.map((f) => {
                const Icon = FILTER_ICONS[f.key];
                const active = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilter(f.key)}
                  >
                    <Icon size={14} color={active ? "#818CF8" : "rgba(255,255,255,0.45)"} />
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 피처 카드 (전체 또는 축제 필터일 때만) */}
            {showFestivals && featuredFestival && (
              <FeaturedCard item={featuredFestival} />
            )}

            {/* 축제 리스트 */}
            {showFestivals && restFestivals.length > 0 && (
              <View style={styles.cardList}>
                {restFestivals.map((f, i) => (
                  <FestivalCard key={`${f.title}-${i}`} item={f} likeCount={socialMap[`festival:${f.title}`]?.likeCount} commentCount={socialMap[`festival:${f.title}`]?.commentCount} />
                ))}
              </View>
            )}

            {/* 공연 */}
            {showPerformances && performances.length > 0 && (
              <View style={styles.cardList}>
                {filter === "all" && (
                  <View style={styles.sectionDivider}>
                    <View style={[styles.accentBar, { backgroundColor: "#8B5CF6" }]} />
                    <Text style={styles.sectionTitle}>{t("discover.performances")}</Text>
                  </View>
                )}
                {performances.map((p) => (
                  <PerformanceCard key={p.id} item={p} likeCount={socialMap[`performance:${p.id}`]?.likeCount} commentCount={socialMap[`performance:${p.id}`]?.commentCount} />
                ))}
              </View>
            )}

            {/* 캠핑 */}
            {showCamping && campingSites.length > 0 && (
              <View style={styles.cardList}>
                {filter === "all" && (
                  <View style={styles.sectionDivider}>
                    <View style={[styles.accentBar, { backgroundColor: "#22C55E" }]} />
                    <Text style={styles.sectionTitle}>{t("discover.camping")}</Text>
                  </View>
                )}
                {campingSites.map((c, i) => (
                  <CampingCard key={`${c.name}-${i}`} item={c} likeCount={socialMap[`camping:${c.name}`]?.likeCount} commentCount={socialMap[`camping:${c.name}`]?.commentCount} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F172A" },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(96,165,250,0.7)",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "rgba(99,102,241,0.5)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  filterTextActive: {
    color: "#818CF8",
  },
  cardList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
    paddingBottom: 4,
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  heroSkeleton: {
    marginHorizontal: 20,
    height: 240,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardSkeleton: {
    marginHorizontal: 20,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
  },
});
