import type { WeatherCondition } from "@/types/weather";
import type { ComponentType } from "react";

import { GlassRaindrops } from "@/components/weather/effects/GlassRaindrops";
import { SunLensFlare } from "@/components/weather/effects/SunLensFlare";
import { DriftingShadow } from "@/components/weather/effects/DriftingShadow";
import { SnowParticles } from "@/components/weather/effects/SnowParticles";
import { FogLayers } from "@/components/weather/effects/FogLayers";
import { DustHaze } from "@/components/weather/effects/DustHaze";

export interface EffectConfig {
  ambient: ComponentType<any>;
  ambientIntensity: "low" | "medium" | "high";
  scrollParallaxRate: number;
  flashEnabled: boolean;
  fogClearing: boolean;
}

export const WEATHER_EFFECTS: Record<WeatherCondition, EffectConfig> = {
  clear:        { ambient: SunLensFlare,   ambientIntensity: "medium", scrollParallaxRate: 0.3, flashEnabled: false, fogClearing: false },
  clouds:       { ambient: DriftingShadow, ambientIntensity: "low",    scrollParallaxRate: 0.2, flashEnabled: false, fogClearing: false },
  rain:         { ambient: GlassRaindrops, ambientIntensity: "medium", scrollParallaxRate: 0.4, flashEnabled: false, fogClearing: false },
  drizzle:      { ambient: GlassRaindrops, ambientIntensity: "low",    scrollParallaxRate: 0.3, flashEnabled: false, fogClearing: false },
  thunderstorm: { ambient: GlassRaindrops, ambientIntensity: "high",   scrollParallaxRate: 0.5, flashEnabled: true,  fogClearing: false },
  snow:         { ambient: SnowParticles,  ambientIntensity: "medium", scrollParallaxRate: 0.15, flashEnabled: false, fogClearing: false },
  fog:          { ambient: FogLayers,      ambientIntensity: "high",   scrollParallaxRate: 0.1, flashEnabled: false, fogClearing: true  },
  dust:         { ambient: DustHaze,       ambientIntensity: "medium", scrollParallaxRate: 0.2, flashEnabled: false, fogClearing: false },
};
