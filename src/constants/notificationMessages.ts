/** 알림 문구 풀 — 같은 조건이라도 매일 다른 톤으로 전달 */

function pick(arr: readonly string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 출근: 비 ──

const COMMUTE_RAIN_TITLE = [
  "☂️ 우산 챙기고 나가세요!",
  "🌧️ 오늘은 우산이 필수예요",
  "☂️ 비 소식! 우산 넣으셨죠?",
  "🌂 접이식 우산 가방에 쏙!",
] as const;

// ── 출근: 옷차림 (체감온도 구간별) ──

const COMMUTE_COLD_TITLE = [
  "🧥 패딩 필수! 따뜻하게 나가세요",
  "🧣 추워요! 두껍게 입으세요",
  "❄️ 오늘 진짜 추워요!",
] as const;

const COMMUTE_COOL_TITLE = [
  "🧥 겉옷 하나 걸치세요",
  "👕 가디건이면 딱이에요!",
  "🍂 쌀쌀해요, 얇은 외투 추천",
] as const;

const COMMUTE_MILD_TITLE = [
  "👕 가볍게 입으면 돼요",
  "😊 긴팔 하나면 충분!",
  "🌤️ 딱 좋은 날씨예요",
] as const;

const COMMUTE_WARM_TITLE = [
  "😎 반팔 OK! 가볍게 나가세요",
  "☀️ 시원하게 입고 나가세요",
  "🩳 반팔 반바지 날씨!",
] as const;

const COMMUTE_HOT_TITLE = [
  "🥵 최대한 시원하게!",
  "💧 수분 보충 꼭 하세요",
  "🧊 더워요! 시원하게 입으세요",
] as const;

// ── 퇴근 ──

const EVENING_RAIN_TITLE = [
  "🌧️ 퇴근길 비 올 수 있어요",
  "☂️ 퇴근 전 우산 확인!",
  "🌧️ 비 예보! 서두르세요",
] as const;

const EVENING_COLD_TITLE = [
  "🧣 퇴근길 기온 뚝!",
  "🌡️ 저녁에 많이 추워져요",
  "🧥 겉옷 꼭 챙기세요",
] as const;

const EVENING_NICE_TITLE = [
  "🌇 퇴근길 날씨 좋아요",
  "✨ 오늘 수고했어요!",
  "🌆 편하게 퇴근하세요",
] as const;

// ── Public API ──

export function pickCommuteTitle(feelsLike: number, hasRain: boolean): string {
  if (hasRain) return pick(COMMUTE_RAIN_TITLE);
  if (feelsLike <= 5) return pick(COMMUTE_COLD_TITLE);
  if (feelsLike <= 16) return pick(COMMUTE_COOL_TITLE);
  if (feelsLike <= 22) return pick(COMMUTE_MILD_TITLE);
  if (feelsLike <= 27) return pick(COMMUTE_WARM_TITLE);
  return pick(COMMUTE_HOT_TITLE);
}

export function pickEveningTitle(willRain: boolean, tempDrop: number): string {
  if (willRain) return pick(EVENING_RAIN_TITLE);
  if (tempDrop >= 5) return pick(EVENING_COLD_TITLE);
  return pick(EVENING_NICE_TITLE);
}
