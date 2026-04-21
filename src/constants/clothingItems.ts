import type { ImageSourcePropType } from "react-native";
import { t } from "@/i18n";

/**
 * 옷차림 무드보드 데이터.
 *
 * 목적: "오늘은 이런 옷을 입어야겠구나"라는 시각적 판단 프레임을 전달.
 * 카테고리별 3색 옷 사진을 카드 상세 화면에 보여줘 사용자가 즉각
 * 옷차림을 결정할 수 있게 한다.
 *
 * 자산: docs/sd-clothing-moodboard.md 참고. 8 카테고리 × 3색 = 24장.
 * 이미지 경로: assets/clothing/{category}/{category}_{nn}_{color}.jpg
 */

// ─── jacket ──────────────────────────────────────────────
const JACKET_COGNAC = require("../../assets/clothing/jacket/jacket_01_cognac.jpg");
const JACKET_NAVY = require("../../assets/clothing/jacket/jacket_02_navy.jpg");
const JACKET_SAGE = require("../../assets/clothing/jacket/jacket_03_sage.jpg");

// ─── padding ─────────────────────────────────────────────
const PADDING_IVORY = require("../../assets/clothing/padding/padding_01_ivory.jpg");
const PADDING_CHARCOAL = require("../../assets/clothing/padding/padding_02_charcoal.jpg");
const PADDING_BURGUNDY = require("../../assets/clothing/padding/padding_03_burgundy.jpg");

// ─── coat ────────────────────────────────────────────────
const COAT_CAMEL = require("../../assets/clothing/coat/coat_01_camel.jpg");
const COAT_OATMEAL = require("../../assets/clothing/coat/coat_02_oatmeal.jpg");
const COAT_FOREST = require("../../assets/clothing/coat/coat_03_forestgreen.jpg");

// ─── knit ────────────────────────────────────────────────
const KNIT_CREAM = require("../../assets/clothing/knit/knit_01_cream.jpg");
const KNIT_TERRACOTTA = require("../../assets/clothing/knit/knit_02_terracotta.jpg");
const KNIT_LAVENDER = require("../../assets/clothing/knit/knit_03_lavender.jpg");

// ─── cardigan ────────────────────────────────────────────
const CARDIGAN_BEIGE = require("../../assets/clothing/cardigan/cardigan_01_beige.jpg");
const CARDIGAN_DUSTYBLUE = require("../../assets/clothing/cardigan/cardigan_02_dustyblue.jpg");
const CARDIGAN_MUSTARD = require("../../assets/clothing/cardigan/cardigan_03_mustard.jpg");

// ─── longsleeve ──────────────────────────────────────────
const LONGSLEEVE_WHITE = require("../../assets/clothing/longsleeve/longsleeve_01_white.jpg");
const LONGSLEEVE_SKYBLUE = require("../../assets/clothing/longsleeve/longsleeve_02_skyblue.jpg");
const LONGSLEEVE_MOCHA = require("../../assets/clothing/longsleeve/longsleeve_03_mocha.jpg");

// ─── tshirt ──────────────────────────────────────────────
const TSHIRT_MINT = require("../../assets/clothing/tshirt/tshirt_01_mint.jpg");
const TSHIRT_PEACH = require("../../assets/clothing/tshirt/tshirt_02_peach.jpg");
const TSHIRT_LIGHTGRAY = require("../../assets/clothing/tshirt/tshirt_03_lightgray.jpg");

// ─── shorts ──────────────────────────────────────────────
const SHORTS_SANDBEIGE = require("../../assets/clothing/shorts/shorts_01_sandbeige.jpg");
const SHORTS_NAVY = require("../../assets/clothing/shorts/shorts_02_navy.jpg");
const SHORTS_OLIVE = require("../../assets/clothing/shorts/shorts_03_olive.jpg");

export type CategoryKey =
  | "padding"
  | "coat"
  | "jacket"
  | "knit"
  | "cardigan"
  | "longsleeve"
  | "tshirt"
  | "shorts";

export interface ClothingColor {
  key: string;
  label: string; // 한국어 색상명
  swatch: string; // chip 색상 hex
  image: ImageSourcePropType;
}

/** 레이어별 무신사 검색어 매핑 */
export interface MusinsaSearchMap {
  outer?: string; // 아우터 검색어 (없는 구간은 undefined)
  top: string; // 상의 검색어
  bottom: string; // 하의 검색어
}

