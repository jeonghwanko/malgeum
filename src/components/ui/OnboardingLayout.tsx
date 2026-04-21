import React from "react";
import { View, StyleSheet, ImageBackground, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { getTextureSource } from "@/components/weather/WeatherBackground";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  /** 주 CTA 버튼 슬롯 — 항상 같은 위치에 고정 (54px 예약). null 허용 (로딩 등) */
  bottom: React.ReactNode;
  /** 버튼 위 부가 요소 (페이지 도트·진행 표시 등) — 없어도 40px 예약 */
  header?: React.ReactNode;
  /** 버튼 아래 부가 요소 (나중에 링크·보조 CTA 등) — 없어도 40px 예약 */
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const GRADIENT_COLORS: [string, string, ...string[]] = ["#0C1929", "#1A3A5C", COLORS.primary];

export function OnboardingLayout({ children, bottom, header, footer, style }: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, style]}>
      {/* 기본 텍스처 blur 배경 (고정) */}
      <ImageBackground
        source={getTextureSource("default", "sunny")}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.bgImage}
        blurRadius={40}
      />
      {/* 다크 스크림 + 그라데이션 오버레이 */}
      <LinearGradient colors={GRADIENT_COLORS} style={[StyleSheet.absoluteFill, styles.scrim]} />

      <View style={[styles.top, { paddingTop: insets.top + 80 }]}>{children}</View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <View style={styles.headerSlot}>{header}</View>
        <View style={styles.buttonSlot}>{bottom}</View>
        <View style={styles.footerSlot}>{footer}</View>
      </View>
    </View>
  );
}

export const onboardingStyles = StyleSheet.create({
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(74,144,217,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 35,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 260,
  },
  btn: {
    width: "100%",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1929",
  },
  bgImage: {
    resizeMode: "cover",
    opacity: 0.5,
  },
  scrim: {
    opacity: 0.75,
  },
  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 28,
  },
  bottom: {
    width: "100%",
    paddingHorizontal: 28,
  },
  headerSlot: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSlot: {
    minHeight: 54,
    justifyContent: "center",
  },
  footerSlot: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
