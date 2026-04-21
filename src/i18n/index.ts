import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { loadJson, saveJson } from "@/utils/storage";
import koFlat from "./ko";
import enFlat from "./en";

// ── 플랫 키 → 중첩 객체 변환 ──────────────────────────────────────────

function unflatten(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [dotKey, value] of Object.entries(flat)) {
    const parts = dotKey.split(".");
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

const ko = unflatten(koFlat as unknown as Record<string, string>);
const en = unflatten(enFlat as unknown as Record<string, string>);

// ── I18n 인스턴스 ──────────────────────────────────────────────────────

const i18n = new I18n({ ko, en });
i18n.locale = "ko"; // 기본 한국어, initLocale()에서 기기/저장 설정으로 덮어씀
i18n.defaultLocale = "ko";
i18n.enableFallback = true; // en에 없는 키는 ko로 폴백

export type Locale = "ko" | "en";
export type TranslationKey = keyof typeof koFlat;

const LOCALE_STORAGE_KEY = "@malgeum/locale";

// ── 초기화 ─────────────────────────────────────────────────────────────

/** 앱 시작 시 호출 — AsyncStorage 저장값 우선, 없으면 기기 언어 감지 */
export async function initLocale(): Promise<Locale> {
  const saved = await loadJson<Locale | null>(LOCALE_STORAGE_KEY, null);
  if (saved) {
    i18n.locale = saved;
    return saved;
  }
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? "ko";
  const locale: Locale = deviceLang === "en" ? "en" : "ko";
  i18n.locale = locale;
  return locale;
}

/** 언어 변경 — AsyncStorage 저장 + 이벤트 발행 */
export async function setLocale(locale: Locale): Promise<void> {
  i18n.locale = locale;
  await saveJson(LOCALE_STORAGE_KEY, locale);
  // 리스너에게 알림
  localeListeners.forEach((fn) => fn(locale));
}

/** 현재 locale 반환 */
export function getLocale(): Locale {
  return i18n.locale as Locale;
}

// ── 리스너 (React 훅용) ────────────────────────────────────────────────

type LocaleListener = (locale: Locale) => void;
const localeListeners = new Set<LocaleListener>();

export function addLocaleListener(fn: LocaleListener): () => void {
  localeListeners.add(fn);
  return () => localeListeners.delete(fn);
}

// ── 번역 헬퍼 ──────────────────────────────────────────────────────────

/** 번역 함수 — i18n.t() 바인딩 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/** 랜덤 메시지 풀에서 하나 선택 — prefix.0, prefix.1, ..., prefix._count */
export function tRandom(prefix: string): string {
  const count = Number(i18n.t(`${prefix}._count`));
  if (!count || isNaN(count)) return i18n.t(`${prefix}.0`);
  const idx = Math.floor(Math.random() * count);
  return i18n.t(`${prefix}.${idx}`);
}

export default i18n;