export interface ClothingCategory {
  key: CategoryKey;
  label: string; // 한국어 카테고리명 (예: "자켓")
  /**
   * 한국어 단정형 — "오늘은 X" 뒤에 붙음.
   * 조사 자동화 대신 데이터로 박음.
   * 예: "자켓이에요", "코트예요"
   */
  labelDeclarative: string;
  colors: ClothingColor[];
  musinsa: MusinsaSearchMap;
}

/**
 * 8 카테고리 × 3색 = 24장.
 * 헥스/색상명 출처: docs/sd-clothing-moodboard.md
 */
/** i18n 적용 — label, labelDeclarative, color.label, musinsa는 getter로 동적 번역 */
function buildClothingItems(): Record<CategoryKey, ClothingCategory> {
  return {
    padding: {
      key: "padding",
      get label() { return t("clothing.padding.label"); },
      get labelDeclarative() { return t("clothing.padding.declarative"); },
      colors: [
        { key: "ivory", get label() { return t("clothing.color.ivory"); }, swatch: "#F5EFE6", image: PADDING_IVORY },
        { key: "charcoal", get label() { return t("clothing.color.charcoal"); }, swatch: "#3D3D3D", image: PADDING_CHARCOAL },
        { key: "burgundy", get label() { return t("clothing.color.burgundy"); }, swatch: "#6B1F2A", image: PADDING_BURGUNDY },
      ],
      musinsa: { get outer() { return t("clothing.musinsa.padding.outer"); }, get top() { return t("clothing.musinsa.padding.top"); }, get bottom() { return t("clothing.musinsa.padding.bottom"); } },
    },
    coat: {
      key: "coat",
      get label() { return t("clothing.coat.label"); },
      get labelDeclarative() { return t("clothing.coat.declarative"); },
      colors: [
        { key: "camel", get label() { return t("clothing.color.camel"); }, swatch: "#C19A6B", image: COAT_CAMEL },
        { key: "oatmeal", get label() { return t("clothing.color.oatmeal"); }, swatch: "#D4C5B0", image: COAT_OATMEAL },
        { key: "forestgreen", get label() { return t("clothing.color.forestgreen"); }, swatch: "#2D4A35", image: COAT_FOREST },
      ],
      musinsa: { get outer() { return t("clothing.musinsa.coat.outer"); }, get top() { return t("clothing.musinsa.coat.top"); }, get bottom() { return t("clothing.musinsa.coat.bottom"); } },
    },
    jacket: {
      key: "jacket",
      get label() { return t("clothing.jacket.label"); },
      get labelDeclarative() { return t("clothing.jacket.declarative"); },
      colors: [
        { key: "cognac", get label() { return t("clothing.color.cognac"); }, swatch: "#8B5E3C", image: JACKET_COGNAC },
        { key: "navy", get label() { return t("clothing.color.navy"); }, swatch: "#1B2A4A", image: JACKET_NAVY },
        { key: "sage", get label() { return t("clothing.color.sage"); }, swatch: "#8FAF8A", image: JACKET_SAGE },
      ],
      musinsa: { get outer() { return t("clothing.musinsa.jacket.outer"); }, get top() { return t("clothing.musinsa.jacket.top"); }, get bottom() { return t("clothing.musinsa.jacket.bottom"); } },
    },
    knit: {
      key: "knit",
      get label() { return t("clothing.knit.label"); },
      get labelDeclarative() { return t("clothing.knit.declarative"); },
      colors: [
        { key: "cream", get label() { return t("clothing.color.cream"); }, swatch: "#F5F0E8", image: KNIT_CREAM },
        { key: "terracotta", get label() { return t("clothing.color.terracotta"); }, swatch: "#C06040", image: KNIT_TERRACOTTA },
        { key: "lavender", get label() { return t("clothing.color.lavender"); }, swatch: "#9B8CB5", image: KNIT_LAVENDER },
      ],
      musinsa: { get outer() { return t("clothing.musinsa.knit.outer"); }, get top() { return t("clothing.musinsa.knit.top"); }, get bottom() { return t("clothing.musinsa.knit.bottom"); } },
    },
    cardigan: {
      key: "cardigan",
      get label() { return t("clothing.cardigan.label"); },
      get labelDeclarative() { return t("clothing.cardigan.declarative"); },
      colors: [
        { key: "beige", get label() { return t("clothing.color.beige"); }, swatch: "#D4B896", image: CARDIGAN_BEIGE },
        { key: "dustyblue", get label() { return t("clothing.color.dustyblue"); }, swatch: "#7B9BB5", image: CARDIGAN_DUSTYBLUE },
        { key: "mustard", get label() { return t("clothing.color.mustard"); }, swatch: "#C8962A", image: CARDIGAN_MUSTARD },
      ],
      musinsa: { get outer() { return t("clothing.musinsa.cardigan.outer"); }, get top() { return t("clothing.musinsa.cardigan.top"); }, get bottom() { return t("clothing.musinsa.cardigan.bottom"); } },
    },
    longsleeve: {
      key: "longsleeve",
      get label() { return t("clothing.longsleeve.label"); },
      get labelDeclarative() { return t("clothing.longsleeve.declarative"); },
      colors: [
        { key: "white", get label() { return t("clothing.color.white"); }, swatch: "#F8F8F6", image: LONGSLEEVE_WHITE },
        { key: "skyblue", get label() { return t("clothing.color.skyblue"); }, swatch: "#6FB3D3", image: LONGSLEEVE_SKYBLUE },
        { key: "mocha", get label() { return t("clothing.color.mocha"); }, swatch: "#7B5B4A", image: LONGSLEEVE_MOCHA },
      ],
      musinsa: { get top() { return t("clothing.musinsa.longsleeve.top"); }, get bottom() { return t("clothing.musinsa.longsleeve.bottom"); } },
    },
    tshirt: {
      key: "tshirt",
      get label() { return t("clothing.tshirt.label"); },
      get labelDeclarative() { return t("clothing.tshirt.declarative"); },
      colors: [
        { key: "mint", get label() { return t("clothing.color.mint"); }, swatch: "#A8D8C8", image: TSHIRT_MINT },
        { key: "peach", get label() { return t("clothing.color.peach"); }, swatch: "#F0C0A0", image: TSHIRT_PEACH },
        { key: "lightgray", get label() { return t("clothing.color.lightgray"); }, swatch: "#C8C8C8", image: TSHIRT_LIGHTGRAY },
      ],
      musinsa: { get top() { return t("clothing.musinsa.tshirt.top"); }, get bottom() { return t("clothing.musinsa.tshirt.bottom"); } },
    },
    shorts: {
      key: "shorts",
      get label() { return t("clothing.shorts.label"); },
      get labelDeclarative() { return t("clothing.shorts.declarative"); },
      colors: [
        { key: "sandbeige", get label() { return t("clothing.color.sandbeige"); }, swatch: "#D4BC96", image: SHORTS_SANDBEIGE },
        { key: "navy", get label() { return t("clothing.color.navy"); }, swatch: "#1E3A5F", image: SHORTS_NAVY },
        { key: "olive", get label() { return t("clothing.color.olive"); }, swatch: "#6B7A3C", image: SHORTS_OLIVE },
      ],
      musinsa: { get top() { return t("clothing.musinsa.shorts.top"); }, get bottom() { return t("clothing.musinsa.shorts.bottom"); } },
    },
  };
}

