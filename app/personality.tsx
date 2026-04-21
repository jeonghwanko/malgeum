import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { ShareNetwork } from "phosphor-react-native";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { t } from "@/i18n";
import { computePersonalityProfile } from "@/services/personalityService";
import type { PersonalityProfile } from "@/types/personality";

export default function PersonalityScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);

  useEffect(() => {
    computePersonalityProfile().then(setProfile);
  }, []);

  if (!profile) return <ScreenSheet title={t("personality.title")}><View /></ScreenSheet>;

  const progressPct = Math.round(profile.progress * 100);
  const progressTier = progressPct >= 70 ? 2 : progressPct >= 40 ? 1 : 0;

  return (
    <ScreenSheet title={t("personality.title")}>
      {/* 히어로 영역 */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
        <Text style={styles.heroEmoji}>{profile.personalityEmoji}</Text>
        <Text style={styles.heroType}>{profile.personalityLabel}</Text>
        <Text style={styles.heroDesc}>{profile.personalityDesc}</Text>

        {profile.ready && profile.rarity !== null && (
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityBadgeText}>
              {t("personality.rarityLabel")} · {t("personality.rarity", { pct: profile.rarity })}
            </Text>
          </View>
        )}

        {profile.ready && profile.personalityParadox && (
          <View style={styles.paradoxCard}>
            <Text style={styles.paradoxLabel}>{t("personality.paradoxLabel")}</Text>
            <Text style={styles.paradoxText}>"{profile.personalityParadox}"</Text>
          </View>
        )}
      </Animated.View>

      {/* 함께한 기간 */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.daysBadge}>
        <Text style={styles.daysBadgeText}>
          {t("personality.daysWith", { days: profile.totalDays })}
        </Text>
      </Animated.View>

      {/* 인사이트 목록 */}
      {profile.ready ? (
        <>
          <View style={styles.insightList}>
            {profile.insights.map((insight, i) => (
              <Animated.View
                key={insight.id}
                entering={FadeInUp.duration(400).delay(200 + i * 80)}
                style={styles.insightCard}
              >
                <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                <View style={styles.insightBody}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDetail}>{insight.detail}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(200 + profile.insights.length * 80)}
            style={styles.shareWrap}
          >
            <Pressable
              style={styles.shareBtn}
              onPress={() => router.push("/share?mode=personality" as never)}
              accessibilityRole="button"
              accessibilityLabel={t("personality.share")}
            >
              <ShareNetwork size={18} color="#fff" weight="bold" />
              <Text style={styles.shareBtnText}>{t("personality.share")}</Text>
            </Pressable>
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>☁️</Text>
          <Text style={styles.emptyText}>{t("personality.emptyText")}</Text>

          {/* 진행도 바 */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{t("personality.progress.pct", { pct: progressPct })}</Text>
          <Text style={styles.progressHint}>
            {t(`personality.progress.tier${progressTier}` as "personality.progress.tier0")}
          </Text>

          <Text style={styles.emptyHint}>{t("personality.emptyHint")}</Text>
        </Animated.View>
      )}
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroType: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  rarityBadge: {
    marginTop: 12,
    backgroundColor: "rgba(251,191,36,0.15)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },

  paradoxCard: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "stretch",
  },
  paradoxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  paradoxText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    fontStyle: "italic",
  },

  daysBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(59,130,246,0.1)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  daysBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },

  insightList: {
    gap: 12,
    paddingHorizontal: 20,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  insightEmoji: {
    fontSize: 28,
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  insightDetail: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  shareWrap: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 40,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 18,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 4,
  },
  progressHint: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 18,
  },
  emptyHint: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
