# 업데이트 노트 — 2026-04-13

## 인터랙션 개선

### Pull-to-Refresh 커스텀 인디케이터
- 기본 스피너 대신 날씨 이모지 유리 오브 + 8개 파티클 버스트 애니메이션
- 당기기 → 임계점 햅틱 → 로딩 맥동 → 완료 버스트 + 성공 햅틱
- iOS: scrollY 음수 기반 pull 애니메이션 / Android: 로딩+완료 애니메이션

### 온도 카운트업
- 앱 열 때 0° → 실제 기온까지 800ms 롤링 카운트업
- 노트북/글라스 양쪽 히어로 스타일 적용

### 탭 전환 애니메이션
- 아이콘 바운스 (0.82 → 1 스프링)
- 활성 점 + 라벨 스프링 입장 애니메이션
- 탭 전환 시 햅틱 피드백

### 섹션 등장 강화
- SectionReveal: translateY 20→32px + scale 0.97→1 등장 효과

## iOS 터치 근본 해결

### ActionGrid 터치 씹힘 (#6935)
- 원인: Reanimated `Animated.View(useAnimatedStyle)` 하위에서 `Pressable`이 iOS ScrollView 안에서 터치 무시 (react-native-reanimated 알려진 버그)
- 해결: ActionGrid에서 SectionReveal 래퍼 제거 + `Pressable` → `TouchableOpacity` 교체 + Reanimated 애니메이션 완전 제거

### HealthGrid 터치
- RNGH `Gesture.Tap()` + Reanimated scale → `TouchableOpacity`로 교체

### 카드 상세 모달 인라인화
- `router.push("/card-detail")` (transparentModal 라우트) → 인라인 `CardDetailModal` (RN `Modal` + `PanResponder`)
- 라우트 전환 없으므로 모달 dismiss 후 터치 씹힘 원천 차단

## 모달/시트 리팩토링

### DailyBriefSheet
- `@gorhom/bottom-sheet` → RN `Modal` + `PanResponder` 드래그 닫기
- X 닫기 버튼 추가
- Android: PanResponder를 일반 View에 적용 (RNAnimated.View에서 이동)

### ChatSheet
- `BottomSheetModal` → RN `Modal` + `KeyboardAvoidingView`
- `BottomSheetFlatList` → RN `FlatList`
- `BottomSheetTextInput` → RN `TextInput` (한글 조합형 입력 정상화)
- `GestureHandlerRootView` 래핑 (Modal 내부 RNGH 지원)
- FlatList 오버스크롤(-60pt)로 시트 닫기

### PanResponder 드래그 구분
- `onStartShouldSetPanResponder: false` — 탭은 버튼으로 전달
- `onMoveShouldSetPanResponder: dy > 10` — 10px 이상 드래그할 때만 활성화

## 나의 날씨 성격

### 개인 인사이트 화면 신규
- 기존 서비스 4개(카드탭, 피드백, 예측게임, 일기) 병렬 집계
- 성격 유형 6종: 꼼꼼형, 감성형, 승부사형, 실용형, 탐험형, 건강형
- 인사이트 카드: 관심 카테고리, 적중률, 연속 평가, 체감 성향, 예측 승률, 일기 통계
- 설정 → "나의 날씨 성격" → ScreenSheet
- feedbackHistory 1회 로드로 3개 지표 인라인 계산 (AsyncStorage 3회→0회 절감)

## GA 트래킹

### screen_view 수동 트래킹
- Firebase 자동 screen_view 비활성화 (iOS/Android)
- `usePathname()` 기반 전역 라우트 트래커 — 27개 라우트를 실제 이름으로 수집
- 기존: RNSScreen, UIViewController 등 노이즈 → home, weekly, share 등 의미 있는 이름

## 빌드/설정

### App Store 언어
- `CFBundleDevelopmentRegion: "ko"` 추가 (EN → KR 표시)

### Android ANR 수정
- `WidgetBridgeModule.kt`: SharedPreferences 쓰기 + 위젯 브로드캐스트를 IO 스레드로 이동

### Android Manifest 충돌
- `@react-native-firebase/analytics`와 `google_analytics_automatic_screen_reporting_enabled` 충돌 → `tools:replace` 추가

### 리소스 최적화
- 미사용 이미지 제거: malgeum A 6장 + C/D 폴더 10장 (~9.4MB)
- 아트 텍스처 90장 압축: 88MB → 25MB (72% 감소, quality 85)

## 유틸리티

### useHaptics 개선
- standalone 함수 export (`hapticLight`, `hapticSuccess`) — `runOnJS` 호환
- 훅과 standalone 함수가 같은 구현 공유

### sumTapCounts 추출
- `cardPreferenceService`에 `sumTapCounts()` 유틸 추가 — 3곳 중복 제거
