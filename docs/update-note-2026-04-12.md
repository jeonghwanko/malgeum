# 업데이트 노트 — 2026-04-11 ~ 04-12

## 성능 / 조작감

### 터치 반응성 전면 개선
- 홈 화면 `Animated.ScrollView` → RN `ScrollView`로 교체하여 RNGH 제스처 충돌 제거
- ActionGrid(포스트잇 카드): `Pressable` → RNGH `Gesture.Tap()` + RNGH `ScrollView` 조합으로 iOS 첫 탭 씹힘 해결
- iOS `delayContentTouches={false}` 적용 — 150ms 터치 홀드 제거
- 모달 닫은 후 첫 터치 씹힘: `animation: "none"` + `gestureEnabled: false` + dismiss 시 `pointerEvents="none"`으로 근본 해결

### 테마 변경 깜빡임 제거
- WeatherBackground 더블 버퍼링: 레이어 A/B를 항상 마운트하고 opacity만 교차 → 조건부 마운트/언마운트 깜빡임 제거
- 그라디언트 + TopScrim + 팔레트를 텍스처와 동시에 크로스페이드 (이전: 600ms 후 한꺼번에 전환)
- `getAdaptivePalette` / `getWeatherGradient`를 `useMemo`로 안정화 → 무한 렌더 루프 방지

## 모달 시트 통합 (@gorhom/bottom-sheet v5)

### 전면 도입
- `@gorhom/bottom-sheet` v5.2.9 설치
- 기존 커스텀 ScreenSheet (150줄 PanResponder/bounces 구현) → 60줄 @gorhom 래퍼
- 스크롤 ↔ 드래그 자동 전환, iOS/Android 동일 동작
- 적용 대상: edit-commute, edit-location, edit-profile, edit-allergens, edit-exercise, edit-clothing, edit-temp-unit, card-detail, feedback, diary, widget-preview, theme-preview (13개)

### ChatSheet → BottomSheetModal
- `BottomSheetModal` + `BottomSheetModalProvider`로 Portal 렌더 → FloatingTabBar 위에 표시 (z-index 문제 해결)
- `BottomSheetTextInput` 적용 → Android 키보드 포커스 정상화
- `keyboardBehavior="extend"` → Android에서 입력창이 시스템 네비게이션 바에 가려지는 문제 해결
- `useChatAnimations.ts` 훅 삭제 (83줄) — 애니메이션/Pan/scrollOffset 모두 라이브러리 내장

## AsyncStorage 최적화
- `hasFeedbackToday()`, `hasPredictedToday()`, `hasDiaryToday()`: 전체 배열 로드 → 경량 키 1개 비교로 변경
- `settlePending()`: WeeklyMaxMap 파라미터 전달 + predictions/weeklyMax 병렬 로드
- 예보 원본 저장: `WEEKLY_FORECAST` 키 신규 — 주간 탭에서 "예보 vs 실측" 비교 표시

## UI 개선
- DailyActionPills: 테마 썸네일 + 공유 + 채팅 FAB. 채팅 열리면 FAB 숨김
- DecisionHero "어제보다 N도 따뜻해요" 폰트 2단계 업 (13→17)
- ChatBubble 날씨 아이콘 깨짐: `getWeatherIcon` → `getConditionEmoji`
- diary.tsx: TextInput `autoFocus` 추가

## 문서
- `docs/gesture-architecture.md` 신규: 화면별 이벤트 처리, 라우트 설정, 트러블슈팅, 체크리스트
- `.claude/rules/architecture.md` 제스처 패턴 섹션 전면 업데이트

## 테스트
- 5개 테스트 추가 (331 → 349개 이상): 경량 키 방식 검증, 병렬 로드 + 정산 검증
