import type { AllArtStyleKey } from "@/types/settings";
import type { TextureWeatherKey } from "@/types/weather";

export interface ThemePalette {
  gradientColors: [string, string, string];
  cardTint: string;
  cardBorder: string;
  animationTint: string;
}

// ── 무료 7종 ──

const vangogh: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,200,37,0.25)", "rgba(44,87,164,0.20)", "rgba(168,216,234,0.35)"],
    cardTint: "rgba(255,200,37,0.08)",
    cardBorder: "rgba(255,200,37,0.20)",
    animationTint: "rgba(255,224,102,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(25,42,86,0.50)", "rgba(55,71,113,0.40)", "rgba(100,116,150,0.45)"],
    cardTint: "rgba(44,87,164,0.10)",
    cardBorder: "rgba(44,87,164,0.20)",
    animationTint: "rgba(150,170,220,0.35)",
  },
  cloudy: {
    gradientColors: ["rgba(55,71,113,0.35)", "rgba(100,116,150,0.25)", "rgba(170,185,210,0.30)"],
    cardTint: "rgba(55,71,113,0.08)",
    cardBorder: "rgba(100,116,150,0.18)",
    animationTint: "rgba(170,185,210,0.20)",
  },
  snowy: {
    gradientColors: ["rgba(180,200,230,0.30)", "rgba(210,220,240,0.25)", "rgba(240,245,255,0.40)"],
    cardTint: "rgba(180,200,230,0.08)",
    cardBorder: "rgba(180,200,230,0.20)",
    animationTint: "rgba(220,230,255,0.30)",
  },
  stormy: {
    gradientColors: ["rgba(75,40,110,0.50)", "rgba(45,55,80,0.45)", "rgba(120,140,50,0.25)"],
    cardTint: "rgba(75,40,110,0.10)",
    cardBorder: "rgba(75,40,110,0.20)",
    animationTint: "rgba(140,130,180,0.30)",
  },
  dusty: {
    gradientColors: ["rgba(130,100,60,0.40)", "rgba(160,130,80,0.30)", "rgba(200,170,110,0.35)"],
    cardTint: "rgba(130,100,60,0.08)",
    cardBorder: "rgba(160,130,80,0.18)",
    animationTint: "rgba(200,170,110,0.20)",
  },
};

const monet: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(210,170,200,0.18)", "rgba(180,170,220,0.15)", "rgba(240,220,180,0.25)"],
    cardTint: "rgba(210,170,200,0.06)",
    cardBorder: "rgba(210,170,200,0.15)",
    animationTint: "rgba(255,220,180,0.20)",
  },
  rainy: {
    gradientColors: ["rgba(140,160,150,0.30)", "rgba(170,180,190,0.25)", "rgba(200,210,215,0.35)"],
    cardTint: "rgba(140,160,150,0.06)",
    cardBorder: "rgba(170,180,190,0.15)",
    animationTint: "rgba(190,200,210,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(175,170,185,0.22)", "rgba(195,190,200,0.18)", "rgba(220,215,225,0.28)"],
    cardTint: "rgba(175,170,185,0.06)",
    cardBorder: "rgba(195,190,200,0.15)",
    animationTint: "rgba(200,195,210,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(210,210,225,0.22)", "rgba(225,225,235,0.18)", "rgba(245,245,250,0.30)"],
    cardTint: "rgba(210,210,225,0.06)",
    cardBorder: "rgba(225,225,235,0.15)",
    animationTint: "rgba(235,235,245,0.25)",
  },
  stormy: {
    gradientColors: ["rgba(80,75,95,0.40)", "rgba(110,105,120,0.35)", "rgba(150,145,160,0.38)"],
    cardTint: "rgba(80,75,95,0.08)",
    cardBorder: "rgba(110,105,120,0.18)",
    animationTint: "rgba(150,145,170,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(170,150,120,0.28)", "rgba(190,175,145,0.22)", "rgba(215,200,170,0.30)"],
    cardTint: "rgba(170,150,120,0.06)",
    cardBorder: "rgba(190,175,145,0.15)",
    animationTint: "rgba(200,185,155,0.18)",
  },
};

