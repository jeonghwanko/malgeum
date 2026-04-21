// 추천 시스템에서 사용하는 모든 UX 문구 상수
// i18n 키를 통해 번역 파일에서 문구를 가져옵니다.

import { t, tRandom } from "@/i18n";

// ── 히어로 메시지 ──────────────────────────────────────────────────────

// 외부에서 사용하는 API — 매 호출마다 랜덤 선택
export const HERO_MSG = {
  get RAIN() { return tRandom("hero.msg.rain"); },
  get SNOW() { return tRandom("hero.msg.snow"); },
  get DUST() { return tRandom("hero.msg.dust"); },
  get COLD() { return tRandom("hero.msg.cold"); },
  get HEAT() { return tRandom("hero.msg.heat"); },
  get CHILLY() { return tRandom("hero.msg.chilly"); },
  get COOL() { return tRandom("hero.msg.cool"); },
  get MILD() { return tRandom("hero.msg.mild"); },
  get WARM() { return tRandom("hero.msg.warm"); },
  get HOT() { return tRandom("hero.msg.hot"); },
};

export const HERO_SUBTEXT = {
  get SNOW() { return t("hero.subtext.snow"); },
  get DUST() { return t("hero.subtext.dust"); },
  get COLD() { return t("hero.subtext.cold"); },
  get HEAT() { return t("hero.subtext.heat"); },
};

export const HERO_BADGE = {
  get RAIN() { return t("hero.badge.rain"); },
  get SNOW() { return t("hero.badge.snow"); },
  get DUST() { return t("hero.badge.dust"); },
  get COLD() { return t("hero.badge.cold"); },
  get HEAT() { return t("hero.badge.heat"); },
  get SAFE() { return t("hero.badge.safe"); },
  get UMBRELLA() { return t("hero.badge.umbrella"); },
  get WARMER() { return t("hero.badge.warmer"); },
  get COLDER() { return t("hero.badge.colder"); },
};

// ── 어제 대비 기온 변화 메시지 ──────────────────────────────────────────

export const DELTA_MSG = {
  get MUCH_WARMER() { return t("rec.delta.muchWarmer"); },
  get WARMER() { return t("rec.delta.warmer"); },
  get MUCH_COLDER() { return t("rec.delta.muchColder"); },
  get COLDER() { return t("rec.delta.colder"); },
};

export const DELTA_SUBTEXT = {
  get MUCH_WARMER() { return t("rec.deltaSub.muchWarmer"); },
  get WARMER() { return t("rec.deltaSub.warmer"); },
  get MUCH_COLDER() { return t("rec.deltaSub.muchColder"); },
  get COLDER() { return t("rec.deltaSub.colder"); },
};

/** 어제 대비 기온 차이를 사용자에게 보여주는 단일 포맷 함수 (SSOT) */
export function formatYesterdayDiff(diff: number): string {
  if (diff === 0) return t("rec.delta.similar");
  const abs = Math.abs(diff);
  return diff > 0
    ? t("rec.delta.warmerDeg", { diff: abs })
    : t("rec.delta.colderDeg", { diff: abs });
}

export const UMBRELLA_TEXT = {
  get NEEDED() { return t("rec.umbrella.needed"); },
  get NOT_NEEDED() { return t("rec.umbrella.notNeeded"); },
  get INDOOR() { return t("rec.umbrella.indoor"); },
};

// ── 카드 타이틀 ──────────────────────────────────────────────────────

export const CARD_TITLE = {
  get UMBRELLA_MUST() { return t("rec.card.umbrellaMust"); },
  get UMBRELLA_MAYBE() { return t("rec.card.umbrellaMaybe"); },
  get CARWASH_GOOD() { return t("rec.card.carwashGood"); },
  get CARWASH_BAD() { return t("rec.card.carwashBad"); },
  get SUNSCREEN_SENSITIVE() { return t("rec.card.sunscreenSensitive"); },
  get SUNSCREEN() { return t("rec.card.sunscreen"); },
  get MASK_SENSITIVE() { return t("rec.card.maskSensitive"); },
  get MASK() { return t("rec.card.mask"); },
  get POLLEN_DANGER() { return t("rec.card.pollenDanger"); },
  get POLLEN_CAUTION() { return t("rec.card.pollenCaution"); },
  get DATE() { return t("rec.card.date"); },
  get WALK() { return t("rec.card.walk"); },
  get LAUNDRY_GOOD() { return t("rec.card.laundryGood"); },
  get LAUNDRY_BAD() { return t("rec.card.laundryBad"); },
  get VENTILATION() { return t("rec.card.ventilation"); },
};

// ── 카드 배지 ──────────────────────────────────────────────────────

export const CARD_BADGE = {
  get MUST() { return t("rec.badge.must"); },
  get REF() { return t("rec.badge.ref"); },
  get RECOMMEND() { return t("rec.badge.recommend"); },
  get BAD() { return t("rec.badge.bad"); },
  get CAUTION() { return t("rec.badge.caution"); },
  get DANGER() { return t("rec.badge.danger"); },
  get GOOD() { return t("rec.badge.good"); },
  get INDOOR() { return t("rec.badge.indoor"); },
};

// ── 카드 설명 (정적) ──────────────────────────────────────────────────

