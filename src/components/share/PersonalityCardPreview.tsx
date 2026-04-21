/**
 * 날씨 성격 공유 카드 — 바이럴 용 SNS 캡처 포맷 (832×1216, aspectRatio 9:16).
 * ShareCardPreview 패턴 따라가며 성격 정보(라벨·역설·희귀도·인사이트 3개) 표시.
 */
import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import { COLORS } from "@/constants/colors";
import type { PersonalityProfile } from "@/types/personality";

interface PersonalityCardPreviewProps {
  profile: PersonalityProfile;
  backgroundImage: any;
  showWatermark?: boolean;
}

export const PersonalityCardPreview = forwardRef<ViewShot, PersonalityCardPreviewProps>(
  ({ profile, backgroundImage, showWatermark = true }, ref) => {
    const topInsights = profile.insights.slice(0, 3);
    return (
      <ViewShot ref={ref} options={{ format: "png", quality: 1 }}>
        <ImageBackground source={backgroundImage} style={styles.card} resizeMode="cover">
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            {/* 상단: 이모지 + 라벨 + 한 줄 설명 */}
            <View style={styles.hero}>
              <Text style={styles.emoji}>{profile.personalityEmoji}</Text>
              <Text style={styles.label}>{profile.personalityLabel}</Text>
              <Text style={styles.desc}>"{profile.personalityDesc}"</Text>
            </View>

            <View style={styles.divider} />

            {/* 가운데: 인사이트 3개 (SPECIFIC / REVEAL / PARADOX 구조) */}
            <View style={styles.insights}>
              {topInsights.map((insight, i) => (
                <View key={insight.id} style={styles.insightRow}>
                  <Text style={styles.insightCheck}>✓</Text>
                  <View style={styles.insightBody}>
                    <Text style={styles.insightTitle} numberOfLines={2}>{insight.title}</Text>
                    <Text style={styles.insightDetail} numberOfLines={2}>{insight.detail}</Text>
                  </View>
                </View>
              ))}
              {profile.personalityParadox && (
                <View style={styles.insightRow}>
                  <Text style={styles.insightCheck}>✓</Text>
                  <View style={styles.insightBody}>
                    <Text style={styles.insightLabel}>PARADOX</Text>
                    <Text style={styles.insightDetail} numberOfLines={3}>{profile.personalityParadox}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 하단: 희귀도 + 워터마크 */}
            <View style={styles.footer}>
              {profile.rarity !== null && (
                <View style={styles.rarityWrap}>
                  <Text style={styles.rarityLabel}>전체의</Text>
                  <Text style={styles.rarityNum}>{profile.rarity}%</Text>
                </View>
              )}
              {showWatermark && <Text style={styles.watermark}>☀️ 맑음 Malgeum</Text>}
            </View>
          </View>
        </ImageBackground>
      </ViewShot>
    );
  },
);

PersonalityCardPreview.displayName = "PersonalityCardPreview";

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    aspectRatio: 9 / 16,
    width: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 28,
    paddingTop: 56,
  },
  hero: {
    alignItems: "center",
  },
  emoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  label: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 20,
  },
  insights: {
    gap: 16,
    flex: 1,
  },
  insightRow: {
    flexDirection: "row",
    gap: 12,
  },
  insightCheck: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FCD34D",
    lineHeight: 20,
  },
  insightBody: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
    lineHeight: 18,
  },
  insightDetail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 17,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
  },
  rarityWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  rarityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  rarityNum: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FCD34D",
    letterSpacing: -1,
  },
  watermark: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
});