const klimt: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(200,160,40,0.28)", "rgba(180,130,50,0.22)", "rgba(220,185,100,0.32)"],
    cardTint: "rgba(200,160,40,0.08)",
    cardBorder: "rgba(200,160,40,0.22)",
    animationTint: "rgba(255,210,80,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(100,130,80,0.35)", "rgba(130,150,100,0.28)", "rgba(170,160,90,0.32)"],
    cardTint: "rgba(100,130,80,0.08)",
    cardBorder: "rgba(130,150,100,0.18)",
    animationTint: "rgba(150,170,120,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(160,140,80,0.28)", "rgba(180,160,100,0.22)", "rgba(200,185,120,0.30)"],
    cardTint: "rgba(160,140,80,0.06)",
    cardBorder: "rgba(180,160,100,0.18)",
    animationTint: "rgba(190,175,110,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(200,190,160,0.25)", "rgba(220,210,180,0.20)", "rgba(240,235,210,0.32)"],
    cardTint: "rgba(200,190,160,0.06)",
    cardBorder: "rgba(220,210,180,0.15)",
    animationTint: "rgba(230,225,200,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(90,50,100,0.42)", "rgba(110,70,90,0.35)", "rgba(160,130,60,0.30)"],
    cardTint: "rgba(90,50,100,0.08)",
    cardBorder: "rgba(110,70,90,0.18)",
    animationTint: "rgba(170,140,80,0.22)",
  },
  dusty: {
    gradientColors: ["rgba(160,120,50,0.35)", "rgba(185,150,75,0.28)", "rgba(210,180,110,0.32)"],
    cardTint: "rgba(160,120,50,0.06)",
    cardBorder: "rgba(185,150,75,0.15)",
    animationTint: "rgba(200,170,100,0.18)",
  },
};

const gauguin: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(235,100,70,0.25)", "rgba(240,180,60,0.20)", "rgba(250,210,120,0.30)"],
    cardTint: "rgba(235,100,70,0.08)",
    cardBorder: "rgba(235,100,70,0.20)",
    animationTint: "rgba(255,180,80,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(20,100,100,0.40)", "rgba(40,120,90,0.32)", "rgba(80,150,110,0.35)"],
    cardTint: "rgba(20,100,100,0.08)",
    cardBorder: "rgba(40,120,90,0.18)",
    animationTint: "rgba(60,140,110,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(100,120,90,0.30)", "rgba(130,140,110,0.25)", "rgba(170,165,135,0.32)"],
    cardTint: "rgba(100,120,90,0.06)",
    cardBorder: "rgba(130,140,110,0.18)",
    animationTint: "rgba(150,155,125,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(200,210,200,0.25)", "rgba(220,225,215,0.20)", "rgba(240,240,235,0.32)"],
    cardTint: "rgba(200,210,200,0.06)",
    cardBorder: "rgba(220,225,215,0.15)",
    animationTint: "rgba(230,235,225,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(140,50,30,0.45)", "rgba(100,60,40,0.38)", "rgba(70,50,35,0.40)"],
    cardTint: "rgba(140,50,30,0.08)",
    cardBorder: "rgba(100,60,40,0.18)",
    animationTint: "rgba(160,80,50,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(150,100,50,0.35)", "rgba(175,130,70,0.28)", "rgba(200,165,100,0.32)"],
    cardTint: "rgba(150,100,50,0.06)",
    cardBorder: "rgba(175,130,70,0.15)",
    animationTint: "rgba(190,155,90,0.18)",
  },
};

