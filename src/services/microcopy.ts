/**
 * 마이크로카피 시스템 — 알림, 브리핑, 위젯 등에서 공통 사용
 *
 * 날씨 데이터를 받아 "정보 전달 + 풍부한 말투"의 메시지를 생성.
 * 같은 조건이라도 매번 다른 톤으로 전달 (랜덤 문구 풀).
 *
 * 사용처:
 *   - 알림 (useNotifications) — title + body
 *   - DailyBriefSheet — 오늘 브리핑 행
 *   - 위젯 — heroMessage
 */

import type { CurrentWeather, HourlyWeather, AirQuality } from "@/types/weather";
import { getClothingCopy, getPm25Status, getUvStatus, getPollenStatus } from "@/utils/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import { detectWeatherChanges } from "@/utils/recommendations";
import { formatYesterdayDiff } from "@/constants/recommendationMessages";
import { t, tRandom, getLocale } from "@/i18n";

// ── 유틸 ────────────────────────────────────────────────────────────────

const ACTION_EMOJI: Record<string, string> = {
  umbrella: "☂️", sunscreen: "🧴", mask: "😷",
  tshirt: "👕", laundry: "👕", jacket: "🧥", padded: "🧥",
  run: "🏃", running: "🏃", walk: "🚶", dumbbell: "💪",
  carwash: "🚗", picnic: "🧺", ventilation: "💨", date: "❤️",
  pollen: "🌿",
};

// ── 핵심 데이터 추출 ─────────────────────────────────────────────────────

export interface WeatherContext {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  airQuality: AirQuality | null;
  yesterdayDiff: number | null;
  locationName: string;
  nickname: string;
}

interface RainInfo {
  hasRain: boolean;
  maxPrecip: number;
  rainStartHour: number | null;
  rainStartDesc: string | null;
}

function analyzeRain(cur: CurrentWeather, hourly: HourlyWeather[]): RainInfo {
  const maxPrecip = Math.max(cur.precipitation, ...hourly.slice(0, 8).map((h) => h.precipitation));
  const hasRain = maxPrecip >= 30;
  const changes = detectWeatherChanges(hourly);
  const rainStart = changes.find((c) => c.type === "rain_start");
  return {
    hasRain,
    maxPrecip,
    rainStartHour: rainStart?.fromHour ?? null,
    rainStartDesc: rainStart?.description ?? null,
  };
}

// ── Public API: 제목 생성 ───────────────────────────────────────────────

/** 출근 알림 타이틀 — 비/체감온도 기반 랜덤 문구 */
export function pickCommuteTitle(feelsLike: number, hasRain: boolean): string {
  if (hasRain) return tRandom("mc.rainTitle");
  if (feelsLike <= 5) return tRandom("mc.coldTitle");
  if (feelsLike <= 16) return tRandom("mc.coolTitle");
  if (feelsLike <= 22) return tRandom("mc.mildTitle");
  if (feelsLike <= 27) return tRandom("mc.warmTitle");
  return tRandom("mc.hotTitle");
}

/** 퇴근 알림 타이틀 */
export function pickEveningTitle(willRain: boolean, tempDrop: number): string {
  if (willRain) return tRandom("mc.eveningRain");
  if (tempDrop >= 5) return tRandom("mc.eveningCold");
  return tRandom("mc.eveningNice");
}

/** 닉네임 붙이기 */
export function withName(nickname: string, message: string): string {
  return nickname ? t("mc.withName", { nickname, message }) : message;
}

// ── Public API: 알림 바디 생성 ──────────────────────────────────────────

export interface NotificationCopy {
  title: string;
  body: string;
}

