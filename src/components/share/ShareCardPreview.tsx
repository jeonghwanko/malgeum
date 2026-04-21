import React, { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import ViewShot from "react-native-view-shot";
import type { TempUnit } from "@/types/settings";
import { formatTemp } from "@/utils/weather";
import { pickSoulMessage } from "@/services/microcopy";
import { getRandomPoetry } from "@/constants/poetryQuotes";

interface ShareCardPreviewProps {
  location: string;
  date: string;
  temp: number;
  condition: string;
  conditionKey?: string;
  tempUnit?: TempUnit;
  actionMessage: string;
  backgroundImage: any;
  showWatermark?: boolean;
  userMessage?: string;
}

export const ShareCardPreview = forwardRef<ViewShot, ShareCardPreviewProps>(
  ({ location, date, temp, condition, conditionKey, actionMessage, backgroundImage, showWatermark = true, tempUnit = "C", userMessage }, ref) => {
    const lonelyMsg = pickSoulMessage(conditionKey ?? "clear");
    const poetry = getRandomPoetry();
    return (
      <ViewShot ref={ref} options={{ format: "png", quality: 1 }}>
        <ImageBackground
          source={backgroundImage}
          style={styles.card}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.02)", "rgba(0,0,0,0.5)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            {/* 사용자 메시지 오버레이 */}
            {userMessage ? (
              <View style={styles.userMsgOverlay} pointerEvents="none">
                <Text style={styles.userMsgText} maxFontSizeMultiplier={1.0}>{userMessage}</Text>
              </View>
            ) : null}

            {/* 좌상단: 시 */}
            <View style={styles.poetryWrap}>
              <Text style={styles.poetryText}>{poetry.text}</Text>
              <Text style={styles.poetryCredit}>— {poetry.poet}, 〈{poetry.poem}〉</Text>
            </View>

            {/* 하단: 날씨 + 뱃지 */}
            <View style={styles.bottom}>
              <Text style={styles.city}>{location} · {date}</Text>
              <View style={styles.tempRow}>
                <Text style={styles.temp}>{formatTemp(temp, tempUnit)}</Text>
                <Text style={styles.cond}>{condition}</Text>
              </View>
              <Text style={styles.action}>{actionMessage}</Text>
              <View style={styles.lonelyBadge}>
                <Text style={styles.lonelyText}>{lonelyMsg}</Text>
              </View>
              {showWatermark && (
                <Text style={styles.watermark}>☀️ 맑음 Malgeum</Text>
              )}
            </View>
          </View>
        </ImageBackground>
      </ViewShot>
    );
  }
);

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
  },
  poetryWrap: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255,255,255,0.3)",
    paddingLeft: 12,
    paddingVertical: 4,
  },
  poetryText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
    lineHeight: 19,
  },
  poetryCredit: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
  },
  bottom: {},
  city: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginBottom: 4,
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 8,
  },
  temp: {
    fontSize: 44,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -2,
    lineHeight: 48,
  },
  cond: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  action: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
    lineHeight: 22,
  },
  lonelyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  lonelyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  watermark: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  userMsgOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  userMsgText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    lineHeight: 28,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
