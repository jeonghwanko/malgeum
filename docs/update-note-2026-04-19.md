# 스토어 업데이트 노트 — 2026-04-19

---

## 업데이트 노트 (What's New)

### 한국어 (ko)

🌈 내 날씨 성격 공개 — 6가지 유형 · 희귀도 · 역설 문장까지
💬 맑음이 채팅 무제한 무료 + "비 알림 켜줘" 말로 설정 변경
🎯 대화형 온보딩 — 맑음이와 질문 답하며 초기 설정 완료
📇 온보딩 끝에 내 프로필 요약 카드 한눈에
🔥 예측 게임 연속 접속 배너 — 매일 돌아올 이유
💌 잔소리 웹 공유 — 앱 없어도 바로 확인 가능
👔 옷차림 추천 연동 매장 유니클로로 전환
🎨 예측 게임 버튼 배경색 iOS 렌더링 개선
🔧 네트워크 에러 로깅 노이즈 축소 (안정성)

### 영어 (en)

🌈 Weather Personality unlocked — 6 types with rarity & paradox insights
💬 Unlimited free Malgeum Chat — change settings just by saying "turn on rain alerts"
🎯 Conversational onboarding — set up your profile by chatting with Malgeum
📇 Profile summary card at the end of onboarding
🔥 Prediction game streak banner — a reason to come back daily
💌 Family Nag web preview — recipients can view without installing the app
👔 Clothing recommendations now link to Uniqlo
🎨 Prediction game button rendering improved on iOS
🔧 Reduced Sentry noise from expected network errors

---

## 프로모션 텍스트 (Promotional Text)

### 한국어 (ko)

날씨를 물어보고, 내 성격을 알아가세요. 매일 돌아올 이유가 생겼어요.

### 영어 (en)

Ask about the weather, discover your personality. A new reason to come back every day.

---

## 검수자 노트 (App Review Notes)

### 한국어 (Apple/Google 검수용)

이번 업데이트의 주요 변경사항:

1. **날씨 성격 바이럴 런칭**: 6가지 유형(우산 낭만가 / 아침 전략가 / 미세먼지 감시자 / 주말 계획가 / 비의 낭만가 / 폭풍 관전자)에 역설 문장과 희귀도 %를 추가했습니다. 설정 탭 > "나의 날씨 성격" 진입. 미공개 상태에선 진행도 %가 표시되어 데이터 누적을 유도합니다. 공유 카드(`/share?mode=personality`)로 SNS 공유 가능.

2. **맑음이 채팅 — 무제한 무료 + 설정 변경**: 이전 버전까지 무료 3회/일 제한이 있었으나 완전 무제한으로 변경. "비 알림 켜줘", "출근 시간 8시 30분" 같은 자연어로 설정 즉시 변경 가능 (로컬 파싱 기반 — 서버 API 호출 없이 동작).

3. **대화형 온보딩**: 기존 폼 기반 온보딩 완료 후 맑음이와의 채팅 온보딩이 자동 시작됩니다. 지하철 역, 비 알림, 미세먼지 알림, 관심사, 옷차림 스타일을 Y/N 또는 단답으로 답하며 설정합니다. 마지막에 프로필 요약 카드 + "홈 화면으로" / "내 성격 미리 보기" 버튼 노출.

4. **예측 게임 Streak 배너**: `GameStatsCard` 상단에 `🔥 N일째 예측 중` 배지를 연속 2일 이상일 때 노출. 위젯에도 작은 배지 추가.

5. **잔소리 웹 수신 페이지**: `example.com/n/:code` URL로 잔소리 받은 사람이 앱 설치 전에 발송인·메시지를 미리볼 수 있습니다. 카카오톡 공유 시 OG 태그로 발송인 이름과 메시지 프리뷰가 노출됩니다(서버 사이드 렌더링).

6. **옷차림 제휴 매장 변경**: 무신사 → 유니클로로 전환 (LinkPrice 3.5%). 템플릿 env 미설정 시 유니클로 직접 URL로 폴백(수익은 0).

7. **iOS 예측 게임 버튼 렌더링 수정**: `Pressable` style 함수 형식 안에서 inline `backgroundColor` 가 간헐적으로 무시되던 이슈를 named StyleSheet 으로 재구조화.

