import {
  CLOTHING_ITEMS,
  getClothingCategoryForFeelsLike,
  type CategoryKey,
} from "../constants/clothingItems";

// ─── getClothingCategoryForFeelsLike — 경계값 ───

describe("getClothingCategoryForFeelsLike", () => {
  it.each<[number, CategoryKey]>([
    // padding (≤ 0°C)
    [-30, "padding"],
    [-10, "padding"],
    [-1, "padding"],
    [0, "padding"],
    // coat (1~5°C)
    [1, "coat"],
    [3, "coat"],
    [5, "coat"],
    // jacket (6~10°C)
    [6, "jacket"],
    [8, "jacket"],
    [10, "jacket"],
    // knit (11~13°C)
    [11, "knit"],
    [12, "knit"],
    [13, "knit"],
    // cardigan (14~16°C)
    [14, "cardigan"],
    [15, "cardigan"],
    [16, "cardigan"],
    // longsleeve (17~22°C)
    [17, "longsleeve"],
    [20, "longsleeve"],
    [22, "longsleeve"],
    // tshirt (23~27°C)
    [23, "tshirt"],
    [25, "tshirt"],
    [27, "tshirt"],
    // shorts (≥ 28°C)
    [28, "shorts"],
    [35, "shorts"],
    [50, "shorts"],
  ])("fl=%i°C → %s", (fl, expected) => {
    expect(getClothingCategoryForFeelsLike(fl)?.key).toBe(expected);
  });

  it("returns null for NaN (방어 — API 파싱 실패 시 shorts 폴스루 방지)", () => {
    expect(getClothingCategoryForFeelsLike(NaN)).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(getClothingCategoryForFeelsLike(Infinity)).toBeNull();
    expect(getClothingCategoryForFeelsLike(-Infinity)).toBeNull();
  });

  it("handles fractional temperatures (경계는 <= 사용)", () => {
    // weatherApi.ts가 항상 반올림해 정수로 넣어주지만,
    // 분수가 들어와도 boundary 동작이 명확함을 보장.
    expect(getClothingCategoryForFeelsLike(10.0)?.key).toBe("jacket");
    expect(getClothingCategoryForFeelsLike(10.01)?.key).toBe("knit");
    expect(getClothingCategoryForFeelsLike(13.0)?.key).toBe("knit");
    expect(getClothingCategoryForFeelsLike(13.5)?.key).toBe("cardigan");
  });
});

// ─── CLOTHING_ITEMS — 데이터 무결성 ───

describe("CLOTHING_ITEMS data integrity", () => {
  const expectedCategories: CategoryKey[] = [
    "padding",
    "coat",
    "jacket",
    "knit",
    "cardigan",
    "longsleeve",
    "tshirt",
    "shorts",
  ];

  it("has exactly 8 categories", () => {
    expect(Object.keys(CLOTHING_ITEMS).sort()).toEqual([...expectedCategories].sort());
  });

  it.each(expectedCategories)("%s has exactly 3 colors", (key) => {
    expect(CLOTHING_ITEMS[key].colors).toHaveLength(3);
  });

  it.each(expectedCategories)("%s has Korean label and labelDeclarative", (key) => {
    const cat = CLOTHING_ITEMS[key];
    expect(cat.label).toBeTruthy();
    expect(cat.labelDeclarative).toBeTruthy();
    // 단정형은 "이에요" 또는 "예요"로 끝나야 함
    expect(cat.labelDeclarative).toMatch(/(이에요|예요)$/);
  });

  it("each color has key, label, swatch (hex), image", () => {
    Object.values(CLOTHING_ITEMS).forEach((cat) => {
      cat.colors.forEach((c) => {
        expect(c.key).toBeTruthy();
        expect(c.label).toBeTruthy();
        expect(c.swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.image).toBeTruthy();
      });
    });
  });

  it("color keys are unique within each category", () => {
    Object.values(CLOTHING_ITEMS).forEach((cat) => {
      const keys = cat.colors.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  it("category.key matches dictionary key", () => {
    Object.entries(CLOTHING_ITEMS).forEach(([dictKey, cat]) => {
      expect(cat.key).toBe(dictKey);
    });
  });
});