/** 출근 알림 — 어제 대비 + 위치 + 비 시간 + 미세먼지 + UV 통합 */
export function buildCommuteCopy(ctx: WeatherContext): NotificationCopy {
  const { current: cur, hourly, airQuality: aq, yesterdayDiff, locationName, nickname } = ctx;
  const rain = analyzeRain(cur, hourly);

  const title = withName(nickname, pickCommuteTitle(cur.feelsLike, rain.hasRain));

  const parts: string[] = [];
  if (yesterdayDiff !== null && Math.abs(yesterdayDiff) >= 3) {
    const key = yesterdayDiff > 0 ? "mc.yesterdayWarmer" : "mc.yesterdayColder";
    parts.push(t(key, { diff: Math.abs(yesterdayDiff) }));
  }
  if (locationName) parts.push(locationName);
  parts.push(t("mc.feelsLike", { temp: cur.feelsLike }));
  if (rain.hasRain) {
    parts.push(rain.rainStartHour !== null
      ? t("mc.rainFromHour", { hour: rain.rainStartHour })
      : t("mc.rainPercent", { precip: rain.maxPrecip }));
  }
  if (aq && aq.aqi >= 2) parts.push(`😷 ${getPm25Status(aq.pm25).label}`);
  if (cur.uvIndex >= 6) parts.push(`🧴 UV ${cur.uvIndex}`);

  return { title, body: parts.join("\n") };
}

/** 퇴근 알림 — 날씨 변화 + 비 + 기온차 */
export function buildEveningCopy(ctx: WeatherContext): NotificationCopy {
  const { current: cur, hourly, locationName, nickname } = ctx;
  const laterHours = hourly.slice(4, 8);
  const willRain = laterHours.some((h) => h.precipitation >= 40);
  const tempDrop = laterHours.length > 0
    ? Math.round(cur.temp - Math.min(...laterHours.map((h) => h.temp)))
    : 0;

  const title = withName(nickname, pickEveningTitle(willRain, tempDrop));

  const parts: string[] = [];
  if (locationName) parts.push(locationName);
  if (willRain) {
    parts.push(t("mc.checkUmbrella"));
  } else if (tempDrop >= 5) {
    parts.push(t("mc.tempDrop", { drop: tempDrop }));
  } else {
    parts.push(t("mc.comfyCommute", { temp: cur.temp }));
  }

  return { title, body: parts.join("\n") };
}

/** 비 알림 — 비 시작 시간 포함 */
export function buildRainCopy(ctx: WeatherContext): NotificationCopy {
  const { current: cur, hourly, nickname } = ctx;
  const rain = analyzeRain(cur, hourly);
  const title = withName(nickname, t("mc.rainAlert"));
  const body = rain.rainStartDesc
    ? t("mc.rainDescUmbrella", { desc: rain.rainStartDesc })
    : t("mc.rainPercentUmbrella", { precip: rain.maxPrecip });
  return { title, body };
}

/** 미세먼지 알림 */
export function buildDustCopy(ctx: WeatherContext): NotificationCopy {
  const { airQuality: aq, nickname } = ctx;
  const label = aq ? getPm25Status(aq.pm25).label : t("weather.pm25.bad");
  return {
    title: withName(nickname, t("mc.dustLabel", { label })),
    body: t("mc.dustBody"),
  };
}

/** UV 알림 */
export function buildUvCopy(ctx: WeatherContext): NotificationCopy {
  const { current: cur, nickname } = ctx;
  const uvLabel = getUvStatus(cur.uvIndex).label;
  return {
    title: withName(nickname, t("mc.uvLabel", { label: uvLabel })),
    body: t("mc.uvBody", { uv: cur.uvIndex }),
  };
}

/** 꽃가루 알림 */
export function buildPollenCopy(ctx: WeatherContext): NotificationCopy {
  const { current: cur, nickname } = ctx;
  const pollen = getPollenStatus(cur.temp, cur.humidity, cur.windSpeed, cur.condition);
  return {
    title: withName(nickname, t("mc.pollenLabel", { label: pollen.label })),
    body: t("mc.pollenBody"),
  };
}

// ── Public API: 브리핑 행 생성 ──────────────────────────────────────────

