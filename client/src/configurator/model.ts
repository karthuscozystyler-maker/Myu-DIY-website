import { ACCESSORY_DATA, type AccessoryId } from "./catalog-data";
import { FABRIC_DATA, type FabricId } from "./fabric-data";
import { getFabric } from "./fabrics";

export type PieceKind = AccessoryId;
export type Finish = "cream" | "charcoal";
// plain/slate are persisted legacy aliases. getFabric resolves them to a sellable fabric.
export type Pattern = FabricId | "plain" | "slate";
export type BoardKind = "large" | "small";
export type Orientation = "portrait" | "landscape";
export type Series = "entry" | "kitchen" | "bathroom" | "desk";

export type Piece = {
  id: string;
  kind: PieceKind;
  x: number;
  y: number;
  finish: Finish;
};
export type Design = {
  version: 2;
  board: BoardKind;
  orientation?: Orientation;
  pattern: Pattern;
  pieces: Piece[];
};

export type CatalogItem = {
  name: string;
  short: string;
  width: number;
  height: number;
  depth: number | null;
  dimensionsVerified: boolean;
  price: number | null;
  prices: Readonly<Record<Finish, number | null>>;
  description: string;
  packSize: number;
  /** Selling unit when not 件: the tin is a 盒 of four, the adjustable rack one 套. */
  packUnit?: "盒" | "套";
  series: readonly Series[];
  skus: Readonly<Record<Finish, string | null>>;
};

export const CATALOG: Readonly<Record<AccessoryId, CatalogItem>> =
  ACCESSORY_DATA;

export const packUnit = (item: CatalogItem) => item.packUnit ?? "盒";
/** Unit for one purchase of a single-piece item: 件, or 套 for a fixed set. */
export const pieceUnit = (item: CatalogItem) =>
  item.packUnit === "套" ? "套" : "件";
/** The tin is one SKU for both finishes; every other item is sold per colour. */
export const hasFinishChoice = (item: CatalogItem) =>
  item.skus.cream !== item.skus.charcoal;

export const SERIES = [
  { id: "entry", label: "玄關系列" },
  { id: "kitchen", label: "廚房系列" },
  { id: "bathroom", label: "浴室系列" },
  { id: "desk", label: "書檯/化妝檯系列" },
] as const satisfies readonly { id: Series; label: string }[];

export function getSeriesItems(series: Series | null): PieceKind[] {
  if (series === null) return [];
  return (Object.keys(CATALOG) as PieceKind[]).filter(kind =>
    CATALOG[kind].series.some(itemSeries => itemSeries === series)
  );
}

export const BOARDS: Record<
  BoardKind,
  { width: number; height: number; label: string; price: null }
> = {
  large: { width: 700, height: 1000, label: "70 × 100 cm", price: null },
  small: { width: 380, height: 700, label: "38 × 70 cm", price: null },
};

export function getBoard(design: Pick<Design, "board" | "orientation">) {
  const board = BOARDS[design.board];
  if ((design.orientation ?? "portrait") === "portrait") return board;

  return {
    width: board.height,
    height: board.width,
    label: `${board.height / 10} × ${board.width / 10} cm`,
    price: board.price,
  };
}

/**
 * Only accessories with verified, positive dimensions that fit the selected
 * board/orientation may be added or retained in a valid design.
 */
export function canPlacePiece(
  kind: PieceKind,
  board: BoardKind,
  orientation: Orientation = "portrait"
): boolean {
  const item = CATALOG[kind];
  const dimensions = getBoard({ board, orientation });
  return (
    item.dimensionsVerified &&
    item.width > 0 &&
    item.height > 0 &&
    item.width <= dimensions.width &&
    item.height <= dimensions.height
  );
}

export function getAccessoryPrice(
  kind: PieceKind,
  finish: Finish
): number | null {
  return CATALOG[kind].prices[finish];
}

export const INITIAL: Design = {
  version: 2,
  board: "large",
  orientation: "portrait",
  pattern: "gingham",
  pieces: [
    { id: "starter-bottles", kind: "bottles", x: 60, y: 70, finish: "cream" },
    { id: "starter-hooks", kind: "hooks", x: 390, y: 90, finish: "cream" },
    { id: "starter-knife", kind: "knife", x: 80, y: 280, finish: "cream" },
    { id: "starter-tin", kind: "tin", x: 400, y: 350, finish: "cream" },
  ],
};

