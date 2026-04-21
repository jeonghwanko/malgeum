# 아트 스타일 테마 시스템

## 개요

맑음 앱은 날씨 배경 텍스처에 7가지 아트 스타일 테마를 제공한다.
기본(수채화 추상) 외에 사용자가 원하는 아트 스타일로 앱 전체 분위기를 바꿀 수 있다.

모든 이미지는 Stable Diffusion XL로 생성 (832×1216, 세로형).

---

## 아트 스타일 7종

### 1. vangogh — 반 고흐

| 항목 | 내용 |
|------|------|
| 테마 | 소용돌이치는 임파스토 붓터치, 후기 인상주의 |
| 색감 | 진한 코발트 블루 + 카드뮴 옐로우 |
| 무드 | 드라마틱, 에너지 넘치는, 역동적 |
| 대표 작품 | 별이 빛나는 밤, 밀밭의 까마귀 |
| 추천 날씨 | 뇌우 (stormy), 흐림 (cloudy) |

```
assets/textures/art/vangogh/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 2. gauguin — 고갱

| 항목 | 내용 |
|------|------|
| 테마 | 굵은 윤곽선, 평면적 형태, 원시적 원색 |
| 색감 | 열대 원색 (빨강, 주황, 초록, 노랑) |
| 무드 | 이국적, 풍요로운, 원시적 생명력 |
| 대표 작품 | 타히티 여인들, 우리는 어디서 왔는가 |
| 추천 날씨 | 맑음 (sunny), 미세먼지 (dusty) |

```
assets/textures/art/gauguin/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 3. popart — 팝아트

| 항목 | 내용 |
|------|------|
| 테마 | 벤데이 하프톤 도트, 만화 스타일 |
| 색감 | 강렬한 원색 (빨강, 파랑, 노랑, 초록) |
| 무드 | 활기찬, 대중적, 유머러스 |
| 대표 작가 | Roy Lichtenstein, Andy Warhol |
| 추천 날씨 | 맑음 (sunny), 비 (rainy) |

```
assets/textures/art/popart/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 4. monet — 모네

| 항목 | 내용 |
|------|------|
| 테마 | 인상주의 빛번짐, 느슨한 붓터치 |
| 색감 | 파스텔 톤, 수면 반사, 대기 빛 |
| 무드 | 고요한, 감성적, 서정적 |
| 대표 작품 | 수련, 루앙 대성당, 건초더미 |
| 추천 날씨 | 흐림 (cloudy), 비 (rainy), 눈 (snowy) |

```
assets/textures/art/monet/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 5. klimt — 클림트

| 항목 | 내용 |
|------|------|
| 테마 | 금박 장식, 비잔틴 모자이크 패턴 |
| 색감 | 골드 + 보석 색상 (에메랄드, 루비, 사파이어) |
| 무드 | 럭셔리, 프리미엄, 신비로운 |
| 대표 작품 | 키스, 아델레 블로흐-바우어 |
| 추천 날씨 | 맑음 (sunny), 눈 (snowy) |

```
assets/textures/art/klimt/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 6. bauhaus — 바우하우스

| 항목 | 내용 |
|------|------|
| 테마 | 기하학적 형태, 그리드 레이아웃 |
| 색감 | 3원색 (빨강/파랑/노랑) + 흑백 |
| 무드 | 모던, 클린, 미니멀, 기능적 |
| 대표 작가 | Wassily Kandinsky, Paul Klee |
| 추천 날씨 | 전체 날씨 (기하학적 추상화) |

```
assets/textures/art/bauhaus/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

### 7. ukiyo — 우키요에

| 항목 | 내용 |
|------|------|
| 테마 | 일본 목판화, 파도 패턴, 선 드로잉 |
| 색감 | 인디고 블루 + 흰, 제한된 색조 |
| 무드 | 차분한, 동양적, 자연친화적 |
| 대표 작품 | 가나가와 해변의 큰 파도 (호쿠사이) |
| 추천 날씨 | 비 (rainy), 눈 (snowy), 흐림 (cloudy) |

