import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LockSimple } from "phosphor-react-native";
import type { ArtTheme } from "@/constants/themes";

interface ThemeCardProps {
  theme: ArtTheme;
  isActive: boolean;
  onPress: () => void;
}

export function ThemeCard({ theme, isActive, onPress }: ThemeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={theme.preview} style={styles.image} />

      {/* 하단 그라데이션 + 테마명 */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        locations={[0.3, 1]}
        style={styles.gradient}
      >
        <Text style={styles.name} numberOfLines={1}>{theme.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{theme.artist}</Text>
      </LinearGradient>

      {/* 사용 중 뱃지 */}
      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>사용 중</Text>
        </View>
      )}

      {/* 잠금 아이콘 */}
      {!theme.isFree && !isActive && (
        <View style={styles.lock}>
          <LockSimple size={14} weight="fill" color="rgba(255,255,255,0.55)" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 3 / 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: "50%",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 1,
  },
  artist: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  activeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(74,144,217,0.85)",
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  lock: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});
