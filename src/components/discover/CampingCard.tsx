import React, { memo, useCallback } from "react";
import { View, Text, ImageBackground, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin } from "phosphor-react-native";
import { SocialRow } from "@/components/discover/SocialRow";
import type { CampingItem } from "@/services/campingService";
import { shortCampAddr } from "@/services/campingService";
import { setDetailCache } from "@/services/discoverSocialService";
import { toHttps } from "@/utils/url";

interface Props {
  item: CampingItem;
  likeCount?: number;
  commentCount?: number;
}

export const CampingCard = memo(function CampingCard({ item, likeCount = 0, commentCount = 0 }: Props) {
  const router = useRouter();
  const addr = shortCampAddr(item.addr);
  const contentKey = `camping:${item.name}`;

  const handlePress = useCallback(() => {
    setDetailCache({
      contentKey,
      type: "camping",
      title: item.name,
      addr: item.addr,
      image: item.image,
      url: item.reserveUrl || item.homepage,
      extra: { type: item.type, environment: item.environment },
    });
    router.push({ pathname: "/discover-detail" as never, params: { contentKey } });
  }, [contentKey, item, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={handlePress}
    >
      {item.image ? (
        <ImageBackground
          source={{ uri: toHttps(item.image)! }}
          style={styles.imageBg}
          resizeMode="cover"
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            locations={[0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {item.type ? (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.type}</Text>
              </View>
            </View>
          ) : null}
        </ImageBackground>
      ) : (
        <View style={[styles.imageBg, styles.placeholder]}>
          <Text style={{ fontSize: 36 }}>⛺</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
        {addr ? (
          <View style={styles.metaItem}>
            <MapPin size={12} weight="fill" color="rgba(255,255,255,0.45)" />
            <Text style={styles.meta} numberOfLines={1}>{addr}</Text>
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
    backgroundColor: "rgba(34,197,94,0.85)",
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
