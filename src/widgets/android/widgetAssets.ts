/**
 * 위젯 배경 아트웤 이미지 맵 — require()는 정적 분석 필요로 모두 명시
 * assets/textures/widget/ 에 위젯 전용 리사이즈 이미지 사용 (600×300px, ~30-60KB)
 * 생성: scripts/resize-widget-textures.js
 */

import type { ImageRequireSource } from "react-native";

type TextureMap = Record<string, ImageRequireSource>;

const ARTWORK: Record<string, TextureMap> = {
  vangogh: {
    sunny:  require("../../../assets/textures/widget/vangogh/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/vangogh/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/vangogh/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/vangogh/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/vangogh/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/vangogh/dusty.jpg"),
  },
  monet: {
    sunny:  require("../../../assets/textures/widget/monet/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/monet/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/monet/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/monet/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/monet/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/monet/dusty.jpg"),
  },
  klimt: {
    sunny:  require("../../../assets/textures/widget/klimt/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/klimt/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/klimt/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/klimt/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/klimt/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/klimt/dusty.jpg"),
  },
  gauguin: {
    sunny:  require("../../../assets/textures/widget/gauguin/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/gauguin/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/gauguin/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/gauguin/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/gauguin/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/gauguin/dusty.jpg"),
  },
  popart: {
    sunny:  require("../../../assets/textures/widget/popart/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/popart/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/popart/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/popart/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/popart/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/popart/dusty.jpg"),
  },
  bauhaus: {
    sunny:  require("../../../assets/textures/widget/bauhaus/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/bauhaus/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/bauhaus/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/bauhaus/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/bauhaus/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/bauhaus/dusty.jpg"),
  },
  ukiyo: {
    sunny:  require("../../../assets/textures/widget/ukiyo/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/ukiyo/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/ukiyo/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/ukiyo/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/ukiyo/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/ukiyo/dusty.jpg"),
  },
  // ── 프리미엄 8종 ──
  mucha: {
    sunny:  require("../../../assets/textures/widget/mucha/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/mucha/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/mucha/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/mucha/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/mucha/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/mucha/dusty.jpg"),
  },
  synthwave: {
    sunny:  require("../../../assets/textures/widget/synthwave/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/synthwave/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/synthwave/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/synthwave/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/synthwave/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/synthwave/dusty.jpg"),
  },
  neoexpress: {
    sunny:  require("../../../assets/textures/widget/neoexpress/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/neoexpress/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/neoexpress/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/neoexpress/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/neoexpress/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/neoexpress/dusty.jpg"),
  },
  poolside: {
    sunny:  require("../../../assets/textures/widget/poolside/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/poolside/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/poolside/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/poolside/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/poolside/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/poolside/dusty.jpg"),
  },
  risograph: {
    sunny:  require("../../../assets/textures/widget/risograph/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/risograph/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/risograph/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/risograph/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/risograph/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/risograph/dusty.jpg"),
  },
  dblexposure: {
    sunny:  require("../../../assets/textures/widget/dblexposure/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/dblexposure/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/dblexposure/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/dblexposure/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/dblexposure/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/dblexposure/dusty.jpg"),
  },
  streetpop: {
    sunny:  require("../../../assets/textures/widget/streetpop/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/streetpop/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/streetpop/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/streetpop/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/streetpop/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/streetpop/dusty.jpg"),
  },
  louiswain: {
    sunny:  require("../../../assets/textures/widget/louiswain/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/louiswain/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/louiswain/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/louiswain/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/louiswain/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/louiswain/dusty.jpg"),
  },
  default: {
    sunny:  require("../../../assets/textures/widget/default/sunny.jpg"),
    cloudy: require("../../../assets/textures/widget/default/cloudy.jpg"),
    rainy:  require("../../../assets/textures/widget/default/rainy.jpg"),
    snowy:  require("../../../assets/textures/widget/default/snowy.jpg"),
    stormy: require("../../../assets/textures/widget/default/stormy.jpg"),
    dusty:  require("../../../assets/textures/widget/default/dusty.jpg"),
  },
};

/** artStyle + textureKey → 위젯 전용 이미지 소스. 미등록 스타일은 default로 폴백. */
export function getArtworkImage(artStyle: string, textureKey: string): ImageRequireSource {
  const style = ARTWORK[artStyle] ?? ARTWORK.default;
  // ARTWORK.default.sunny는 항상 존재하므로 null 반환 없음
  return style[textureKey] ?? style.sunny ?? ARTWORK.default.sunny;
}

export const ART_STYLE_LABELS: Record<string, string> = {
  vangogh:     "반 고흐",
  monet:       "모네",
  klimt:       "클림트",
  gauguin:     "고갱",
  popart:      "팝 아트",
  bauhaus:     "바우하우스",
  ukiyo:       "우키요에",
  mucha:       "무하",
  synthwave:   "신스웨이브",
  neoexpress:  "네오 익스프레스",
  poolside:    "풀사이드",
  risograph:   "리소그래프",
  dblexposure: "이중노출",
  streetpop:   "스트리트 팝",
  louiswain:   "루이 웨인",
  default:     "",
};
