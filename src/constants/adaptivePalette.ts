import type { AllArtStyleKey } from "@/types/settings";
import type { TextureWeatherKey } from "@/types/weather";
import { getThemePalette } from "./themePalettes";
import { getThemeMood } from "./themeMoods";
import { getNotebookStyle, type NotebookStyle } from "./notebookStyles";

/**
 * Adaptive Palette v3 — "예술적 가독성"
 *
 * 3가지 핵심 원칙:
 *   1. 아트 배경은 살린다 — 무조건 어둡게 덮지 않는다
 *   2. 텍스트는 반드시 읽힌다 — accent 기반 shadow + scrim으로 깊이 확보
 *   3. 테마마다 다른 분위기 — contrast 프로파일로 밝기별 세밀 조정
 */
export interface AdaptivePalette {
  // ── 배경 특성 ──
  isDark: boolean;
  scrimOpacity: number;             // 전체 dim (0~0.3)
  topScrimStart: number;            // 상단 scrim 시작 opacity (0~0.7)
  scrimTint: string;                // scrim 색상 — 순검정 대신 테마 어둠색

  // ── 텍스트 ──
  textPrimary: string;              // 핵심 온도 — 테마별 틴트
  textSecondary: string;            // 설명 텍스트
  textTertiary: string;             // 보조 텍스트
  textShadowColor: string;          // 1차 shadow — 가독성용 (어두운 색)
  textShadowIntensity: number;      // shadow radius 배수
  textGlowColor: string;            // 2차 glow — 예술적 후광 (accent 기반)
  textGlowRadius: number;           // glow 퍼짐 (px)

  // ── 카드 ──
  cardBg: string;                   // GlassCard 배경
  cardBorder: string;               // GlassCard 보더
  cardBlurTint: "dark" | "light";
  cardBlurIntensity: number;        // 30~80

  // ── 태그/pill ──
  pillBg: string;
  pillText: string;
  pillBorder: string;

  // ── Hourly 아이템 ──
  hourlyBg: string;
  hourlyNowBg: string;
  hourlyNowBorder: string;

  // ── 섹션 ──
  sectionTitle: string;

  // ── 액센트 ──
  accent: string;

  // ── 이펙트 ──
  animationTint: string;

  // ── 타이포그래피 ──
  tempFontWeight: "700" | "800" | "900";
  tempLetterSpacing: number;
  cardFontWeight: "600" | "700" | "800";

  // ── 탭바/구분선 ──
  tabBarBg: string;                   // FloatingTabBar 배경 — 불투명, accent 틴팅
  dividerColor: string;               // 구분선/경계선

  // ── 노트북 스타일 ──
  notebook: NotebookStyle;
}

// ──────────────────────────── 색상 유틸 ────────────────────────────

interface RGB { r: number; g: number; b: number }

