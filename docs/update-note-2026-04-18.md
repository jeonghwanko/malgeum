# 스토어 업데이트 노트 — 2026-04-18

---

## 업데이트 노트 (What's New)

### 한국어 (ko)

🎪 발견 탭 전면 개편 — 내 주변 축제, 공연, 캠핑장을 한눈에
🎭 공연/축제 상세 보기 + 좋아요/댓글 기능 추가
🔍 카테고리 필터 — 축제, 공연, 캠핑을 빠르게 전환
💬 다른 사용자의 후기를 댓글로 공유하세요
🎨 발견 페이지 매거진 스타일 UI + 그라디언트 배경
🔗 홈 추천 배너 → 발견 탭 바로 이동
☀️ 자외선 차트 기간 확대 (기온·미세먼지와 동일)
🔧 공유 탭 아이콘 개선, 안정성 향상

### 영어 (en)

🎪 Discover tab redesigned — nearby festivals, shows, and camping at a glance
🎭 Detail view with likes & comments for each event
🔍 Category filters — quickly switch between festivals, shows, camping
💬 Share your thoughts with comments on any event
🎨 Magazine-style UI with gradient backgrounds
🔗 Home recommendation banners now link to Discover tab
☀️ UV chart extended to match temperature & dust charts
🔧 Share tab icon improvements, stability fixes

---

## 프로모션 텍스트 (Promotional Text)

### 한국어 (ko)

내 주변에서 지금 뭐 하지? 축제, 공연, 캠핑장을 날씨와 함께 발견하세요.

### 영어 (en)

What's happening nearby? Discover festivals, shows, and camping spots — with weather in mind.

---

## 검수자 노트 (App Review Notes)

### 한국어 (Apple/Google 검수용)

이번 업데이트의 주요 변경사항:

1. **발견 탭 (3번째 탭)**: 한국관광공사, KOPIS, 고캠핑 공공 API를 통해 사용자 위치 기반 축제/공연/캠핑장 정보를 보여줍니다. 상단 필터 칩으로 카테고리를 전환할 수 있습니다.

2. **상세 보기**: 각 콘텐츠를 탭하면 이미지, 위치, 기간 등 상세 정보를 확인할 수 있고, 좋아요와 댓글을 남길 수 있습니다. 댓글은 기기 식별자(익명)로 작성되며, 본인 댓글만 수정/삭제 가능합니다.

3. **UI 개선**: 공유 화면의 모드 탭과 발견 페이지 필터에 플랫 아이콘을 적용했습니다.

4. **홈 → 발견 연결**: 홈 화면 하단의 축제/공연/캠핑 추천 배너를 탭하면 발견 탭으로 이동합니다.

5. **자외선 차트 확장**: 홈 화면 시간별 자외선 차트를 기온/미세먼지 차트와 동일한 시간 범위로 맞추고, 3시간 간격 샘플링으로 표시 구간을 넓혔습니다.

6. **안정성 개선**: 권한 설정 화면 열기 실패 시 발생하던 예외를 안전하게 처리했습니다 (Sentry "Unable to open app settings" 오류 수정).

테스트 방법:
- 앱 실행 후 하단 3번째 탭 "발견"을 탭합니다
- 위치 권한이 허용된 상태에서 주변 축제/공연 목록이 표시됩니다
- 아무 카드를 탭하면 상세 보기가 열립니다
- 상세 보기에서 하트(좋아요) 탭, 하단 입력창에 댓글 작성이 가능합니다
- 상단 필터 칩(전체/축제/공연/캠핑)으로 카테고리를 전환할 수 있습니다
- 홈 화면 하단 추천 배너를 탭해 발견 탭으로 이동하는지 확인합니다
- 홈 화면 시간별 차트 3종(기온/미세먼지/자외선)의 가로 길이가 동일한지 확인합니다

특이사항:
- 캠핑 섹션은 날씨 조건(맑음/흐림, 체감 10도 이상, 비 없음)이 충족될 때만 노출됩니다
- 댓글/좋아요 데이터는 자체 서버(findthem)에서 관리됩니다
- 별도 로그인 없이 기기 식별자로 익명 참여합니다

### 영어 (Apple/Google Review Notes)

Key changes in this update:

1. **Discover tab (3rd tab)**: Shows nearby festivals, performances, and campsites using Korean public data APIs (KorService2, KOPIS, GoCamping) based on user location. Category filter chips at the top allow quick switching.

2. **Detail view**: Tapping any content card opens a detail screen with image, location, period, and social features (likes and comments). Comments are anonymous via device ID; users can only edit/delete their own comments.

3. **UI improvements**: Flat phosphor icons applied to share screen mode tabs and discover page filters.

4. **Home → Discover link**: Festival/performance/camping recommendation banners on the home screen now navigate to the Discover tab when tapped.

5. **UV chart extended**: The hourly UV chart on the home screen now matches the time range of the temperature/dust charts (3-hour sampling).

6. **Stability fix**: Gracefully handles rejection when opening system settings (fixes Sentry "Unable to open app settings" error).

How to test:
- Launch the app and tap the 3rd tab "Discover" (발견)
- With location permission granted, nearby festivals and performances will be listed
- Tap any card to open the detail view
- In detail view, tap the heart icon to like, use the bottom input to leave a comment
- Use filter chips (All / Festivals / Shows / Camping) to switch categories
- Tap the recommendation banners at the bottom of the home screen to navigate to the Discover tab
- Verify that the three hourly charts (temperature / dust / UV) have the same horizontal length

Notes:
- Camping section only appears when weather conditions are suitable (clear/cloudy, feels like 10°C+, no rain)
- Like/comment data is managed by our own server
- No login required — anonymous participation via device identifier
