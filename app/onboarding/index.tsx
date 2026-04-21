import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, Dimensions, Pressable, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { logOnboardingStep } from "@/services/analytics";
import { t } from "@/i18n";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BG_IMAGE = require("../../assets/malgeum/A/A01-sunny-day.jpg");

/* ── Floating light orb ── */
function FloatingOrb({
  size,
  top,
  left,
  delay,
  duration,
  color,
}: {
  size: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}) {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.5, 1], [0.08, 0.3, 0.08]),
    transform: [
      { translateY: interpolate(phase.value, [0, 1], [-20, 20]) },
      { translateX: interpolate(phase.value, [0, 1], [-15, 15]) },
      { scale: interpolate(phase.value, [0, 0.5, 1], [0.85, 1.15, 0.85]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        orbStyle,
      ]}
    />
  );
}

/* ── Typing question loop ── */
const TYPING_QUESTION_KEYS = [
  "onboarding.typingQ1",
  "onboarding.typingQ2",
  "onboarding.typingQ3",
] as const;

function TypingQuestions() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"typing" | "erasing">("typing");
  const cursor = useSharedValue(1);

  // Cursor blink
  useEffect(() => {
    cursor.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500, easing: Easing.ease }),
        withTiming(1, { duration: 500, easing: Easing.ease }),
      ),
      -1,
      false,
    );
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: cursor.value }));

  useEffect(() => {
    const q = t(TYPING_QUESTION_KEYS[idx]);
    let timeout: ReturnType<typeof setTimeout>;

    if (mode === "typing") {
      if (text.length < q.length) {
        timeout = setTimeout(() => setText(q.slice(0, text.length + 1)), 85);
      } else {
        // Full text reached → hold 1400ms then start erasing
        timeout = setTimeout(() => setMode("erasing"), 1400);
      }
    } else {
      // erasing
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 32);
      } else {
        // Empty → move to next question, back to typing (no timer needed)
        setIdx((i) => (i + 1) % TYPING_QUESTION_KEYS.length);
        setMode("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [text, mode, idx]);

  return (
    <View style={styles.typingRow}>
      <Text style={styles.typingText}>{text}</Text>
      <Animated.Text style={[styles.typingCursor, cursorStyle]}>|</Animated.Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Animation values ──
  const bgScale = useSharedValue(1.15);
  const bgOpacity = useSharedValue(0);
  const titleY = useSharedValue(40);
  const titleOpacity = useSharedValue(0);
  const subY = useSharedValue(30);
  const subOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(24);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    // 1) Background fade-in + slow zoom settle
    bgOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });
    bgScale.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) });

    // 2) Title slide up
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    titleY.value = withDelay(600, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // 3) Sub text
    subOpacity.value = withDelay(1100, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
    subY.value = withDelay(1100, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));

    // 4) Tagline
    taglineOpacity.value = withDelay(1600, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    taglineY.value = withDelay(1600, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 5) Button
    btnOpacity.value = withDelay(2100, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    btnY.value = withDelay(2100, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 6) Shimmer loop on button
    shimmer.value = withDelay(
      2800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  // ── Animated Styles ──
  const bgAnimStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: bgScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const btnContainerStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));

  const [btnWidth, setBtnWidth] = React.useState(300);
  const onBtnLayout = (e: LayoutChangeEvent) => setBtnWidth(e.nativeEvent.layout.width);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3,
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-btnWidth, btnWidth]) },
    ],
  }));

  // Background breathing (continuous slow zoom)
  const breathPhase = useSharedValue(0);
  useEffect(() => {
    breathPhase.value = withDelay(
      2000,
      withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathPhase.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <View style={styles.root}>
      {/* Background layer */}
      <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, breathStyle]}>
          <ImageBackground source={BG_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </Animated.View>
      </Animated.View>

      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(15,23,42,0.55)", "transparent", "rgba(15,23,42,0.7)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Floating orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FloatingOrb size={180} top={SCREEN_H * 0.08} left={-50} delay={0} duration={10000} color="rgba(116,185,255,0.3)" />
        <FloatingOrb size={140} top={SCREEN_H * 0.4} left={SCREEN_W * 0.6} delay={2000} duration={12000} color="rgba(255,224,102,0.2)" />
        <FloatingOrb size={120} top={SCREEN_H * 0.7} left={SCREEN_W * 0.15} delay={4000} duration={14000} color="rgba(74,144,217,0.25)" />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Center area — main message */}
        <View style={styles.center}>
          <Animated.Text style={[styles.title, titleStyle]}>
            {t("onboarding.heroTitle")}
          </Animated.Text>

          <Animated.View style={[styles.divider, subStyle]} />

          <Animated.View style={[styles.typingWrap, subStyle]}>
            <TypingQuestions />
            <Text style={styles.resolution}>{t("onboarding.heroSub")}</Text>
          </Animated.View>

          <Animated.View style={taglineStyle}>
            <View style={styles.taglinePill}>
              <Text style={styles.taglineText}>{t("onboarding.tagline")}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom area — OnboardingLayout과 동일한 슬롯 구조 */}
        <Animated.View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) + 16 }, btnContainerStyle]}>
          <View style={styles.headerSlot} />
          <View style={styles.buttonSlot}>
            <Pressable
              onPress={() => { logOnboardingStep("welcome_start"); router.replace("/onboarding/location"); }}
              style={({ pressed }) => [pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
                onLayout={onBtnLayout}
              >
                <Animated.View style={[styles.ctaShimmer, shimmerStyle]}>
                  <LinearGradient
                    colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <Text style={styles.ctaText}>{t("onboarding.start")}</Text>
              </LinearGradient>
            </Pressable>
          </View>
          <View style={styles.footerSlot}>
            <Text style={styles.footerText}>{t("onboarding.footerHint")}</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: -1,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    marginVertical: 20,
  },
  typingWrap: {
    alignItems: "center",
    marginBottom: 24,
    minHeight: 68,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    minHeight: 32,
  },
  typingText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  typingCursor: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(255,255,255,0.85)",
    marginLeft: 1,
  },
  resolution: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.2,
    marginTop: 14,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  taglinePill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  taglineText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bottom: {
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
  ctaGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    overflow: "hidden",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ctaPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  footerText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