export interface BriefLine {
  emoji: string;
  label: string;
  sub?: string;
}

/** DailyBriefSheet + 알림 공통 — 오늘의 브리핑 행 목록 */
export function buildBriefLines(ctx: WeatherContext, tempHigh: number, actionCard?: { icon: string; title: string; description: string }): BriefLine[] {
  const { current: cur, hourly, airQuality: aq, yesterdayDiff } = ctx;
  const rain = analyzeRain(cur, hourly);
  const clothing = getClothingCopy(cur.feelsLike);
  const condEmoji = getConditionEmoji(cur.condition);

  const lines: BriefLine[] = [];

  // 1. 오늘 날씨 핵심
  lines.push({ emoji: condEmoji, label: pickCommuteTitle(cur.feelsLike, rain.hasRain) });

  // 2. 기온
  lines.push({ emoji: "🌡️", label: t("mc.briefTempHigh", { temp: Math.round(tempHigh) }) });

  // 3. 어제 대비
  if (yesterdayDiff !== null && Math.abs(yesterdayDiff) >= 2) {
    lines.push({ emoji: "📅", label: formatYesterdayDiff(yesterdayDiff) });
  }

  // 4. 비 정보 (시간 포함) — 액션 카드가 우산이면 중복이므로 스킵
  const isUmbrellaCard = actionCard?.icon === "umbrella";
  if (rain.hasRain && !isUmbrellaCard) {
    const desc = rain.rainStartDesc ?? t("mc.briefPrecip", { precip: rain.maxPrecip });
    lines.push({ emoji: "☂️", label: desc });
  }

  // 5. 옷차림
  lines.push({ emoji: "👕", label: clothing });

  // 6. 미세먼지 (나쁨 이상) — 액션 카드가 마스크면 중복이므로 스킵
  const isDustCard = actionCard?.icon === "mask";
  if (aq && aq.aqi >= 2 && !isDustCard) {
    lines.push({ emoji: "😷", label: t("mc.briefDust", { label: getPm25Status(aq.pm25).label }) });
  }

  // 7. 액션 카드 1순위
  if (actionCard) {
    lines.push({
      emoji: ACTION_EMOJI[actionCard.icon] ?? "📋",
      label: actionCard.title,
      sub: isDustCard ? undefined : actionCard.description,
    });
  }

  return lines;
}

// ── Public API: 감성 한마디 (위젯 + 공유 카드) ─────────────────────────

// 시간대: dawn(0~5), morning(6~10), afternoon(11~16), evening(17~20), night(21~23)
type TimeSlot = "dawn" | "morning" | "afternoon" | "evening" | "night";

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h < 6) return "dawn";
  if (h < 11) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

