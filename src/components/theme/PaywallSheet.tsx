import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Palette } from "phosphor-react-native";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface PaywallSheetProps {
  onPurchase: () => void;
  onSkip: () => void;
}

export function PaywallSheet({ onPurchase, onSkip }: PaywallSheetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>맑음 프리미엄</Text>
      <Text style={styles.title}>나만의 날씨 화면을 완성하세요</Text>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <Palette size={14} color="#74B9FF" />
          <Text style={styles.featureText}>프리미엄 아트 테마 8종 잠금 해제</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureEmoji}>📱</Text>
          <Text style={styles.featureText}>위젯도 아트 테마 적용</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureEmoji}>💬</Text>
          <Text style={styles.featureText}>AI 맑음이 하루 100회 대화</Text>
        </View>
      </View>

      <Text style={styles.price}>
        <Text style={styles.priceHighlight}>월 3,300원</Text>
      </Text>

      <PrimaryButton label="7일 무료 체험 시작하기" onPress={onPurchase} style={styles.btn} />

      <Pressable onPress={onSkip}>
        <Text style={styles.skip}>나중에 할게요</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 4,
  },
  features: {
    alignSelf: "flex-start",
    marginVertical: 14,
    gap: 6,
    maxWidth: 240,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureEmoji: {
    fontSize: 14,
  },
  featureText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  price: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
  },
  priceHighlight: {
    color: "#74B9FF",
    fontWeight: "600",
  },
  btn: {
    width: "100%",
    marginBottom: 8,
  },
  skip: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    padding: 6,
  },
});
