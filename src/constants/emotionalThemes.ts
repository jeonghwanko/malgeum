import type { WeatherCondition } from "@/types/weather";
import { t } from "@/i18n";

export interface MusicRec {
  title: string;
  artist: string;
  /** Spotify/Apple Music 검색 URL — 앱 미설치 시 웹으로 폴백 */
  url?: string;
}

export interface ArtworkRec {
  title: string;
  artist: string;
}

export interface EmotionalTheme {
  emotion: string;
  messages: string[];
  music: MusicRec[];
  artwork: ArtworkRec[];
}

// ── 계절별 보너스 플레이리스트 ─────────────────────────────────────────
type Season = "spring" | "summer" | "autumn" | "winter";

const SEASONAL_MUSIC: Record<Season, MusicRec[]> = {
  spring: [
    { title: "봄날", artist: "BTS", url: "https://open.spotify.com/search/봄날%20BTS" },
    { title: "벚꽃 엔딩", artist: "버스커버스커", url: "https://open.spotify.com/search/벚꽃엔딩" },
    { title: "봄이 좋냐", artist: "10cm", url: "https://open.spotify.com/search/봄이좋냐%2010cm" },
    { title: "꽃", artist: "박효신", url: "https://open.spotify.com/search/꽃%20박효신" },
  ],
  summer: [
    { title: "Palette", artist: "아이유", url: "https://open.spotify.com/search/Palette%20IU" },
    { title: "바다", artist: "볼빨간사춘기", url: "https://open.spotify.com/search/바다%20볼빨간사춘기" },
    { title: "여름밤의 꿈", artist: "라이너스의 담요", url: "https://open.spotify.com/search/여름밤의꿈" },
    { title: "비도 오고 그래서", artist: "헤이즈", url: "https://open.spotify.com/search/비도오고그래서" },
  ],
  autumn: [
    { title: "가을 아침", artist: "아이유", url: "https://open.spotify.com/search/가을아침%20IU" },
    { title: "가을 우체국 앞에서", artist: "윤도현", url: "https://open.spotify.com/search/가을우체국" },
    { title: "단풍", artist: "이적", url: "https://open.spotify.com/search/단풍%20이적" },
    { title: "가을 타나봐", artist: "BIGBANG", url: "https://open.spotify.com/search/가을타나봐" },
  ],
  winter: [
    { title: "눈의 꽃", artist: "박효신", url: "https://open.spotify.com/search/눈의꽃" },
    { title: "첫눈처럼 너에게 가겠다", artist: "EXO", url: "https://open.spotify.com/search/첫눈처럼%20EXO" },
    { title: "겨울잠", artist: "10cm", url: "https://open.spotify.com/search/겨울잠%2010cm" },
    { title: "크리스마스엔", artist: "아이유", url: "https://open.spotify.com/search/크리스마스엔%20IU" },
  ],
};

