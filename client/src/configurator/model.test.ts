import { describe, expect, it } from "vitest";
import { ACCESSORY_DATA } from "./catalog-data";
import { FABRIC_DATA } from "./fabric-data";
import { getFabric } from "./fabrics";
import {
  BOARDS,
  CATALOG,
  EMPTY_DESIGN,
  INITIAL,
  SERIES,
  accessoryTotal,
  canPlacePiece,
  canReviewDesign,
  changeOrientation,
  constrain,
  freePosition,
  getAccessoryPrice,
  getBoard,
  getSeriesItems,
  historyReducer,
  overlapping,
  parseDesign,
  resizeBoard,
  summary,
  total,
  type BoardKind,
  type Design,
  type Finish,
  type History,
  type Orientation,
  type PieceKind,
} from "./model";

const kinds = Object.keys(CATALOG) as PieceKind[];
const fabricIds = Object.keys(FABRIC_DATA);
const finishes: Finish[] = ["cream", "charcoal"];

const piece = (
  id: string,
  kind: PieceKind,
  x: number,
  y: number,
  finish: Finish = "cream"
) => ({ id, kind, x, y, finish });

const firstPlaceable = (
  board: BoardKind = "large",
  orientation: Orientation = "portrait"
): PieceKind => {
  const kind = kinds.find(candidate =>
    canPlacePiece(candidate, board, orientation)
  );
  expect(kind).toBeDefined();
  return kind!;
};

const design = (pieces: Design["pieces"], pattern = fabricIds[0]!): Design => ({
  version: 2,
  board: "large",
  pattern: pattern as Design["pattern"],
  pieces,
});

const summarizedFinish = (kind: PieceKind, finish: Finish): Finish =>
  kind === "tin" ? "cream" : finish;