```
assets/textures/art/ukiyo/
├── sunny.jpg   cloudy.jpg   rainy.jpg
├── snowy.jpg   dusty.jpg    stormy.jpg
```

---

## 앱에서 테마 선택 구현

### 테마 상수 정의

```ts
// constants/themes.ts
export const ART_STYLES = {
  base:    { label: '기본',     emoji: '🎨', description: '수채화 추상' },
  vangogh: { label: '반 고흐', emoji: '🌀', description: '소용돌이 붓터치' },
  gauguin: { label: '고갱',    emoji: '🌺', description: '열대 원색 평면' },
  popart:  { label: '팝아트',  emoji: '💥', description: '벤데이 도트' },
  monet:   { label: '모네',    emoji: '🌸', description: '인상주의 빛번짐' },
  klimt:   { label: '클림트',  emoji: '✨', description: '금박 장식' },
  bauhaus: { label: '바우하우스', emoji: '⬛', description: '기하학 도형' },
  ukiyo:   { label: '우키요에', emoji: '🌊', description: '목판화 파도' },
} as const;

export type ArtStyleKey = keyof typeof ART_STYLES;
```

### 텍스처 매핑

```ts
// constants/textures.ts
import { ArtStyleKey } from './themes';

type WeatherKey = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'dusty' | 'stormy';

const BASE = {
  sunny:  require('../assets/textures/base/sunny.jpg'),
  cloudy: require('../assets/textures/base/cloudy.jpg'),
  rainy:  require('../assets/textures/base/rainy.jpg'),
  snowy:  require('../assets/textures/base/snowy.jpg'),
  dusty:  require('../assets/textures/base/dusty.jpg'),
  stormy: require('../assets/textures/base/stormy.jpg'),
};

const ART = {
  vangogh: {
    sunny:  require('../assets/textures/art/vangogh/sunny.jpg'),
    cloudy: require('../assets/textures/art/vangogh/cloudy.jpg'),
    rainy:  require('../assets/textures/art/vangogh/rainy.jpg'),
    snowy:  require('../assets/textures/art/vangogh/snowy.jpg'),
    dusty:  require('../assets/textures/art/vangogh/dusty.jpg'),
    stormy: require('../assets/textures/art/vangogh/stormy.jpg'),
  },
  gauguin: {
    sunny:  require('../assets/textures/art/gauguin/sunny.jpg'),
    cloudy: require('../assets/textures/art/gauguin/cloudy.jpg'),
    rainy:  require('../assets/textures/art/gauguin/rainy.jpg'),
    snowy:  require('../assets/textures/art/gauguin/snowy.jpg'),
    dusty:  require('../assets/textures/art/gauguin/dusty.jpg'),
    stormy: require('../assets/textures/art/gauguin/stormy.jpg'),
  },
  popart: {
    sunny:  require('../assets/textures/art/popart/sunny.jpg'),
    cloudy: require('../assets/textures/art/popart/cloudy.jpg'),
    rainy:  require('../assets/textures/art/popart/rainy.jpg'),
    snowy:  require('../assets/textures/art/popart/snowy.jpg'),
    dusty:  require('../assets/textures/art/popart/dusty.jpg'),
    stormy: require('../assets/textures/art/popart/stormy.jpg'),
  },
  monet: {
    sunny:  require('../assets/textures/art/monet/sunny.jpg'),
    cloudy: require('../assets/textures/art/monet/cloudy.jpg'),
    rainy:  require('../assets/textures/art/monet/rainy.jpg'),
    snowy:  require('../assets/textures/art/monet/snowy.jpg'),
    dusty:  require('../assets/textures/art/monet/dusty.jpg'),
    stormy: require('../assets/textures/art/monet/stormy.jpg'),
  },
  klimt: {
    sunny:  require('../assets/textures/art/klimt/sunny.jpg'),
    cloudy: require('../assets/textures/art/klimt/cloudy.jpg'),
    rainy:  require('../assets/textures/art/klimt/rainy.jpg'),
    snowy:  require('../assets/textures/art/klimt/snowy.jpg'),
    dusty:  require('../assets/textures/art/klimt/dusty.jpg'),
    stormy: require('../assets/textures/art/klimt/stormy.jpg'),
  },
  bauhaus: {
    sunny:  require('../assets/textures/art/bauhaus/sunny.jpg'),
    cloudy: require('../assets/textures/art/bauhaus/cloudy.jpg'),
    rainy:  require('../assets/textures/art/bauhaus/rainy.jpg'),
    snowy:  require('../assets/textures/art/bauhaus/snowy.jpg'),
    dusty:  require('../assets/textures/art/bauhaus/dusty.jpg'),
    stormy: require('../assets/textures/art/bauhaus/stormy.jpg'),
  },
  ukiyo: {
    sunny:  require('../assets/textures/art/ukiyo/sunny.jpg'),
    cloudy: require('../assets/textures/art/ukiyo/cloudy.jpg'),
    rainy:  require('../assets/textures/art/ukiyo/rainy.jpg'),
    snowy:  require('../assets/textures/art/ukiyo/snowy.jpg'),
    dusty:  require('../assets/textures/art/ukiyo/dusty.jpg'),
    stormy: require('../assets/textures/art/ukiyo/stormy.jpg'),
  },
};

export function getTexture(style: ArtStyleKey, weather: WeatherKey) {
  if (style === 'base') return BASE[weather];
  return ART[style][weather];
}
```

