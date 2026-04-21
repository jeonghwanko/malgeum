import React, { useState, useEffect, useRef, useMemo } from "react";
import { ImageBackground, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { ImageSourcePropType } from "react-native";
import type { WeatherCondition } from "@/types/weather";
import type { AllArtStyleKey } from "@/types/settings";
import { getWeatherGradient } from "@/constants/gradients";
import { mapConditionToTexture } from "@/utils/weather";
import { getTimeOfDay } from "@/utils/date";
import { useTheme } from "@/context/ThemeContext";
import { usePaletteCommit } from "@/context/PaletteContext";
import { useBreathingScale } from "./effects/BreathingBackground";
import { TopScrim } from "./TopScrim";
import { getAdaptivePalette, type AdaptivePalette } from "@/constants/adaptivePalette";

// 기본 텍스처
const BASE_TEXTURES: Record<string, ImageSourcePropType> = {
  sunny: require("../../../assets/malgeum/A/A01-sunny-day.jpg"),
  rainy: require("../../../assets/malgeum/A/A06-rainy.jpg"),
  cloudy: require("../../../assets/malgeum/A/A05-cloudy.jpg"),
  snowy: require("../../../assets/malgeum/A/A08-snowy.jpg"),
  stormy: require("../../../assets/malgeum/A/A07-thunderstorm.jpg"),
  dusty: require("../../../assets/malgeum/A/A10-fine-dust.jpg"),
  dawn: require("../../../assets/malgeum/A/A03-dawn.jpg"),
};

// 아트 테마 텍스처 (날씨별)
const ART_TEXTURES: Partial<Record<AllArtStyleKey, Record<string, ImageSourcePropType>>> = {
  bauhaus: {
    sunny: require("../../../assets/textures/art/bauhaus/sunny.jpg"),
    rainy: require("../../../assets/textures/art/bauhaus/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/bauhaus/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/bauhaus/snowy.jpg"),
    stormy: require("../../../assets/textures/art/bauhaus/stormy.jpg"),
    dusty: require("../../../assets/textures/art/bauhaus/dusty.jpg"),
  },
  vangogh: {
    sunny: require("../../../assets/textures/art/vangogh/sunny.jpg"),
    rainy: require("../../../assets/textures/art/vangogh/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/vangogh/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/vangogh/snowy.jpg"),
    stormy: require("../../../assets/textures/art/vangogh/stormy.jpg"),
    dusty: require("../../../assets/textures/art/vangogh/dusty.jpg"),
  },
  monet: {
    sunny: require("../../../assets/textures/art/monet/sunny.jpg"),
    rainy: require("../../../assets/textures/art/monet/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/monet/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/monet/snowy.jpg"),
    stormy: require("../../../assets/textures/art/monet/stormy.jpg"),
    dusty: require("../../../assets/textures/art/monet/dusty.jpg"),
  },
  klimt: {
    sunny: require("../../../assets/textures/art/klimt/sunny.jpg"),
    rainy: require("../../../assets/textures/art/klimt/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/klimt/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/klimt/snowy.jpg"),
    stormy: require("../../../assets/textures/art/klimt/stormy.jpg"),
    dusty: require("../../../assets/textures/art/klimt/dusty.jpg"),
  },
  gauguin: {
    sunny: require("../../../assets/textures/art/gauguin/sunny.jpg"),
    rainy: require("../../../assets/textures/art/gauguin/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/gauguin/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/gauguin/snowy.jpg"),
    stormy: require("../../../assets/textures/art/gauguin/stormy.jpg"),
    dusty: require("../../../assets/textures/art/gauguin/dusty.jpg"),
  },
  popart: {
    sunny: require("../../../assets/textures/art/popart/sunny.jpg"),
    rainy: require("../../../assets/textures/art/popart/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/popart/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/popart/snowy.jpg"),
    stormy: require("../../../assets/textures/art/popart/stormy.jpg"),
    dusty: require("../../../assets/textures/art/popart/dusty.jpg"),
  },
  ukiyo: {
    sunny: require("../../../assets/textures/art/ukiyo/sunny.jpg"),
    rainy: require("../../../assets/textures/art/ukiyo/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/ukiyo/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/ukiyo/snowy.jpg"),
    stormy: require("../../../assets/textures/art/ukiyo/stormy.jpg"),
    dusty: require("../../../assets/textures/art/ukiyo/dusty.jpg"),
  },
  // ── 프리미엄 8종 ──
  mucha: {
    sunny: require("../../../assets/textures/art/mucha/sunny.jpg"),
    rainy: require("../../../assets/textures/art/mucha/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/mucha/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/mucha/snowy.jpg"),
    stormy: require("../../../assets/textures/art/mucha/stormy.jpg"),
    dusty: require("../../../assets/textures/art/mucha/dusty.jpg"),
  },
  synthwave: {
    sunny: require("../../../assets/textures/art/synthwave/sunny.jpg"),
    rainy: require("../../../assets/textures/art/synthwave/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/synthwave/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/synthwave/snowy.jpg"),
    stormy: require("../../../assets/textures/art/synthwave/stormy.jpg"),
    dusty: require("../../../assets/textures/art/synthwave/dusty.jpg"),
  },
  neoexpress: {
    sunny: require("../../../assets/textures/art/neoexpress/sunny.jpg"),
    rainy: require("../../../assets/textures/art/neoexpress/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/neoexpress/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/neoexpress/snowy.jpg"),
    stormy: require("../../../assets/textures/art/neoexpress/stormy.jpg"),
    dusty: require("../../../assets/textures/art/neoexpress/dusty.jpg"),
  },
  poolside: {
    sunny: require("../../../assets/textures/art/poolside/sunny.jpg"),
    rainy: require("../../../assets/textures/art/poolside/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/poolside/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/poolside/snowy.jpg"),
    stormy: require("../../../assets/textures/art/poolside/stormy.jpg"),
    dusty: require("../../../assets/textures/art/poolside/dusty.jpg"),
  },
  risograph: {
    sunny: require("../../../assets/textures/art/risograph/sunny.jpg"),
    rainy: require("../../../assets/textures/art/risograph/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/risograph/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/risograph/snowy.jpg"),
    stormy: require("../../../assets/textures/art/risograph/stormy.jpg"),
    dusty: require("../../../assets/textures/art/risograph/dusty.jpg"),
  },
  dblexposure: {
    sunny: require("../../../assets/textures/art/dblexposure/sunny.jpg"),
    rainy: require("../../../assets/textures/art/dblexposure/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/dblexposure/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/dblexposure/snowy.jpg"),
    stormy: require("../../../assets/textures/art/dblexposure/stormy.jpg"),
    dusty: require("../../../assets/textures/art/dblexposure/dusty.jpg"),
  },
  streetpop: {
    sunny: require("../../../assets/textures/art/streetpop/sunny.jpg"),
    rainy: require("../../../assets/textures/art/streetpop/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/streetpop/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/streetpop/snowy.jpg"),
    stormy: require("../../../assets/textures/art/streetpop/stormy.jpg"),
    dusty: require("../../../assets/textures/art/streetpop/dusty.jpg"),
  },
  louiswain: {
    sunny: require("../../../assets/textures/art/louiswain/sunny.jpg"),
    rainy: require("../../../assets/textures/art/louiswain/rainy.jpg"),
    cloudy: require("../../../assets/textures/art/louiswain/cloudy.jpg"),
    snowy: require("../../../assets/textures/art/louiswain/snowy.jpg"),
    stormy: require("../../../assets/textures/art/louiswain/stormy.jpg"),
    dusty: require("../../../assets/textures/art/louiswain/dusty.jpg"),
  },
};

/** artStyle + textureKey 조합으로 올바른 텍스처 이미지 반환 (공유 카드 등 외부 사용) */
export function getTextureSource(artStyle: AllArtStyleKey, textureKey: string): ImageSourcePropType {
  return ART_TEXTURES[artStyle]?.[textureKey] ?? BASE_TEXTURES[textureKey] ?? BASE_TEXTURES.sunny;
}

interface WeatherBackgroundProps {
  condition: WeatherCondition;
  isNight?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollY?: SharedValue<number>;
  onPalette?: (palette: AdaptivePalette) => void;
  sideGradient?: boolean;
}

const CROSSFADE_DURATION = 600; // ms

export function WeatherBackground({
  condition,
  isNight = false,
  children,
  style,
  scrollY,
  onPalette,
  sideGradient = true,
}: WeatherBackgroundProps) {
  const { artStyle } = useTheme();
  const textureKey = mapConditionToTexture(condition);
  const timeOfDay = getTimeOfDay();
  const gradient = useMemo(() => getWeatherGradient(condition, timeOfDay, artStyle), [condition, timeOfDay, artStyle]);

  const artTextures = ART_TEXTURES[artStyle];
  const image = artTextures?.[textureKey] ?? BASE_TEXTURES[textureKey] ?? BASE_TEXTURES.sunny;

  const nextAdaptive = useMemo(() => getAdaptivePalette(artStyle, textureKey), [artStyle, textureKey]);
  const breathingStyle = useBreathingScale(scrollY);
  const commitPalette = usePaletteCommit();

  // ── 크로스페이드 (항상 2레이어 마운트 — 조건부 마운트/언마운트 깜빡임 방지) ──
  type BgLayer = { image: ImageSourcePropType; gradient: typeof gradient; adaptive: typeof nextAdaptive };
  const initLayer: BgLayer = { image, gradient, adaptive: nextAdaptive };

  const [layerA, setLayerA] = useState<BgLayer>(initLayer);
  const [layerB, setLayerB] = useState<BgLayer>(initLayer);
  const showB = useSharedValue(0); // 0 = A 표시, 1 = B 표시
  const [activeIsB, setActiveIsB] = useState(false);
  const prevKeyRef = useRef(`${artStyle}-${textureKey}`);
  const commitRef = useRef(commitPalette);
  commitRef.current = commitPalette;

  useEffect(() => {
    const key = `${artStyle}-${textureKey}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    const target: BgLayer = { image, gradient, adaptive: nextAdaptive };

    cancelAnimation(showB);
    if (activeIsB) {
      setLayerA(target);
      showB.value = withTiming(0, { duration: CROSSFADE_DURATION }, (finished) => {
        if (!finished) return;
        runOnJS(setActiveIsB)(false);
        runOnJS(onCommitPalette)();
      });
    } else {
      setLayerB(target);
      showB.value = withTiming(1, { duration: CROSSFADE_DURATION }, (finished) => {
        if (!finished) return;
        runOnJS(setActiveIsB)(true);
        runOnJS(onCommitPalette)();
      });
    }
  }, [artStyle, textureKey, image, gradient, nextAdaptive, showB, activeIsB]);

  function onCommitPalette() {
    commitRef.current?.();
  }

  const layerBStyle = useAnimatedStyle(() => ({
    opacity: showB.value,
  }));
  // ─────────────────────────────────────────────────────────────────────────

  const adaptive = activeIsB ? layerB.adaptive : layerA.adaptive;
  useEffect(() => {
    onPalette?.(adaptive);
  }, [adaptive, onPalette]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.breathingWrapper, breathingStyle]} pointerEvents="none">
        {/* 레이어 A — 항상 마운트 */}
        <ImageBackground source={layerA.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={layerA.gradient.colors} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <TopScrim startOpacity={layerA.adaptive.topScrimStart} scrimOpacity={layerA.adaptive.scrimOpacity} scrimTint={layerA.adaptive.scrimTint} />

        {/* 레이어 B — 항상 마운트, opacity로만 전환 */}
        <Animated.View style={[StyleSheet.absoluteFillObject, layerBStyle]} pointerEvents="none">
          <ImageBackground source={layerB.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={layerB.gradient.colors} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <TopScrim startOpacity={layerB.adaptive.topScrimStart} scrimOpacity={layerB.adaptive.scrimOpacity} scrimTint={layerB.adaptive.scrimTint} />
        </Animated.View>
      </Animated.View>
      {sideGradient && (
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.15)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  breathingWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
});