// 감성 한마디 — locale별 문구 풀
const SOUL_MESSAGES_KO: Record<string, Record<TimeSlot, readonly string[]>> = {
  clear: {
    dawn:      ["새벽 하늘이 밝아와", "잠이 안 와, 너 생각에", "별이 지고 해가 떠", "이 새벽에 네가 보고 싶어"],
    morning:   ["눈이 부셔", "같이 걷고 싶어", "햇살이 따뜻해", "좋은 아침, 보고 싶어"],
    afternoon: ["너 생각나", "혼자가 싫어", "같이 봤으면", "오늘 같은 날 네가 없어"],
    evening:   ["노을이 예뻐서 슬퍼", "하늘이 물들어", "퇴근길에 네가 떠올라", "이 하늘 같이 보고 싶어"],
    night:     ["맑은 날엔", "하늘이 예뻐서 슬퍼", "별 보이는 밤에", "잘 자, 보고 싶어"],
  },
  clouds: {
    dawn:      ["새벽이 흐려", "잠에서 깼는데 네 생각", "구름 낀 새벽", "아직 어두워"],
    morning:   ["왜 생각나지", "흐린 아침이야", "하늘이 너 같아", "구름 사이로 네가 보여"],
    afternoon: ["보고 싶어", "쓸쓸하다", "멍하니 있어", "같이 있었으면"],
    evening:   ["흐린 저녁이야", "그때 생각나", "흐린 날이 좋았는데", "너랑 걸었던 저녁"],
    night:     ["구름에 달 가렸어", "외로운 밤이야", "생각이 많아", "잠이 안 와"],
  },
  rain: {
    dawn:      ["새벽비 소리에 잠 깼어", "비 오는 새벽이야", "빗소리에 네가 떠올라", "잠이 안 와"],
    morning:   ["비 소리 들려?", "우산 있어?", "비 오는 아침이야", "비 맞으며 걸었잖아"],
    afternoon: ["같이 맞고 싶어", "창문에 빗소리", "비 오는 날엔", "이 노래 알지"],
    evening:   ["퇴근길에 비가 와", "우산 하나에 둘이", "비 오는 저녁", "젖어도 괜찮았는데"],
    night:     ["연락하고 싶어", "비가 와", "빗소리가 네 목소리 같아", "비 오는 밤이야"],
  },
  drizzle: {
    dawn:      ["이슬비에 새벽이 젖어", "살짝 촉촉해", "부슬부슬 내려", "잠결에 빗소리"],
    morning:   ["부슬부슬", "살짝 젖었어", "이슬비에 옷 젖듯이", "은은하게"],
    afternoon: ["너처럼 와", "조용한 비", "스미는 것 같아", "안개 같아"],
    evening:   ["촉촉한 저녁이야", "살살 내려", "이슬비 맞으며 걸어", "조용히 젖어가"],
    night:     ["촉촉해", "조용한 밤비", "스며드는 것 같아", "이슬비 오는 밤"],
  },
  thunderstorm: {
    dawn:      ["새벽에 천둥이", "무서워, 잠이 깼어", "번개 치는 새벽", "네가 옆에 있었으면"],
    morning:   ["무서워", "옆에 있어줘", "번개 쳤어", "천둥소리에 네가 떠올라"],
    afternoon: ["심장 떨려", "꼭 안겼으면", "창문 닫아", "같이 무서워하고 싶어"],
    evening:   ["폰 쥐었어", "혼자 있어", "퇴근길 무서워", "번개가 하늘을 갈라"],
    night:     ["무서운 밤이야", "혼자 이불 속에", "천둥소리에 잠이 안 와", "안아줘"],
  },
  snow: {
    dawn:      ["새벽에 눈 왔어", "하얀 새벽이야", "눈 오는 새벽", "잠에서 깼더니 눈이야"],
    morning:   ["눈 온다", "같이 봤으면", "눈 밟는 소리", "첫눈에 네가 없어"],
    afternoon: ["혼자 왔어", "손이 시려", "따뜻했었지", "발자국 남겼어"],
    evening:   ["눈 오는 저녁이야", "이 계절엔", "녹기 전에 보고 싶어", "눈꽃이 내려"],
    night:     ["눈 오는 밤이야", "하얀 밤", "창밖에 눈이 쌓여", "잘 자, 눈이 와"],
  },
  fog: {
    dawn:      ["안개 낀 새벽이야", "흐릿한 새벽", "아무것도 안 보여", "안개 속에 너를 찾아"],
    morning:   ["안 보여", "흐릿해", "너를 찾고 있어", "안개가 걷히면 보일까"],
    afternoon: ["사라진 것 같아", "안개 속에", "뿌옇다", "생각도 안개처럼"],
    evening:   ["멀어져", "조용해", "안개 낀 저녁", "흐린 길을 걷고 있어"],
    night:     ["안개 낀 밤이야", "아무것도 안 보여", "길을 잃은 것 같아", "네가 보이지 않아"],
  },
  dust: {
    dawn:      ["답답한 새벽이야", "숨이 막혀", "맑을 날 있겠지", "먼지 낀 새벽"],
    morning:   ["답답해", "마스크 써", "탁하다", "맑은 하늘이 그리워"],
    afternoon: ["흐릿해", "네 생각에", "먼지 너머 네가 있을까", "숨이 막혀"],
    evening:   ["나가지 마", "답답한 저녁이야", "집에 있자", "탁한 하늘"],
    night:     ["맑을 날이 올까", "답답한 밤", "네 생각에 잠이 안 와", "먼지 가득한 밤"],
  },
};

