import React, { memo, useCallback } from "react";
import { View, Text, ImageBackground, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, CalendarBlank } from "phosphor-react-native";
import type { FestivalItem } from "@/services/festivalService";
import { formatFestivalPeriod, shortAddr } from "@/services/festivalService";
import { setDetailCache } from "@/services/discoverSocialService";
import { toHttps, decodeEntities } from "@/utils/url";
import { t } from "@/i18n";

interface Props {
  item: FestivalItem;
}

export const FeaturedCard = memo(function FeaturedCard({ item }: Props) {
  const router = useRouter();
  const period = formatFestivalPeriod(item.startDate, item.endDate);
  const addr = shortAddr(item.addr);
  const distLabel = item.dist ? `${(item.dist / 1000).toFixed(1)}km` : null;
  const contentKey = `festival:${item.title}`;

  const handlePress = useCallback(() => {
    setDetailCache({
      contentKey,
      type: "festival",
      title: item.title,
      addr: item.addr,
      image: item.image,
      period,
      url: item.url,
    });
    router.push({ pathname: "/discover-detail" as never, params: { contentKey } });
  }, [contentKey, item, period, router]);

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        onPress={handlePress}
      >
        <ImageBackground
          source={item.image ? { uri: toHttps(item.image)! } : require("../../../assets/images/splash.png")}
          style={styles.bg}
          resizeMode="cover"
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.88)"]}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t("discover.recommendedBadge")}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {decodeEntities(item.title)}
            </Text>
            <View style={styles.metaRow}>
              {addr ? (
                <View style={styles.metaItem}>
                  <MapPin size={13} weight="fill" color="rgba(255,255,255,0.6)" />
                  <Text style={styles.metaText}>
                    {addr}{distLabel ? ` · ${distLabel}` : ""}
                  </Text>
                </View>
              ) : null}
              {period ? (
                <View style={styles.metaItem}>
                  <CalendarBlank size={13} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.metaText}>{period}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  bg: {
    height: 240,
    justifyContent: "space-between",
    padding: 16,
  },
  imageStyle: {
    borderRadius: 16,
  },
  badgeRow: {
    flexDirection: "row",
  },
  badge: {
    backgroundColor: "rgba(99,102,241,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 30,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
});
