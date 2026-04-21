import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Text, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { usePalette } from "@/context/PaletteContext";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { mapConditionToTexture, formatTemp } from "@/utils/weather";
import { WeeklySummary } from "@/components/weekly/WeeklySummary";
import { DayRow } from "@/components/weekly/DayRow";
import { PredictionGameButton } from "@/components/weekly/PredictionGameButton";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { formatDay, todayKey, nextDayKey, getLocalizedDay } from "@/utils/date";
import { getDailyTip } from "@/utils/recommendations";
import { loadWeeklyMaxMap, loadWeeklyForecastMap, getWeekStartMonday, hasPredictedToday } from "@/services/predictionGameService";
import { t } from "@/i18n";

interface PastDayRow {
  key: string;
  day: string;
  date: string;
  value: number;
  forecastMax?: number;
}
import type { DailyWeather } from "@/types/weather";

function buildMockDaily(): DailyWeather[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    { dt: now, tempMin: 16, tempMax: 26, condition: "clear", precipitation: 0 },
    { dt: now + 86400, tempMin: 15, tempMax: 24, condition: "clouds", precipitation: 10 },
    { dt: now + 86400 * 2, tempMin: 13, tempMax: 20, condition: "rain", precipitation: 80 },
    { dt: now + 86400 * 3, tempMin: 14, tempMax: 21, condition: "drizzle", precipitation: 40 },
    { dt: now + 86400 * 4, tempMin: 15, tempMax: 23, condition: "clouds", precipitation: 10 },
    { dt: now + 86400 * 5, tempMin: 16, tempMax: 27, condition: "clear", precipitation: 0 },
    { dt: now + 86400 * 6, tempMin: 17, tempMax: 28, condition: "clear", precipitation: 0 },
  ];
}

function getDayAction(d: DailyWeather): { text: string; variant: "safe" | "caution" | "hot" | "default" } {
  if (d.precipitation >= 50) return { text: t("weekly.action.umbrellaMust"), variant: "caution" };
  if (d.precipitation >= 30) return { text: t("weekly.action.umbrellaMaybe"), variant: "caution" };
  if (d.tempMax >= 33) return { text: t("weekly.action.heatWarn"), variant: "hot" };
  if (d.tempMax >= 28) return { text: t("weekly.action.sunscreen"), variant: "hot" };
  if (d.tempMin <= 0) return { text: t("weekly.action.coldWarn"), variant: "caution" };
  if (d.condition === "snow") return { text: t("weekly.action.snowAlert"), variant: "caution" };
  if (d.condition === "clear" && d.tempMax >= 20 && d.tempMax <= 27) return { text: t("weekly.action.running"), variant: "safe" };
  if (d.condition === "clear" && d.precipitation < 20) return { text: t("weekly.action.carwash"), variant: "safe" };
  if (d.condition === "clear" || d.condition === "clouds") {
    if (d.tempMax >= 20 && d.tempMax <= 28) return { text: t("weekly.action.outing"), variant: "safe" };
  }
  if (d.tempMax <= 10) return { text: t("weekly.action.padding"), variant: "default" };
  if (d.tempMax <= 16) return { text: t("weekly.action.cardigan"), variant: "default" };
  return { text: t("weekly.action.comfy"), variant: "safe" };
}

// DAY_NAMES는 pastWeekDays 빌드에서 KOREAN_DAYS를 직접 사용하므로 불필요 (getLocalizedDay 사용)

function appendDayLabel(day: string) {
  const todayLabel = t("date.today");
  const tomorrowLabel = t("date.tomorrow");
  if (day === todayLabel || day === tomorrowLabel) return day;
  return t("weekly.dayAppend", { day });
}

