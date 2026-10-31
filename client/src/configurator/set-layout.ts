import {
  canPlacePiece,
  freePosition,
  type Design,
  type Finish,
  type Orientation,
  type Pattern,
} from "./model";
import { setItemKind, type PresetSet } from "./sets";

/** Whether every accessory of the set fits the set's board in this direction. */
export function setFits(preset: PresetSet, orientation: Orientation): boolean {
  return preset.composition.every(item => {
    const kind = setItemKind(item);
    return !kind || canPlacePiece(kind, preset.board, orientation);
  });
}

/**
 * Lays a preset set's accessories out on its board so the customer can
 * rearrange them. The size is fixed by the set; the customer may turn the
 * board, which lays the set out afresh in the new direction.
 */
export function buildSetDesign(
  preset: PresetSet,
  pattern: Pattern,
  finish: Finish,
  requested?: Orientation
): Design {
  const kinds = preset.composition.map(setItemKind);
  const orientation: Orientation =
    requested && setFits(preset, requested)
      ? requested
      : setFits(preset, "portrait")
        ? "portrait"
        : "landscape";
  let design: Design = {
    version: 2,
    board: preset.board,
    orientation,
    pattern,
    pieces: [],
  };
  for (const [index, item] of preset.composition.entries()) {
    const kind = kinds[index];
    if (!kind) continue;
    for (let copy = 0; copy < item.quantity; copy++) {
      const id = `${preset.id}-${index}-${copy}`;
      design = {
        ...design,
        pieces: [
          ...design.pieces,
          { id, kind, finish, ...freePosition(design, kind) },
        ],
      };
    }
  }
  return design;
}

/** Same layout, new fabric: accessories keep their places and follow the fabric's colour rule. */
export function restyleSetDesign(
  design: Design,
  pattern: Pattern,
  finish: Finish
): Design {
  return {
    ...design,
    pattern,
    pieces: design.pieces.map(piece => ({ ...piece, finish })),
  };
}