const SOUL_MESSAGES_EN: Record<string, Record<TimeSlot, readonly string[]>> = {
  clear: {
    dawn:      ["Dawn sky is glowing", "Thinking of you at dawn", "Stars fade, sun rises", "Wish you were here"],
    morning:   ["So bright today", "Want to walk with you", "Warm sunshine", "Good morning, miss you"],
    afternoon: ["Thinking of you", "Don't want to be alone", "Wish you saw this", "A day like this without you"],
    evening:   ["Sunset is beautiful", "Sky is painted", "You came to mind", "Wish we watched this together"],
    night:     ["On clear nights", "Sky too pretty to be alone", "Starry night", "Goodnight, miss you"],
  },
  clouds: {
    dawn:      ["Cloudy dawn", "Woke up thinking of you", "Overcast dawn", "Still dark"],
    morning:   ["Why do I think of you", "Cloudy morning", "Sky reminds me of you", "See you through the clouds"],
    afternoon: ["Miss you", "Feeling lonely", "Just staring", "Wish you were here"],
    evening:   ["Cloudy evening", "Remember that time", "Liked cloudy days", "That evening walk together"],
    night:     ["Moon hidden by clouds", "Lonely night", "Lots on my mind", "Can't sleep"],
  },
  rain: {
    dawn:      ["Woke to rain", "Rainy dawn", "Rain reminds me of you", "Can't sleep"],
    morning:   ["Hear the rain?", "Got your umbrella?", "Rainy morning", "We walked in rain"],
    afternoon: ["Want to share the rain", "Raindrops on window", "On rainy days", "Know this song?"],
    evening:   ["Rain on the way home", "One umbrella for two", "Rainy evening", "Didn't mind getting wet"],
    night:     ["Want to call you", "It's raining", "Rain sounds like your voice", "Rainy night"],
  },
  drizzle: {
    dawn:      ["Dawn drizzle", "Slightly damp", "Light sprinkle", "Rain in my sleep"],
    morning:   ["Light drizzle", "A little wet", "Like mist on clothes", "Gentle rain"],
    afternoon: ["Comes like you", "Quiet rain", "Seeping in", "Like fog"],
    evening:   ["Damp evening", "Falling softly", "Walking in drizzle", "Quietly getting wet"],
    night:     ["Moist night", "Quiet night rain", "Seeping in", "Drizzly night"],
  },
  thunderstorm: {
    dawn:      ["Thunder at dawn", "Scared, woke up", "Lightning dawn", "Wish you were beside me"],
    morning:   ["Scared", "Stay with me", "Lightning struck", "Thunder reminds me of you"],
    afternoon: ["Heart racing", "Wish I held you", "Close the window", "Want to be scared together"],
    evening:   ["Holding my phone", "Alone", "Scary commute", "Lightning splits the sky"],
    night:     ["Scary night", "Under the covers", "Can't sleep from thunder", "Hold me"],
  },
  snow: {
    dawn:      ["It snowed at dawn", "White dawn", "Snowy dawn", "Woke up to snow"],
    morning:   ["It's snowing", "Wish you saw this", "Sound of footsteps in snow", "First snow without you"],
    afternoon: ["Came alone", "Hands are cold", "It was warm then", "Left footprints"],
    evening:   ["Snowy evening", "This season", "Want to see you before it melts", "Snowflakes falling"],
    night:     ["Snowy night", "White night", "Snow piling outside", "Goodnight, it's snowing"],
  },
  fog: {
    dawn:      ["Foggy dawn", "Hazy dawn", "Can't see anything", "Searching for you in the fog"],
    morning:   ["Can't see", "It's blurry", "Looking for you", "Will I see you when it clears?"],
    afternoon: ["Seems to have vanished", "In the fog", "Hazy", "Thoughts like fog"],
    evening:   ["Drifting away", "So quiet", "Foggy evening", "Walking the misty path"],
    night:     ["Foggy night", "Can't see anything", "Feels like being lost", "Can't find you"],
  },
  dust: {
    dawn:      ["Suffocating dawn", "Can't breathe", "Clear days will come", "Dusty dawn"],
    morning:   ["Suffocating", "Wear a mask", "Hazy", "Miss the clear sky"],
    afternoon: ["Blurry", "Thinking of you", "Are you beyond the dust?", "Hard to breathe"],
    evening:   ["Don't go out", "Stuffy evening", "Let's stay home", "Murky sky"],
    night:     ["Will clear days come?", "Stuffy night", "Can't sleep thinking of you", "Dusty night"],
  },
};