export const EMPTY_DESIGN: Design = { ...INITIAL, pieces: [] };

export function constrain(
  kind: PieceKind,
  board: Design["board"],
  x: number,
  y: number,
  snap = false,
  orientation: Orientation = "portrait"
) {
  const dimensions = getBoard({ board, orientation });
  const piece = CATALOG[kind];
  const round = (value: number) => {
    const finite = Number.isFinite(value) ? value : 0;
    return snap ? Math.round(finite / 10) * 10 : Math.round(finite);
  };
  // Unverified or oversized items must never create a negative coordinate range.
  const maxX = Math.max(0, dimensions.width - Math.max(0, piece.width));
  const maxY = Math.max(0, dimensions.height - Math.max(0, piece.height));
  return {
    x: Math.max(0, Math.min(maxX, round(x))),
    y: Math.max(0, Math.min(maxY, round(y))),
  };
}

export function changeOrientation(
  design: Design,
  orientation: Orientation
): Design {
  // Do not silently clip, remove, or move a piece into an impossible board.
  if (
    design.pieces.some(
      piece => !canPlacePiece(piece.kind, design.board, orientation)
    )
  )
    return design;

  const oldBoard = getBoard(design);
  const newBoard = getBoard({ board: design.board, orientation });

  return {
    ...design,
    orientation,
    pieces: design.pieces.map(piece => {
      const item = CATALOG[piece.kind];
      const relativeCenterX = (piece.x + item.width / 2) / oldBoard.width;
      const relativeCenterY = (piece.y + item.height / 2) / oldBoard.height;
      const bounded = constrain(
        piece.kind,
        design.board,
        relativeCenterX * newBoard.width - item.width / 2,
        relativeCenterY * newBoard.height - item.height / 2,
        false,
        orientation
      );
      return { ...piece, ...bounded };
    }),
  };
}

export function resizeBoard(design: Design, board: BoardKind): Design {
  const orientation = design.orientation ?? "portrait";
  // Returning the original object lets the caller distinguish a rejected resize.
  if (
    design.pieces.some(piece => !canPlacePiece(piece.kind, board, orientation))
  )
    return design;

  const oldBoard = getBoard(design);
  const newBoard = getBoard({ board, orientation });

  return {
    ...design,
    board,
    pieces: design.pieces.map(piece => {
      const item = CATALOG[piece.kind];
      const relativeCenterX = (piece.x + item.width / 2) / oldBoard.width;
      const relativeCenterY = (piece.y + item.height / 2) / oldBoard.height;
      const bounded = constrain(
        piece.kind,
        board,
        relativeCenterX * newBoard.width - item.width / 2,
        relativeCenterY * newBoard.height - item.height / 2,
        false,
        orientation
      );
      return { ...piece, ...bounded };
    }),
  };
}

export function overlapping(design: Design): Set<string> {
  const found = new Set<string>();
  design.pieces.forEach((a, index) =>
    design.pieces.slice(index + 1).forEach(b => {
      const aa = CATALOG[a.kind];
      const bb = CATALOG[b.kind];
      if (
        a.x < b.x + bb.width &&
        a.x + aa.width > b.x &&
        a.y < b.y + bb.height &&
        a.y + aa.height > b.y
      ) {
        found.add(a.id);
        found.add(b.id);
      }
    })
  );
  return found;
}

export type SummaryRow = {
  kind: PieceKind;
  finish: Finish;
  quantity: number;
  purchaseQuantity: number;
  includedQuantity: number;
  unplacedQuantity: number;
};

export function summary(design: Design): SummaryRow[] {
  const rows = new Map<
    string,
    { kind: PieceKind; finish: Finish; quantity: number }
  >();
  for (const piece of design.pieces) {
    // The legacy tin is sold as one cream 4-pack. Preserve historical charcoal
    // placements as that same sellable cream specification.
    const finish: Finish = piece.kind === "tin" ? "cream" : piece.finish;
    const key = `${piece.kind}-${finish}`;
    const row = rows.get(key);
    if (row) row.quantity += 1;
    else rows.set(key, { kind: piece.kind, finish, quantity: 1 });
  }

  return Array.from(rows.values()).map(row => {
    const packSize = CATALOG[row.kind].packSize;
    const purchaseQuantity = Math.ceil(row.quantity / packSize);
    const includedQuantity = purchaseQuantity * packSize;
    return {
      ...row,
      purchaseQuantity,
      includedQuantity,
      unplacedQuantity: includedQuantity - row.quantity,
    };
  });
}

