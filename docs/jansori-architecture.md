# 잔소리 (Family Nag) 아키텍처

2026-04-19 Firebase Firestore → findthem PostgreSQL 이전 완료.

## 데이터 모델 (Prisma)

```prisma
model MalgeumConnection {
  id                String    @id @default(dbgenerated("uuid_generate_v7()"))
  senderUid         String    // Firebase Anonymous Auth uid (sender)
  recipientUid      String?   // claim 후 채워짐
  inviteCode        String    @unique @db.VarChar(6)
  status            String    @default("pending")  // pending | active
  nickname          String    // sender가 설정한 receiver 별명
  senderDisplayName String    // 수신자에게 보일 이름
  personalMessage   String    @default("")
  schedules         Json      @default("[]")       // [{hour, minute, message}]
  createdAt         DateTime  @default(now())
  lastSentAt        DateTime?
  invite            MalgeumInvite?
}

model MalgeumInvite {
  code              String   @id @db.VarChar(6)
  senderUid         String
  senderDisplayName String
  connectionId      String   @unique
  usedBy            String?  // receiver uid (claim 시 채워짐)
  expiresAt         DateTime
  createdAt         DateTime @default(now())
  connection        MalgeumConnection @relation(onDelete: Cascade)
}
```

## API 엔드포인트 (findthem Express)

| Method | 경로 | 용도 | 호출자 |
|--------|-----|-----|-------|
| POST | `/api/malgeum/invite` | sender 초대 코드 + connection 생성 | 맑음 앱 |
| GET | `/api/malgeum/invite/:code` | 초대 조회 | 웹 랜딩 |
| POST | `/api/malgeum/invite/:code/claim` | receiver 수락 | 맑음 앱 |
| GET | `/api/malgeum/connections?uid=X&role=Y` | 목록 조회 | 맑음 앱 |
| PATCH | `/api/malgeum/connections/:id` | 편집 | 맑음 앱 |
| DELETE | `/api/malgeum/connections/:id` | 삭제 (cascade) | 맑음 앱 |
| GET | `/api/og/n/:code` | 크롤러 OG 메타 | 카카오톡/페북 등 |

**인증**: 모든 `/api/malgeum/*` 엔드포인트 `X-App-Key` 헤더 필수. sender/receiver uid는 요청 바디/쿼리에 포함.
**바이패스**: `/api/og/*` 는 `APP_KEY_BYPASS_PATHS` 에 포함 (크롤러 접근).

## 흐름

```
[맑음 앱 · Sender]
  ↓ createInvite() → POST /api/malgeum/invite
[findthem API]
  ↓ MalgeumConnection + MalgeumInvite 생성
  ↓ inviteCode 응답
[맑음 앱 · Sender]
  ↓ 카카오톡 공유 → https://example.com/n/{code}
  ↓
[수신자 브라우저]
  ↓ findthem 웹 /n/:code 라우트 매치
  ↓ fetchMalgeumInvite(code) → GET /api/malgeum/invite/:code
  ↓ 발송인 + 메시지 미리보기 렌더
  ↓ "앱으로 받기" 탭
[맑음 앱 · Receiver, 설치 후]
  ↓ 딥링크 malgeum://invite?code=XXX
  ↓ claimInvite(code, receiverUid) → POST /api/malgeum/invite/:code/claim
[findthem API]
  ↓ invite.usedBy 설정 + connection.status → active
[맑음 앱 · Receiver]
  ↓ loadReceiverConnections(receiverUid)
  ↓ 스케줄 기반 로컬 알림 등록 (expo-notifications)
```

## OG 태그 (SSR)

nginx crawler map으로 UA 감지 → `/api/og/n/:code` 프록시 → Prisma 조회 → 발송인·메시지 기반 동적 OG 태그 반환.

```nginx
location ~ ^/n/([a-zA-Z0-9]+)$ {
  if ($is_crawler = 1) {
    rewrite ^/n/(.+)$ /__og_n/$1 last;
  }
  try_files /index.html =404;
}
location ^~ /__og_n/ {
  internal;
  rewrite ^/__og_n/(.+)$ /api/og/n/$1 break;
  proxy_pass http://localhost:4000;
}
```

## 마이그레이션 히스토리

- **2026-04-19**: Firebase Firestore → PostgreSQL 이전.
  - 이유: 기존 findthem 백엔드(Prisma + Express) 재사용으로 단일 DB 유지, Firebase 서비스 계정 관리 부담 제거
  - 범위: 스키마 + API + 앱 서비스 + 웹 랜딩 모두 동시 전환
  - 마이그레이션 대상 데이터 없음 (서비스 출시 전 — 기존 Firestore 데이터 버림)
