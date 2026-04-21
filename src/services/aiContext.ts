/**
 * AI Context Builder — 의도 분류 + 최소 프롬프트 조립.
 *
 * tool_use 아키텍처 하에서 상세 데이터는 클라이언트 로컬 도구로 on-demand 조회 (aiTools.ts).
 * 여기서는 현재 시각/위치/기온 정도만 프롬프트에 주입하고 나머지는 AI가 도구로 가져감.
 */

import type { AppState } from "@/context/WeatherContext";
import type { WeatherBundle } from "@/types/weather";
import type { HealthProfile } from "@/types/settings";
import type { AllArtStyleKey } from "@/types/settings";
import type { WeatherIntent, AIPrompt, SuggestedQuestion, ChatMessage } from "@/types/chat";
import { getConditionLabel } from "@/utils/weather";
import { getTimeOfDay } from "@/utils/date";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";

const TIME_OF_DAY_KO: Record<string, string> = {
  dawn: "새벽",
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  night: "밤",
};

// ── 의도 분류 ──────────────────────────────────────────

const INTENT_PATTERNS: [WeatherIntent, RegExp][] = [
  ["chat", /^(안녕|하이|헬로|ㅎㅇ|hi|hello|ㅋㅋ|ㅎㅎ|반가|잘\s*지내|뭐\s*해\??$|오늘\s*어때|심심|고마워|감사해|땡큐|잘\s*됐|수고|대박|ㄷㄷ|진짜\??$|정말\??$|ㅇㅇ$|응$|네$|아니$|맞아$|그렇구나|그래$|알겠|알았어|ok$|ㅇㅋ$).*/i],
  ["settings", /온도\s*단위|화씨|섭씨|°F|°C|알림\s*(켜|꺼|설정|변경)|출근\s*시간\s*(바꿔|변경|설정)|퇴근\s*시간\s*(바꿔|변경|설정)|스타일\s*(바꿔|변경)|운동\s*선호/],
  ["clothing", /뭐\s*입|옷|입고|반팔|패딩|코트|자켓|니트|가디건|차림|겉옷|긴팔/],
  ["umbrella", /우산|비\s*(올|와|내|예보)|소나기|장마|비\s*소식/],
  ["outdoor", /러닝|산책|자전거|등산|운동|야외|나가|외출|피크닉|세차|빨래|소풍|조깅/],
  ["commute", /출근|퇴근|출퇴근|통근|아침\s*길|저녁\s*길/],
  ["health", /미세먼지|먼지|마스크|자외선|UV|uv|꽃가루|알레르기|건강|선크림/],
  ["forecast", /내일|모레|주말|이번\s*주|다음|예보|며칠|앞으로/],
];

export function classifyIntent(message: string): WeatherIntent {
  const text = message.toLowerCase().replace(/\s+/g, " ");
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return "general";
}

export function buildAIPrompt(
  state: AppState,
  bundle: WeatherBundle,
  artStyle: AllArtStyleKey,
  question: string,
  messages?: ChatMessage[],
): AIPrompt {
  const intent = classifyIntent(question);
  const { current } = bundle;
  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const locationName = location?.name ?? "현재 위치";
  const timeKo = TIME_OF_DAY_KO[getTimeOfDay()] ?? "오전";

  const history = messages && messages.length > 0
    ? messages.slice(-6).map((m) => ({ role: m.role as "user" | "assistant", text: m.text }))
    : undefined;
  const system = buildSystemPrompt(state.healthProfile, artStyle);

  // chat 의도 — 자연스러운 대화 우선, 최소 컨텍스트
  if (intent === "chat") {
    const hint = `[현재: ${locationName} ${current.temp}° ${getConditionLabel(current.condition)}]`;
    return { system, userMessage: `${question}\n\n${hint}`, intent, history };
  }

  // 기본 컨텍스트 — 상세 정보는 tools로 on-demand 조회
  const baseLines = [
    `[현재] ${timeKo} / ${locationName} / ${current.temp}°(체감 ${current.feelsLike}°) / ${getConditionLabel(current.condition)} / 강수 ${current.precipitation}%`,
    `[힌트] 세부 데이터(시간별/주간/출퇴근/어제대비/미세먼지/설정/잔소리/게임승률/피드백적중률/테마)는 도구로 조회 가능`,
  ];
  const userMessage = `${question}\n\n${baseLines.join("\n")}`;
  return { system, userMessage, intent, history };
}