export function accessoryTotal(design: Design): number | null {
  let sum = 0;
  for (const row of summary(design)) {
    const unitPrice = getAccessoryPrice(row.kind, row.finish);
    if (unitPrice === null) return null;
    sum += row.purchaseQuantity * unitPrice;
  }
  return sum;
}

function isPattern(value: unknown): value is Pattern {
  return (
    value === "plain" ||
    value === "slate" ||
    (typeof value === "string" &&
      Object.prototype.hasOwnProperty.call(FABRIC_DATA, value))
  );
}

export function canReviewDesign(design: Design): boolean {
  return (
    design.pieces.length > 0 &&
    isPattern(design.pattern) &&
    Boolean(getFabric(design.pattern))
  );
}

export function total(design: Design): number | null {
  const boardPrice = getBoard(design).price;
  const accessories = accessoryTotal(design);
  return boardPrice === null || accessories === null
    ? null
    : boardPrice + accessories;
}

export function freePosition(
  design: Design,
  kind: PieceKind
): { x: number; y: number } {
  const orientation = design.orientation ?? "portrait";
  if (!canPlacePiece(kind, design.board, orientation)) return { x: 0, y: 0 };

  const board = getBoard(design);
  const item = CATALOG[kind];
  for (let y = 30; y <= board.height - item.height; y += 30) {
    for (let x = 30; x <= board.width - item.width; x += 30) {
      const candidate: Piece = { id: "candidate", kind, x, y, finish: "cream" };
      if (
        !overlapping({ ...design, pieces: [...design.pieces, candidate] }).has(
          "candidate"
        )
      )
        return { x, y };
    }
  }
  return constrain(
    kind,
    design.board,
    30 + design.pieces.length * 10,
    30 + design.pieces.length * 20,
    false,
    orientation
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBoard(value: unknown): value is BoardKind {
  return value === "large" || value === "small";
}

function isOrientation(value: unknown): value is Orientation {
  return value === "portrait" || value === "landscape";
}

function isPieceKind(value: unknown): value is PieceKind {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CATALOG, value)
  );
}

function isFinish(value: unknown): value is Finish {
  return value === "cream" || value === "charcoal";
}

export function parseDesign(raw: string): Design | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== 2 ||
      !isBoard(parsed.board) ||
      !isPattern(parsed.pattern) ||
      !Array.isArray(parsed.pieces) ||
      parsed.pieces.length > 30 ||
      (parsed.orientation !== undefined && !isOrientation(parsed.orientation))
    )
      return null;

    const orientation = parsed.orientation ?? "portrait";
    const ids = new Set<string>();
    const pieces: Piece[] = [];
    for (const candidate of parsed.pieces) {
      if (
        !isRecord(candidate) ||
        typeof candidate.id !== "string" ||
        !candidate.id ||
        ids.has(candidate.id) ||
        !isPieceKind(candidate.kind) ||
        !isFinish(candidate.finish) ||
        typeof candidate.x !== "number" ||
        typeof candidate.y !== "number" ||
        !Number.isFinite(candidate.x) ||
        !Number.isFinite(candidate.y) ||
        !canPlacePiece(candidate.kind, parsed.board, orientation)
      )
        return null;

      const bounded = constrain(
        candidate.kind,
        parsed.board,
        candidate.x,
        candidate.y,
        false,
        orientation
      );
      if (bounded.x !== candidate.x || bounded.y !== candidate.y) return null;

      ids.add(candidate.id);
      pieces.push({
        id: candidate.id,
        kind: candidate.kind,
        x: candidate.x,
        y: candidate.y,
        finish: candidate.finish,
      });
    }

    return {
      version: 2,
      board: parsed.board,
      orientation,
      pattern: parsed.pattern,
      pieces,
    };
  } catch {
    return null;
  }
}

export type History = { past: Design[]; present: Design; future: Design[] };
export type HistoryAction =
  | { type: "commit"; design: Design }
  | { type: "undo" }
  | { type: "redo" };

export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "commit") {
    if (JSON.stringify(state.present) === JSON.stringify(action.design))
      return state;
    return {
      past: [...state.past, state.present].slice(-40),
      present: action.design,
      future: [],
    };
  }
  if (action.type === "undo" && state.past.length) {
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future],
    };
  }
  if (action.type === "redo" && state.future.length) {
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
    };
  }
  return state;
}
