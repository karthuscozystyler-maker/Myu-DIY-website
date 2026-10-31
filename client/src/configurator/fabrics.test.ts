import { describe, expect, it } from "vitest";
import { FABRIC_DATA } from "./fabric-data";
import { FABRICS, getFabric } from "./fabrics";

const RECEIVED_FABRIC_NAMES = [
  "卡其小格紋",
  "奶油米白",
  "奶茶小方磚",
  "奶茶灰",
  "奶茶雙細線",
  "奶黃色",
  "嫩粉條紋",
  "岩岭暗灰",
  "摩卡線條",
  "暖粉色",
  "沐慕小花磚",
  "沐慕線條",
  "深咖色",
  "淺灰條紋",
  "灰白格紋",
  "經典奶茶格紋",
  "藍灰條紋",
  "藍白格紋",
  "藍綠色",
  "霧藍色",
  "霧面瓷白",
].sort();

describe("引磁布目錄", () => {
  it("只公開 21 張已收到的單布圖，不把對照表或缺圖布款當作布款", () => {
    const names = FABRICS.map(fabric => fabric.name).sort();

    expect(FABRICS).toHaveLength(21);
    expect(Object.keys(FABRIC_DATA)).toHaveLength(21);
    expect(names).toEqual(RECEIVED_FABRIC_NAMES);
    expect(names).not.toContain("引磁布顏色對照表");
    expect(names).not.toContain("法式碎花");
    expect(names).not.toContain("萬年曆(咖啡款)");
    expect(names).not.toContain("萬年曆(奶白款)");
  });

  it("每款都有唯一的小、大尺寸 SKU，方向不改變銷售規格", () => {
    for (const size of ["small", "large"] as const) {
      const skus = FABRICS.map(fabric => fabric.skus[size]);
      expect(new Set(skus)).toHaveLength(FABRICS.length);
      expect(skus.every(Boolean)).toBe(true);
    }

    FABRICS.forEach(fabric => {
      expect(fabric.skus.small).toBe(`myu-legocloth-38-${fabric.code}`);
      expect(fabric.skus.large).toBe(`myu-legocloth-70-${fabric.code}`);
    });
  });

  it("以精確原始名稱或 ID 取得相同布款，並保留岩岭暗灰原字", () => {
    FABRICS.forEach(fabric => {
      expect(getFabric(fabric.id).id).toBe(fabric.id);
      expect(getFabric(fabric.name).id).toBe(fabric.id);
    });

    expect(getFabric("岩岭暗灰")).toMatchObject({
      id: "fabric-gy",
      name: "岩岭暗灰",
      skus: {
        small: "myu-legocloth-38-gy",
        large: "myu-legocloth-70-gy",
      },
    });
  });

  it("舊 ID 仍對應實際素色／暗灰，未知值則安全回到經典奶茶格紋", () => {
    expect(getFabric("plain").id).toBe("fabric-wt");
    expect(getFabric("legacyplain").id).toBe("fabric-wt");
    expect(getFabric("slate").id).toBe("fabric-gy");
    expect(getFabric("not-a-fabric").id).toBe("gingham");
  });
});