const popart: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,230,0,0.22)", "rgba(255,50,120,0.18)", "rgba(255,240,180,0.28)"],
    cardTint: "rgba(255,230,0,0.08)",
    cardBorder: "rgba(255,50,120,0.20)",
    animationTint: "rgba(255,230,50,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(0,180,220,0.35)", "rgba(20,20,30,0.30)", "rgba(60,60,80,0.38)"],
    cardTint: "rgba(0,180,220,0.08)",
    cardBorder: "rgba(0,180,220,0.20)",
    animationTint: "rgba(0,200,240,0.30)",
  },
  cloudy: {
    gradientColors: ["rgba(120,120,130,0.28)", "rgba(150,150,160,0.22)", "rgba(190,190,200,0.30)"],
    cardTint: "rgba(120,120,130,0.06)",
    cardBorder: "rgba(150,150,160,0.18)",
    animationTint: "rgba(170,170,180,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(230,230,240,0.25)", "rgba(240,200,220,0.20)", "rgba(250,245,250,0.32)"],
    cardTint: "rgba(230,230,240,0.06)",
    cardBorder: "rgba(240,200,220,0.15)",
    animationTint: "rgba(240,220,235,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(200,0,120,0.40)", "rgba(60,0,200,0.35)", "rgba(30,30,50,0.42)"],
    cardTint: "rgba(200,0,120,0.08)",
    cardBorder: "rgba(60,0,200,0.18)",
    animationTint: "rgba(180,50,200,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(200,150,50,0.30)", "rgba(220,180,80,0.25)", "rgba(240,210,120,0.32)"],
    cardTint: "rgba(200,150,50,0.06)",
    cardBorder: "rgba(220,180,80,0.15)",
    animationTint: "rgba(230,195,100,0.18)",
  },
};

const bauhaus: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(220,40,30,0.18)", "rgba(255,200,0,0.15)", "rgba(0,90,170,0.20)"],
    cardTint: "rgba(255,200,0,0.06)",
    cardBorder: "rgba(220,40,30,0.15)",
    animationTint: "rgba(255,210,50,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(0,90,170,0.35)", "rgba(80,80,80,0.28)", "rgba(150,150,155,0.32)"],
    cardTint: "rgba(0,90,170,0.06)",
    cardBorder: "rgba(0,90,170,0.18)",
    animationTint: "rgba(80,130,200,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(100,100,105,0.28)", "rgba(140,140,145,0.22)", "rgba(185,185,190,0.28)"],
    cardTint: "rgba(100,100,105,0.06)",
    cardBorder: "rgba(140,140,145,0.15)",
    animationTint: "rgba(160,160,165,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(200,200,210,0.22)", "rgba(220,220,228,0.18)", "rgba(245,245,250,0.28)"],
    cardTint: "rgba(200,200,210,0.06)",
    cardBorder: "rgba(220,220,228,0.15)",
    animationTint: "rgba(230,230,240,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(30,30,35,0.45)", "rgba(60,60,65,0.38)", "rgba(100,100,110,0.40)"],
    cardTint: "rgba(30,30,35,0.08)",
    cardBorder: "rgba(60,60,65,0.18)",
    animationTint: "rgba(80,80,100,0.22)",
  },
  dusty: {
    gradientColors: ["rgba(160,130,60,0.30)", "rgba(185,155,80,0.25)", "rgba(210,185,110,0.30)"],
    cardTint: "rgba(160,130,60,0.06)",
    cardBorder: "rgba(185,155,80,0.15)",
    animationTint: "rgba(200,175,100,0.18)",
  },
};

const ukiyo: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(55,48,107,0.22)", "rgba(240,230,210,0.15)", "rgba(190,50,38,0.18)"],
    cardTint: "rgba(55,48,107,0.06)",
    cardBorder: "rgba(190,50,38,0.18)",
    animationTint: "rgba(220,170,80,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(50,60,80,0.38)", "rgba(100,120,150,0.30)", "rgba(160,175,195,0.35)"],
    cardTint: "rgba(50,60,80,0.06)",
    cardBorder: "rgba(100,120,150,0.18)",
    animationTint: "rgba(140,160,190,0.28)",
  },
  cloudy: {
    gradientColors: ["rgba(80,80,95,0.28)", "rgba(120,120,135,0.22)", "rgba(170,170,180,0.28)"],
    cardTint: "rgba(80,80,95,0.06)",
    cardBorder: "rgba(120,120,135,0.15)",
    animationTint: "rgba(150,150,165,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(230,230,235,0.22)", "rgba(240,240,243,0.18)", "rgba(250,250,252,0.28)"],
    cardTint: "rgba(230,230,235,0.06)",
    cardBorder: "rgba(240,240,243,0.15)",
    animationTint: "rgba(240,240,248,0.25)",
  },
  stormy: {
    gradientColors: ["rgba(30,30,50,0.48)", "rgba(55,48,80,0.40)", "rgba(80,70,100,0.42)"],
    cardTint: "rgba(30,30,50,0.08)",
    cardBorder: "rgba(55,48,80,0.18)",
    animationTint: "rgba(70,60,100,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(140,110,60,0.32)", "rgba(170,140,85,0.26)", "rgba(200,175,115,0.30)"],
    cardTint: "rgba(140,110,60,0.06)",
    cardBorder: "rgba(170,140,85,0.15)",
    animationTint: "rgba(190,165,105,0.18)",
  },
};

