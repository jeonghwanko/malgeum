# 제스처/이벤트 처리 아키텍처

> 이 문서는 맑음 앱의 터치/드래그/스크롤 이벤트 처리 설계를 정리한다.
> 새로운 터치 인터랙션을 추가하거나 기존 컴포넌트를 수정할 때 반드시 참조할 것.

---

## 1. 핵심 원칙

### RN 네이티브 터치 > RNGH 제스처

앱 전체에서 **RNGH(react-native-gesture-handler)를 터치 경로에서 최소화**한다.

| 우선순위 | 방식 | 용도 |
|---------|------|------|
| 1순위 | RN `Pressable` | 탭 이벤트 (카드, 버튼, FAB) |
| 2순위 | RN `ScrollView` / `FlatList` | 스크롤 + 오버스크롤 감지 |
| 3순위 | Reanimated `SharedValue` + `useAnimatedStyle` | 애니메이션 구동 (터치 판단 아님) |
| 최후 수단 | RNGH `Gesture.Pan()` | 커스텀 드래그 (ChatSheet dismiss 등) |

### 왜 RNGH를 피하는가?

1. **모달 복귀 후 터치 씹힘**: RNGH 상태 머신이 이전 제스처에서 리셋되지 않아 첫 터치 소비
2. **두 제스처 시스템 경쟁**: RNGH ScrollView + RNGH Tap이 같은 터치 이벤트를 놓고 경쟁 → 불예측 동작
3. **transparentModal 전환 충돌**: react-native-screens의 네이티브 전환 + RNGH 제스처가 동시 활성화

---

## 2. 화면별 이벤트 처리

### 2-1. 홈 화면 (`app/(tabs)/index.tsx`)

```
RN ScrollView (onScroll → scrollY SharedValue, delayContentTouches=false)
  ├─ HeroSection
  │    ├─ TouchableOpacity (위치 선택)
  │    └─ TouchableOpacity (공유)
  ├─ DecisionHero
  │    └─ Pressable (브리핑 열기)
  ├─ ActionGrid
  │    └─ RNGH ScrollView (수평) ← Gesture.Tap()과 같은 시스템
  │         └─ PostitCard: RNGH Gesture.Tap() + Reanimated scale
  ├─ HealthGrid
  │    └─ HealthRow: RNGH Gesture.Tap() + Reanimated scale
  ├─ CommuteCard, HourlyScroll ...
  └─ 피드백 배너: Pressable
```

**ActionGrid/HealthGrid**: RNGH `Gesture.Tap()` + RNGH `ScrollView`를 쌍으로 사용. 같은 제스처 시스템에서 네이티브 레벨로 터치를 협상하므로 iOS에서도 첫 탭이 씹히지 않음. RN ScrollView + RNGH Tap 조합은 iOS `delayContentTouches` 문제로 첫 터치가 씹힘.

스크롤 추적은 `onScroll` JS 콜백 → `scrollY.value` 직접 세팅.
`useAnimatedScrollHandler`는 사용하지 않음 (RNGH 의존성 제거 목적).
대신 `scrollEventThrottle={16}`으로 Reanimated UI 스레드 대비 1프레임 지연 허용.

### 2-2. ScreenSheet (transparentModal 모달)

`@gorhom/bottom-sheet` v5 사용. 스크롤 ↔ 드래그 전환을 라이브러리가 내장 처리.

```
BottomSheet (snapPoints=["75%"], enablePanDownToClose)
  ├─ BottomSheetBackdrop (pressBehavior="close")
  ├─ 헤더 + X 버튼 (Pressable)
  └─ BottomSheetScrollView
       └─ children
```

- **스크롤 ↔ 드래그**: `BottomSheetScrollView`가 자동 전환 — 스크롤 맨 위에서 아래로 당기면 시트 dismiss
- **iOS/Android 동일 동작**: 라이브러리 내장 PanGesture가 플랫폼 차이 처리
- **backdrop 탭 dismiss**: `pressBehavior="close"`로 자동 처리
- **onClose → router.back()**: 시트가 닫히면 자동으로 라우트 복귀

> **규칙**: ScreenSheet 안에서 스크롤 가능한 콘텐츠는 반드시 `BottomSheetScrollView` 또는 `BottomSheetFlatList` 사용. RN 기본 ScrollView를 쓰면 드래그 전환이 동작하지 않음.

### 2-3. ChatSheet (Modal 기반 바텀시트)

```
Modal (transparent)
  ├─ Animated.View (backdrop)
  │    └─ Pressable (backdrop 탭 → close)
  └─ GestureDetector (Pan)
       └─ Animated.View (sheet)
            ├─ ChatSheetHeader
            ├─ FlatList (onScroll → scrollOffset SharedValue)
            ├─ ChatSuggestedQuestions
            └─ ChatInputBar
```