export const CLOTHING_ITEMS: Record<CategoryKey, ClothingCategory> = buildClothingItems();

/**
 * 체감온도 → 카테고리 매핑.
 *
 * doc(sd-clothing-moodboard.md)의 카테고리별 온도 범위는 서로 겹치므로
 * 각 온도에 단일 카테고리만 선택되도록 아래 cut-point를 사용한다.
 *
 *   ≤ 0°C    padding   (한파)
 *   1 ~ 5°C  coat      (매우 추움)
 *   6 ~ 10°C jacket    (추움)
 *   11~13°C  knit      (쌀쌀 하단 — 두꺼운 스웨터)
 *   14~16°C  cardigan  (쌀쌀 상단 — 가벼운 outer)
 *   17~22°C  longsleeve (적당)
 *   23~27°C  tshirt    (따뜻)
 *   ≥ 28°C   shorts    (더움)
 *
 * knit↔cardigan은 doc상 둘 다 11~16°C이지만,
 * knit는 두꺼운 톱이라 더 추운 쪽(11~13)에,
 * cardigan은 가벼운 layering outer이라 더 따뜻한 쪽(14~16)에 배치.
 */
export function getClothingCategoryForFeelsLike(fl: number): ClothingCategory | null {
  // NaN/Infinity/undefined 등 비정상 값은 카테고리 없음으로 처리.
  // (NaN은 모든 비교가 false라 그대로 두면 shorts로 폴스루되는 버그 방지)
  if (!Number.isFinite(fl)) return null;

  let key: CategoryKey;
  if (fl <= 0) key = "padding";
  else if (fl <= 5) key = "coat";
  else if (fl <= 10) key = "jacket";
  else if (fl <= 13) key = "knit";
  else if (fl <= 16) key = "cardigan";
  else if (fl <= 22) key = "longsleeve";
  else if (fl <= 27) key = "tshirt";
  else key = "shorts";

  return CLOTHING_ITEMS[key];
}
