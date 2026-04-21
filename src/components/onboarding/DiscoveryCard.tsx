import React, { useEffect, useMemo, useState, type ComponentType } from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import { mapConditionToTexture } from "@/utils/weather";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { MapPin, type IconProps } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { formatTemp } from "@/utils/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import type { TempUnit } from "@/types/settings";
import type { WeatherCondition } from "@/types/weather";

interface DiscoveryCardProps {
  locationName: string;                          // e.g., "서울 강남구"
  temp: number;
  condition: WeatherCondition;
  conditionLabel: string;                        // e.g., "흐림"
  TeaserIcon: ComponentType<IconProps>;          // flat phosphor icon component
  teaserText: string;                            // e.g., "오늘은 가디건 어때요?"
  tempUnit: TempUnit;
}

export function DiscoveryCard({
  locationName,
  temp,
  condition,
  conditionLabel,
  TeaserIcon,
  teaserText,
  tempUnit,
}: DiscoveryCardProps) {
  // ── Progressive location name (split by space) ──
  const parts = useMemo(
    () => locationName.split(" ").filter(Boolean),
    [locationName],
  );
  const [locationStep, setLocationStep] = useState(0);

  useEffect(() => {
    if (locationStep >= parts.length) return;
    const delay = locationStep === 0 ? 550 : 380;
    const timeout = setTimeout(() => setLocationStep((prev) => prev + 1), delay);
    return () => clearTimeout(timeout);
  }, [locationStep, parts.length]);

  const displayedLocation = parts.slice(0, locationStep).join(" ");
  const allRevealed = locationStep >= parts.length;

  // ── Pin drop animation ──
  const pinY = useSharedValue(-72);
  const pinScale = useSharedValue(0.5);
  const pinOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    pinOpacity.value = withTiming(1, { duration: 240 });
    pinY.value = withSpring(0, { damping: 7, stiffness: 120, mass: 0.9 });
    pinScale.value = withSpring(1, { damping: 8, stiffness: 140 });
    // Landing ring burst (fires after pin lands)
    ringOpacity.value = withSequence(
      withTiming(0, { duration: 520 }),
      withTiming(0.6, { duration: 0 }),
      withTiming(0, { duration: 600 }),
    );
    ringScale.value = withSequence(
      withTiming(0, { duration: 520 }),
      withTiming(0.4, { duration: 0 }),
      withTiming(1.8, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [{ translateY: pinY.value }, { scale: pinScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  // ── Hint arrow pulse ──
  const hintY = useSharedValue(0);
  useEffect(() => {
    if (!allRevealed) return;
    hintY.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [allRevealed]);

  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hintY.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Pin drop + landing ring */}
      <View style={styles.pinContainer}>
        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
        <Animated.View style={[styles.pinWrap, pinStyle]}>
          <MapPin size={38} weight="fill" color={COLORS.primaryLight} />
        </Animated.View>
      </View>

      {/* "찾았어요!" label */}
      <Animated.Text entering={FadeIn.delay(380).duration(400)} style={styles.foundLabel}>
        찾았어요!
      </Animated.Text>

      {/* Progressive location name */}
      <Text style={styles.locationText} numberOfLines={2}>
        {displayedLocation || " "}
      </Text>

      {/* Weather + teaser card (appears after location fully typed) */}
      {allRevealed && (
        <Animated.View entering={FadeInDown.delay(180).duration(520)} style={styles.card}>
          <ImageBackground
            source={getTextureSource("default", mapConditionToTexture(condition))}
            style={styles.cardBg}
            imageStyle={styles.cardBgImage}
            blurRadius={40}
          >
            <View style={styles.cardScrim} />
          </ImageBackground>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherEmoji}>{getConditionEmoji(condition)}</Text>
            <View style={styles.tempBlock}>
              <Text style={styles.temp} maxFontSizeMultiplier={1.0}>
                {formatTemp(temp, tempUnit)}
              </Text>
              <Text style={styles.conditionLabel}>{conditionLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.teaserRow}>
            <View style={styles.teaserIconWrap}>
              <TeaserIcon size={22} weight="duotone" color={COLORS.primaryLight} />
            </View>
            <Text style={styles.teaserText} numberOfLines={2}>{teaserText}</Text>
          </View>
        </Animated.View>
      )}

      {/* Hint for next step */}
      {allRevealed && (
        <Animated.View entering={FadeIn.delay(900).duration(500)} style={[styles.hintRow, hintStyle]}>
          <Text style={styles.hint}>아직 더 있어요  ↓</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    width: "100%",
  },
  pinContainer: {
    width: 120,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pinWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74,144,217,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  foundLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryLight,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 30,
    minHeight: 62,   // 2 lines reserved so long addresses don't push layout
    marginBottom: 18,
    paddingHorizontal: 8,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  card: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 22,
    overflow: "hidden",
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBgImage: {
    resizeMode: "cover",
    opacity: 0.6,
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  weatherEmoji: {
    fontSize: 46,
  },
  tempBlock: {
    flex: 1,
  },
  temp: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 16,
  },
  teaserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teaserIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(74,144,217,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  teaserText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  hintRow: {
    marginTop: 22,
  },
  hint: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.3,
  },
});