// ── 프리미엄 8종 ──

const mucha: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(120,140,60,0.22)", "rgba(200,170,80,0.18)", "rgba(170,130,160,0.25)"],
    cardTint: "rgba(200,170,80,0.08)",
    cardBorder: "rgba(120,140,60,0.18)",
    animationTint: "rgba(220,195,100,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(80,90,80,0.35)", "rgba(110,120,100,0.28)", "rgba(150,145,130,0.32)"],
    cardTint: "rgba(80,90,80,0.06)",
    cardBorder: "rgba(110,120,100,0.18)",
    animationTint: "rgba(130,135,115,0.22)",
  },
  cloudy: {
    gradientColors: ["rgba(130,125,110,0.28)", "rgba(160,155,140,0.22)", "rgba(190,185,170,0.28)"],
    cardTint: "rgba(130,125,110,0.06)",
    cardBorder: "rgba(160,155,140,0.15)",
    animationTint: "rgba(175,170,155,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(215,215,210,0.22)", "rgba(230,228,222,0.18)", "rgba(245,244,240,0.28)"],
    cardTint: "rgba(215,215,210,0.06)",
    cardBorder: "rgba(230,228,222,0.15)",
    animationTint: "rgba(238,236,230,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(60,50,65,0.45)", "rgba(85,75,80,0.38)", "rgba(120,100,90,0.40)"],
    cardTint: "rgba(60,50,65,0.08)",
    cardBorder: "rgba(85,75,80,0.18)",
    animationTint: "rgba(100,90,85,0.22)",
  },
  dusty: {
    gradientColors: ["rgba(150,120,60,0.32)", "rgba(175,148,80,0.26)", "rgba(200,180,115,0.30)"],
    cardTint: "rgba(150,120,60,0.06)",
    cardBorder: "rgba(175,148,80,0.15)",
    animationTint: "rgba(190,168,100,0.18)",
  },
};

const synthwave: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,50,150,0.25)", "rgba(0,220,255,0.20)", "rgba(130,0,220,0.28)"],
    cardTint: "rgba(255,50,150,0.08)",
    cardBorder: "rgba(0,220,255,0.22)",
    animationTint: "rgba(255,100,200,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(20,10,40,0.50)", "rgba(60,20,100,0.42)", "rgba(0,150,200,0.35)"],
    cardTint: "rgba(60,20,100,0.10)",
    cardBorder: "rgba(0,150,200,0.22)",
    animationTint: "rgba(0,180,240,0.30)",
  },
  cloudy: {
    gradientColors: ["rgba(40,20,60,0.38)", "rgba(80,50,100,0.30)", "rgba(130,100,150,0.32)"],
    cardTint: "rgba(40,20,60,0.08)",
    cardBorder: "rgba(80,50,100,0.18)",
    animationTint: "rgba(110,80,140,0.22)",
  },
  snowy: {
    gradientColors: ["rgba(150,100,200,0.22)", "rgba(180,150,220,0.18)", "rgba(220,200,240,0.28)"],
    cardTint: "rgba(150,100,200,0.06)",
    cardBorder: "rgba(180,150,220,0.18)",
    animationTint: "rgba(200,170,235,0.25)",
  },
  stormy: {
    gradientColors: ["rgba(15,5,30,0.55)", "rgba(50,10,80,0.48)", "rgba(100,0,60,0.42)"],
    cardTint: "rgba(50,10,80,0.10)",
    cardBorder: "rgba(100,0,60,0.22)",
    animationTint: "rgba(180,0,120,0.28)",
  },
  dusty: {
    gradientColors: ["rgba(100,60,30,0.35)", "rgba(140,80,50,0.28)", "rgba(180,100,70,0.32)"],
    cardTint: "rgba(100,60,30,0.06)",
    cardBorder: "rgba(140,80,50,0.18)",
    animationTint: "rgba(160,90,60,0.20)",
  },
};