### 테마 선택 화면 (설정)

```tsx
// screens/ThemeSettingsScreen.tsx
import { ART_STYLES, ArtStyleKey } from '../constants/themes';
import { getTexture } from '../constants/textures';

export function ThemeSettingsScreen() {
  const [selectedStyle, setSelectedStyle] = useTheme(); // AsyncStorage 저장

  return (
    <FlatList
      data={Object.entries(ART_STYLES)}
      numColumns={2}
      renderItem={({ item: [key, meta] }) => (
        <Pressable
          onPress={() => setSelectedStyle(key as ArtStyleKey)}
          style={[styles.card, selectedStyle === key && styles.selected]}
        >
          {/* 맑음 날씨로 미리보기 */}
          <Image source={getTexture(key as ArtStyleKey, 'sunny')} style={styles.preview} />
          <Text>{meta.emoji} {meta.label}</Text>
          <Text style={styles.desc}>{meta.description}</Text>
        </Pressable>
      )}
    />
  );
}
```

### useTheme 훅

```ts
// hooks/useTheme.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { ArtStyleKey } from '../constants/themes';

const THEME_KEY = 'malgeum_art_style';

export function useTheme() {
  const [style, setStyle] = useState<ArtStyleKey>('base');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved) setStyle(saved as ArtStyleKey);
    });
  }, []);

  const updateStyle = async (newStyle: ArtStyleKey) => {
    setStyle(newStyle);
    await AsyncStorage.setItem(THEME_KEY, newStyle);
  };

  return [style, updateStyle] as const;
}
```

---

## UX 고려사항

### 테마 선택 진입점

- **설정 화면** → "배경 테마" 메뉴
- **홈 화면 롱프레스** → 테마 퀵 변경 (선택적)

### 온보딩에서 테마 선택

첫 실행 시 테마 선택 화면을 온보딩 스텝으로 넣으면 개인화 경험 강화.

### 무료 vs 유료 구분 (선택)

| 티어 | 포함 스타일 |
|------|------------|
| 무료 | base, bauhaus (2종) |
| 프리미엄 | vangogh, gauguin, popart, monet, klimt, ukiyo (6종) |

---

## 파일 생성 스크립트

```bash
# /home/ubuntu/ComfyUI/findthem 에서 실행
npx tsx apps/happy-animals/generate-weather-art-styles.ts

# 생성 완료 후 이 레포로 복사
mkdir -p /home/ubuntu/weather/assets/textures/art
for style in vangogh gauguin popart monet klimt bauhaus ukiyo; do
  mkdir -p /home/ubuntu/weather/assets/textures/art/$style
  cp /home/ubuntu/ComfyUI/findthem/apps/happy-animals/output/weather-art-styles/$style/*.jpg \
     /home/ubuntu/weather/assets/textures/art/$style/
done
```