function getCurrentSeason(): Season {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** 현재 계절의 보너스 음악 추천 */
export function getSeasonalMusic(): MusicRec[] {
  return SEASONAL_MUSIC[getCurrentSeason()];
}

/** 현재 계절 이름 (로컬라이즈) */
export function getSeasonLabel(): string {
  const seasonKeys: Record<Season, string> = {
    spring: "emo.season.spring",
    summer: "emo.season.summer",
    autumn: "emo.season.autumn",
    winter: "emo.season.winter",
  };
  return t(seasonKeys[getCurrentSeason()]);
}

const THEMES: Record<WeatherCondition, EmotionalTheme> = {
  clear: {
    emotion: "설레임",
    messages: [
      "낯설고 어색한 사이라면\n다가가보세요",
      "오늘 같은 날씨엔\n좋아한다고 말하고 싶어요",
      "먼저 말 걸어봐요\n오늘이 딱 좋아요",
      "당신과 걷고 싶은\n날이에요",
      "설레는 마음, 그냥 두기엔\n날씨가 너무 좋아요",
      "환한 햇살처럼\n당신 생각이 밝아요",
      "좋아해요\n한번 말해봤어요",
      "오늘은 용기 내볼게요",
    ],
    music: [
      { title: "봄날", artist: "BTS", url: "https://open.spotify.com/search/봄날%20BTS" },
      { title: "Celebrity", artist: "아이유", url: "https://open.spotify.com/search/Celebrity%20IU" },
      { title: "라일락", artist: "아이유", url: "https://open.spotify.com/search/라일락%20IU" },
      { title: "신호등", artist: "이무진", url: "https://open.spotify.com/search/신호등%20이무진" },
      { title: "사랑하게 될 거야", artist: "성시경", url: "https://open.spotify.com/search/사랑하게될거야" },
    ],
    artwork: [
      { title: "인상, 해돋이", artist: "클로드 모네" },
      { title: "별이 빛나는 밤", artist: "빈센트 반 고흐" },
      { title: "라 그랑드 자트 섬의 일요일 오후", artist: "조르주 쇠라" },
    ],
  },

  rain: {
    emotion: "그리움",
    messages: [
      "보고 싶어요",
      "비 오는 날엔\n당신 생각이 나요",
      "창밖을 보다\n그대가 떠올랐어요",
      "비처럼 조용히\n당신 곁에 있고 싶어요",
      "비 소리에\n이름을 불러봤어요",
      "비가 그치면\n보러 갈게요",
      "이 비 다 맞아도\n좋을 것 같은 사람",
      "비 오는 날, 당신이 생각나는 건\n처음이 아니에요",
    ],
    music: [
      { title: "비가 오는 날엔", artist: "10cm", url: "https://open.spotify.com/search/비가오는날엔%2010cm" },
      { title: "우산", artist: "윤하", url: "https://open.spotify.com/search/우산%20윤하" },
      { title: "연애소설", artist: "아이유", url: "https://open.spotify.com/search/연애소설%20IU" },
      { title: "가을 아침", artist: "아이유", url: "https://open.spotify.com/search/가을아침%20IU" },
      { title: "비", artist: "이하이", url: "https://open.spotify.com/search/비%20이하이" },
    ],
    artwork: [
      { title: "비 오는 파리", artist: "귀스타브 카유보트" },
      { title: "우산", artist: "오귀스트 르누아르" },
      { title: "연인들", artist: "르네 마그리트" },
    ],
  },

  drizzle: {
    emotion: "조심스러움",
    messages: [
      "우산 하나에 둘이 걸어도\n될까요?",
      "이슬비처럼 조용히\n스며드는 마음이에요",
      "말 못 했던 마음\n비에 실어 보낼게요",
      "이런 날은\n그냥 옆에 있고 싶어요",
      "소리 없이 스며드는 거\n있잖아요",
      "조심스럽게, 한 발짝\n다가가도 될까요",
      "촉촉한 날\n마음도 촉촉해져요",
      "작은 빗방울처럼\n사소하지만 포근해요",
    ],
    music: [
      { title: "비 오는 날에", artist: "버스커버스커", url: "https://open.spotify.com/search/비오는날에%20버스커버스커" },
      { title: "처음엔 사랑이란 게", artist: "성시경", url: "https://open.spotify.com/search/처음엔사랑이란게%20성시경" },
      { title: "봄비", artist: "거미", url: "https://open.spotify.com/search/봄비%20거미" },
      { title: "그냥 좋은 날", artist: "로꼬", url: "https://open.spotify.com/search/그냥좋은날%20로꼬" },
    ],
    artwork: [
      { title: "우산", artist: "오귀스트 르누아르" },
      { title: "비 오는 파리", artist: "귀스타브 카유보트" },
    ],
  },

  clouds: {
    emotion: "외로움",
    messages: [
      "외로워요\n당신이 있었으면 해요",
      "흐린 날엔\n자꾸 생각나요",
      "오늘 같은 날\n옆에 있어줄 수 있어요?",
      "혼자인 것 같은\n날이에요",
      "구름처럼 흘러\n당신 곁에 가고 싶어요",
      "이런 날엔 당신\n목소리가 듣고 싶어요",
      "그냥 곁에 있어줘요",
      "멀리 있어도 가깝게 느껴지는\n사람이 있어요",
    ],
    music: [
      { title: "외로워", artist: "오마이걸", url: "https://open.spotify.com/search/외로워%20오마이걸" },
      { title: "안아줘", artist: "정준일", url: "https://open.spotify.com/search/안아줘%20정준일" },
      { title: "그 사람", artist: "어반자카파", url: "https://open.spotify.com/search/그사람%20어반자카파" },
      { title: "혼자라는 말", artist: "이석훈", url: "https://open.spotify.com/search/혼자라는말%20이석훈" },
      { title: "나의 옛날이야기", artist: "이문세", url: "https://open.spotify.com/search/나의옛날이야기%20이문세" },
    ],
    artwork: [
      { title: "안개 바다 위의 방랑자", artist: "카스파르 다비트 프리드리히" },
      { title: "수련", artist: "클로드 모네" },
      { title: "우울", artist: "에드바르트 뭉크" },
    ],
  },

  snow: {
    emotion: "따뜻함",
    messages: [
      "눈 오는 날엔\n손을 잡고 싶어요",
      "함께 걷고 싶은\n날이에요",
      "따뜻하게 안아줘도\n될까요?",
      "당신 옆이 제일\n따뜻할 것 같아요",
      "첫눈처럼\n기억될 것 같아요",
      "눈이 쌓이는 동안\n당신만 생각했어요",
      "이 순간을\n함께하고 싶어요",
      "설레는 게 눈 때문인지\n당신 때문인지",
    ],
    music: [
      { title: "눈의 꽃", artist: "박효신", url: "https://open.spotify.com/search/눈의꽃%20박효신" },
      { title: "첫눈처럼 너에게 가겠다", artist: "EXO", url: "https://open.spotify.com/search/첫눈처럼%20EXO" },
      { title: "크리스마스엔", artist: "아이유", url: "https://open.spotify.com/search/크리스마스엔%20IU" },
      { title: "Winter Child", artist: "아이유", url: "https://open.spotify.com/search/Winter%20Child%20IU" },
      { title: "내 눈물 모아", artist: "김광석", url: "https://open.spotify.com/search/내눈물모아%20김광석" },
    ],
    artwork: [
      { title: "눈 속의 까치", artist: "클로드 모네" },
      { title: "겨울 풍경", artist: "카스파르 다비트 프리드리히" },
      { title: "눈보라", artist: "J.M.W. 터너" },
    ],
  },

  fog: {
    emotion: "신비",
    messages: [
      "보이듯 말듯\n당신이 그래요",
      "안개처럼 조용히\n다가가고 싶어요",
      "이 흐릿한 날\n유독 선명한 게 있어요",
      "잘 보이지 않아도\n당신만 보여요",
      "낯설어서\n더 보고 싶어요",
      "안개가 걷히면\n당신이 보일 것 같아요",
      "아직 모르는 사이지만\n알고 싶어요",
      "가까이 있는데\n왜 이렇게 멀게 느껴지나요",
    ],
    music: [
      { title: "안개", artist: "조용필", url: "https://open.spotify.com/search/안개%20조용필" },
      { title: "거리에서", artist: "성시경", url: "https://open.spotify.com/search/거리에서%20성시경" },
      { title: "나를 찾아줘", artist: "이소라", url: "https://open.spotify.com/search/나를찾아줘%20이소라" },
      { title: "어디에도", artist: "방탄소년단", url: "https://open.spotify.com/search/어디에도%20BTS" },
    ],
    artwork: [
      { title: "안개 바다 위의 방랑자", artist: "카스파르 다비트 프리드리히" },
      { title: "런던의 안개, 워털루 다리", artist: "클로드 모네" },
    ],
  },

  thunderstorm: {
    emotion: "강렬함",
    messages: [
      "말하지 못했던 마음이\n터져나올 것 같아요",
      "이런 날엔\n솔직해지고 싶어요",
      "번개처럼 강렬하게\n당신이 생각나요",
      "좋아한다고\n소리치고 싶어요",
      "거센 비에도\n지워지지 않는 마음",
      "폭풍 같은 감정\n당신 때문이에요",
      "참기 어려운\n마음이에요",
      "이미 돌이킬 수\n없어요",
    ],
    music: [
      { title: "불꽃놀이", artist: "어반자카파", url: "https://open.spotify.com/search/불꽃놀이%20어반자카파" },
      { title: "Psycho", artist: "Red Velvet", url: "https://open.spotify.com/search/Psycho%20Red%20Velvet" },
      { title: "죽겠다는 말", artist: "바이브", url: "https://open.spotify.com/search/죽겠다는말%20바이브" },
      { title: "그대에게", artist: "소녀시대", url: "https://open.spotify.com/search/그대에게%20소녀시대" },
    ],
    artwork: [
      { title: "절규", artist: "에드바르트 뭉크" },
      { title: "폭풍 속의 눈", artist: "J.M.W. 터너" },
    ],
  },

  dust: {
    emotion: "보호",
    messages: [
      "이런 날은 당신 곁에서\n지켜주고 싶어요",
      "오늘은 나갈 핑계로\n연락해도 될까요?",
      "같이 집에 있자는 말\n사실 하고 싶었어요",
      "먼지 가득한 하루\n당신 생각은 맑아요",
      "당신 마스크는\n제가 챙길게요",
      "탁한 날에도\n선명한 게 있어요",
      "밖보다 옆에 있을 사람이\n필요한 날",
      "이럴 때일수록\n좋은 사람이 필요해요",
    ],
    music: [
      { title: "오늘 취하면 안 되는데", artist: "장범준", url: "https://open.spotify.com/search/오늘취하면%20장범준" },
      { title: "안녕이라고 말하지마", artist: "2AM", url: "https://open.spotify.com/search/안녕이라고%202AM" },
      { title: "그대에게", artist: "성시경", url: "https://open.spotify.com/search/그대에게%20성시경" },
      { title: "다 줄거야", artist: "10cm", url: "https://open.spotify.com/search/다줄거야%2010cm" },
    ],
    artwork: [
      { title: "실내의 두 연인", artist: "에드가 드가" },
      { title: "나와 마을", artist: "마르크 샤갈" },
    ],
  },
};

export function getEmotionalTheme(condition: WeatherCondition): EmotionalTheme {
  return THEMES[condition] ?? THEMES.clear;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
