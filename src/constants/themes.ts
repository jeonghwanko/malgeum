import type { ImageSourcePropType } from "react-native";
import type { ArtStyleKey, PremiumArtStyleKey, AllArtStyleKey } from "@/types/settings";
import type { WeatherCondition } from "@/types/weather";

export interface ArtTheme {
  id: AllArtStyleKey;
  name: string;
  artist: string;
  isFree: boolean;
  type: "default" | "art";
  preview: ImageSourcePropType;
}

// 무료 아트 테마 7종 (클래식 명화)
export const FREE_STYLE_KEYS: ArtStyleKey[] = [
  "vangogh", "monet", "klimt", "gauguin", "popart", "bauhaus", "ukiyo",
];

// 프리미엄 전용 8종
export const PREMIUM_STYLE_KEYS: PremiumArtStyleKey[] = [
  "mucha", "synthwave", "neoexpress", "poolside", "risograph", "dblexposure", "streetpop", "louiswain",
];

export const ALL_STYLE_KEYS: AllArtStyleKey[] = [...FREE_STYLE_KEYS, ...PREMIUM_STYLE_KEYS];

export function themeById(id: string): ArtTheme | undefined {
  return ART_THEMES.find((t) => t.id === id);
}

/**
 * 날씨 조건 + 시간대 → 어울리는 테마 자동 추천.
 * 프리미엄 유저는 8종 프리미엄 테마도 포함.
 */
export function getAutoTheme(
  condition: WeatherCondition,
  timeOfDay: "dawn" | "morning" | "afternoon" | "evening" | "night",
  isPremium: boolean,
): AllArtStyleKey {
  if (isPremium) {
    if (condition === "thunderstorm") return "synthwave";
    if (condition === "snow") return "louiswain";
    if (condition === "fog") return "dblexposure";
    if (condition === "dust") return "risograph";
    if (condition === "rain" || condition === "drizzle") return "poolside";
    if (condition === "clouds") return "mucha";
    // clear — 시간대별
    if (timeOfDay === "dawn") return "mucha";
    if (timeOfDay === "morning") return "poolside";
    if (timeOfDay === "afternoon") return "streetpop";
    if (timeOfDay === "evening") return "neoexpress";
    return "synthwave"; // night
  }
  // 무료
  if (condition === "thunderstorm") return "popart";
  if (condition === "snow") return "ukiyo";
  if (condition === "fog") return "monet";
  if (condition === "dust") return "gauguin";
  if (condition === "rain" || condition === "drizzle") return "ukiyo";
  if (condition === "clouds") return "monet";
  // clear — 시간대별
  if (timeOfDay === "dawn") return "klimt";
  if (timeOfDay === "morning") return "vangogh";
  if (timeOfDay === "afternoon") return "bauhaus";
  if (timeOfDay === "evening") return "gauguin";
  return "ukiyo"; // night
}

export const ART_THEMES: ArtTheme[] = [
  // ── 기본 테마 ──
  {
    id: "default",
    name: "기본 — 맑은 하늘",
    artist: "Default",
    isFree: true,
    type: "default",
    preview: require("../../assets/malgeum/A/A01-sunny-day.jpg"),
  },
  // ── 무료 7종 (클래식 명화) ──
  {
    id: "vangogh",
    name: "반 고흐",
    artist: "별이 빛나는 밤",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/vangogh/sunny.jpg"),
  },
  {
    id: "monet",
    name: "모네",
    artist: "수련 연못",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/monet/rainy.jpg"),
  },
  {
    id: "klimt",
    name: "클림트",
    artist: "키스",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/klimt/sunny.jpg"),
  },
  {
    id: "gauguin",
    name: "고갱",
    artist: "타히티의 여인들",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/gauguin/sunny.jpg"),
  },
  {
    id: "popart",
    name: "팝 아트",
    artist: "앤디 워홀 스타일",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/popart/sunny.jpg"),
  },
  {
    id: "bauhaus",
    name: "바우하우스",
    artist: "기하학적 구성",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/bauhaus/sunny.jpg"),
  },
  {
    id: "ukiyo",
    name: "우키요에",
    artist: "가나가와의 파도",
    isFree: true,
    type: "art",
    preview: require("../../assets/textures/art/ukiyo/sunny.jpg"),
  },
  // ── 프리미엄 8종 ──
  {
    id: "mucha",
    name: "무하",
    artist: "아르누보 꽃장식",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/mucha/sunny.jpg"),
  },
  {
    id: "synthwave",
    name: "신스웨이브",
    artist: "레트로퓨처 네온",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/synthwave/sunny.jpg"),
  },
  {
    id: "neoexpress",
    name: "네오 익스프레스",
    artist: "신표현주의 스트리트",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/neoexpress/sunny.jpg"),
  },
  {
    id: "poolside",
    name: "풀사이드",
    artist: "수영장 풍경",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/poolside/sunny.jpg"),
  },
  {
    id: "risograph",
    name: "리소그래프",
    artist: "잉크 인쇄 일러스트",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/risograph/sunny.jpg"),
  },
  {
    id: "dblexposure",
    name: "더블 익스포저",
    artist: "이중노출 포토",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/dblexposure/sunny.jpg"),
  },
  {
    id: "streetpop",
    name: "스트리트 팝",
    artist: "컨템포러리 팝",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/streetpop/sunny.jpg"),
  },
  {
    id: "louiswain",
    name: "루이스 웨인",
    artist: "사이키델릭 고양이",
    isFree: false,
    type: "art",
    preview: require("../../assets/textures/art/louiswain/sunny.jpg"),
  },
];
