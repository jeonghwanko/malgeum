import type { AllArtStyleKey } from "@/types/settings";

/**
 * 테마별 폰트 무드 + 카드 무드.
 * 카드는 투명 글라스 — 아트 배경이 비쳐 보이고, 텍스트는 밝은 색 + 그림자로 가독성 확보.
 */
export interface ThemeMood {
  // ── 히어로 온도 ──
  tempColor: string;
  tempShadowColor: string;
  descColor: string;
  rangeColor: string;

  // ── 카드 섹션 무드 ──
  cardGlassBg: string;          // 낮은 불투명도 (0.18~0.30)
  cardBorderColor: string;
  cardTextPrimary: string;      // 밝은 색 (아트 위에서 읽힘)
  cardTextSecondary: string;
  cardAccent: string;

  // ── 섹션 타이틀 ──
  sectionColor: string;

  // ── 타이포그래피 feel ──
  tempFontWeight: "700" | "800" | "900";
  tempLetterSpacing: number;
  cardFontWeight: "600" | "700" | "800";
}

// ─────────────────────────── 무료 7종 ───────────────────────────

const vangogh: ThemeMood = {
  tempColor: "#FFF8E1",
  tempShadowColor: "rgba(255,180,0,0.20)",
  descColor: "rgba(255,248,225,0.85)",
  rangeColor: "rgba(255,248,225,0.50)",
  cardGlassBg: "rgba(255,240,200,0.22)",
  cardBorderColor: "rgba(255,200,37,0.20)",
  cardTextPrimary: "#FFF8E1",
  cardTextSecondary: "rgba(255,248,225,0.65)",
  cardAccent: "#F9A825",
  sectionColor: "rgba(255,248,225,0.55)",
  tempFontWeight: "900",
  tempLetterSpacing: -2,
  cardFontWeight: "700",
};

const monet: ThemeMood = {
  tempColor: "#F3E5F5",
  tempShadowColor: "rgba(200,160,210,0.18)",
  descColor: "rgba(243,229,245,0.80)",
  rangeColor: "rgba(243,229,245,0.45)",
  cardGlassBg: "rgba(240,225,245,0.20)",
  cardBorderColor: "rgba(210,170,200,0.18)",
  cardTextPrimary: "#F3E5F5",
  cardTextSecondary: "rgba(243,229,245,0.60)",
  cardAccent: "#CE93D8",
  sectionColor: "rgba(243,229,245,0.50)",
  tempFontWeight: "700",
  tempLetterSpacing: -1,
  cardFontWeight: "600",
};

const klimt: ThemeMood = {
  tempColor: "#FFF9C4",
  tempShadowColor: "rgba(255,215,0,0.22)",
  descColor: "rgba(255,249,196,0.85)",
  rangeColor: "rgba(255,249,196,0.50)",
  cardGlassBg: "rgba(255,245,200,0.22)",
  cardBorderColor: "rgba(218,165,32,0.22)",
  cardTextPrimary: "#FFF9C4",
  cardTextSecondary: "rgba(255,249,196,0.60)",
  cardAccent: "#FFD700",
  sectionColor: "rgba(255,249,196,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -1.5,
  cardFontWeight: "700",
};

const gauguin: ThemeMood = {
  tempColor: "#FFE0B2",
  tempShadowColor: "rgba(255,120,50,0.18)",
  descColor: "rgba(255,224,178,0.85)",
  rangeColor: "rgba(255,224,178,0.50)",
  cardGlassBg: "rgba(255,200,150,0.20)",
  cardBorderColor: "rgba(230,120,50,0.18)",
  cardTextPrimary: "#FFE0B2",
  cardTextSecondary: "rgba(255,224,178,0.60)",
  cardAccent: "#FF7043",
  sectionColor: "rgba(255,224,178,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -1.5,
  cardFontWeight: "700",
};

