import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import ViewShot from "react-native-view-shot";
import { formatTemp } from "@/utils/weather";
import type { TempUnit } from "@/types/settings";
import type { EmotionalTheme, MusicRec, ArtworkRec } from "@/constants/emotionalThemes";

interface EmotionalCardPreviewProps {
  location: string;
  date: string;
  temp: number;
  tempUnit?: TempUnit;
  condition: string;
  backgroundImage: any;
  theme: EmotionalTheme;
  message: string;
  music: MusicRec;
  artwork: ArtworkRec;
  showWatermark?: boolean;
  userMessage?: string;
}

export const EmotionalCardPreview = forwardRef<ViewShot, EmotionalCardPreviewProps>(
  (
    {
      location,
      date,
      temp,
      tempUnit = "C",
      condition,
      backgroundImage,
      theme,
      message,
      music,
      artwork,
      showWatermark = true,
      userMessage,
    },
    ref,
  ) => {
    return (
      <ViewShot ref={ref} options={{ format: "jpg", quality: 0.95 }}>
        <ImageBackground source={backgroundImage} style={styles.card} resizeMode="cover">
          {/* 상단 어둠 + 하단 어둠, 중간 살짝 투명 */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.72)",
              "rgba(0,0,0,0.18)",
              "rgba(0,0,0,0.10)",
              "rgba(0,0,0,0.60)",
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            {/* ── TOP: 감정 배지 + 낭만 문구 + 사용자 한 마디 ── */}
            <View style={styles.top}>
              <View style={styles.emotionBadge}>
                <Text style={styles.emotionText}>{theme.emotion}</Text>
              </View>
              <Text style={styles.message}>{message}</Text>
              {userMessage ? (
                <Text style={styles.userMsgText} maxFontSizeMultiplier={1.0}>"{userMessage}"</Text>
              ) : null}
            </View>

            {/* ── MID: 음악 + 그림 ── */}
            <View style={styles.mid}>
              <View style={styles.recsCard}>
                <View style={styles.recRow}>
                  <Text style={styles.recIcon}>🎵</Text>
                  <View style={styles.recTexts}>
                    <Text style={styles.recTitle} maxFontSizeMultiplier={1.0} numberOfLines={1}>
                      {music.title}
                    </Text>
                    <Text style={styles.recSub} maxFontSizeMultiplier={1.0} numberOfLines={1}>
                      {music.artist}
                    </Text>
                  </View>
                  {music.url && <Text style={styles.recLink}>▶</Text>}
                </View>

                <View style={styles.recDivider} />

                <View style={styles.recRow}>
                  <Text style={styles.recIcon}>🎨</Text>
                  <View style={styles.recTexts}>
                    <Text style={styles.recTitle} maxFontSizeMultiplier={1.0} numberOfLines={1}>
                      {artwork.title}
                    </Text>
                    <Text style={styles.recSub} maxFontSizeMultiplier={1.0} numberOfLines={1}>
                      {artwork.artist}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── BOTTOM: 날씨 + 워터마크 ── */}
            <View style={styles.bottom}>
              <Text style={styles.locationDate} maxFontSizeMultiplier={1.0}>
                {location} · {date}
              </Text>
              <View style={styles.tempRow}>
                <Text style={styles.temp} maxFontSizeMultiplier={1.0}>
                  {formatTemp(temp, tempUnit)}
                </Text>
                <Text style={styles.cond} maxFontSizeMultiplier={1.0}>
                  {condition}
                </Text>
              </View>
              {showWatermark && (
                <Text style={styles.watermark} maxFontSizeMultiplier={1.0}>
                  ☀️ 맑음 Malgeum
                </Text>
              )}
            </View>
          </View>
        </ImageBackground>
      </ViewShot>
    );
  },
);

EmotionalCardPreview.displayName = "EmotionalCardPreview";

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 832 / 1216,
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: "space-between",
  },

  // ── TOP ──
  top: {
    gap: 16,
  },
  emotionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  emotionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 36,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // ── MID ──
  mid: {
    alignItems: "center",
  },
  recsCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 0,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  recDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 4,
  },
  recIcon: {
    fontSize: 20,
    width: 26,
    textAlign: "center",
  },
  recTexts: {
    flex: 1,
    gap: 2,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  recSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  recLink: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 4,
  },

  // ── BOTTOM ──
  bottom: {
    gap: 4,
  },
  locationDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  temp: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -2,
    lineHeight: 42,
  },
  cond: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  watermark: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    marginTop: 4,
  },
  userMsgText: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