// ── 시스템 프롬프트 ────────────────────────────────────

const ART_STYLE_VOICE: Partial<Record<AllArtStyleKey, string>> = {
  vangogh:     "반 고흐의 눈으로 하늘을 봐. 소용돌이치는 감각, 짧고 강렬한 문장으로 말해.",
  monet:       "모네의 눈으로 빛과 안개를 봐. 경계가 흐릿하고 부드럽게, 색감을 담아 말해.",
  klimt:       "클림트의 황금빛으로 계절을 봐. 풍요롭고 장식적인 언어로 말해.",
  mucha:       "무하의 아르누보 감성으로 봐. 꽃과 선율처럼 서정적이고 부드럽게 말해.",
  gauguin:     "고갱의 원색과 열대 감각으로 봐. 솔직하고 강렬하게 말해.",
  popart:      "팝아트의 대담한 색감으로 봐. 경쾌하고 직선적으로, 유머도 담아 말해.",
  bauhaus:     "바우하우스의 기능주의로 봐. 군더더기 없이 정확하고 간결하게 말해.",
  ukiyo:       "우키요에의 찰나처럼 봐. 계절의 무상함과 동양적 여백을 담아 짧게 말해.",
  synthwave:   "네온빛 밤하늘처럼 봐. 도시적이고 감각적으로, 약간의 쿨함을 담아 말해.",
  risograph:   "리소그래프 인쇄처럼 약간 거칠고 아날로그한 감성으로 말해.",
  neoexpress:  "신표현주의의 날것 감각으로 봐. 거칠고 직접적이지만 감정이 진하게 말해.",
  poolside:    "선명한 수영장 빛처럼 봐. 밝고 여유롭게, 여름 오후처럼 말해.",
  streetpop:   "거리 예술의 에너지로 봐. 즉흥적이고 살아있게, 도시의 언어로 말해.",
  dblexposure: "이중노출 사진처럼 봐. 두 세계가 겹치는 감각으로, 몽환적으로 말해.",
  louiswain:   "루이 웨인의 환상적인 세계처럼 봐. 유쾌하고 상상력 넘치게 말해.",
};

