/**
 * 네이티브 위젯(iOS WidgetKit / Android AppWidget)에 전달하는 데이터 계약.
 * SharedPreferences(Android) 또는 UserDefaults-AppGroup(iOS)에 JSON으로 저장.
 */
export interface WidgetData {
  temp: number;
  feelsLike: number;
  tempDisplay: string; // "18°" or "64°F" — 변환 완료된 표시용
  feelsLikeDisplay: string; // "18°" or "64°F"
  tempUnit: string; // "C" | "F"
  condition: string; // WeatherCondition
  conditionLabel: string; // "맑음", "비" 등
  conditionEmoji: string; // "☀️", "🌧️" 등
  locationName: string; // "서울 강남구"
  district: string; // "강남구"
  heroMessage: string; // "반팔 OK", "우산 필수"
  textureKey: string; // "sunny", "rainy" 등
  updatedAt: number; // epoch ms

  // 액션카드 (Medium 3개, Large 4개)
  cards: WidgetCard[];
  // AI 질문형 한마디 (Large 전용)
  aiSummary: string;
  // 현재 아트 스타일 (위젯 색상 테마에 사용)
  artStyle: string;
  // 투명 모드 (배경화면 비침)
  glassMode?: boolean;
  predictionStreak?: number;
}

export interface WidgetCard {
  id: string;
  title: string;
  description: string;
  icon: string; // Phosphor 아이콘 키 ("umbrella", "t-shirt" 등)
}
