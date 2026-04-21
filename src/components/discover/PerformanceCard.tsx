import React, { memo, useCallback } from "react";
import { View, Text, ImageBackground, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarBlank } from "phosphor-react-native";
import { SocialRow } from "@/components/discover/SocialRow";
import type { PerformanceItem } from "@/services/performanceService";
import { formatPerfPeriod } from "@/services/performanceService";
import { setDetailCache } from "@/services/discoverSocialService";
import { toHttps, decodeEntities } from "@/utils/url";

interface Props {
  item: PerformanceItem;
  likeCount?: number;
  commentCount?: number;
}

export const PerformanceCard = memo(function PerformanceCard({ item, likeCount = 0, commentCount = 0 }: Props) {
  const router = useRouter();
  const period = formatPerfPeriod(item.startDate, item.endDate);
  const contentKey = `performance:${item.id}`;

  const handlePress = useCallback(() => {
    setDetailCache({
      contentKey,
      type: "performance",
      title: item.title,
      addr: "",
      image: item.poster,
      period,
      url: item.url,
      extra: { genre: item.genre, venue: item.venue },
    });
    router.push({ pathname: "/discover-detail" as never, params: { contentKey } });
  }, [contentKey, item, period, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={handlePress}
    >
      {item.poster ? (
        <ImageBackground
          source={{ uri: toHttps(item.poster)! }}
          style={styles.imageBg}
          resizeMode="cover"
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            locations={[0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.genre}</Text>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.imageBg, styles.placeholder]}>
          <Text style={{ fontSize: 36 }}>🎭</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{decodeEntities(item.title)}</Text>
        <Text style={styles.venue} numberOfLines={1}>{decodeEntities(item.venue)}</Text>
        {period ? (
          <View style={styles.metaItem}>
            <CalendarBlank size={12} color="rgba(255,255,255,0.45)" />
            <Text style={styles.meta}>{period}</Text>
          </View>
        ) : null}
        <SocialRow likeCount={likeCount} commentCount={commentCount} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  imageBg: {
    width: "100%",
    height: 200,
  },
  imageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholder: {
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  badgeRow: {
    flexDirection: "row",
    padding: 12,
  },
  badge: {
    backgroundColor: "rgba(139,92,246,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  info: {
    padding: 14,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  venue: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
});