const neoexpress: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(220,40,30,0.22)", "rgba(0,60,200,0.18)", "rgba(255,210,0,0.25)"],
    cardTint: "rgba(255,210,0,0.08)",
    cardBorder: "rgba(220,40,30,0.22)",
    animationTint: "rgba(255,220,50,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(20,20,40,0.48)", "rgba(0,40,150,0.38)", "rgba(60,60,80,0.42)"],
    cardTint: "rgba(0,40,150,0.08)",
    cardBorder: "rgba(0,40,150,0.22)",
    animationTint: "rgba(50,80,180,0.28)",
  },
  cloudy: {
    gradientColors: ["rgba(60,60,65,0.35)", "rgba(100,100,110,0.28)", "rgba(150,150,155,0.32)"],
    cardTint: "rgba(60,60,65,0.06)",
    cardBorder: "rgba(100,100,110,0.18)",
    animationTint: "rgba(130,130,140,0.20)",
  },
  snowy: {
    gradientColors: ["rgba(210,210,220,0.25)", "rgba(230,230,235,0.20)", "rgba(248,248,252,0.30)"],
    cardTint: "rgba(210,210,220,0.06)",
    cardBorder: "rgba(230,230,235,0.15)",
    animationTint: "rgba(240,240,248,0.25)",
  },
  stormy: {
    gradientColors: ["rgba(10,10,15,0.55)", "rgba(40,20,20,0.48)", "rgba(80,30,30,0.42)"],
    cardTint: "rgba(40,20,20,0.10)",
    cardBorder: "rgba(80,30,30,0.22)",
    animationTint: "rgba(150,40,40,0.28)",
  },
  dusty: {
    gradientColors: ["rgba(140,100,40,0.35)", "rgba(170,130,60,0.28)", "rgba(200,165,90,0.32)"],
    cardTint: "rgba(140,100,40,0.06)",
    cardBorder: "rgba(170,130,60,0.18)",
    animationTint: "rgba(190,155,80,0.20)",
  },
};

const poolside: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(0,190,190,0.22)", "rgba(255,120,90,0.18)", "rgba(180,220,60,0.25)"],
    cardTint: "rgba(0,190,190,0.08)",
    cardBorder: "rgba(255,120,90,0.20)",
    animationTint: "rgba(255,200,100,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(80,140,160,0.35)", "rgba(110,160,175,0.28)", "rgba(150,185,195,0.32)"],
    cardTint: "rgba(80,140,160,0.06)",
    cardBorder: "rgba(110,160,175,0.18)",
    animationTint: "rgba(130,170,190,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(130,150,155,0.28)", "rgba(160,175,178,0.22)", "rgba(195,205,208,0.28)"],
    cardTint: "rgba(130,150,155,0.06)",
    cardBorder: "rgba(160,175,178,0.15)",
    animationTint: "rgba(180,192,195,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(210,225,230,0.22)", "rgba(228,235,238,0.18)", "rgba(245,248,250,0.28)"],
    cardTint: "rgba(210,225,230,0.06)",
    cardBorder: "rgba(228,235,238,0.15)",
    animationTint: "rgba(238,242,246,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(40,60,70,0.45)", "rgba(70,90,100,0.38)", "rgba(110,130,140,0.40)"],
    cardTint: "rgba(40,60,70,0.08)",
    cardBorder: "rgba(70,90,100,0.18)",
    animationTint: "rgba(90,115,125,0.22)",
  },
  dusty: {
    gradientColors: ["rgba(160,130,70,0.32)", "rgba(185,158,92,0.26)", "rgba(210,190,120,0.30)"],
    cardTint: "rgba(160,130,70,0.06)",
    cardBorder: "rgba(185,158,92,0.15)",
    animationTint: "rgba(200,178,110,0.18)",
  },
};