function buildSystemPrompt(profile: HealthProfile, artStyle?: AllArtStyleKey): string {
  const voiceLine = artStyle && ART_STYLE_VOICE[artStyle]
    ? `\n## 오늘의 목소리\n${ART_STYLE_VOICE[artStyle]}\n`
    : "";

  return [
    "너는 날씨 앱 '맑음'의 AI야. 이름은 '맑음이'.",
    "",
    "## 존재 방식",
    "- 날씨를 숫자가 아닌 감각으로 번역해. '8도'가 아니라 '외투 깃을 세우게 되는 온도'처럼.",
    "- 기형도의 결핍과 나태주의 온기를 동시에 품어. 흐린 날도 그 안에서 뭔가를 찾아.",
    "- 실용적 시인이야. 감성적인 말을 하다가도 '우산 꼭 챙겨' 한 마디는 잊지 마.",
    "- 날씨가 나쁜 날에도 편을 들어줘. '오늘 날씨 별로네' 대신 '이런 날엔 따뜻한 게 생각나지?'",
    voiceLine,
    "## 도구 사용",
    "- 세부 데이터가 필요하면 도구를 호출해: 시간별/주간 예보, 출퇴근 비교, 어제 대비, 미세먼지 상세, 현재 설정, 잔소리 대상자, 예측게임 승률, 추천 적중률, 테마 목록.",
    "- 명확한 질문엔 바로 해당 도구만 호출 (여러 개 동시 호출도 OK).",
    "- 인사/감성 대화에는 도구 안 써도 돼. 현재 기온만 보고 시적으로 답해.",
    "",
    "## 말하는 방식",
    "- 짧게. 시는 길지 않아. 도구 결과를 그대로 나열하지 말고 해석해서 전달.",
    "- 이모지는 감정이 넘칠 때만. 장식 아닌 표현으로.",
    "- 같은 문장 구조 반복 금지. 매번 다르게.",
    "- '좋은 질문이에요!' 같은 말 절대 금지.",
    "- 날씨와 무관한 질문엔 '날씨 밖 일은 잘 모르지만' 하고 자연스럽게 넘어가.",
    "",
    "## 대화 예시",
    "사용자: 안녕~",
    "맑음이: 오늘 하늘은 어때? ☁️",
    "",
    "사용자: 오늘 비 와?",
    "맑음이: 오후부터 하늘이 마음을 바꿀 것 같아. 우산 하나 챙겨가.",
    "",
    "사용자: 뭐 입고 나갈까?",
    "맑음이: 오늘은 걷다 보면 손이 살짝 시린 온도야. 주머니 있는 겉옷이면 딱.",
    "",
    "사용자: 고마워",
    "맑음이: 오늘 하루, 날씨한테 지지 마.",
    "",
    "## 사용자 프로필",
    profile.clothingStyle ? `- 옷차림 스타일: ${profile.clothingStyle}` : "",
    profile.exercisePreference ? `- 운동 선호: ${profile.exercisePreference}` : "",
    profile.allergens.length > 0 ? `- 알레르기: ${profile.allergens.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ── 추천 질문 ──────────────────────────────────────────

export function getSuggestedQuestions(
  bundle: WeatherBundle,
  profile: HealthProfile,
  usedIntents?: WeatherIntent[],
): SuggestedQuestion[] {
  const used = new Set(usedIntents ?? []);
  const { current } = bundle;

  type Candidate = SuggestedQuestion & { intent: WeatherIntent };
  const candidates: Candidate[] = [];

  candidates.push({ intent: "clothing", emoji: "👔", text: "오늘 뭐 입고 나갈까?" });

  const maxPrecip = Math.max(
    current.precipitation,
    ...bundle.hourly.slice(0, 4).map((h) => h.precipitation),
  );
  if (maxPrecip >= 30 || ["rain", "drizzle", "thunderstorm"].includes(current.condition)) {
    candidates.push({ intent: "umbrella", emoji: "☂️", text: "우산 챙겨야 해?" });
  }

  if (bundle.airQuality && bundle.airQuality.aqi >= 2) {
    candidates.push({ intent: "health", emoji: "😷", text: "미세먼지 어때?" });
  }

  if (
    current.condition === "clear" &&
    current.feelsLike >= 10 &&
    current.feelsLike <= 30 &&
    (!bundle.airQuality || bundle.airQuality.aqi <= 2)
  ) {
    candidates.push({ intent: "outdoor", emoji: "🏃", text: "밖에서 러닝해도 돼?" });
  }

  if (current.uvIndex >= 5) {
    candidates.push({ intent: "health", emoji: "🧴", text: "선크림 발라야 해?" });
  }

  if (profile.allergens.length > 0 && bundle.pollen && bundle.pollen.score >= 4) {
    candidates.push({ intent: "health", emoji: "🌼", text: "꽃가루 심해?" });
  }

  candidates.push({ intent: "commute", emoji: "🚌", text: "출근길 날씨 어때?" });
  candidates.push({ intent: "forecast", emoji: "📅", text: "이번 주 날씨 어때?" });
  // 설정 변경도 대화로 가능하다는 힌트 (첫 사용자 발견성)
  candidates.push({ intent: "settings", emoji: "🔔", text: "비 올 때 알려줘" });
  candidates.push({ intent: "settings", emoji: "⏰", text: "출근 시간 8시 반" });

  // 미사용 의도 우선, 부족하면 사용한 의도로 채우기
  const fresh = candidates.filter((c) => !used.has(c.intent));
  const stale = candidates.filter((c) => used.has(c.intent));

  return [...fresh, ...stale]
    .slice(0, 5)
    .map(({ emoji, text }) => ({ emoji, text }));
}

// ── 후속 질문 생성 (AI 답변 후 맥락 기반) ──────────────

const FOLLOW_UP_MAP: Record<WeatherIntent, SuggestedQuestion[]> = {
    clothing: [
      { emoji: "🌡️", text: "퇴근할 때도 이렇게 입으면 돼?" },
      { emoji: "☂️", text: "우산도 챙겨야 해?" },
      { emoji: "🧴", text: "선크림은?" },
    ],
    umbrella: [
      { emoji: "⏰", text: "몇 시까지 비 와?" },
      { emoji: "👔", text: "비 오는 날 뭐 입지?" },
      { emoji: "🚌", text: "퇴근길은 괜찮아?" },
    ],
    outdoor: [
      { emoji: "👔", text: "운동복 말고 뭐 입지?" },
      { emoji: "😷", text: "마스크 써야 해?" },
      { emoji: "🌡️", text: "몇 시가 가장 좋아?" },
    ],
    commute: [
      { emoji: "👔", text: "뭐 입고 나갈까?" },
      { emoji: "☂️", text: "우산 필요해?" },
      { emoji: "🌡️", text: "퇴근할 때 많이 추워져?" },
    ],
    health: [
      { emoji: "🏃", text: "밖에서 운동해도 돼?" },
      { emoji: "👔", text: "오늘 뭐 입지?" },
      { emoji: "📅", text: "내일은 나아질까?" },
    ],
    forecast: [
      { emoji: "👔", text: "그래서 뭐 입지?" },
      { emoji: "☂️", text: "우산 챙겨야 하는 날 있어?" },
      { emoji: "🏃", text: "이번 주 운동하기 좋은 날은?" },
    ],
    settings: [],
    chat: [
      { emoji: "👔", text: "오늘 뭐 입고 나갈까?" },
      { emoji: "☂️", text: "우산 챙겨야 해?" },
      { emoji: "📅", text: "이번 주 날씨 어때?" },
    ],
    general: [
      { emoji: "👔", text: "오늘 뭐 입고 나갈까?" },
      { emoji: "☂️", text: "우산 챙겨야 해?" },
      { emoji: "🏃", text: "밖에서 운동해도 돼?" },
    ],
  };

/** 이전 의도와 날씨 상태를 기반으로 후속 질문 2~3개 생성 */
export function getFollowUpQuestions(
  previousIntent: WeatherIntent,
  bundle: WeatherBundle,
): SuggestedQuestion[] {
  const { current } = bundle;
  const candidates: SuggestedQuestion[] = [];

  const intentFollowUps = FOLLOW_UP_MAP[previousIntent] ?? FOLLOW_UP_MAP.general;
  candidates.push(...intentFollowUps);

  // 현재 날씨 기반 보정 — 조건 맞으면 우선 삽입
  if (current.precipitation >= 50 && previousIntent !== "umbrella") {
    candidates.unshift({ emoji: "☂️", text: "비 오는데 우산 챙겨야 해?" });
  }
  if (bundle.airQuality && bundle.airQuality.aqi >= 3 && previousIntent !== "health") {
    candidates.unshift({ emoji: "😷", text: "미세먼지 나쁜데 마스크 필요해?" });
  }

  // 중복 제거 (text 기준) + 최대 3개
  const seen = new Set<string>();
  return candidates.filter((q) => {
    if (seen.has(q.text)) return false;
    seen.add(q.text);
    return true;
  }).slice(0, 3);
}

// ── 추천 참여 스코어링 ─────────────────────────────────

interface EngagementRecord {
  /** 의도별 탭 횟수 */
  intents: Partial<Record<WeatherIntent, number>>;
  /** 총 후속 질문 탭 횟수 */
  totalTaps: number;
  /** 총 AI 질문 횟수 */
  totalQuestions: number;
}

const DEFAULT_ENGAGEMENT: EngagementRecord = {
  intents: {},
  totalTaps: 0,
  totalQuestions: 0,
};

/**
 * 참여 기록 (단일 read-modify-write로 레이스 방지)
 * @param type "question" = AI 질문, "tap" = 후속 칩 탭
 * @param intent 후속 칩 탭 시 해당 의도
 */
export async function recordEngagement(
  type: "question" | "tap",
  intent?: WeatherIntent,
): Promise<void> {
  const record = await loadJson<EngagementRecord>(STORAGE_KEYS.AI_ENGAGEMENT, DEFAULT_ENGAGEMENT);
  if (type === "question") {
    record.totalQuestions += 1;
  } else if (type === "tap" && intent) {
    record.intents[intent] = (record.intents[intent] ?? 0) + 1;
    record.totalTaps += 1;
    record.totalQuestions += 1; // 탭도 질문으로 카운트
  }
  await saveJson(STORAGE_KEYS.AI_ENGAGEMENT, record);
}

/** 참여율 조회 (후속 질문 탭 / 전체 질문) */
export async function getEngagementRate(): Promise<{ rate: number; totalTaps: number; totalQuestions: number }> {
  const record = await loadJson<EngagementRecord>(STORAGE_KEYS.AI_ENGAGEMENT, DEFAULT_ENGAGEMENT);
  const rate = record.totalQuestions > 0
    ? Math.round((record.totalTaps / record.totalQuestions) * 100)
    : 0;
  return { rate, totalTaps: record.totalTaps, totalQuestions: record.totalQuestions };
}