function parseColor(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** accent RGB를 base rgba에 블렌딩 */
function tintRgba(
  baseR: number, baseG: number, baseB: number, baseA: number,
  accent: RGB, strength: number,
): string {
  const r = Math.round(baseR + (accent.r - baseR) * strength);
  const g = Math.round(baseG + (accent.g - baseG) * strength);
  const b = Math.round(baseB + (accent.b - baseB) * strength);
  return `rgba(${r},${g},${b},${baseA})`;
}

// ──────────────────────────── 테마 기본 특성 ────────────────────────────

interface ThemeBase {
  accent: string;
  accentStrength: number;           // 0~1: 액센트 블렌딩 강도
  contrast: number;                 // 0.7~1.4: scrim/shadow/card 강도 배수 (밝은 아트일수록 높게)
  tempFontWeight: "700" | "800" | "900";
  tempLetterSpacing: number;
  cardFontWeight: "600" | "700" | "800";
  darkness: Record<TextureWeatherKey, boolean>;
}

const THEME_BASES: Record<AllArtStyleKey, ThemeBase> = {
  default: {
    accent: "#4A90D9", accentStrength: 0.15, contrast: 1.0,
    tempFontWeight: "800", tempLetterSpacing: -1.5, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  vangogh: {
    accent: "#F9A825", accentStrength: 0.25, contrast: 1.2,  // 밝고 바쁜 아트 → 강한 대비
    tempFontWeight: "900", tempLetterSpacing: -2, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  monet: {
    accent: "#CE93D8", accentStrength: 0.18, contrast: 0.9,  // 부드러운 아트 → 가벼운 대비
    tempFontWeight: "700", tempLetterSpacing: -1, cardFontWeight: "600",
    darkness: { sunny: false, rainy: false, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  klimt: {
    accent: "#FFD700", accentStrength: 0.25, contrast: 1.3,  // 금색 아트 매우 밝음
    tempFontWeight: "800", tempLetterSpacing: -1.5, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  gauguin: {
    accent: "#FF7043", accentStrength: 0.22, contrast: 1.1,  // 중간 밝기
    tempFontWeight: "800", tempLetterSpacing: -1.5, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  popart: {
    accent: "#FF1744", accentStrength: 0.30, contrast: 1.2,  // 강렬한 색상
    tempFontWeight: "900", tempLetterSpacing: -3, cardFontWeight: "800",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  bauhaus: {
    accent: "#E53935", accentStrength: 0.20, contrast: 1.1,
    tempFontWeight: "800", tempLetterSpacing: -2, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  ukiyo: {
    accent: "#5C6BC0", accentStrength: 0.18, contrast: 1.2,  // 밝은 파도 배경
    tempFontWeight: "700", tempLetterSpacing: -1, cardFontWeight: "600",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  mucha: {
    accent: "#8BC34A", accentStrength: 0.18, contrast: 0.95, // 파스텔 톤
    tempFontWeight: "700", tempLetterSpacing: -1, cardFontWeight: "600",
    darkness: { sunny: false, rainy: false, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  synthwave: {
    accent: "#FF4081", accentStrength: 0.35, contrast: 0.8,  // 이미 어두움
    tempFontWeight: "900", tempLetterSpacing: -3, cardFontWeight: "800",
    darkness: { sunny: true, rainy: true, cloudy: true, snowy: false, stormy: true, dusty: true },
  },
  neoexpress: {
    accent: "#F44336", accentStrength: 0.28, contrast: 1.15,
    tempFontWeight: "900", tempLetterSpacing: -3, cardFontWeight: "800",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  poolside: {
    accent: "#26C6DA", accentStrength: 0.20, contrast: 1.1,
    tempFontWeight: "800", tempLetterSpacing: -2, cardFontWeight: "700",
    darkness: { sunny: false, rainy: false, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  risograph: {
    accent: "#F50057", accentStrength: 0.25, contrast: 1.1,
    tempFontWeight: "800", tempLetterSpacing: -2, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  dblexposure: {
    accent: "#607D8B", accentStrength: 0.12, contrast: 1.0,
    tempFontWeight: "700", tempLetterSpacing: -1, cardFontWeight: "600",
    darkness: { sunny: false, rainy: true, cloudy: true, snowy: false, stormy: true, dusty: false },
  },
  streetpop: {
    accent: "#42A5F5", accentStrength: 0.22, contrast: 1.15,
    tempFontWeight: "900", tempLetterSpacing: -2.5, cardFontWeight: "800",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
  louiswain: {
    accent: "#66BB6A", accentStrength: 0.20, contrast: 1.1,
    tempFontWeight: "800", tempLetterSpacing: -2, cardFontWeight: "700",
    darkness: { sunny: false, rainy: true, cloudy: false, snowy: false, stormy: true, dusty: false },
  },
};

// ──────────────────────────── 팩토리 결과 타입 ────────────────────────────

type FactoryResult = Omit<AdaptivePalette,
  "isDark" | "accent" | "animationTint" | "tempFontWeight" | "tempLetterSpacing" | "cardFontWeight" | "notebook"
>;

/** accent를 어둡게 만들어 scrim 색상으로 사용 */
function darkenAccent(ac: RGB, factor: number): string {
  const r = Math.round(ac.r * factor);
  const g = Math.round(ac.g * factor);
  const b = Math.round(ac.b * factor);
  return `${r},${g},${b}`;
}

// ──────────────────────────── 밝은 배경 팩토리 ────────────────────────────

function buildLightBgPalette(base: ThemeBase, mood: ReturnType<typeof getThemeMood>): FactoryResult {
  const ac = parseColor(base.accent);
  const s = base.accentStrength;
  const c = base.contrast; // 대비 배수 — 밝은 아트일수록 높음

  // scrim: 순검정 대신 accent 어둠색 (테마 색감 유지하면서 깊이 부여)
  const scrimRgb = darkenAccent(ac, 0.15);

  return {
    scrimOpacity: 0.12 * c,                    // 밝은 아트에서 깊이 확보
    topScrimStart: 0.55 * c,                   // 상단 텍스트 보호
    scrimTint: `rgba(${scrimRgb},1)`,          // accent 기반 scrim 색상

    // 텍스트: 테마별 틴트 + 강화된 가독성
    textPrimary: mood.tempColor,
    textSecondary: mood.descColor,
    textTertiary: mood.rangeColor,
    textShadowColor: `rgba(0,0,0,${0.6 * c})`,        // 1차: 가독성 — 어둡고 강하게
    textShadowIntensity: 1.8 * c,                       // shadow radius 배수
    textGlowColor: mood.tempShadowColor,                // 2차: accent 후광 — 예술적 깊이
    textGlowRadius: 20 * c,                              // glow 퍼짐

    // 카드: 깊은 글라스 — 아트를 비추면서도 콘텐츠 분리
    cardBg: tintRgba(0, 0, 0, 0.42 * c, ac, s * 0.35),
    cardBorder: tintRgba(255, 255, 255, 0.18, ac, s * 0.40),
    cardBlurTint: "dark",
    cardBlurIntensity: Math.round(55 * c),

    // Pill: 액센트 틴팅 — 카드보다 약간 연하게
    pillBg: tintRgba(0, 0, 0, 0.38 * c, ac, s * 0.30),
    pillText: mood.cardTextPrimary,
    pillBorder: tintRgba(255, 255, 255, 0.18, ac, s * 0.35),

    // Hourly: 그라데이션 깊이감
    hourlyBg: tintRgba(0, 0, 0, 0.28 * c, ac, s * 0.25),
    hourlyNowBg: tintRgba(0, 0, 0, 0.45 * c, ac, s * 0.40),
    hourlyNowBorder: tintRgba(255, 255, 255, 0.28, ac, s * 0.45),

    // 섹션
    sectionTitle: mood.sectionColor,

    // 탭바/구분선
    tabBarBg: tintRgba(15, 23, 42, 0.92, ac, s * 0.40),
    dividerColor: tintRgba(255, 255, 255, 0.12, ac, s * 0.20),
  };
}

// ──────────────────────────── 어두운 배경 팩토리 ────────────────────────────

function buildDarkBgPalette(base: ThemeBase, mood: ReturnType<typeof getThemeMood>): FactoryResult {
  const ac = parseColor(base.accent);
  const s = base.accentStrength;
  const c = base.contrast;

  const scrimRgb = darkenAccent(ac, 0.10);

  return {
    scrimOpacity: 0.04 * c,
    topScrimStart: 0.30 * c,
    scrimTint: `rgba(${scrimRgb},1)`,

    // 텍스트: 어두운 배경에서는 shadow 약하게, glow으로 분위기
    textPrimary: mood.tempColor,
    textSecondary: mood.descColor,
    textTertiary: mood.rangeColor,
    textShadowColor: `rgba(0,0,0,${0.45 * c})`,
    textShadowIntensity: 1.2 * c,
    textGlowColor: mood.tempShadowColor,
    textGlowRadius: 25 * c,                      // 어두운 배경에서 glow 더 넓게

    // 카드: 라이트 글라스 + accent 틴팅
    cardBg: tintRgba(255, 255, 255, 0.16, ac, s * 0.30),
    cardBorder: tintRgba(255, 255, 255, 0.22, ac, s * 0.35),
    cardBlurTint: "light",
    cardBlurIntensity: Math.round(42 * c),

    // Pill
    pillBg: tintRgba(255, 255, 255, 0.16, ac, s * 0.25),
    pillText: mood.cardTextPrimary,
    pillBorder: tintRgba(255, 255, 255, 0.22, ac, s * 0.30),

    // Hourly
    hourlyBg: tintRgba(255, 255, 255, 0.12, ac, s * 0.20),
    hourlyNowBg: tintRgba(255, 255, 255, 0.22, ac, s * 0.35),
    hourlyNowBorder: tintRgba(255, 255, 255, 0.32, ac, s * 0.40),

    // 섹션
    sectionTitle: mood.sectionColor,

    // 탭바/구분선
    tabBarBg: tintRgba(0, 0, 0, 0.88, ac, s * 0.35),
    dividerColor: tintRgba(255, 255, 255, 0.12, ac, s * 0.20),
  };
}

// ──────────────────────────── Public API ────────────────────────────

/**
 * 테마 + 날씨 조합에 따른 adaptive palette 반환.
 * 15 themes × 6 weathers = 90가지 조합마다 고유한 시각적 경험 제공.
 *
 * 데이터 소스 통합:
 *  - ThemeBase: 액센트/타이포/밝기 판단
 *  - themeMoods: 테마별 텍스트 틴트/섀도우/섹션 색상
 *  - themePalettes: 테마×날씨별 카드 보더/애니메이션 틴트
 */
export function getAdaptivePalette(
  artStyle: AllArtStyleKey,
  textureKey: TextureWeatherKey,
): AdaptivePalette {
  const base = THEME_BASES[artStyle] ?? THEME_BASES.bauhaus;
  const isDark = base.darkness[textureKey] ?? false;
  const mood = getThemeMood(artStyle);
  const themePal = getThemePalette(artStyle, textureKey);

  const adaptive = isDark ? buildDarkBgPalette(base, mood) : buildLightBgPalette(base, mood);

  // themePalettes 오버라이드: 수작업 튜닝된 cardBorder와 animationTint 우선 적용
  if (themePal) {
    adaptive.cardBorder = themePal.cardBorder;
  }

  return {
    isDark,
    accent: base.accent,
    animationTint: themePal?.animationTint ?? "rgba(255,224,102,0.25)",
    tempFontWeight: base.tempFontWeight,
    tempLetterSpacing: base.tempLetterSpacing,
    cardFontWeight: base.cardFontWeight,
    notebook: getNotebookStyle(artStyle),
    ...adaptive,
  };
}
