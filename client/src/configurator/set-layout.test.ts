import { describe, expect, it } from "vitest";
import { FABRICS } from "./fabrics";
import { canPlacePiece, constrain, overlapping } from "./model";
import { buildSetDesign, restyleSetDesign } from "./set-layout";
import {
  PRESET_SETS,
  getSetPrice,
  getSetVariant,
  setFinishForPatternName,
  setItemKind,
} from "./sets";

describe("預設套裝排位與價錢", () => {
  it("maps every set item to an accessory that fits the set's board", () => {
    for (const preset of PRESET_SETS) {
      const { orientation } = buildSetDesign(preset, FABRICS[0].id, "cream");
      for (const item of preset.composition) {
        const kind = setItemKind(item);
        expect(kind, `${preset.id} ${item.name}`).toBeDefined();
        expect(canPlacePiece(kind!, preset.board, orientation)).toBe(true);
      }
    }
  });

  it("fits every set on an upright board (no item wider than the fabric)", () => {
    for (const preset of PRESET_SETS)
      expect(buildSetDesign(preset, FABRICS[0].id, "cream").orientation, preset.id).toBe(
        "portrait"
      );
  });

  it("lays every set out inside its board with no overlapping pieces", () => {
    for (const preset of PRESET_SETS) {
      const design = buildSetDesign(preset, FABRICS[0].id, "cream");
      const count = preset.composition.reduce((sum, item) => sum + item.quantity, 0);
      expect(design.pieces).toHaveLength(count);
      expect(overlapping(design).size, preset.id).toBe(0);
      for (const piece of design.pieces)
        expect(
          constrain(piece.kind, design.board, piece.x, piece.y, false, design.orientation)
        ).toEqual({
          x: piece.x,
          y: piece.y,
        });
    }
  });

  it("prices every selectable fabric of every set (原價 above 特價)", () => {
    for (const preset of PRESET_SETS)
      for (const fabric of FABRICS) {
        const price = getSetPrice(getSetVariant(preset, fabric.name));
        expect(price, `${preset.id} ${fabric.name}`).toBeDefined();
        expect(price![0]).toBeGreaterThan(price![1]);
      }
  });

  it("keeps positions but follows the fabric colour rule when the fabric changes", () => {
    const preset = PRESET_SETS[0];
    const cream = buildSetDesign(preset, FABRICS[0].id, "cream");
    const grey = FABRICS.find(f => setFinishForPatternName(f.name) === "charcoal")!;
    const restyled = restyleSetDesign(cream, grey.id, "charcoal");
    expect(restyled.pieces.map(p => [p.x, p.y])).toEqual(cream.pieces.map(p => [p.x, p.y]));
    expect(restyled.pieces.every(p => p.finish === "charcoal")).toBe(true);
  });
});
