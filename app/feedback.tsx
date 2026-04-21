import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { t } from "@/i18n";
import { saveFeedback, getFeedbackStats, hasFeedbackToday, getFeedbackStreak, type FeedbackStats } from "@/services/feedbackService";
import { useWeatherContext } from "@/context/WeatherContext";
import { logFeedbackSubmit } from "@/services/analytics";

export default function FeedbackScreen() {
  const { state } = useWeatherContext();
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const done = await hasFeedbackToday();
      if (done) {
        setAlreadyDone(true);
        setSubmitted(true);
      }
      setStats(await getFeedbackStats());
      setStreak(await getFeedbackStreak());
    })();
  }, []);

  const handleFeedback = useCallback(async (accurate: boolean) => {
    if (submitted) return;
    setSubmitted(true);
    logFeedbackSubmit(accurate);
    await saveFeedback(accurate, state.currentWeather?.feelsLike);
    setStats(await getFeedbackStats());
    setStreak(await getFeedbackStreak());
  }, [submitted, state.currentWeather?.feelsLike]);

  return (
    <ScreenSheet title={t("feedback.title")} subtitle={t("feedback.subtitle")}>
      {!submitted ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.questionWrap}>
          <Text style={styles.emoji}>🤔</Text>
          <Text style={styles.question}>{t("feedback.question")}</Text>
          <Text style={styles.hint}>{t("feedback.hint")}</Text>

          <View style={styles.btnRow}>
            <Pressable
              style={[styles.feedbackBtn, styles.yesBg]}
              onPress={() => handleFeedback(true)}
            >
              <Text style={styles.feedbackEmoji}>👍</Text>
              <Text style={styles.feedbackLabel}>{t("feedback.accurate")}</Text>
            </Pressable>
            <Pressable
              style={[styles.feedbackBtn, styles.noBg]}
              onPress={() => handleFeedback(false)}
            >
              <Text style={styles.feedbackEmoji}>👎</Text>
              <Text style={styles.feedbackLabel}>{t("feedback.inaccurate")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInUp.duration(400)} style={styles.resultWrap}>
          <Text style={styles.emoji}>{alreadyDone ? "📊" : "🎉"}</Text>
          <Text style={styles.resultTitle}>
            {alreadyDone ? t("feedback.alreadyDone") : t("feedback.thanks")}
          </Text>

          {streak > 0 && (
            <Text style={styles.streakText}>
              {t("feedback.streak", { days: streak })}
            </Text>
          )}

          {stats && stats.total > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>{t("feedback.recentAccuracy")}</Text>
              <Text style={styles.statsRate}>{stats.rate}%</Text>
              <Text style={styles.statsDetail}>
                {t("feedback.statsDetail", { total: stats.total, accurate: stats.accurate })}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  questionWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  question: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 32,
  },
  btnRow: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
  },
  yesBg: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  noBg: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  feedbackEmoji: {
    fontSize: 32,
  },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  resultWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F59E0B",
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    padding: 28,
    alignItems: "center",
    width: "100%",
    gap: 6,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  statsRate: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.safe,
    letterSpacing: -2,
  },
  statsDetail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
});
