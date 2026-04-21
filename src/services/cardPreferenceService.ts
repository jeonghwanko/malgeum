import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import type { CardCategory } from "@/types/actions";

/** 카테고리별 탭 횟수 맵 */
export type CardTapCounts = Partial<Record<CardCategory, number>>;

/** 카드 탭 기록 (카테고리 단위) */
export async function recordCardTap(category: CardCategory): Promise<void> {
  const counts = await loadJson<CardTapCounts>(STORAGE_KEYS.CARD_TAP_COUNTS, {});
  counts[category] = (counts[category] ?? 0) + 1;
  await saveJson(STORAGE_KEYS.CARD_TAP_COUNTS, counts);
}

/** 카테고리별 탭 빈도 로드 */
export async function loadCardTapCounts(): Promise<CardTapCounts> {
  return loadJson<CardTapCounts>(STORAGE_KEYS.CARD_TAP_COUNTS, {});
}

/** 탭 총합 */
export function sumTapCounts(tapCounts: CardTapCounts): number {
  return Object.values(tapCounts).reduce((s, n) => s + (n ?? 0), 0);
}

/**
 * 카드 priority에 개인화 가중치 반영.
 * 자주 탭하는 카테고리 → priority를 최대 1 낮춤 (위로 올림).
 * 최소 탭 총합 10회 이상이어야 활성화 (cold start 방지).
 */
export function applyPersonalBoost(
  priority: number,
  category: CardCategory,
  tapCounts: CardTapCounts,
): number {
  const total = sumTapCounts(tapCounts);
  if (total < 10) return priority; // cold start — 원래 순서 유지

  const myTaps = tapCounts[category] ?? 0;
  const ratio = myTaps / total; // 0 ~ 1

  // ratio 0.3 이상이면 최대 1.0 부스트 (priority 감소 = 위로)
  const boost = Math.min(ratio * 3, 1.0);
  return Math.max(1, priority - boost);
}
