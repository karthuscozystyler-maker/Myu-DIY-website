import { describe, expect, it } from "vitest";
import {
  LONG_PRESS_MOVE_TOLERANCE,
  clientPointToBoardPoint,
  exceedsLongPressMovement,
} from "./long-press";

describe("長按移動策略", () => {
  it("在 8px 內維持長按，超過門檻才取消以交還頁面捲動", () => {
    const start = { clientX: 100, clientY: 200 };

    expect(
      exceedsLongPressMovement(start, {
        clientX: 108,
        clientY: 200,
      })
    ).toBe(false);
    expect(
      exceedsLongPressMovement(start, {
        clientX: 108.1,
        clientY: 200,
      })
    ).toBe(true);
    expect(LONG_PRESS_MOVE_TOLERANCE).toBe(8);
  });

  it("以 stage 的可視座標反算底板物理座標", () => {
    expect(
      clientPointToBoardPoint(
        { clientX: 130, clientY: 260 },
        { left: 10, top: 20 },
        { boardX: 20, boardY: 40, scale: 0.5 }
      )
    ).toEqual({ x: 200, y: 400 });
  });
});
