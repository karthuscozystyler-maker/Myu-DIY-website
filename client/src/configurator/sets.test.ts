import { describe, expect, it } from "vitest";
import {
  getSetById,
  getSetVariant,
  getSetsForSeries,
  PRESET_SETS,
  setFinishForPatternName,
} from "./sets";

describe("preset sets", () => {
  it("deduplicates fixed compositions by series, board, and set number", () => {
    // 廚房 38×70 Set 6 was withdrawn (its 42.5 cm coat rack is wider than the board).
    expect(PRESET_SETS).toHaveLength(31);
    expect(getSetsForSeries("kitchen")).toHaveLength(9);
    expect(getSetsForSeries("bathroom")).toHaveLength(10);
    expect(getSetsForSeries("entry")).toHaveLength(4);
    expect(getSetsForSeries("desk")).toHaveLength(8);
    expect(new Set(PRESET_SETS.map(set => set.id)).size).toBe(
      PRESET_SETS.length
    );
  });

  it("keeps public composition and board metadata", () => {
    const kitchen = getSetById("kitchen-small-set1");
    expect(kitchen?.board).toBe("small");
    expect(kitchen?.composition).toEqual([
      { name: "瓶子收納架", quantity: 1, kind: "bottles" },
      { name: "鍋蓋架", quantity: 1 },
      { name: "六勾架", quantity: 1, kind: "hooks" },
    ]);
    // 萬年曆 fabrics are not sold.
    expect(kitchen?.variants).toHaveLength(22);
    expect(kitchen?.variants?.[0]).toMatchObject({
      patternName: "灰白格紋",
      sku: "myu-lego-s-gwp-set1",
    });
    expect(kitchen?.publicDescription).not.toMatch(/成本|毛利|ERP/);
  });

  it("resolves both available cloth patterns to one real SKU in every preset", () => {
    for (const preset of PRESET_SETS) {
      for (const name of ["經典奶茶格紋", "沐慕小花磚"]) {
        const variant = getSetVariant(preset, name);
        expect(variant?.patternName).toBe(name);
        expect(variant?.sku).toMatch(/^myu-lego-/);
      }
      expect(getSetVariant(preset, "未有的布款")).toBeUndefined();
    }
  });

  it("maps only the exact charcoal pattern name (with the accepted simplified form)", () => {
    expect(setFinishForPatternName("岩岭暗灰")).toBe("charcoal");
    expect(setFinishForPatternName("岩嶺暗灰")).toBe("charcoal");
    expect(setFinishForPatternName("岩岭灰")).toBe("cream");
    expect(setFinishForPatternName("灰白格紋")).toBe("cream");
  });
});