describe("收納牆配置模型", () => {
  it("以來源資料作為唯一目錄，並保留四個舊配件鍵作為初始示範", () => {
    expect(CATALOG).toBe(ACCESSORY_DATA);
    expect(kinds).toHaveLength(25);
    expect(kinds).toEqual(
      expect.arrayContaining(["bottles", "hooks", "knife", "tin"])
    );
    expect(INITIAL.pieces.map(item => item.kind).sort()).toEqual([
      "bottles",
      "hooks",
      "knife",
      "tin",
    ]);
    expect(INITIAL.pieces.every(item => item.finish === "cream")).toBe(true);
    expect(overlapping(INITIAL).size).toBe(0);
  });

  it("列出来源实际归属的所有系列配件，不再假设只有厨房系列", () => {
    expect(SERIES.map(series => series.id)).toEqual([
      "entry",
      "kitchen",
      "bathroom",
      "desk",
    ]);
    for (const series of SERIES) {
      expect(getSeriesItems(series.id)).toEqual(
        kinds.filter(kind => CATALOG[kind].series.includes(series.id))
      );
    }
    expect(getSeriesItems(null)).toEqual([]);
  });

  it("公开全部 21 款来源布料，并让旧 plain/slate 名称经 getFabric 兼容", () => {
    expect(fabricIds).toHaveLength(21);
    for (const fabricId of fabricIds) {
      expect(getFabric(fabricId as Design["pattern"]).id).toBe(fabricId);
    }
    expect(getFabric("plain").id).toBe("fabric-wt");
    expect(getFabric("slate").id).toBe("fabric-gy");
  });

  it("可放置性严格依赖已核实的正尺寸和目前底板方向", () => {
    for (const kind of kinds) {
      for (const board of Object.keys(BOARDS) as BoardKind[]) {
        for (const orientation of ["portrait", "landscape"] as Orientation[]) {
          const item = CATALOG[kind];
          const dimensions = getBoard({ board, orientation });
          expect(canPlacePiece(kind, board, orientation)).toBe(
            item.dimensionsVerified &&
              item.width > 0 &&
              item.height > 0 &&
              item.width <= dimensions.width &&
              item.height <= dimensions.height
          );
        }
      }
    }
  });

  it("约束不会因为未核实或过大的资料产生负位置", () => {
    for (const kind of kinds) {
      const point = constrain(kind, "small", 99999, -99999);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("逐一读取所有布款，并能在大小底板和两个方向解析有效设计", () => {
    for (const fabricId of fabricIds) {
      for (const board of Object.keys(BOARDS) as BoardKind[]) {
        for (const orientation of ["portrait", "landscape"] as Orientation[]) {
          const kind = firstPlaceable(board, orientation);
          const parsed = parseDesign(
            JSON.stringify({
              version: 2,
              board,
              orientation,
              pattern: fabricId,
              pieces: [
                piece(`${fabricId}-${board}-${orientation}`, kind, 0, 0),
              ],
            })
          );
          expect(parsed).toMatchObject({
            version: 2,
            board,
            orientation,
            pattern: fabricId,
          });
        }
      }
    }
  });

  it("拒绝版本错误、未知布款、越界、重复 ID、非有限坐标、未核实尺寸和第 31 件", () => {
    const fitting = firstPlaceable();
    expect(parseDesign(JSON.stringify({ ...INITIAL, version: 1 }))).toBeNull();
    expect(
      parseDesign(
        JSON.stringify({
          ...INITIAL,
          pattern: "not-a-source-fabric",
          pieces: [],
        })
      )
    ).toBeNull();
    expect(
      parseDesign(
        JSON.stringify({
          ...INITIAL,
          pieces: [piece("out", fitting, -1, 0)],
        })
      )
    ).toBeNull();
    expect(
      parseDesign(
        JSON.stringify({
          ...INITIAL,
          pieces: [piece("same", fitting, 0, 0), piece("same", fitting, 0, 0)],
        })
      )
    ).toBeNull();
    expect(
      parseDesign(
        JSON.stringify({
          ...INITIAL,
          pieces: [piece("infinite", fitting, Number.POSITIVE_INFINITY, 0)],
        })
      )
    ).toBeNull();
    expect(
      parseDesign(
        JSON.stringify({
          ...INITIAL,
          pieces: Array.from({ length: 31 }, (_, index) =>
            piece(`id-${index}`, fitting, 0, 0)
          ),
        })
      )
    ).toBeNull();

    // Every received accessory now has verified dimensions; unknown kinds must still be rejected.
    expect(kinds.every(kind => canPlacePiece(kind, "large"))).toBe(true);
    expect(
      parseDesign(
        JSON.stringify({
          version: 2,
          board: "large",
          pattern: fabricIds[0],
          pieces: [piece("unknown", "not-a-kind" as PieceKind, 0, 0)],
        })
      )
    ).toBeNull();
  });

  it("四入小铁盒仍按排位数量向上取整，并保留历史 charcoal 为奶油规格", () => {
    const result = summary(
      design(
        Array.from({ length: 5 }, (_, index) =>
          piece(`tin-${index}`, "tin", index * 90, 0)
        )
      )
    );
    expect(result).toEqual([
      {
        kind: "tin",
        finish: "cream",
        quantity: 5,
        purchaseQuantity: 2,
        includedQuantity: 8,
        unplacedQuantity: 3,
      },
    ]);
    expect(
      summary(
        design([
          piece("tin-cream", "tin", 0, 0, "cream"),
          piece("tin-charcoal", "tin", 90, 0, "charcoal"),
        ])
      )[0]
    ).toMatchObject({ finish: "cream", quantity: 2, purchaseQuantity: 1 });
  });

  it("每种颜色价格直接来自来源资料，所有已收资料均有参考价", () => {
    for (const kind of kinds) {
      for (const finish of finishes) {
        expect(getAccessoryPrice(kind, finish)).toBe(
          CATALOG[kind].prices[finish]
        );
        expect(getAccessoryPrice(kind, finish)).not.toBeNull();
      }
    }

    const priced = kinds
      .flatMap(kind => finishes.map(finish => ({ kind, finish })))
      .find(
        ({ kind, finish }) =>
          getAccessoryPrice(kind, summarizedFinish(kind, finish)) !== null
      );
    expect(priced).toBeDefined();
    const expectedPrice = getAccessoryPrice(
      priced!.kind,
      summarizedFinish(priced!.kind, priced!.finish)
    );
    expect(
      accessoryTotal(
        design([piece("priced", priced!.kind, 0, 0, priced!.finish)])
      )
    ).toBe(expectedPrice);
    expect(total(design([]))).toBeNull();
  });

  it("拒绝不能容纳现有配件的缩放或旋转，并保留原设计对象", () => {
    // 隱形六勾衣帽架 is 42.5 cm wide: it fits the 70 cm side but not a 38 cm-wide board.
    const wide = kinds.find(
      kind =>
        !canPlacePiece(kind, "small", "portrait") &&
        canPlacePiece(kind, "small", "landscape")
    );
    expect(wide).toBeDefined();
    const source = design([piece("wide", wide!, 0, 0)]);
    expect(resizeBoard(source, "small")).toBe(source);
    const small = { ...source, board: "small" as const, orientation: "landscape" as const };
    expect(changeOrientation(small, "portrait")).toBe(small);
  });

  it("正常缩放、旋转、碰撞和可用位置保留既有公共接口", () => {
    const kind = firstPlaceable();
    const source = design([piece("one", kind, 10, 20)]);
    const resized = resizeBoard(source, "small");
    expect(resized.board).toBe("small");
    expect(resized.pieces).toHaveLength(1);
    const rotated = changeOrientation(source, "landscape");
    expect(rotated.orientation).toBe("landscape");

    const item = CATALOG[kind];
    expect(
      overlapping(
        design([piece("a", kind, 0, 0), piece("b", kind, item.width, 0)])
      ).size
    ).toBe(0);
    expect(
      overlapping(
        design([
          piece("a", kind, 0, 0),
          piece("b", kind, Math.max(0, item.width - 1), 0),
        ])
      ).size
    ).toBe(2);
    const point = freePosition(EMPTY_DESIGN, kind);
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeGreaterThanOrEqual(0);
  });

  it("可复核性要求至少一个配件，并允许每个来源布款", () => {
    const fitting = firstPlaceable();
    for (const fabricId of fabricIds) {
      expect(
        canReviewDesign(design([piece(fabricId, fitting, 0, 0)], fabricId))
      ).toBe(true);
    }
    expect(canReviewDesign(design([]))).toBe(false);
    expect(
      canReviewDesign({
        ...design([piece("legacy", fitting, 0, 0)]),
        pattern: "plain",
      })
    ).toBe(true);
  });

  it("撤销、重做与 40 笔历史上限保持既有接口", () => {
    const state: History = { past: [], present: INITIAL, future: [] };
    const next = { ...INITIAL, pieces: [] };
    const edited = historyReducer(state, { type: "commit", design: next });
    const undone = historyReducer(edited, { type: "undo" });
    expect(undone.present).toEqual(INITIAL);
    expect(historyReducer(undone, { type: "redo" }).present).toEqual(next);
    expect(historyReducer(edited, { type: "commit", design: next })).toBe(
      edited
    );

    const accumulated = Array.from(
      { length: 41 },
      (_, index): Design => ({
        ...INITIAL,
        pieces: index % 2 ? [] : INITIAL.pieces,
      })
    ).reduce<History>(
      (history, nextDesign) =>
        historyReducer(history, { type: "commit", design: nextDesign }),
      state
    );
    expect(accumulated.past).toHaveLength(40);
  });
});
