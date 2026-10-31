import {
  canPlacePiece,
  freePosition,
  type Design,
  type Finish,
  type Orientation,
  type Pattern,
} from "./model";
import { setItemKind, type PresetSet } from "./sets";

/** Lays a preset set's accessories out on its board so the customer can rearrange them. */
export function buildSetDesign(
  preset: PresetSet,
  pattern: Pattern,
  finish: Finish
): Design {
  const kinds = preset.composition.map(setItemKind);
  // A 38 cm-wide portrait board cannot take e.g. the 42.5 cm coat hook rack: lay it landscape.
  const orientation: Orientation = kinds.every(
    kind => !kind || canPlacePiece(kind, preset.board, "portrait")
  )
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
