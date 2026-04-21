import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { MapPin, Star } from "phosphor-react-native";
import type { RecommendationItem } from "@/services/recommendationApi";
import { t } from "@/i18n";

interface Props {
  item: RecommendationItem;
  onPress?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  festival: "🎪",
  camping: "⛺",
  performance: "🎭",
};

export function RecommendationHero({ item, onPress }: Props) {
  const typeEmoji = TYPE_LABEL[item.type] ?? "📍";
  const distLabel = `${item.distKm.toFixed(1)}km`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderEmoji}>{typeEmoji}</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.badges}>
          <View style={styles.typeBadge}>
            <Star size={12} weight="fill" color="#FCD34D" />
            <Text style={styles.typeBadgeText}>{t("discover.featuredTitle")}</Text>
          </View>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <MapPin size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.metaText}>{item.region}</Text>
            <Text style={styles.distBadge}>{distLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    height: 180,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 48 },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  badges: {
    flexDirection: "row",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,158,11,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.5)",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FCD34D",
  },
  bottom: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  distBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