function formatDayRange(days: DailyWeather[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) {
    const { day } = formatDay(days[0].dt);
    return appendDayLabel(day);
  }
  const indices = days.map((d) => Math.floor(d.dt / 86400));
  const ranges: string[][] = [];
  let current = [formatDay(days[0].dt).day];
  for (let i = 1; i < days.length; i++) {
    if (indices[i] - indices[i - 1] === 1) {
      current.push(formatDay(days[i].dt).day);
    } else {
      ranges.push(current);
      current = [formatDay(days[i].dt).day];
    }
  }
  ranges.push(current);
  return ranges
    .map((r) =>
      r.length >= 2
        ? `${appendDayLabel(r[0])}~${appendDayLabel(r[r.length - 1])}`
        : appendDayLabel(r[0])
    )
    .join(", ");
}

function buildSummaryText(daily: DailyWeather[]): string {
  const lines: string[] = [];
  const rainyDays = daily.filter((d) => d.precipitation >= 50);
  const snowDays = daily.filter((d) => d.condition === "snow");

  if (snowDays.length > 0) {
    lines.push(t("weekly.snow"));
  } else if (rainyDays.length >= 3) {
    lines.push(t("weekly.manyRain"));
  } else if (rainyDays.length > 0) {
    lines.push(t("weekly.someRain", { days: formatDayRange(rainyDays) }));
  }

  for (let i = 0; i < daily.length - 1; i++) {
    const diff = daily[i + 1].tempMax - daily[i].tempMax;
    if (diff <= -7) {
      const { day } = formatDay(daily[i + 1].dt);
      lines.push(t("weekly.tempDrop", { day: appendDayLabel(day) }));
      break;
    }
    if (diff >= 7) {
      const { day } = formatDay(daily[i + 1].dt);
      lines.push(t("weekly.tempRise", { day: appendDayLabel(day) }));
      break;
    }
  }

  const hotDays = daily.filter((d) => d.tempMax >= 33);
  if (hotDays.length > 0) {
    lines.push(t("weekly.heatWarn"));
  }

  const weekend = daily.filter((d) => {
    const dow = new Date(d.dt * 1000).getDay();
    return dow === 0 || dow === 6;
  });
  if (weekend.length > 0 && weekend.every((d) => d.precipitation < 30 && d.tempMax >= 15)) {
    lines.push(t("weekly.weekendNice"));
  }

  if (lines.length === 0) {
    if (daily.every((d) => d.precipitation < 20)) {
      lines.push(t("weekly.allClear"));
      lines.push(t("weekly.goodOutdoor"));
    } else {
      lines.push(t("weekly.normal"));
    }
  }

  return lines.slice(0, 2).join("\n");
}

export default function WeeklyScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();
  const bgCondition = state.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(bgCondition);

  return <WeeklyContent />;
}

