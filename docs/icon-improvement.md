# 맑음 (Malgeum) — 아이콘 시스템 개선 리서치

> 작성일: 2026-04-03
> 작성자: 박유경 (UX Designer)
> 목적: 시스템 이모지를 제거하고 프리미엄 아이콘 시스템으로 교체

---

## 1. 현재 문제 진단

### 문제: 시스템 이모지와 Glassmorphism 톤앤매너 불일치

현재 날씨 아이콘(☀️ 🌧️ ❄️ 등)과 UI 아이콘(🔔 ⚙️ 등)은 iOS/Android의 시스템 이모지 렌더링에 의존한다. 이 방식이 초래하는 UX 문제는 세 가지다.

**시각적 불일치**
- iOS 이모지와 Android 이모지는 렌더링이 서로 다르다. 동일 앱이 플랫폼별로 다른 아이콘을 보여주게 된다.
- 이모지는 고채도/고대비 3D 형태다. 반투명 Glassmorphism 카드 위에서 튀어 보이고, 카드의 섬세한 레이어 깊이감을 방해한다.
- Pretendard 폰트의 라운드 고딕 무드(기하학적, 절제된)와 이모지의 사실적-캐릭터 무드가 충돌한다.

**브랜딩 일관성 부재**
- 브랜딩 확정안(branding.md)에 명시된 "캐릭터 없음 — 타이포그래피 + 듀오톤 아이콘" 방향과 직접 모순된다.
- "고급 날씨 매거진" 무드를 목표로 하는 앱에서 이모지는 캐주얼/유아적 인상을 준다.

**접근성 한계**
- 이모지는 `alt` 텍스트가 없으면 스크린 리더가 임의 설명("태양" 대신 "얼굴 없는 태양")을 읽는다.
- 이모지 크기 조절 시 픽셀이 뭉개지거나 렌더링이 불안정하다(특히 12px 이하).

---

## 2. 프리미엄 날씨 앱 아이콘 트렌드 리서치 (2025–2026)

### 경쟁 앱 분석

| 앱 | 아이콘 스타일 | 특징 |
|----|------------|------|
| Apple Weather | SF Symbols (라인/필드 혼용) | 시스템 폰트와 일체감, 날씨 상태에 따라 색상 변화 |
| Carrot Weather | 커스텀 3D 스타일 | 캐릭터 없음, 날씨 조건별 고유 색조 팔레트 |
| Today Weather | 미니멀 라인 아이콘 | 배경 그라데이션과 대비되는 흰색 라인 아이콘 |
| Cat Weather | Glassmorphism 카드 + 시스템 아이콘 | 실제로 이모지 혼용 — 아이콘 불일치가 약점으로 지적됨 |

**결론**: 프리미엄 앱일수록 시스템 이모지를 사용하지 않는다. 대신 커스텀 SVG 아이콘 또는 검증된 아이콘 시스템을 전체에 일관 적용한다.

### Glassmorphism에 어울리는 아이콘 스타일

Glassmorphism 카드는 배경이 반투명하게 비치고 섬세한 경계선을 갖는다. 이 위에 놓이는 아이콘이 갖춰야 할 조건은 다음과 같다.

1. **단순한 형태** — 카드 표면의 블러·레이어 효과가 복잡한 아이콘의 디테일을 묻는다. 외곽선이 명확한 단순 형태가 유리하다.
2. **컬러 제어 가능성** — CSS/SVG 속성으로 색상을 덮어쓸 수 있어야 라이트/다크 모드, 날씨별 배경 변화에 대응 가능하다.
3. **2색 구조 (듀오톤)** — 단색 라인(모노톤)보다 한 단계 표현력이 높고, 3D 이모지보다는 훨씬 절제돼 있다. 프리미엄 앱의 중간 지점.

**권장 스타일: 듀오톤(Duotone) + 필드(Fill) 혼합**
- 날씨 아이콘: 듀오톤(primary 색 + 반투명 secondary 색으로 입체감 표현)
- UI 아이콘(탭바, 설정): 라인(Line) 단일 두께 — 콘텐츠 아이콘보다 시각적으로 조용해야 함

---

## 3. 날씨 아이콘 최종 추천: Basmilius Weather Icons (Meteocons)

### 선정 근거

