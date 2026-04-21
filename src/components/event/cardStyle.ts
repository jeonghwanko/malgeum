// 아트 배경 위에서도 항상 가독성이 보장되는 이벤트 카드 공통 배경/보더.
// 팔레트 cardBg는 일부 아트 스타일(ukiyo 등)에서 너무 투명해 텍스트가 묻혀 사용 불가.
export const EVENT_CARD_BG = "rgba(15,23,42,0.72)";
export const EVENT_CARD_BORDER = "rgba(255,255,255,0.18)";

// ScreenSheet(밝은 배경) 안에서 사용하는 라이트 모드 색상
export const EVENT_CARD_BG_LIGHT = "rgba(0,0,0,0.04)";
export const EVENT_CARD_BORDER_LIGHT = "rgba(0,0,0,0.08)";
export const LIGHT_TEXT = "#1E293B";
export const LIGHT_TEXT_SUB = "rgba(0,0,0,0.5)";
export const LIGHT_TEXT_HINT = "rgba(0,0,0,0.35)";
export const LIGHT_DIVIDER = "rgba(0,0,0,0.08)";

// ScreenSheet 내부에서 사용 시 이중 마진 제거 (ScreenSheet paddingHorizontal: 24 + card marginHorizontal: 24)
export const LIGHT_MARGIN_RESET = { marginHorizontal: 0 } as const;