const SOUL_FALLBACK_KO: readonly string[] = ["보고 싶어", "네가 그리워", "잘 있어?", "영원히 사랑해", "보고 싶다"];
const SOUL_FALLBACK_EN: readonly string[] = ["Miss you", "Thinking of you", "How are you?", "Love you forever", "I miss you"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 날씨 + 시간대 감성 한마디 — 위젯 aiSummary, 공유 카드 등 */
export function pickSoulMessage(condition: string): string {
  const timeSlot = getTimeSlot();
  const isEn = getLocale() === "en";
  const messages = isEn ? SOUL_MESSAGES_EN : SOUL_MESSAGES_KO;
  const fallback = isEn ? SOUL_FALLBACK_EN : SOUL_FALLBACK_KO;
  const condMsgs = messages[condition];
  if (!condMsgs) return pick(fallback);
  const list = condMsgs[timeSlot];
  return pick(list);
}

// ── Public API: 잔소리 미리보기 ──────────────────────────────────────────

/** 잔소리 미리보기 메시지 — 현재 날씨 기반으로 "오늘 보냈다면 이런 메시지" 생성 */
export function buildPreviewCopy(
  current: CurrentWeather | null,
  hourly: HourlyWeather[],
  airQuality: AirQuality | null,
  nickname: string,
): NotificationCopy | null {
  if (!current || hourly.length === 0) return null;
  const ctx: WeatherContext = {
    current,
    hourly,
    airQuality,
    yesterdayDiff: null,
    locationName: "",
    nickname,
  };
  return buildCommuteCopy(ctx);
}

// ── Public API: 공유 다운로드 링크 (UTM 추적) ────────────────────────────

const BASE_DOWNLOAD_URL =
  process.env.EXPO_PUBLIC_DOWNLOAD_URL ?? "https://example.com/malgeum/download";

interface ShareCardParams {
  condition?: string;
  emotion?: string;
}

/** 공유 카드 유형별 UTM + 카드 프리뷰 파라미터가 포함된 다운로드 링크 */
export function getDownloadUrl(
  source: "weather" | "emotional" | "challenge" | "compare" | "invite" | "personality",
  params?: ShareCardParams,
): string {
  const parts = [
    `card=${source}`,
    `utm_source=share`,
    `utm_medium=${source}_card`,
    `utm_campaign=share_${source}`,
  ];
  if (params?.condition) parts.push(`condition=${encodeURIComponent(params.condition)}`);
  if (params?.emotion) parts.push(`emotion=${encodeURIComponent(params.emotion)}`);
  return `${BASE_DOWNLOAD_URL}?${parts.join("&")}`;
}

// ── Public API: 인사말 ──────────────────────────────────────────────────

/** 랜덤 인사 오프너 */
export function pickGreeting(): string {
  return tRandom("mc.greeting");
}
