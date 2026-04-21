import React, { useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { COLORS } from "@/constants/colors";
import { openAffiliateLink } from "@/utils/affiliate";
import { logMusinsaTap } from "@/services/analytics";
import type { ClothingCategory } from "@/constants/clothingItems";

interface Props {
  category: ClothingCategory;
}

const GAP = 12;
const SHEET_PADDING = 48; // ScreenSheet 내부 패딩 (좌24 + 우24)

/**
 * 옷차림 무드보드 — 카테고리별 3색 작은 썸네일.
 *
 * "오늘은 X예요" 단정형 타이틀 + 88×110 썸네일 3개를 한 줄 중앙 정렬로.
 * 한눈에 카테고리 + 색상 옵션을 파악할 수 있도록 함.
 */
export function ClothingMoodboard({ category }: Props) {
  const { width } = useWindowDimensions();
  const count = category.colors.length;
  const thumbW = Math.floor((width - SHEET_PADDING - GAP * (count - 1)) / count);
  const thumbH = Math.round(thumbW * 1.25);

  const handleTap = useCallback(
    (colorLabel: string) => {
      const query = `${category.label} ${colorLabel}`;
      logMusinsaTap("moodboard", query, category.key);
      openAffiliateLink(query);
    },
    [category],
  );

  if (!category.colors.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘은 {category.labelDeclarative}</Text>

      <View style={styles.row}>
        {category.colors.map((c) => (
          <Pressable
            key={c.key}
            style={({ pressed }) => [{ width: thumbW }, pressed && styles.itemPressed]}
            onPress={() => handleTap(c.label)}
          >
            <Image
              source={c.image}
              style={{ width: thumbW, height: thumbH, borderRadius: 10, backgroundColor: "#F1F5F9" }}
              resizeMode="cover"
              accessibilityLabel={`${category.label} ${c.label}`}
            />
            <Text
              style={styles.label}
              numberOfLines={1}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.shopHint}>탭해서 유니클로에서 구경하기</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    justifyContent: "center",
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  itemPressed: {
    opacity: 0.8,
  },
  shopHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
});
