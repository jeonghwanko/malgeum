# 날씨 배경 텍스처 시스템

## 개요

Stable Diffusion XL로 생성한 날씨별 추상 배경 텍스처.
캐릭터/사람 없음, 순수 텍스처/패턴만으로 날씨 분위기를 표현.
Glassmorphism 카드의 배경 레이어로 사용.

---

## 파일 구조

```
assets/textures/
├── base/                    # 수채화/잉크 추상 텍스처 (기본)
│   ├── sunny.jpg            # 맑음
│   ├── cloudy.jpg           # 흐림
│   ├── rainy.jpg            # 비
│   ├── snowy.jpg            # 눈
│   ├── dusty.jpg            # 미세먼지
│   └── stormy.jpg           # 뇌우
│
└── art/                     # 아트 스타일 버전 (7가지 × 6날씨 = 42장)
    ├── vangogh/             # 반 고흐 소용돌이 임파스토
    ├── gauguin/             # 고갱 평면 원색
    ├── popart/              # 팝아트 벤데이 도트
    ├── monet/               # 모네 인상주의 빛번짐
    ├── klimt/               # 클림트 금박 장식
    ├── bauhaus/             # 바우하우스 기하학 도형
    └── ukiyo/               # 우키요에 목판화
        └── {sunny|cloudy|rainy|snowy|dusty|stormy}.jpg
```

---

## 이미지 스펙

| 항목 | 값 |
|------|-----|
| 크기 | 832 × 1216 px (세로형) |
| 비율 | ~2:3 (모바일 전체화면 최적화) |
| 포맷 | JPEG |
| 모델 | Stable Diffusion XL (sd_xl_base_1.0) |
| Steps | 30 |
| CFG | 7.0 |
| Sampler | DPM++ 2M Karras |

---

## 날씨 코드 → 텍스처 매핑

| 날씨 코드 | 파일명 | 색상 무드 |
|----------|--------|----------|
| `sunny` | sunny.jpg | 따뜻한 황금 노랑 + 주황 |
| `cloudy` | cloudy.jpg | 차가운 실버 그레이 + 흰 |
| `rainy` | rainy.jpg | 쿨 인디고 블루 + 남색 |
| `snowy` | snowy.jpg | 아이스 블루 + 순백 |
| `dusty` | dusty.jpg | 머스터드 옐로우 + 베이지 |
| `stormy` | stormy.jpg | 어두운 퍼플 + 일렉트릭 옐로우 |

---

## 앱에서 사용하는 방법

### 기본 날씨별 배경

```tsx
import { ImageBackground } from 'react-native';

const WEATHER_TEXTURES = {
  sunny:  require('../assets/textures/base/sunny.jpg'),
  cloudy: require('../assets/textures/base/cloudy.jpg'),
  rainy:  require('../assets/textures/base/rainy.jpg'),
  snowy:  require('../assets/textures/base/snowy.jpg'),
  dusty:  require('../assets/textures/base/dusty.jpg'),
  stormy: require('../assets/textures/base/stormy.jpg'),
} as const;

type WeatherKey = keyof typeof WEATHER_TEXTURES;

// 현재 날씨에 맞는 텍스처 배경
export function WeatherBackground({ weather, children }: {
  weather: WeatherKey;
  children: React.ReactNode;
}) {
  return (
    <ImageBackground
      source={WEATHER_TEXTURES[weather]}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}
```

### 아트 스타일 버전 (사용자 테마 선택)

```tsx
const ART_STYLE_TEXTURES = {
  vangogh: {
    sunny:  require('../assets/textures/art/vangogh/sunny.jpg'),
    cloudy: require('../assets/textures/art/vangogh/cloudy.jpg'),
    // ...
  },
  popart: {
    sunny:  require('../assets/textures/art/popart/sunny.jpg'),
    // ...
  },
  // ...
} as const;

type ArtStyle = keyof typeof ART_STYLE_TEXTURES;

// 사용자가 선택한 아트 스타일 + 현재 날씨 조합
function getTexture(style: ArtStyle | 'base', weather: WeatherKey) {
  if (style === 'base') return WEATHER_TEXTURES[weather];
  return ART_STYLE_TEXTURES[style][weather];
}
```

