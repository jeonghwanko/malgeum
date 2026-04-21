import { applyPersonalBoost, type CardTapCounts } from "../services/cardPreferenceService";

describe("applyPersonalBoost", () => {
  it("returns original priority when total taps < 10 (cold start)", () => {
    const counts: CardTapCounts = { clothing: 5, umbrella: 3 };
    expect(applyPersonalBoost(3, "clothing", counts)).toBe(3);
  });

  it("boosts priority for frequently tapped category", () => {
    const counts: CardTapCounts = { clothing: 8, umbrella: 2, health: 2 };
    // total = 12, clothing ratio = 8/12 ≈ 0.67, boost = min(0.67*3, 1) = 1.0
    const boosted = applyPersonalBoost(3, "clothing", counts);
    expect(boosted).toBeLessThan(3);
    expect(boosted).toBeGreaterThanOrEqual(1);
  });

  it("does not boost rarely tapped category", () => {
    const counts: CardTapCounts = { clothing: 8, umbrella: 1, health: 1, outdoor: 1 };
    // total = 11, umbrella ratio = 1/11 ≈ 0.09, boost = 0.09*3 = 0.27
    const boosted = applyPersonalBoost(3, "umbrella", counts);
    expect(boosted).toBeCloseTo(2.73, 1);
  });

  it("never reduces priority below 1", () => {
    const counts: CardTapCounts = { clothing: 20 };
    // total = 20, ratio = 1.0, boost = 1.0, priority 1 - 1 = 0 → clamped to 1
    expect(applyPersonalBoost(1, "clothing", counts)).toBe(1);
  });

  it("returns original priority for unknown category", () => {
    const counts: CardTapCounts = { clothing: 10, umbrella: 5 };
    // outdoor has 0 taps, ratio = 0, boost = 0
    expect(applyPersonalBoost(4, "outdoor", counts)).toBe(4);
  });

  it("handles empty tapCounts with total >= 10 edge case", () => {
    // 이론적으로 불가능하지만 방어
    expect(applyPersonalBoost(3, "clothing", {})).toBe(3);
  });

  it("max boost is 1.0 even for dominant category", () => {
    const counts: CardTapCounts = { health: 50, clothing: 1 };
    // total = 51, health ratio ≈ 0.98, boost = min(0.98*3, 1) = 1.0
    const boosted = applyPersonalBoost(3, "health", counts);
    expect(boosted).toBe(2); // 3 - 1.0 = 2
  });
});