function WeeklyContent() {
  const { state } = useWeatherContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ap = usePalette()!;
  const daily = useMemo(
    () => state.dailyForecast.length > 0 ? state.dailyForecast : buildMockDaily(),
    [state.dailyForecast],
  );

  // 예측 게임 상태
  const [gamePredicted, setGamePredicted] = useState(false);

  // 이번주 지난 날들의 실측 최고기온 (월요일부터 어제까지, WEEKLY_MAX 스냅샷)
  const [pastWeekDays, setPastWeekDays] = useState<PastDayRow[]>([]);
  const [pastLoading, setPastLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [map, fcMap, predicted] = await Promise.all([loadWeeklyMaxMap(), loadWeeklyForecastMap(), hasPredictedToday()]);
        if (cancelled) return;
        setGamePredicted(predicted);
        if (cancelled) return;
        const today = todayKey();
        const rows: PastDayRow[] = [];
        let cursor = getWeekStartMonday();
        while (cursor < today) {
          const value = map[cursor];
          if (typeof value === "number") {
            const [yy, mm, dd] = cursor.split("-").map(Number);
            const d = new Date(yy, mm - 1, dd);
            rows.push({
              key: cursor,
              day: getLocalizedDay(d.getDay()),
              date: `${mm}/${dd}`,
              value,
              forecastMax: fcMap[cursor],
            });
          }
          cursor = nextDayKey(cursor);
        }
        setPastWeekDays(rows);
        setPastLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const weekMin = Math.min(...daily.map((d) => d.tempMin));
  const weekMax = Math.max(...daily.map((d) => d.tempMax));
  const summaryText = useMemo(() => buildSummaryText(daily), [daily]);
  const dailyMeta = useMemo(
    () => daily.map((d) => ({ action: getDayAction(d), tip: getDailyTip(d) ?? undefined })),
    [daily],
  );


  const nb = ap?.notebook;
  const fontFamily = nb && nb.fontFamily !== "system" ? nb.fontFamily : undefined;
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 } as const,
    textShadowRadius: 10,
  };

  const bgCondition = state.currentWeather?.condition ?? "clear";

  return (
    <WeatherBackground condition={bgCondition} isNight={false} sideGradient={true}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily, fontWeight: fontFamily ? "normal" : "800", ...shadow }]}>
            {t("weekly.title")}
          </Text>
          <Text style={[styles.subtitle, { ...shadow, textShadowRadius: 6 }]}>
            {t("weekly.subtitle")}
          </Text>
        </View>

        <WeeklySummary text={summaryText} />

        <PredictionGameButton
          hasPredicted={gamePredicted}
          onPress={() => router.push("/prediction-game" as never)}
          palette={ap}
        />

        {pastLoading && pastWeekDays.length === 0 && (
          <>
            <SkeletonRow style={styles.yesterdayRow} />
            <SkeletonRow style={styles.yesterdayRow} />
          </>
        )}

        {pastWeekDays.map((p) => (
          <View key={p.key} style={styles.yesterdayRow}>
            <Text style={styles.yesterdayDay}>{p.day}</Text>
            <Text style={styles.yesterdayDate}>{p.date}</Text>
            <View style={styles.yesterdayBadge}>
              <Text style={styles.yesterdayBadgeText}>{t("weekly.actual")}</Text>
            </View>
            <View style={{ flex: 1 }} />
            {p.forecastMax !== undefined && (
              <Text style={styles.forecastLabel}>{t("weekly.forecast")} {formatTemp(p.forecastMax, state.tempUnit)}</Text>
            )}
            <Text style={styles.yesterdayLabel}>{t("common.high")}</Text>
            <Text style={styles.yesterdayValue}>{formatTemp(p.value, state.tempUnit)}</Text>
          </View>
        ))}

        {daily.map((d, idx) => {
          const { day, date, isToday } = formatDay(d.dt);
          return (
            <DayRow
              key={d.dt}
              day={day}
              date={date}
              condition={d.condition}
              tempLow={d.tempMin}
              tempHigh={d.tempMax}
              weekMin={weekMin}
              weekMax={weekMax}
              action={dailyMeta[idx].action}
              tip={dailyMeta[idx].tip}
              isToday={isToday}
            />
          );
        })}

        {/* 커피콩 크로스 프로모 */}
        <Pressable
          style={[styles.coffeeBanner, { backgroundColor: ap?.pillBg, borderColor: ap?.pillBorder }]}
          onPress={() => Linking.openURL(
            Platform.OS === "ios"
              ? "https://apps.apple.com/kr/app/%EC%BB%A4%ED%94%BC%EC%BD%A9/id6761358222"
              : "https://play.google.com/store/apps/details?id=gg.pryzm.coffee"
          )}
        >
          <Text style={styles.coffeeBannerEmoji}>☕</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.coffeeBannerTitle, { color: ap?.textPrimary ?? "#FFFFFF" }]}>습관 체크하고 커피 받아가세요</Text>
            <Text style={[styles.coffeeBannerSub, { color: ap?.textTertiary ?? "rgba(255,255,255,0.5)" }]}>매일 미션 완료하면 진짜 상품권 교환!</Text>
          </View>
          <Text style={{ fontSize: 18, color: ap?.textTertiary ?? "rgba(255,255,255,0.5)" }}>›</Text>
        </Pressable>
      </ScrollView>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  yesterdayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.18)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.32)",
  },
  yesterdayDay: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  yesterdayDate: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  yesterdayBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  yesterdayBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
  },
  forecastLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    marginRight: 12,
  },
  yesterdayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  yesterdayValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  scroll: { flex: 1 },
  content: { padding: 24 },
  header: { marginBottom: 24 },
  title: {
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  coffeeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
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
});