### Glassmorphism 카드 위에 배경으로

```tsx
import { BlurView } from 'expo-blur';

export function WeatherCard({ weather, children }: { weather: WeatherKey; children: React.ReactNode }) {
  return (
    <WeatherBackground weather={weather}>
      {/* 반투명 블러 카드 */}
      <BlurView intensity={20} tint="light" style={styles.card}>
        {children}
      </BlurView>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
});
```

### 날씨 API 코드 → 텍스처 키 변환

```ts
// OpenWeatherMap weather condition code → texture key
export function getWeatherKey(conditionCode: number): WeatherKey {
  if (conditionCode >= 200 && conditionCode < 300) return 'stormy';   // 뇌우
  if (conditionCode >= 300 && conditionCode < 600) return 'rainy';    // 비/이슬비
  if (conditionCode >= 600 && conditionCode < 700) return 'snowy';    // 눈
  if (conditionCode === 800) return 'sunny';                           // 맑음
  if (conditionCode > 800) return 'cloudy';                           // 흐림
  return 'dusty';                                                      // 기타 (안개, 먼지 등)
}

// 기상청 API PTY(강수형태) + SKY(하늘상태) → texture key
export function getWeatherKeyKMA(pty: number, sky: number): WeatherKey {
  if (pty === 1 || pty === 4) return 'rainy';   // 비
  if (pty === 2 || pty === 3) return 'snowy';   // 눈/진눈깨비
  if (sky === 1) return 'sunny';                 // 맑음
  if (sky === 3) return 'cloudy';               // 구름 많음
  if (sky === 4) return 'cloudy';               // 흐림
  return 'sunny';
}
```

---

## 아트 스타일 설명

| 스타일 ID | 이름 | 특징 | 추천 사용처 |
|----------|------|------|------------|
| `vangogh` | 반 고흐 | 소용돌이 임파스토 붓터치, 진한 파랑/노랑 | 드라마틱한 날씨 강조 |
| `gauguin` | 고갱 | 굵은 윤곽선, 열대 원색, 평면적 | 여름 감성 테마 |
| `popart` | 팝아트 | 벤데이 도트, 만화 스타일, 원색 | 활기찬/젊은 테마 |
| `monet` | 모네 | 인상주의 빛번짐, 부드러운 붓터치 | 감성/우아한 테마 |
| `klimt` | 클림트 | 금박 장식, 비잔틴 패턴, 골드 | 프리미엄/고급 테마 |
| `bauhaus` | 바우하우스 | 기하학 도형, 3원색, 미니멀 | 모던/클린 테마 |
| `ukiyo` | 우키요에 | 일본 목판화, 파도 패턴, 선 | 동양적/차분한 테마 |

---

## 생성 방법 (재생성 시)

```bash
# ComfyUI 실행 중 상태에서

# 기본 6장
cd /home/ubuntu/ComfyUI/findthem
npx tsx apps/happy-animals/generate-weather-textures.ts

# 아트 스타일 42장
npx tsx apps/happy-animals/generate-weather-art-styles.ts

# 결과물 이 레포로 복사
cp output/weather-textures/*.jpg /home/ubuntu/weather/assets/textures/base/
cp -r output/weather-art-styles/*/  /home/ubuntu/weather/assets/textures/art/
```

---

## 향후 계획

- [ ] 시간대별 변형 (아침/낮/저녁/밤) × 날씨 조합
- [ ] 계절별 변형 (봄/여름/가을/겨울)
- [ ] 다크 모드 전용 버전
- [ ] 애니메이션 버전 (Lottie 또는 Rive)