export const CARD_DESC = {
  get CARWASH_GOOD() { return t("rec.desc.carwashGood"); },
  get CARWASH_BAD() { return t("rec.desc.carwashBad"); },
  get OUTDOOR_INDOOR_RAIN() { return t("rec.desc.indoorRain"); },
  get OUTDOOR_INDOOR_DUST() { return t("rec.desc.indoorDust"); },
  get AIR_GOOD_FALLBACK() { return t("rec.desc.airGood"); },
  get DATE_AIR() { return t("rec.desc.dateAir"); },
  get VENTILATION() { return t("rec.desc.ventilation"); },
  get LAUNDRY_BAD_RAIN() { return t("rec.desc.laundryBadRain"); },
  get UV_SENSITIVE_SUFFIX() { return t("rec.desc.uvSensitive"); },
  get DUST_SENSITIVE_SUFFIX() { return t("rec.desc.dustSensitive"); },
};

// ── 운동 카드 타이틀 ──────────────────────────────────────────────────

export const EXERCISE_TITLE = {
  get RUNNING() { return t("rec.exercise.running"); },
  get CYCLING() { return t("rec.exercise.cycling"); },
  get HIKING() { return t("rec.exercise.hiking"); },
  get WALKING() { return t("rec.exercise.walking"); },
  get SWIMMING_OUTDOOR() { return t("rec.exercise.swimmingOutdoor"); },
  get INDOOR_WORKOUT() { return t("rec.exercise.indoorWorkout"); },
  get INDOOR_SWIMMING() { return t("rec.exercise.indoorSwimming"); },
  get INDOOR_DEFAULT() { return t("rec.exercise.indoorDefault"); },
};

// ── 옷차림 (히어로 서브텍스트용 짧은 버전) ────────────────────────────

export const CLOTHING_SHORT = {
  get EXTREME_COLD() { return t("rec.clothingShort.extremeCold"); },
  get COLD() { return t("rec.clothingShort.cold"); },
  get COOL() { return t("rec.clothingShort.cool"); },
  get MILD() { return t("rec.clothingShort.mild"); },
  get WARM() { return t("rec.clothingShort.warm"); },
  get HOT() { return t("rec.clothingShort.hot"); },
};

// ── 옷차림 카드 타이틀·배지 ──────────────────────────────────────────

export const CLOTHING = {
  FREEZING:    { get title() { return t("rec.clothing.freezing.title"); },    get badge() { return t("rec.clothing.freezing.badge"); } },
  VERY_COLD:   { get title() { return t("rec.clothing.veryCold.title"); },    get badge() { return t("rec.clothing.veryCold.badge"); } },
  COLD:        { get title() { return t("rec.clothing.cold.title"); },        get badge() { return t("rec.clothing.cold.badge"); } },
  COOL:        { get title() { return t("rec.clothing.cool.title"); },        get badge() { return t("rec.clothing.cool.badge"); } },
  MILD:        { get title() { return t("rec.clothing.mild.title"); },        get badge() { return t("rec.clothing.mild.badge"); } },
  WARM:        { get title() { return t("rec.clothing.warm.title"); },        get badge() { return t("rec.clothing.warm.badge"); } },
  HOT:         { get title() { return t("rec.clothing.hot.title"); },         get badge() { return t("rec.clothing.hot.badge"); } },
  EXTREME_HOT: { get title() { return t("rec.clothing.extremeHot.title"); },  get badge() { return t("rec.clothing.extremeHot.badge"); } },
};

// ── 복장 스타일 팁 ────────────────────────────────────────────────────

export const STYLE_TIP = {
  get FORMAL_COLD() { return t("rec.style.formalCold"); },
  get FORMAL_MILD() { return t("rec.style.formalMild"); },
  get FORMAL_WARM() { return t("rec.style.formalWarm"); },
  get SPORTY_COLD() { return t("rec.style.sportyCold"); },
  get SPORTY_MILD() { return t("rec.style.sportyMild"); },
  get SPORTY_WARM() { return t("rec.style.sportyWarm"); },
  get CASUAL_COLD() { return t("rec.style.casualCold"); },
  get CASUAL_MILD() { return t("rec.style.casualMild"); },
  get CASUAL_WARM() { return t("rec.style.casualWarm"); },
  get MINIMAL_COLD() { return t("rec.style.minimalCold"); },
  get MINIMAL_MILD() { return t("rec.style.minimalMild"); },
  get MINIMAL_WARM() { return t("rec.style.minimalWarm"); },
};

// ── 주간 탭 일별 팁 ──────────────────────────────────────────────────

export const DAILY_TIP = {
  get THUNDERSTORM() { return t("rec.daily.thunderstorm"); },
  get SNOW() { return t("rec.daily.snow"); },
  get HEAVY_RAIN() { return t("rec.daily.heavyRain"); },
  get RAIN() { return t("rec.daily.rain"); },
  get EXTREME_HEAT() { return t("rec.daily.extremeHeat"); },
  get HOT() { return t("rec.daily.hot"); },
  get EXTREME_COLD() { return t("rec.daily.extremeCold"); },
  get COLD() { return t("rec.daily.cold"); },
  get DUST() { return t("rec.daily.dust"); },
  get FOG() { return t("rec.daily.fog"); },
  get NICE_DAY() { return t("rec.daily.niceDay"); },
  get COLD_AVG() { return t("rec.daily.coldAvg"); },
};

// ── 출퇴근 추천 ──────────────────────────────────────────────────────

export const COMMUTE_REC = {
  get UMBRELLA() { return t("rec.commute.umbrella"); },
  get EXTRA_LAYER() { return t("rec.commute.extraLayer"); },
};

// ── 날씨 변화 감지 ────────────────────────────────────────────────────

export const WEATHER_CHANGE_DESC = {
  rainStart: (hour: number) => t("rec.change.rainStart", { hour }),
  rainStop: (hour: number) => t("rec.change.rainStop", { hour }),
  tempDrop: (hour: number, from: string, to: string) =>
    t("rec.change.tempDrop", { hour, from, to }),
};
