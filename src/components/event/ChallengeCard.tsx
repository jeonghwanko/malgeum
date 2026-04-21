import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import type { PredictionChoice } from "@/types/predictionGame";
import type { WeatherCondition } from "@/types/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import { t } from "@/i18n";

interface ChallengeCardProps {
  baseMax: number;
  choice: PredictionChoice;
  locationName: string;
  condition: WeatherCondition;
  backgroundImage: ImageSourcePropType;
}

export const ChallengeCard = forwardRef<ViewShot, ChallengeCardProps>(
  ({ baseMax, choice, locationName, condition, backgroundImage }, ref) => {
    const emoji = getConditionEmoji(condition);
    const choiceLabel = choice === "higher" ? t("event.predictHigher") : t("event.predictLower");

    return (
      <ViewShot ref={ref} options={{ format: "jpg", quality: 0.92 }}>
        <ImageBackground source={backgroundImage} style={styles.card} resizeMode="cover">
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.6)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            {/* 상단 배지 */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t("challengeCard.badge")}</Text>
            </View>

            {/* 중앙: 예측 내용 */}
            <View style={styles.center}>
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={styles.challengeText}>
                {t("challengeCard.todayHigh")}
              </Text>
              <Text style={styles.baseMax}>{baseMax}°</Text>
              <Text style={styles.challengeText}>
                {t("challengeCard.predicted1")}<Text style={styles.choiceHighlight}>{choiceLabel}</Text>{t("challengeCard.predicted2")}
              </Text>
              <Text style={styles.location}>{locationName}</Text>
            </View>

            {/* 하단: 도전 유도 */}
            <View style={styles.bottom}>
              <Text style={styles.ctaText}>{t("event.canYou")}</Text>
              <View style={styles.appBadge}>
                <Text style={styles.appBadgeText}>{t("challengeCard.appBadge")}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </ViewShot>
    );
  },
);

ChallengeCard.displayName = "ChallengeCard";

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 480,
    borderRadius: 24,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,158,11,0.25)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FCD34D",
  },
  center: {
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 30,
  },
  baseMax: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  choiceHighlight: {
    color: "#FCD34D",
  },
  location: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  bottom: {
    alignItems: "center",
    gap: 10,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  appBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  appBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
});
