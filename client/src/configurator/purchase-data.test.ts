import { describe, expect, it } from "vitest";
import { FABRIC_DATA, type FabricId } from "./fabric-data";
import {
  CATALOG,
  EMPTY_DESIGN,
  getAccessoryPrice,
  type Design,
  type Finish,
  type PieceKind,
} from "./model";
import { buildDIYCartSelection } from "./cart-plan";
import { exportPlan, purchaseListText } from "./purchase-data";
import { getFabricPrice } from "./fabrics";

const kinds = Object.keys(CATALOG) as PieceKind[];
const fabricId = Object.keys(FABRIC_DATA)[0]! as FabricId;
const finishes: Finish[] = ["cream", "charcoal"];

const plan = (kind: PieceKind, finish: Finish = "cream"): Design => ({
  ...EMPTY_DESIGN,
  pattern: fabricId,
  pieces: [{ id: `${kind}-${finish}`, kind, finish, x: 0, y: 0 }],
});

describe("購買清單匯出", () => {
  it("JSON 从目录输出名称、包装数量与该颜色的实际参考单价", () => {
    for (const kind of kinds) {
      for (const finish of finishes) {
        const data = exportPlan(plan(kind, finish));
        const row = data.summary[0];
        const soldFinish = kind === "tin" ? "cream" : finish;
        expect(row).toMatchObject({
          name: CATALOG[kind].name,
          packSize: CATALOG[kind].packSize,
          purchaseUnit: CATALOG[kind].packSize > 1 ? "box" : "piece",
          referenceUnitPrice: getAccessoryPrice(kind, soldFinish),
        });
      }
    }
  });

  it("四入小铁盒按盒输出，保留未排位余数和来源单价", () => {
    const fiveTins: Design = {
      ...plan("tin"),
      pieces: Array.from({ length: 5 }, (_, index) => ({
        id: `tin-${index}`,
        kind: "tin" as const,
        finish: "cream" as const,
        x: index * 100,
        y: 50,
      })),
    };
    const data = exportPlan(fiveTins);
    expect(data.summary[0]).toMatchObject({
      name: CATALOG.tin.name,
      purchaseUnit: "box",
      packSize: 4,
      quantity: 5,
      purchaseQuantity: 2,
      includedQuantity: 8,
      unplacedQuantity: 3,
      referenceUnitPrice: CATALOG.tin.prices.cream,
    });
    // EMPTY_DESIGN is a 70×100 board of an ordinary fabric: 特價 598.
    expect(data.boardPrice).toBe(598);
    expect(data.total).toBe(2 * CATALOG.tin.prices.cream! + 598);
    expect(data.livePriceVerified).toBe(false);
    expect(data.unit).toBe("mm");
  });

  it("文字清單包括配件價、引磁布價及合共", () => {
    const design = plan("hooks", "charcoal");
    const data = exportPlan(design);
    const text = purchaseListText(design);
    expect(data.summary[0]).toMatchObject({
      name: CATALOG.hooks.name,
      referenceUnitPrice: CATALOG.hooks.prices.charcoal,
    });
    expect(data.accessorySubtotal).toBe(CATALOG.hooks.prices.charcoal);
    expect(text).toContain(`預估金額 HK$${CATALOG.hooks.prices.charcoal}`);
    expect(text).toContain("引磁布 70 × 100 cm 直放 × 1件；預估金額 HK$598");
    expect(text).toContain(`連引磁布預估合共：HK$${CATALOG.hooks.prices.charcoal! + 598}`);
    expect(text).toContain("尚未下單");
  });

  it("引磁布價：所有布同價，奶茶小方磚另計", () => {
    expect(getFabricPrice("fabric-gwp", "small")).toEqual([418, 288]);
    expect(getFabricPrice("fabric-gy", "large")).toEqual([838, 598]);
    expect(getFabricPrice("fabric-grid", "small")).toEqual([468, 328]);
    expect(getFabricPrice("fabric-grid", "large")).toEqual([948, 678]);
  });

  it("可读清单仍包含来源布名、方向、包装说明和非下单提示", () => {
    const fiveTins: Design = {
      ...plan("tin"),
      orientation: "landscape",
      pieces: Array.from({ length: 5 }, (_, index) => ({
        id: `list-tin-${index}`,
        kind: "tin" as const,
        finish: "cream" as const,
        x: index * 100,
        y: 50,
      })),
    };
    const text = purchaseListText(fiveTins);
    expect(text).toContain(`${FABRIC_DATA[fabricId].name}引磁布`);
    expect(text).toContain("100 × 70 cm 橫放");
    expect(text).toContain("2盒／每盒4入");
    expect(text).toContain("已排位5個，購買合共8個，另有3個未排位");
    expect(text).toContain("圖片與排位供參考，安裝以商品說明為準");
    expect(text).toContain("尚未下單");
  });

  it("自由調節收納架每次排位就是一套（左右兩支），並保留所選顏色", () => {
    const twoSets: Design = {
      ...plan("accessory-18", "charcoal"),
      pieces: Array.from({ length: 2 }, (_, index) => ({
        id: `rack-${index}`,
        kind: "accessory-18" as const,
        finish: "charcoal" as const,
        x: index * 300,
        y: 0,
      })),
    };
    const text = purchaseListText(twoSets);
    expect(text).toContain("自由調節收納架（岩嶺暗灰）：2套");
    expect(buildDIYCartSelection(twoSets)[0]).toMatchObject({
      sku: CATALOG["accessory-18"].skus.charcoal,
      name: "自由調節收納架（岩嶺暗灰）",
      quantity: 2,
    });
  });

  it("没有已排位配件时不会建立购买清单", () => {
    expect(() => purchaseListText(EMPTY_DESIGN)).toThrow("至少一件配件");
  });
});