**Pan 제스처 + FlatList 공존 방식:**
- `scrollOffset` SharedValue로 FlatList 스크롤 위치 실시간 추적
- Pan `onUpdate`에서 `scrollOffset.value > 2`이면 return (FlatList에 위임)
- 스크롤 맨 위일 때만 아래로 드래그 → 시트 dismiss

### 2-4. BottomSheet (Modal 기반, 범용)

```
GestureDetector (Pan + simultaneousWithExternalGesture)
  └─ Animated.View (sheet)
       └─ RNGH ScrollView (Gesture.Native ref 공유)
```

- RNGH ScrollView + Pan이 `simultaneous` 모드로 공존
- `isScrolledToTop` 체크로 드래그 허용 범위 제어
- ChatSheet보다 단순하지만, `simultaneous` 모드에서 바운시한 느낌 발생 가능

---

## 3. expo-router 라우트 설정

### transparentModal (ScreenSheet 사용)

```typescript
const sheetOptions = {
  presentation: "transparentModal",
  animation: "none",        // ScreenSheet이 자체 애니메이션 → react-native-screens 전환 제거
  gestureEnabled: false,    // 네이티브 스와이프 dismiss 비활성화
};
```

**`animation: "none"`이 필수인 이유:**
ScreenSheet은 `withSpring`/`withTiming`으로 열기/닫기 애니메이션을 직접 처리한다.
`animation: "fade"`를 쓰면 react-native-screens가 추가 전환을 실행하고,
그 전환 중에 아래 화면으로의 터치가 블록된다 (dismiss 후 첫 터치 씹힘의 원인).

**`gestureEnabled: false`가 필수인 이유:**
네이티브 스와이프 dismiss + ScreenSheet의 커스텀 dismiss가 동시 활성화되면
첫 터치를 네이티브 시스템이 평가하느라 ~100ms 지연 발생.

### modal (네이티브 프레젠테이션)

```typescript
{ presentation: "modal", animation: "slide_from_bottom" }
```

`share`, `diary`, `feedback`, `widget-preview` 등은 네이티브 modal 프레젠테이션 사용.
X 버튼 또는 네이티브 제스처로 닫기.

---

## 4. 배경 레이어 pointerEvents

```
WeatherBackground (View)
  └─ breathingWrapper (Animated.View, pointerEvents="none")
       ├─ 레이어 A: ImageBackground + LinearGradient + TopScrim
       └─ 레이어 B: Animated.View (pointerEvents="none", opacity 크로스페이드)
            └─ ImageBackground + LinearGradient + TopScrim
  └─ sideGradient (pointerEvents="none")
  └─ {children} ← 터치는 여기서만 받음
```

**규칙**: 배경/오버레이/그라디언트 등 **시각 전용 레이어는 반드시 `pointerEvents="none"`**.
Animated.View의 기본값이 `"auto"`이므로, opacity 크로스페이드 레이어가 터치를 가로챌 수 있다.

---

## 5. 자주 발생하는 문제와 해결

### 모달 닫은 후 첫 터치 씹힘

| 원인 | 해결 |
|------|------|
| RNGH 제스처 인식기가 이전 상태에서 리셋 안 됨 | 터치 경로에서 RNGH 제거 |
| react-native-screens `fade` 전환 중 터치 블록 | `animation: "none"` |
| 네이티브 제스처 + 커스텀 제스처 동시 활성화 | `gestureEnabled: false` |
| backdrop Pressable이 opacity 0에서도 터치 소비 | dismiss 시 `pointerEvents="none"` |
| 배경 Animated.View가 터치 가로챔 | `pointerEvents="none"` |

### 드래그가 안 먹힘 / 씹힘

| 원인 | 해결 |
|------|------|
| Pan 제스처와 ScrollView가 같은 RNGH 시스템에서 경쟁 | ScrollView를 RN 네이티브로 분리 |
| 드래그 존이 너무 좁음 | 오버스크롤 방식으로 전환 (모달 전체가 드래그 영역) |
| 수평/수직 판단 임계값이 까다로움 | 단순화 또는 제거 |

### 스크롤 안에서 Pressable 반응 지연

| 원인 | 해결 |
|------|------|
| Animated.ScrollView(RNGH)가 터치를 선점 | RN ScrollView 사용 |
| Gesture.Tap()이 ScrollView 제스처와 경쟁 | RN Pressable 사용 |

---

## 6. 새 컴포넌트 추가 시 체크리스트

- [ ] 터치 요소에 RNGH 사용했는가? → RN `Pressable`로 대체 가능한지 확인
- [ ] ScrollView가 RNGH import인가? → RN `react-native`에서 import
- [ ] 배경/오버레이 레이어에 `pointerEvents="none"` 있는가?
- [ ] 모달이면 `animation: "none"` + `gestureEnabled: false` 설정했는가?
- [ ] dismiss 애니메이션 중 `pointerEvents="none"` 적용했는가?

---

*최종 업데이트: 2026-04-12*
