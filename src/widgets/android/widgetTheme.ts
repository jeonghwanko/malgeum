/** 위젯 아트 테마 — 앱 아트 스타일별 위젯 색상 팔레트 */

export interface WidgetTheme {
  bg: string;       // 주 배경색
  accent: string;   // 강조 (pill 배경, 아이콘 틴트)
  text: string;     // 메인 텍스트 (온도)
  sub: string;      // 보조 텍스트 (지역명, 날씨 라벨)
  pill: string;     // pill 텍스트
}

const WIDGET_THEMES: Record<string, WidgetTheme> = {
  vangogh:     { bg: "#0E2559", accent: "#F0C020", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#000000" },
  monet:       { bg: "#2A5F6C", accent: "#A8D8E8", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#1A3A44" },
  klimt:       { bg: "#2C1A0E", accent: "#D4A017", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#1A0C00" },
  gauguin:     { bg: "#5C2200", accent: "#F0A030", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#2A0E00" },
  popart:      { bg: "#B50000", accent: "#FFE400", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#000000" },
  bauhaus:     { bg: "#1C2D5A", accent: "#E63946", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  ukiyo:       { bg: "#1A2456", accent: "#C9B8E8", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#1A2456" },
  mucha:       { bg: "#3D2B1F", accent: "#C9A96E", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#1A0E00" },
  synthwave:   { bg: "#1A0533", accent: "#FF2D78", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  neoexpress:  { bg: "#1A1A1A", accent: "#FF5F1F", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  poolside:    { bg: "#0A4A8A", accent: "#FF9F40", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#000000" },
  risograph:   { bg: "#3D1F4E", accent: "#F25C8A", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  dblexposure: { bg: "#1A2B1A", accent: "#7ED8A4", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#000000" },
  streetpop:   { bg: "#1A1A2E", accent: "#FF6B9D", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  louiswain:   { bg: "#1F1030", accent: "#A78BFA", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#FFFFFF" },
  default:     { bg: "#1E293B", accent: "#90C4DC", text: "#FFFFFF", sub: "#FFFFFFCC", pill: "#0F2A38" },
};

export function getWidgetTheme(artStyle: string): WidgetTheme {
  return WIDGET_THEMES[artStyle] ?? WIDGET_THEMES.default;
}

/** 날씨 조건별 플랫 SVG 아이콘 (40×40 viewBox, stroke="white") */
export function getWeatherIconSvg(condition: string, accentColor = "white"): string {
  const c = accentColor;
  const sw = '2.5';

  switch (condition) {
    case "clear":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="7" fill="none" stroke="${c}" stroke-width="${sw}"/>
        <line x1="20" y1="3" x2="20" y2="9" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="20" y1="31" x2="20" y2="37" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="3" y1="20" x2="9" y2="20" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="31" y1="20" x2="37" y2="20" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="7.4" y1="7.4" x2="11.7" y2="11.7" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="28.3" y1="28.3" x2="32.6" y2="32.6" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="32.6" y1="7.4" x2="28.3" y2="11.7" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="11.7" y1="28.3" x2="7.4" y2="32.6" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
      </svg>`;

    case "clouds":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 28a6 6 0 0 1 1-12 7 7 0 0 1 13.5-1.5A5 5 0 1 1 31 28H9z"
          fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>
      </svg>`;

    case "rain":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 22a5 5 0 0 1 0.5-10 6 6 0 0 1 11.5-1A4.5 4.5 0 1 1 27 22H8z"
          fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>
        <line x1="13" y1="27" x2="11" y2="34" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="27" x2="18" y2="34" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
        <line x1="27" y1="27" x2="25" y2="34" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    case "drizzle":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 22a5 5 0 0 1 0.5-10 6 6 0 0 1 11.5-1A4.5 4.5 0 1 1 27 22H8z"
          fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>
        <circle cx="14" cy="30" r="2" fill="${c}"/>
        <circle cx="21" cy="33" r="2" fill="${c}"/>
        <circle cx="28" cy="30" r="2" fill="${c}"/>
      </svg>`;

    case "snow":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="5" x2="20" y2="35" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="5" y1="20" x2="35" y2="20" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="8.8" y1="8.8" x2="31.2" y2="31.2" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="31.2" y1="8.8" x2="8.8" y2="31.2" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <circle cx="20" cy="20" r="2.5" fill="${c}"/>
        <circle cx="20" cy="5" r="2" fill="${c}"/>
        <circle cx="20" cy="35" r="2" fill="${c}"/>
        <circle cx="5" cy="20" r="2" fill="${c}"/>
        <circle cx="35" cy="20" r="2" fill="${c}"/>
      </svg>`;

    case "thunderstorm":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 20a5 5 0 0 1 0.5-10 5.5 5.5 0 0 1 10.5-1A4 4 0 1 1 25 20H8z"
          fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>
        <polyline points="21,24 16,32 21,32 16,40" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;

    case "fog":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="6" y1="13" x2="34" y2="13" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="6" y1="20" x2="30" y2="20" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="6" y1="27" x2="24" y2="27" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
      </svg>`;

    case "dust":
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="14" r="6" fill="none" stroke="${c}" stroke-width="${sw}"/>
        <line x1="20" y1="3" x2="20" y2="8" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="5" y1="25" x2="35" y2="25" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/>
        <line x1="5" y1="32" x2="28" y2="32" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/>
      </svg>`;

    default:
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="7" fill="none" stroke="${c}" stroke-width="${sw}"/>
      </svg>`;
  }
}
