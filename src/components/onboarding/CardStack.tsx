import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions, ImageBackground } from "react-native";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import { mapConditionToTexture } from "@/utils/weather";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getActionIcon } from "@/constants/actionIcons";
import { getStatusColor } from "@/constants/colors";
import type { ActionCard } from "@/types/actions";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

export interface CardStackHandle {
  dismiss: () => void;
}

interface CardStackProps {
  cards: ActionCard[];
  currentIndex: number;
  onNext: () => void;
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  function CardStack({ cards, currentIndex, onNext }, ref) {
    const [showHint, setShowHint] = useState(true);
    const translateX = useSharedValue(0);
    const isAnimating = useSharedValue(false);
    const hintX = useSharedValue(0);

    const advanceCard = useCallback(() => {
      translateX.value = 0;
      isAnimating.value = false;
      setShowHint(false);
      onNext();
    }, [onNext]);

    const dismissCard = useCallback(() => {
      if (isAnimating.value) return;
      isAnimating.value = true;
      translateX.value = withTiming(
        -SCREEN_W * 1.3,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(advanceCard)();
          }
        },
      );
    }, [advanceCard]);

    useImperativeHandle(ref, () => ({ dismiss: dismissCard }), [dismissCard]);

    // 스와이프 힌트: 첫 카드에서만 좌우로 흔들리는 애니메이션
    useEffect(() => {
      if (!showHint) return;
      const timer = setTimeout(() => {
        hintX.value = withRepeat(
          withSequence(
            withTiming(-18, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(8, { duration: 300, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) }),
          ),
          2,
          false,
        );
      }, 800);
      return () => clearTimeout(timer);
    }, [showHint]);

    const resetCard = useCallback(() => {
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, []);

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetX([-10, 10])
          .failOffsetY([-20, 20])
          .onUpdate((e) => {
            if (isAnimating.value) return;
            translateX.value = e.translationX;
          })
          .onEnd((e) => {
            if (isAnimating.value) return;
            if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
              runOnJS(dismissCard)();
            } else {
              runOnJS(resetCard)();
            }
          }),
      [dismissCard, resetCard],
    );

    const currentCard = cards[currentIndex];
    const hasNext = currentIndex + 1 < cards.length;

    return (
      <View style={styles.root}>
        <Text style={styles.label}>오늘의 추천</Text>

        <View style={styles.stackArea}>
          {hasNext && <BackCard offset={1} />}
          {currentCard && (
            <GestureDetector key={currentCard.id} gesture={panGesture}>
              <TopCard card={currentCard} translateX={translateX} hintX={showHint ? hintX : undefined} />
            </GestureDetector>
          )}
        </View>

        {showHint && (
          <Animated.Text
            entering={FadeIn.delay(900).duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.swipeHint}
          >
            ← 밀어서 다음 카드
          </Animated.Text>
        )}
      </View>
    );
  },
);

/* ── Top (draggable) card ── */
function TopCard({
  card,
  translateX,
  hintX,
}: {
  card: ActionCard;
  translateX: SharedValue<number>;
  hintX?: SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => {
    const tx = translateX.value + (hintX?.value ?? 0);
    return {
      transform: [
        { translateX: tx },
        { rotate: `${interpolate(tx, [-SCREEN_W, 0, SCREEN_W], [-15, 0, 15])}deg` },
      ],
      opacity: interpolate(
        Math.abs(translateX.value),
        [0, SCREEN_W * 0.8],
        [1, 0.3],
        "clamp",
      ),
    };
  });

  return (
    <Animated.View style={[styles.card, styles.cardTop, animStyle]}>
      <CardContent card={card} />
    </Animated.View>
  );
}

/* ── Back (static, scaled down) card — no content, just a shape ── */
function BackCard({ offset }: { offset: number }) {
  return (
    <View
      style={[
        styles.card,
        styles.cardBack,
        {
          transform: [{ scale: 1 - offset * 0.05 }, { translateY: offset * 10 }],
          opacity: 1 - offset * 0.15,
        },
      ]}
    />
  );
}

/* ── Shared card content ── */
function CardContent({ card }: { card: ActionCard }) {
  const Icon = getActionIcon(card.icon);
  const statusColor = getStatusColor(card.status);
  const textureKey = mapConditionToTexture(card.condition ?? "clear");

  return (
    <>
      <ImageBackground
        source={getTextureSource("default", textureKey)}
        style={styles.cardBg}
        imageStyle={styles.cardBgImage}
        blurRadius={40}
      >
        <View style={styles.cardScrim} />
      </ImageBackground>
      <View style={styles.cardTopRow}>
        <View style={styles.iconWrap}>
          <Icon size={38} weight="duotone" color="#FFFFFF" />
        </View>
        {card.badge && (
          <View style={[styles.badge, { borderColor: statusColor }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
            <Text style={styles.badgeText}>{card.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  stackArea: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 24,
    justifyContent: "center",
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
  cardTop: {
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardBack: {
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(74,144,217,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
  },
  swipeHint: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
    marginTop: 14,
  },
});