const risograph: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,50,130,0.20)", "rgba(0,180,170,0.15)", "rgba(255,200,50,0.22)"],
    cardTint: "rgba(255,50,130,0.06)",
    cardBorder: "rgba(0,180,170,0.18)",
    animationTint: "rgba(255,180,80,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(0,120,130,0.38)", "rgba(50,50,70,0.30)", "rgba(100,100,120,0.35)"],
    cardTint: "rgba(0,120,130,0.08)",
    cardBorder: "rgba(0,120,130,0.20)",
    animationTint: "rgba(0,150,160,0.28)",
  },
  cloudy: {
    gradientColors: ["rgba(100,90,110,0.28)", "rgba(140,130,148,0.22)", "rgba(180,175,185,0.28)"],
    cardTint: "rgba(100,90,110,0.06)",
    cardBorder: "rgba(140,130,148,0.15)",
    animationTint: "rgba(160,155,168,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(220,215,228,0.22)", "rgba(235,232,240,0.18)", "rgba(248,246,252,0.28)"],
    cardTint: "rgba(220,215,228,0.06)",
    cardBorder: "rgba(235,232,240,0.15)",
    animationTint: "rgba(242,240,248,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(30,20,40,0.48)", "rgba(60,30,70,0.40)", "rgba(100,50,90,0.42)"],
    cardTint: "rgba(30,20,40,0.08)",
    cardBorder: "rgba(60,30,70,0.20)",
    animationTint: "rgba(120,50,100,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(150,110,50,0.32)", "rgba(178,138,72,0.26)", "rgba(205,172,100,0.30)"],
    cardTint: "rgba(150,110,50,0.06)",
    cardBorder: "rgba(178,138,72,0.15)",
    animationTint: "rgba(195,160,90,0.18)",
  },
};

const dblexposure: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(40,60,100,0.22)", "rgba(80,100,140,0.18)", "rgba(160,180,210,0.25)"],
    cardTint: "rgba(40,60,100,0.06)",
    cardBorder: "rgba(80,100,140,0.18)",
    animationTint: "rgba(140,165,200,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(20,30,55,0.48)", "rgba(40,55,85,0.40)", "rgba(75,95,130,0.42)"],
    cardTint: "rgba(20,30,55,0.08)",
    cardBorder: "rgba(40,55,85,0.20)",
    animationTint: "rgba(60,80,120,0.28)",
  },
  cloudy: {
    gradientColors: ["rgba(60,65,80,0.32)", "rgba(95,100,115,0.26)", "rgba(140,145,158,0.30)"],
    cardTint: "rgba(60,65,80,0.06)",
    cardBorder: "rgba(95,100,115,0.15)",
    animationTint: "rgba(120,125,140,0.20)",
  },
  snowy: {
    gradientColors: ["rgba(190,195,210,0.22)", "rgba(215,218,228,0.18)", "rgba(240,242,248,0.28)"],
    cardTint: "rgba(190,195,210,0.06)",
    cardBorder: "rgba(215,218,228,0.15)",
    animationTint: "rgba(228,230,240,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(10,12,25,0.55)", "rgba(25,30,50,0.48)", "rgba(50,55,75,0.45)"],
    cardTint: "rgba(10,12,25,0.10)",
    cardBorder: "rgba(25,30,50,0.22)",
    animationTint: "rgba(40,45,70,0.28)",
  },
  dusty: {
    gradientColors: ["rgba(120,95,55,0.35)", "rgba(150,125,78,0.28)", "rgba(182,160,110,0.32)"],
    cardTint: "rgba(120,95,55,0.06)",
    cardBorder: "rgba(150,125,78,0.15)",
    animationTint: "rgba(168,148,100,0.18)",
  },
};

