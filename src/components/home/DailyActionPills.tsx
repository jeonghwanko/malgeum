import React, { useState, useEffect, useRef } from "react";
import { View, Image, StyleSheet, Pressable } from "react-native";
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { ChatCircle } from "phosphor-react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePurchase } from "@/context/PurchaseContext";
import { usePalette } from "@/context/PaletteContext";
import { ART_THEMES } from "@/constants/themes";
import { getTextureSource } from "@/components/weather/WeatherBackground";
import type { TextureWeatherKey } from "@/types/weather";
import type { ArtTheme } from "@/constants/themes";

function pickRandomTheme(currentArt: string, isPremium: boolean, excludeId?: string): ArtTheme | null {
  const candidates = ART_THEMES.filter(
    (t) => t.id !== currentArt && t.id !== "default" && t.id !== excludeId && (t.isFree || isPremium),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

interface DailyActionPillsProps {
  onChatPress: () => void;
  topInset?: number;
  textureKey: TextureWeatherKey;
  chatHintTrigger?: number;
}

export const DailyActionPills = React.memo(function DailyActionPills({
  onChatPress,
  topInset = 0,
  textureKey,
  chatHintTrigger,
}: DailyActionPillsProps) {
  const { artStyle, setArtStyle } = useTheme();
  const { isPremium } = usePurchase();
  const ap = usePalette();

  const [pick, setPick] = useState(() => pickRandomTheme(artStyle, isPremium));
  const mountedRef = useRef(true);

  // 온보딩 채팅 닫힐 때 — 채팅 아이콘이 스프링으로 확대·축소
  const pulseScale = useSharedValue(1);
  const hintFirstRunRef = useRef(true);

  useEffect(() => {
    if (hintFirstRunRef.current) {
      hintFirstRunRef.current = false;
      return;
    }
    if (chatHintTrigger === undefined) return;
    pulseScale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 220, mass: 0.6 }),
      withSpring(1.0, { damping: 5, stiffness: 180, mass: 0.8 }),
    );
  }, [chatHintTrigger, pulseScale]);

  const chatPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // 유저가 FAB 테마를 선택했을 때만 새로 뽑기
  useEffect(() => {
    if (!mountedRef.current) {
      setPick((prev) => {
        if (prev && prev.id === artStyle) return pickRandomTheme(artStyle, isPremium, prev.id);
        return prev;
      });
    }
    mountedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artStyle, isPremium]);

  return (
    <View style={[styles.container, { top: topInset + 90 }]} pointerEvents="box-none">
      {pick && (
        <Animated.View entering={FadeInRight.duration(220).delay(60)}>
          <Pressable
            style={({ pressed }) => [
              styles.themeFab,
              ap && { borderColor: ap.cardBorder },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
            onPress={() => setArtStyle(pick.id)}
          >
            <Image
              source={getTextureSource(pick.id, textureKey)}
              style={styles.themeThumb}
            />
          </Pressable>
        </Animated.View>
      )}

      {/* 채팅 */}
      <Animated.View style={{ marginTop: 4 }} entering={FadeInRight.duration(220).delay(120)}>
        <Animated.View style={chatPulseStyle}>
          <Pressable
            style={({ pressed }) => [
              styles.chatFab,
              ap && { borderColor: ap.cardBorder, backgroundColor: ap.pillBg },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
            onPress={onChatPress}
          >
            <ChatCircle size={24} weight="regular" color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const THEME_SIZE = 40;
const ICON_SIZE = 44;
const CHAT_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    gap: 12,
    zIndex: 5,
  },
  themeFab: {
    width: THEME_SIZE,
    height: THEME_SIZE,
    borderRadius: THEME_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  iconFab: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatFab: {
    width: CHAT_SIZE,
    height: CHAT_SIZE,
    borderRadius: CHAT_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeThumb: {
    width: THEME_SIZE,
    height: THEME_SIZE,
    borderRadius: THEME_SIZE / 2,
  },
});