8. **안정성 개선**: fetch 타임아웃/취소로 발생하는 AbortError 를 Sentry 로깅에서 제외하여 노이즈 축소. 사용자에게 영향 없는 내부 최적화.

테스트 방법:
- 온보딩: 신규 설치 후 위치·알림 권한 완료 → 자동으로 맑음이 채팅 시작 → 질문 답변으로 프로필 구축
- 성격: 설정 탭 > "나의 날씨 성격" > 진행도 확인 또는 유형 공개 화면
- 채팅: 홈 > "맑음이 채팅" 배너 > "비 알림 켜줘" 입력 → 알림 토글 즉시 변경 확인
- Streak: 예측 게임에서 2일 연속 예측 후 상단 배너 노출 확인
- 잔소리: 대상자 등록 > 메시지 작성 후 "공유하기" > 카카오톡 공유 시 미리보기 카드 확인
- 옷차림: 홈 "옷차림" 카드 상세 > 색상/레이어 탭 → 유니클로 검색 페이지 열림 확인

특이사항:
- 맑음이 채팅은 AI 프록시 서버 사용. 프롬프트 인젝션 방지를 위한 서버 측 sanitization 적용.
- 잔소리 웹 페이지는 Firebase Firestore 를 읽으며, 서버에서 Firebase Admin SDK 를 통해 OG 태그용 메타데이터를 생성합니다.
- 성격 유형과 희귀도는 현재 추정 하드코딩 값입니다 (서버 집계 기반 실제 통계는 후속 업데이트).

### 영어 (Apple/Google Review Notes)

Key changes in this update:

1. **Weather Personality viral launch**: 6 types (Umbrella Romantic / Morning Strategist / Dust Watcher / Weekend Planner / Rain Romantic / Storm Watcher) with paradox insights and rarity %. Entry: Settings tab > "My Weather Personality". Before reveal, a progress % badge encourages data accumulation. Shareable card at `/share?mode=personality`.

2. **Malgeum Chat — unlimited free + settings change**: Previously limited to 3 free messages/day, now fully unlimited. Natural language settings changes like "turn on rain alerts" or "departure time 8:30" work via local parsing (no server call needed for setting changes).

3. **Conversational onboarding**: After the form-based onboarding, Malgeum automatically starts a chat onboarding. Users answer Y/N or short text for subway station, rain alerts, dust alerts, interests, and clothing style. Ends with a profile summary card + "Go to Home" / "Preview my personality" buttons.

4. **Prediction game streak banner**: `🔥 N-day streak` badge appears above `GameStatsCard` when 2+ consecutive days. Small badge also added to home widget.

5. **Family Nag web landing page**: Recipients can preview sender & message at `example.com/n/:code` before installing the app. OG tags render sender name + message preview when shared via KakaoTalk (server-side rendered).

6. **Affiliate partner change**: Musinsa → Uniqlo (LinkPrice 3.5%). Falls back to direct Uniqlo URL when env template is unset (0 revenue, no user impact).

7. **iOS Prediction Game button rendering fix**: Restructured inline `backgroundColor` inside `Pressable` style function (which was intermittently ignored on iOS) into named StyleSheet entries.

8. **Stability improvements**: AbortError (from fetch timeout/cancellation) now excluded from Sentry logging to reduce noise. Internal optimization with no user impact.

How to test:
- Onboarding: Fresh install → after location/notification permissions → Malgeum chat starts automatically → answer questions to build profile
- Personality: Settings tab > "My Weather Personality" > see progress or reveal screen
- Chat: Home > "Malgeum Chat" banner > type "turn on rain alerts" → alert toggle changes instantly
- Streak: Make predictions on 2 consecutive days > streak banner appears
- Nag: Add recipient > compose message > tap "Share" > verify preview card in KakaoTalk
- Clothing: Home "Clothing" card detail > tap a color/layer → Uniqlo search page opens

Notes:
- Malgeum Chat uses an AI proxy server with server-side sanitization against prompt injection.
- The Family Nag web page reads from Firebase Firestore via Firebase Admin SDK for OG tag metadata generation.
- Personality types and rarity values are currently hardcoded estimates (server-aggregated real stats coming in a future update).