const popart: ThemeMood = {
  tempColor: "#FFFFFF",
  tempShadowColor: "rgba(255,0,80,0.22)",
  descColor: "rgba(255,255,255,0.90)",
  rangeColor: "rgba(255,255,255,0.55)",
  cardGlassBg: "rgba(255,255,255,0.25)",
  cardBorderColor: "rgba(255,0,80,0.20)",
  cardTextPrimary: "#FFFFFF",
  cardTextSecondary: "rgba(255,255,255,0.65)",
  cardAccent: "#FF1744",
  sectionColor: "rgba(255,255,0,0.65)",
  tempFontWeight: "900",
  tempLetterSpacing: -3,
  cardFontWeight: "800",
};

const bauhaus: ThemeMood = {
  tempColor: "#FFFFFF",
  tempShadowColor: "rgba(0,0,0,0.12)",
  descColor: "rgba(255,255,255,0.82)",
  rangeColor: "rgba(255,255,255,0.48)",
  cardGlassBg: "rgba(255,255,255,0.22)",
  cardBorderColor: "rgba(255,255,255,0.12)",
  cardTextPrimary: "#FFFFFF",
  cardTextSecondary: "rgba(255,255,255,0.60)",
  cardAccent: "#E53935",
  sectionColor: "rgba(255,255,255,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -2,
  cardFontWeight: "700",
};

const ukiyo: ThemeMood = {
  tempColor: "#E8EAF6",
  tempShadowColor: "rgba(100,120,180,0.18)",
  descColor: "rgba(232,234,246,0.82)",
  rangeColor: "rgba(232,234,246,0.45)",
  cardGlassBg: "rgba(200,210,240,0.20)",
  cardBorderColor: "rgba(100,120,180,0.16)",
  cardTextPrimary: "#E8EAF6",
  cardTextSecondary: "rgba(232,234,246,0.60)",
  cardAccent: "#5C6BC0",
  sectionColor: "rgba(232,234,246,0.50)",
  tempFontWeight: "700",
  tempLetterSpacing: -1,
  cardFontWeight: "600",
};

// ─────────────────────────── 프리미엄 8종 ───────────────────────────

const mucha: ThemeMood = {
  tempColor: "#F1F8E9",
  tempShadowColor: "rgba(139,195,74,0.18)",
  descColor: "rgba(241,248,233,0.82)",
  rangeColor: "rgba(241,248,233,0.45)",
  cardGlassBg: "rgba(220,240,200,0.20)",
  cardBorderColor: "rgba(139,195,74,0.18)",
  cardTextPrimary: "#F1F8E9",
  cardTextSecondary: "rgba(241,248,233,0.60)",
  cardAccent: "#8BC34A",
  sectionColor: "rgba(241,248,233,0.50)",
  tempFontWeight: "700",
  tempLetterSpacing: -1,
  cardFontWeight: "600",
};

const synthwave: ThemeMood = {
  tempColor: "#F0F4FF",
  tempShadowColor: "rgba(0,220,255,0.30)",
  descColor: "rgba(200,220,255,0.85)",
  rangeColor: "rgba(200,220,255,0.50)",
  cardGlassBg: "rgba(20,10,40,0.30)",
  cardBorderColor: "rgba(0,220,255,0.25)",
  cardTextPrimary: "#E0F7FA",
  cardTextSecondary: "rgba(128,222,234,0.70)",
  cardAccent: "#FF4081",
  sectionColor: "rgba(0,220,255,0.60)",
  tempFontWeight: "900",
  tempLetterSpacing: -3,
  cardFontWeight: "800",
};

const neoexpress: ThemeMood = {
  tempColor: "#FFEB3B",
  tempShadowColor: "rgba(0,0,0,0.25)",
  descColor: "rgba(255,235,59,0.85)",
  rangeColor: "rgba(255,235,59,0.50)",
  cardGlassBg: "rgba(255,255,255,0.22)",
  cardBorderColor: "rgba(220,40,30,0.22)",
  cardTextPrimary: "#FFFFFF",
  cardTextSecondary: "rgba(255,255,255,0.65)",
  cardAccent: "#F44336",
  sectionColor: "rgba(255,235,59,0.60)",
  tempFontWeight: "900",
  tempLetterSpacing: -3,
  cardFontWeight: "800",
};

