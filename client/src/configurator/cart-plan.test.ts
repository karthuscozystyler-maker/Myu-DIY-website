import { describe, expect, it } from "vitest";
import { ACCESSORY_DATA } from "./catalog-data";
import {
  buildDIYCartSelection,
  buildSetCartSelection,
  selectionKey,
} from "./cart-plan";
import { FABRIC_DATA, type FabricId } from "./fabric-data";
import {
  CATALOG,
  EMPTY_DESIGN,
  summary,
  type Design,
  type Finish,
  type PieceKind,
} from "./model";
import { PRESET_SETS } from "./sets";

const kinds = Object.keys(CATALOG) as PieceKind[];
const fabricIds = Object.keys(FABRIC_DATA) as FabricId[];
const finishes: Finish[] = ["cream", "charcoal"];

const make = (
  pieces: Design["pieces"],
  overrides: Partial<Design> = {}
): Design => ({
  ...EMPTY_DESIGN,
  pattern: fabricIds[0]!,
  pieces,
  ...overrides,
});

const onePiece = (kind: PieceKind, finish: Finish = "cream") => [
  { id: `${kind}-${finish}`, kind, x: 0, y: 0, finish },
];

const sellableKind = (): PieceKind => {
  const kind = kinds.find(kind => CATALOG[kind].skus.cream);
  expect(kind).toBeDefined();
  return kind!;
};

describe("cart selections use source-owned sellable SKUs", () => {
  it("requires at least one accessory", () => {
    expect(() => buildDIYCartSelection(make([]))).toThrow("至少一件配件");
  });

  it("uses every source fabric's selected board SKU, independent of orientation", () => {
    const kind = sellableKind();
    for (const fabricId of fabricIds) {
      for (const board of ["small", "large"] as const) {
        const result = buildDIYCartSelection(
          make(onePiece(kind), {
            pattern: fabricId,
            board,
            orientation: "landscape",
          })
        );
        const cloth = result.find(line => line.role === "cloth");
        expect(cloth).toMatchObject({
          sku: FABRIC_DATA[fabricId].skus[board],
          quantity: 1,
          unit: "piece",
          role: "cloth",
        });
        expect(result.at(-1)?.role).toBe("cloth");
      }
    }
  });

  it("uses every source accessory SKU by sold finish and fails closed when one is absent", () => {
    expect(CATALOG).toBe(ACCESSORY_DATA);
    const fabric = fabricIds[0]!;
    for (const kind of kinds) {
      for (const finish of finishes) {
        const design = make(onePiece(kind, finish), { pattern: fabric });
        const soldFinish = kind === "tin" ? "cream" : finish;
        const expectedSku = CATALOG[kind].skus[soldFinish];
        if (expectedSku === null) {
          expect(() => buildDIYCartSelection(design)).toThrow("SKU");
        } else {
          const accessory = buildDIYCartSelection(design).find(
            line => line.role === "accessory"
          );
          expect(accessory).toMatchObject({
            sku: expectedSku,
            quantity: 1,
            unit: CATALOG[kind].packSize > 1 ? "box" : "piece",
          });
        }
      }
    }
  });

  it("keeps every received accessory colour connected to a concrete SKU", () => {
    for (const kind of kinds) {
      for (const finish of finishes) {
        const soldFinish = kind === "tin" ? "cream" : finish;
        expect(CATALOG[kind].skus[soldFinish]).toBeTruthy();
      }
    }
  });

  it("keeps the four-pack tin ceil quantity from summary", () => {
    const result = buildDIYCartSelection(
      make(
        Array.from({ length: 5 }, (_, index) => ({
          id: `tin-${index}`,
          kind: "tin" as const,
          x: index * 5,
          y: 0,
          finish: "cream" as const,
        }))
      )
    );
    const tin = result.find(line => line.role === "accessory");
    expect(tin).toMatchObject({
      sku: CATALOG.tin.skus.cream,
      quantity: 2,
      unit: "box",
    });
    expect(
      summary(
        make(
          Array.from({ length: 5 }, (_, index) => ({
            id: `summary-tin-${index}`,
            kind: "tin" as const,
            x: index * 5,
            y: 0,
            finish: "cream" as const,
          }))
        )
      )[0].purchaseQuantity
    ).toBe(2);
  });

  it("keeps set selection as exactly one preset line without duplicating components", () => {
    const result = buildSetCartSelection(PRESET_SETS[0], "gingham");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sku: "myu-lego-s-cmtp-set1",
      quantity: 1,
      unit: "set",
      role: "preset",
    });
  });

  it("normalizes fingerprint ordering but never ignores quantity", () => {
    const rows = buildDIYCartSelection(make(onePiece(sellableKind())));
    expect(selectionKey(rows)).toBe(selectionKey([...rows].reverse()));
    expect(selectionKey(rows)).not.toBe(
      selectionKey(rows.map(row => ({ ...row, quantity: row.quantity + 1 })))
    );
  });
});