const streetpop: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,180,200,0.20)", "rgba(130,200,255,0.18)", "rgba(255,230,180,0.25)"],
    cardTint: "rgba(255,180,200,0.06)",
    cardBorder: "rgba(130,200,255,0.18)",
    animationTint: "rgba(255,210,150,0.22)",
  },
  rainy: {
    gradientColors: ["rgba(80,90,120,0.38)", "rgba(110,120,150,0.30)", "rgba(150,160,180,0.35)"],
    cardTint: "rgba(80,90,120,0.06)",
    cardBorder: "rgba(110,120,150,0.18)",
    animationTint: "rgba(130,140,170,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(140,140,155,0.28)", "rgba(170,170,182,0.22)", "rgba(200,200,210,0.28)"],
    cardTint: "rgba(140,140,155,0.06)",
    cardBorder: "rgba(170,170,182,0.15)",
    animationTint: "rgba(185,185,198,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(220,215,230,0.22)", "rgba(235,232,242,0.18)", "rgba(248,246,252,0.28)"],
    cardTint: "rgba(220,215,230,0.06)",
    cardBorder: "rgba(235,232,242,0.15)",
    animationTint: "rgba(240,238,248,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(50,40,60,0.45)", "rgba(80,65,90,0.38)", "rgba(120,100,130,0.40)"],
    cardTint: "rgba(50,40,60,0.08)",
    cardBorder: "rgba(80,65,90,0.18)",
    animationTint: "rgba(100,85,115,0.22)",
  },
  dusty: {
    gradientColors: ["rgba(155,125,65,0.32)", "rgba(180,155,88,0.26)", "rgba(208,185,118,0.30)"],
    cardTint: "rgba(155,125,65,0.06)",
    cardBorder: "rgba(180,155,88,0.15)",
    animationTint: "rgba(195,175,105,0.18)",
  },
};

const louiswain: Record<TextureWeatherKey, ThemePalette> = {
  sunny: {
    gradientColors: ["rgba(255,140,60,0.22)", "rgba(100,200,100,0.18)", "rgba(200,100,220,0.25)"],
    cardTint: "rgba(255,140,60,0.08)",
    cardBorder: "rgba(100,200,100,0.20)",
    animationTint: "rgba(255,180,80,0.25)",
  },
  rainy: {
    gradientColors: ["rgba(50,80,120,0.38)", "rgba(80,110,150,0.30)", "rgba(120,150,180,0.35)"],
    cardTint: "rgba(50,80,120,0.06)",
    cardBorder: "rgba(80,110,150,0.18)",
    animationTint: "rgba(100,130,170,0.25)",
  },
  cloudy: {
    gradientColors: ["rgba(110,100,120,0.28)", "rgba(145,138,152,0.22)", "rgba(182,178,188,0.28)"],
    cardTint: "rgba(110,100,120,0.06)",
    cardBorder: "rgba(145,138,152,0.15)",
    animationTint: "rgba(165,160,175,0.18)",
  },
  snowy: {
    gradientColors: ["rgba(215,220,230,0.22)", "rgba(232,235,240,0.18)", "rgba(248,249,252,0.28)"],
    cardTint: "rgba(215,220,230,0.06)",
    cardBorder: "rgba(232,235,240,0.15)",
    animationTint: "rgba(242,244,250,0.22)",
  },
  stormy: {
    gradientColors: ["rgba(40,25,55,0.48)", "rgba(70,45,80,0.40)", "rgba(110,70,100,0.42)"],
    cardTint: "rgba(40,25,55,0.08)",
    cardBorder: "rgba(70,45,80,0.18)",
    animationTint: "rgba(130,70,110,0.25)",
  },
  dusty: {
    gradientColors: ["rgba(145,115,55,0.32)", "rgba(172,142,78,0.26)", "rgba(200,175,108,0.30)"],
    cardTint: "rgba(145,115,55,0.06)",
    cardBorder: "rgba(172,142,78,0.15)",
    animationTint: "rgba(188,165,95,0.18)",
  },
};

// ── 팔레트 맵 ──

const THEME_PALETTES: Partial<Record<AllArtStyleKey, Record<TextureWeatherKey, ThemePalette>>> = {
  vangogh,
  monet,
  klimt,
  gauguin,
  popart,
  bauhaus,
  ukiyo,
  mucha,
  synthwave,
  neoexpress,
  poolside,
  risograph,
  dblexposure,
  streetpop,
  louiswain,
};

export function getThemePalette(
  artStyle: AllArtStyleKey,
  textureKey: TextureWeatherKey,
): ThemePalette | null {
  return THEME_PALETTES[artStyle]?.[textureKey] ?? null;
}