const poolside: ThemeMood = {
  tempColor: "#E0F7FA",
  tempShadowColor: "rgba(0,188,212,0.18)",
  descColor: "rgba(224,247,250,0.85)",
  rangeColor: "rgba(224,247,250,0.50)",
  cardGlassBg: "rgba(200,240,250,0.20)",
  cardBorderColor: "rgba(0,188,212,0.18)",
  cardTextPrimary: "#E0F7FA",
  cardTextSecondary: "rgba(224,247,250,0.60)",
  cardAccent: "#26C6DA",
  sectionColor: "rgba(224,247,250,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -2,
  cardFontWeight: "700",
};

const risograph: ThemeMood = {
  tempColor: "#FCE4EC",
  tempShadowColor: "rgba(255,50,130,0.18)",
  descColor: "rgba(252,228,236,0.85)",
  rangeColor: "rgba(252,228,236,0.50)",
  cardGlassBg: "rgba(252,220,235,0.20)",
  cardBorderColor: "rgba(0,180,170,0.18)",
  cardTextPrimary: "#FCE4EC",
  cardTextSecondary: "rgba(252,228,236,0.60)",
  cardAccent: "#F50057",
  sectionColor: "rgba(0,180,170,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -2,
  cardFontWeight: "700",
};

const dblexposure: ThemeMood = {
  tempColor: "#CFD8DC",
  tempShadowColor: "rgba(55,71,79,0.20)",
  descColor: "rgba(207,216,220,0.80)",
  rangeColor: "rgba(207,216,220,0.45)",
  cardGlassBg: "rgba(180,195,210,0.20)",
  cardBorderColor: "rgba(55,71,79,0.15)",
  cardTextPrimary: "#ECEFF1",
  cardTextSecondary: "rgba(207,216,220,0.60)",
  cardAccent: "#607D8B",
  sectionColor: "rgba(207,216,220,0.50)",
  tempFontWeight: "700",
  tempLetterSpacing: -1,
  cardFontWeight: "600",
};

const streetpop: ThemeMood = {
  tempColor: "#FFF8E1",
  tempShadowColor: "rgba(255,140,180,0.18)",
  descColor: "rgba(255,248,225,0.85)",
  rangeColor: "rgba(255,248,225,0.50)",
  cardGlassBg: "rgba(255,220,235,0.22)",
  cardBorderColor: "rgba(130,200,255,0.18)",
  cardTextPrimary: "#FFFFFF",
  cardTextSecondary: "rgba(255,255,255,0.65)",
  cardAccent: "#42A5F5",
  sectionColor: "rgba(255,200,230,0.55)",
  tempFontWeight: "900",
  tempLetterSpacing: -2.5,
  cardFontWeight: "800",
};

const louiswain: ThemeMood = {
  tempColor: "#E8F5E9",
  tempShadowColor: "rgba(76,175,80,0.18)",
  descColor: "rgba(232,245,233,0.85)",
  rangeColor: "rgba(232,245,233,0.45)",
  cardGlassBg: "rgba(220,245,220,0.20)",
  cardBorderColor: "rgba(255,140,60,0.18)",
  cardTextPrimary: "#E8F5E9",
  cardTextSecondary: "rgba(232,245,233,0.60)",
  cardAccent: "#66BB6A",
  sectionColor: "rgba(255,200,100,0.55)",
  tempFontWeight: "800",
  tempLetterSpacing: -2,
  cardFontWeight: "700",
};

// ─────────────────────────── 맵 + 헬퍼 ───────────────────────────

const DEFAULT_MOOD: ThemeMood = bauhaus;

const THEME_MOODS: Record<string, ThemeMood> = {
  vangogh, monet, klimt, gauguin, popart, bauhaus, ukiyo,
  mucha, synthwave, neoexpress, poolside, risograph, dblexposure, streetpop, louiswain,
};

export function getThemeMood(artStyle: AllArtStyleKey): ThemeMood {
  return THEME_MOODS[artStyle] ?? DEFAULT_MOOD;
}