[Basmilius Weather Icons](https://basmilius.github.io/weather-icons/) (별칭: Meteocons v3)는 현재 사용 가능한 날씨 아이콘 중 가장 완성도 높은 오픈소스 셋이다.

| 평가 항목 | 내용 |
|----------|------|
| 라이선스 | MIT — 상업 앱 무료 사용 가능, 저작권 표시만 유지 |
| 스타일 수 | Fill(채움), Outline(라인) 2종 |
| 아이콘 수 | 날씨 상태 전용 100+ (맑음/흐림/비/눈/뇌우/안개/미세먼지 등 완전 커버) |
| 애니메이션 | 정적 SVG + 애니메이션 SVG + Lottie JSON 세 형식 제공 |
| CDN | `https://bmcdn.nl/assets/weather-icons/v3.0/` — 별도 npm 설치 없이 HTML에 `<img>` 태그로 즉시 사용 |
| Glassmorphism 호환 | CSS `filter: brightness()` 또는 SVG 직접 편집으로 색조 변경 가능 |

### 주요 아이콘 이름 목록 (맑음 앱 필요 항목)

| 날씨 상태 | Fill 파일명 | 비고 |
|----------|------------|------|
| 맑음 (낮) | `clear-day.svg` | 태양 |
| 맑음 (밤) | `clear-night.svg` | 달 + 별 |
| 구름 조금 | `partly-cloudy-day.svg` | 태양 + 구름 |
| 흐림 | `overcast-day.svg` | 두꺼운 구름 |
| 비 | `rain.svg` / `drizzle.svg` | 강도별 |
| 뇌우 | `thunderstorms-rain.svg` | 번개 + 비 |
| 눈 | `snow.svg` | |
| 안개 | `fog.svg` | |
| 바람 | `wind.svg` | |
| 미세먼지 | `haze.svg` | |
| UV 지수 | `uv-index.svg` | 선스크린 추천 카드용 |
| 습도 | `humidity.svg` | |
| 기압 | `pressure.svg` | |

### CDN 사용법 (HTML mockup 즉시 적용)

```html
<!-- Fill 스타일 — Glassmorphism 카드 내 날씨 상태 아이콘 -->
<img
  src="https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/clear-day.svg"
  width="64"
  height="64"
  alt="맑음"
/>

<!-- 애니메이션 SVG — 히어로 섹션 (더 큰 크기, 움직임 있음) -->
<img
  src="https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/rain.svg"
  width="120"
  height="120"
  alt="비"
/>
```

### 다크/라이트 배경 대응 방법

아이콘 자체가 컬러 SVG이므로 배경에 따라 CSS로 밝기를 조정한다.

```css
/* 어두운 배경(비 오는 날, 밤)에서 아이콘 밝기 높이기 */
.weather-icon-on-dark {
  filter: brightness(1.15) drop-shadow(0 2px 8px rgba(255,255,255,0.15));
}

/* 밝은 배경에서 채도 약간 낮추기 — 카드 안에서 튀지 않게 */
.weather-icon-on-light {
  filter: saturate(0.85);
}
```

---

## 4. UI 아이콘 추천: Phosphor Icons (Duotone/Regular 혼용)

### 선정 근거

탭바·설정·알림 등 UI 기능 아이콘은 [Phosphor Icons](https://phosphoricons.com/)를 권장한다.

| 평가 항목 | Phosphor | Lucide | Heroicons |
|----------|---------|--------|-----------|
| 스타일 수 | 6종 (thin/light/regular/bold/fill/duotone) | 1종 (라인) | 2종 (outline/solid) |
| 아이콘 수 | 9,000+ | 1,500+ | 300+ |
| 라인 두께 커스텀 | 가능 | 가능 (`strokeWidth`) | 불가 |
| Pretendard 조화 | 우수 (Regular 두께가 Pretendard 500과 시각적 무게 일치) | 보통 | 보통 |
| CDN (HTML) | jsDelivr — 즉시 적용 가능 | jsDelivr | jsDelivr |
| 날씨 관련 아이콘 | cloud, sun, cloud-rain, snowflake, thermometer, wind 등 있음 | 동일 | 제한적 |

**Phosphor가 맞는 이유**: 6가지 굵기 중 `regular`(2px 스트로크)가 Pretendard의 Medium(500) 굵기와 시각적 무게가 맞다. 탭바에서는 `regular`, 강조 필요한 상황(활성 탭)에서는 `fill`로 전환하면 별도 아이콘 이미지 없이 상태 전환을 표현할 수 있다.

### CDN 사용법

```html
<!-- head에 추가 -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" />
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css" />

<!-- 탭바 아이콘 (비활성 → regular, 활성 → fill) -->
<i class="ph ph-house"></i>          <!-- 홈 비활성 -->
<i class="ph-fill ph-house"></i>     <!-- 홈 활성 -->
<i class="ph ph-calendar"></i>       <!-- 주간예보 비활성 -->
<i class="ph ph-clock"></i>          <!-- 출근모드 비활성 -->
<i class="ph ph-gear-six"></i>       <!-- 설정 비활성 -->

<!-- 설정 화면 항목 아이콘 (듀오톤 — 약간 화려한 강조) -->
<i class="ph-duotone ph-bell-ringing"></i>  <!-- 알림 -->
<i class="ph-duotone ph-map-pin"></i>        <!-- 위치 -->
<i class="ph-duotone ph-thermometer"></i>    <!-- 온도 단위 -->
<i class="ph-duotone ph-moon-stars"></i>     <!-- 다크모드 -->
```

### 탭바 아이콘 활성/비활성 상태 전환 패턴

```css
.tab-icon {
  color: #94A3B8;   /* 비활성: Slate */
  font-size: 24px;
}

.tab-icon.active {
  color: #4A90D9;   /* 활성: Sky Blue (primary) */
}
```

---

## 5. 추가 시각 요소 — 유저 만족도 극대화 방안

### 5-1. 히어로 섹션 날씨 SVG 일러스트 (임팩트: 최상)

현재 히어로 영역은 CSS `radial-gradient`로 태양을 표현하고 있다. 이 방식은 날씨 상태가 바뀌어도 변하지 않아 정보 전달력이 약하다.

**개선안**: Basmilius Fill 아이콘을 히어로 크기(120–160px)로 배치하고, 날씨 상태 변수에 따라 교체한다.

```html
<!-- 히어로 날씨 아이콘 — 맑음 상태 -->
<div class="hero-icon-wrapper">
  <img
    class="hero-weather-icon"
    src="https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/clear-day.svg"
    width="140"
    height="140"
    alt="맑음"
  />
</div>
```

```css
.hero-icon-wrapper {
  /* 아이콘 주변 배경 글로우 — 날씨 무드 강조 */
  filter: drop-shadow(0 8px 24px rgba(255, 200, 80, 0.4));
}

/* 비 오는 날 */
.hero-icon-wrapper.rainy {
  filter: drop-shadow(0 8px 24px rgba(100, 150, 220, 0.35));
}
```

**효과**: 날씨 상태가 한눈에 인식되고, CSS 태양 글로우(`::before`)를 제거해 코드도 단순해진다.

### 5-2. 날씨 배경 파티클 (임팩트: 높음)

현재 "비 오는 날" 화면에 CSS 애니메이션 비 효과가 이미 구현돼 있다. 이것을 강화하거나 다른 날씨 상태에도 확장한다.

| 날씨 | 파티클 효과 | 구현 방법 |
|------|-----------|---------|
| 비 | 빗방울 세로 스크롤 | CSS `@keyframes` translate (현재 구현됨) |
| 눈 | 눈송이 지그재그 낙하 | CSS `@keyframes` + `translateX` oscillate |
| 맑음 | 태양 광선 펄스 | CSS `scale` + `opacity` 루프 |
| 흐림 | 구름 수평 드리프트 | CSS `translateX` 느린 루프 |
| 미세먼지 | 먼지 부유 | CSS `translateY` + `opacity` 랜덤 지연 |

비 파티클 강화 코드 예시:

```css
/* 빗방울 2-3겹 레이어로 원근감 표현 */
.rain-layer-near {
  animation-duration: 0.6s;
  opacity: 0.9;
  width: 1.5px;
}
.rain-layer-far {
  animation-duration: 1.1s;
  opacity: 0.4;
  width: 1px;
  transform: skewX(-3deg);  /* 먼 빗방울은 더 기울어 보임 */
}
```

### 5-3. 카드 탭/호버 마이크로인터랙션 (임팩트: 중상)

Glassmorphism 카드는 시각적으로 "물리적 레이어"처럼 보인다. 탭할 때 눌리는 느낌을 주면 카드가 실체적인 오브젝트처럼 느껴진다.

```css
/* 카드 스프링 탭 효과 */
.action-card {
  transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
  cursor: pointer;
}

.action-card:active {
  transform: scale(0.97) translateY(1px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);  /* 원래보다 그림자 줄이기 — 눌리는 느낌 */
}

/* 호버 (태블릿/데스크톱 mockup 용) */
.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.22);
}
```

아이콘 탭 시 추가 피드백:

```css
/* 의사결정 카드 내 아이콘 탭 시 회전 강조 */
.decision-icon {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);  /* spring curve */
}

.decision-icon:active {
  transform: rotate(-8deg) scale(1.1);
}
```

### 5-4. 다크/라이트 모드 아이콘 색상 적응 (임팩트: 중)

Basmilius 아이콘은 컬러 SVG로 배경에 따라 너무 튈 수 있다. CSS 변수로 배경별 필터 값을 제어한다.

```css
:root {
  --icon-filter-on-dark: brightness(1.1) saturate(1.1);
  --icon-filter-on-light: brightness(0.9) saturate(0.85);
}

/* 다크 배경 (비, 밤) */
[data-theme="dark"] .weather-icon {
  filter: var(--icon-filter-on-dark);
}

/* 라이트 배경 (라이트 모드 주간예보, 설정) */
[data-theme="light"] .weather-icon {
  filter: var(--icon-filter-on-light);
}
```

Phosphor UI 아이콘은 `currentColor`를 사용하므로 CSS `color` 속성만 바꾸면 전체 대응된다.

```css
/* 라이트 모드에서 탭바 */
[data-theme="light"] .tab-icon {
  color: #6B7280;  /* Warm Gray */
}
[data-theme="light"] .tab-icon.active {
  color: #4A90D9;  /* Sky Blue */
}
```

### 5-5. XP/스코어 없는 앱의 "성취감" 대체 — 배경 전환 트랜지션 (임팩트: 중)

날씨 앱은 게임화 요소가 없다. 사용자 만족의 핵심은 "정보를 확인했을 때의 안도감"이다. 날씨 상태 전환(맑음→비)을 부드럽게 크로스페이드하면 정보 업데이트 자체가 쾌적한 경험이 된다.

```css
.screen-background {
  transition: background 1.2s ease-in-out;  /* 날씨 변경 시 배경 부드럽게 전환 */
}

.weather-icon-container {
  transition: opacity 0.3s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 아이콘 교체 시: 페이드아웃 후 스케일업으로 등장 */
.weather-icon-container.entering {
  opacity: 0;
  transform: scale(0.85);
}
.weather-icon-container.entered {
  opacity: 1;
  transform: scale(1);
}
```

---

## 6. 구현 우선순위

임팩트와 구현 난이도를 기준으로 순서를 정한다.

| 순위 | 개선 항목 | 임팩트 | 난이도 | 예상 소요 |
|------|---------|--------|--------|---------|
| **1** | Basmilius 날씨 아이콘으로 이모지 전체 교체 | 최상 | 낮음 | 1–2시간 |
| **2** | Phosphor UI 아이콘으로 탭바/설정 이모지 교체 | 높음 | 낮음 | 1시간 |
| **3** | 히어로 섹션 아이콘 대형 배치 + drop-shadow 글로우 | 높음 | 낮음 | 30분 |
| **4** | 카드 탭 마이크로인터랙션 (scale + shadow) | 중상 | 낮음 | 30분 |
| **5** | 날씨 파티클 강화 (눈/태양 광선 레이어 추가) | 중 | 중간 | 2–3시간 |
| **6** | 다크/라이트 모드 아이콘 CSS 변수 적응 | 중 | 낮음 | 30분 |
| **7** | 배경 크로스페이드 트랜지션 | 중 | 낮음 | 30분 |

**1, 2순위를 먼저 적용하면**: 이모지가 사라지는 것만으로 UI 전체의 프리미엄 느낌이 즉시 올라간다. 코드 변경량은 최소다.

---

## 7. 적용 시 주의사항

### Basmilius 아이콘 저작권

MIT 라이선스이나 소스 파일 내 저작권 표시 보존이 조건이다. HTML 주석 또는 앱 내 "오픈소스 라이선스" 화면에 아래 내용을 추가한다.

```
Meteocons — Weather Icons by Bas Milius
https://bas.dev/work/meteocons
MIT License
```

### Phosphor Icons 저작권

MIT 라이선스, 별도 표시 불필요.

### CDN 의존성 주의

현재 mockup은 CDN 의존 방식이 적합하다. 실제 앱(React Native) 전환 시에는 아이콘 파일을 로컬에 번들하거나 Phosphor의 React Native 패키지(`@phosphor-icons/react-native`)를 사용한다.

---

## 참고 링크

- [Basmilius Weather Icons (GitHub)](https://github.com/basmilius/weather-icons)
- [Basmilius Weather Icons (데모 — Fill)](https://basmilius.github.io/weather-icons/index-fill.html)
- [Basmilius Weather Icons (데모 — Outline)](https://basmilius.github.io/weather-icons/index.html)
- [Phosphor Icons (공식)](https://phosphoricons.com/)
- [Phosphor Icons (jsDelivr CDN)](https://www.jsdelivr.com/package/npm/phosphor-icons)
- [Glassmorphism UI — 2025 트렌드 분석](https://www.atvoid.com/blog/what-is-glassmorphism-the-transparent-trend-defining-2025-ui-design)
- [마이크로인터랙션 가이드 2025](https://www.justinmind.com/web-design/micro-interactions)
- [App Icon Design Trends 2025](https://iconmaker.studio/blog/app-icon-design-trends-2025)
