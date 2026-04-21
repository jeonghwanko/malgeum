import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import ViewShot from "react-native-view-shot";
import { captureAndShareWithMessage } from "@/utils/shareCapture";
import { getDownloadUrl } from "@/services/microcopy";
import { hasCelebratedWinToday, markWinCelebrated } from "@/utils/storage";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { mapConditionToTexture } from "@/utils/weather";
import { todayKey } from "@/utils/date";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { PredictionCard } from "@/components/event/PredictionCard";
import { GameStatsCard } from "@/components/event/GameStatsCard";
import { PredictionHistoryList } from "@/components/event/PredictionHistoryList";
import { ChallengeCard } from "@/components/event/ChallengeCard";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import {
  loadGameView,
  savePrediction,
  computeStats,
} from "@/services/predictionGameService";
import { logError } from "@/utils/logger";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";
import { SkeletonStats, SkeletonDots } from "@/components/ui/Skeleton";
import type {
  PredictionChoice,
  PredictionEntry,
} from "@/types/predictionGame";

export default function PredictionGameScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();

  const [history, setHistory] = useState<PredictionEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const challengeCardRef = useRef<ViewShot>(null);

  const today = todayKey();
  const todayPrediction = useMemo(
    () => history.find((e) => e.date === today) ?? null,
    [history, today],
  );
  const yesterdayResult = useMemo(() => {
    const settled = history
      .filter((e) => e.result && e.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return settled[0] ?? null;
  }, [history, today]);
  const stats = useMemo(() => computeStats(history), [history]);

  const baseMax =
    typeof state.dailyForecast?.[0]?.tempMax === "number"
      ? Math.round(state.dailyForecast[0].tempMax)
      : null;
  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? t("event.currentArea");
  const bgCondition = state.currentWeather?.condition ?? "clear";

  // 모달 마운트 시 1회 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [view, celebrated] = await Promise.all([
        loadGameView(),
        hasCelebratedWinToday(),
      ]);
      if (cancelled) return;
      setHistory(view.history);
      setHistoryLoaded(true);

      if (!celebrated) {
        const latestSettled = view.history
          .filter((e: PredictionEntry) => e.result && e.date !== todayKey())
          .sort((a: PredictionEntry, b: PredictionEntry) => b.date.localeCompare(a.date))[0];
        if (latestSettled?.result === "win") {
          setShowCelebrate(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePredict = useCallback(
    async (choice: PredictionChoice) => {
      if (submitting || todayPrediction || baseMax === null) return;
      setSubmitting(true);
      try {
        const entry = await savePrediction(choice, baseMax);
        setHistory((prev) => (prev.some((e) => e.date === entry.date) ? prev : [...prev, entry]));
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, todayPrediction, baseMax],
  );

  const handleShareChallenge = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const choice = todayPrediction?.choice === "higher" ? t("event.predictHigher") : t("event.predictLower");
      const msg = [
        t("event.predictMsg", { temp: baseMax, choice }),
        t("event.canYou"),
        "",
        `${t("share.downloadLabel")}${getDownloadUrl("challenge", { condition: bgCondition })}`,
      ].join("\n");
      await captureAndShareWithMessage(challengeCardRef, msg, "jpg");
    } catch (e) {
      logError("share", e);
    } finally {
      setSharing(false);
    }
  }, [sharing, todayPrediction, baseMax]);

  const handleShareResult = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const streak = stats.currentStreak;
      const msg = [
        t("event.gotItRight"),
        streak >= 2 ? t("event.streakMsg", { streak }) : t("event.tryIt"),
        "",
        `${t("share.downloadLabel")}${getDownloadUrl("challenge", { condition: bgCondition })}`,
      ].join("\n");
      await captureAndShareWithMessage(challengeCardRef, msg, "jpg");
    } catch (e) { logError("share", e); }
    finally { setSharing(false); }
  }, [sharing, stats.currentStreak]);

  const handleDismissCelebrate = useCallback(async () => {
    setShowCelebrate(false);
    await markWinCelebrated();
  }, []);

  const handleCelebrateShare = useCallback(async () => {
    setShowCelebrate(false);
    await markWinCelebrated();
    setTimeout(() => handleShareResult(), 300);
  }, [handleShareResult]);

  const textureKey = mapConditionToTexture(bgCondition);
  const bgImage = getTextureSource(artStyle, textureKey);

  return (
    <>
      {/* 도전장 캡처용 — 화면 밖 렌더 */}
      {todayPrediction && (
        <View style={styles.offscreen} pointerEvents="none">
          <ChallengeCard
            ref={challengeCardRef}
            baseMax={baseMax ?? 0}
            choice={todayPrediction.choice}
            locationName={locationName}
            condition={bgCondition}
            backgroundImage={bgImage}
          />
        </View>
      )}

      <ScreenSheet title={t("predCard.title")} subtitle={t("predCard.subtitle")} defaultSnap="90%">
        <PredictionCard
          baseMax={baseMax}
          locationName={locationName}
          todayPrediction={todayPrediction}
          yesterdayResult={yesterdayResult}
          onPredict={handlePredict}
          disabled={submitting || baseMax === null}
          submitting={submitting}
          variant="light"
        />

        {/* 자동 축하 배너 */}
        {showCelebrate && (
          <View style={styles.celebrateCard}>
            <Text style={styles.celebrateEmoji}>
              {stats.currentStreak >= 3 ? "🔥" : "🎉"}
            </Text>
            <Text style={styles.celebrateTitle}>
              {stats.currentStreak >= 3
                ? t("event.celebrateStreak", { streak: stats.currentStreak })
                : stats.currentStreak === 1 && stats.totalWins === 1
                  ? t("event.celebrateFirst")
                  : t("event.celebrateWin")}
            </Text>
            <Text style={styles.celebrateSub}>{t("event.celebrateSub")}</Text>
            <Pressable
              style={styles.celebrateShareBtn}
              onPress={() => { hapticLight(); handleCelebrateShare(); }}
            >
              <Text style={styles.celebrateShareText}>{t("event.celebrateShareBtn")}</Text>
            </Pressable>
            <Pressable onPress={handleDismissCelebrate}>
              <Text style={styles.celebrateDismiss}>{t("event.celebrateDismiss")}</Text>
            </Pressable>
          </View>
        )}

        {/* 예측 완료 후 도전장 공유 버튼 */}
        {todayPrediction && (
          <Pressable
            style={[styles.challengeBtn, sharing && styles.btnDisabled]}
            onPress={() => { hapticLight(); handleShareChallenge(); }}
            disabled={sharing}
          >
            <Text style={styles.challengeBtnText}>
              {sharing ? t("event.capturing") : t("event.sendChallenge")}
            </Text>
          </Pressable>
        )}

        {/* 어제 결과 공유 */}
        {yesterdayResult?.result === "win" && (
          <Pressable
            style={[styles.resultShareBtn, sharing && styles.btnDisabled]}
            onPress={() => { hapticLight(); handleShareResult(); }}
            disabled={sharing}
          >
            <Text style={styles.resultShareText}>
              {stats.currentStreak >= 2
                ? t("event.streakShare", { streak: stats.currentStreak })
                : t("event.winShare")}
            </Text>
          </Pressable>
        )}

        {historyLoaded ? (
          <>
            <GameStatsCard stats={stats} variant="light" />
            <PredictionHistoryList entries={history} variant="light" />
          </>
        ) : (
          <>
            <SkeletonStats style={{ marginBottom: 16 }} />
            <SkeletonDots />
          </>
        )}
      </ScreenSheet>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    top: -9999,
    left: -9999,
    opacity: 0,
  },
  celebrateCard: {
    marginTop: 12,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  celebrateEmoji: { fontSize: 40 },
  celebrateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D97706",
    textAlign: "center",
  },
  celebrateSub: {
    fontSize: 13,
    color: "#78716C",
    textAlign: "center",
    marginBottom: 4,
  },
  celebrateShareBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 4,
  },
  celebrateShareText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  celebrateDismiss: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    paddingVertical: 4,
  },
  challengeBtn: {
    marginTop: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  challengeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resultShareBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    alignItems: "center",
  },
  resultShareText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#D97706",
  },
});
