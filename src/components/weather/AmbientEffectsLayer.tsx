import React from "react";
import { View, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { WeatherCondition } from "@/types/weather";
import { WEATHER_EFFECTS } from "@/constants/weatherEffects";
import { LightningFlash } from "./effects/LightningFlash";

interface AmbientEffectsLayerProps {
  condition: WeatherCondition;
  scrollY: SharedValue<number>;
  animationTint?: string;
  isDark?: boolean;
}

export function AmbientEffectsLayer({ condition, scrollY, animationTint, isDark }: AmbientEffectsLayerProps) {
  const config = WEATHER_EFFECTS[condition];
  const AmbientComponent = config.ambient;

  return (
    <View style={styles.container} pointerEvents="none">
      <AmbientComponent
        scrollY={scrollY}
        tint={animationTint}
        intensity={config.ambientIntensity}
        isDark={isDark}
      />
      {config.flashEnabled && <LightningFlash />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});
