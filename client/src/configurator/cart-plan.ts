import { getFabric } from "./fabrics";
import { CATALOG, summary, type Design } from "./model";
import { getSetVariant, type PresetSet } from "./sets";

export type CartSelectionLine = {
  sku: string;
  name: string;
  quantity: number;
  unit: "piece" | "box" | "set";
  // Purchase ordering: standalone accessories first, then cloth.
  role: "cloth" | "accessory" | "preset";
};

function requireSku(sku: string | null, message: string): string {
  if (typeof sku !== "string" || !sku.trim()) throw new Error(message);
  return sku;
}

function accessoryName(
  item: (typeof CATALOG)[keyof typeof CATALOG],
  finish: "cream" | "charcoal"
) {
  if (item.packSize > 1) return `${item.name}（${item.packSize}入）`;
  return `${item.name}${finish === "charcoal" ? "（岩嶺暗灰）" : "（奶油米白）"}`;
}

export function buildDIYCartSelection(design: Design): CartSelectionLine[] {
  if (!design.pieces.length)
    throw new Error("請先加入至少一件配件，再連同引磁布購買。");

  const fabric = getFabric(design.pattern);
  const clothSku = requireSku(
    fabric.skus[design.board],
    "所選引磁布尺寸暫未提供可購買 SKU，請選擇其他布款或尺寸。"
  );
  const boardLabel = design.board === "small" ? "38×70 cm" : "70×100 cm";
  const accessories = summary(design).map(row => {
    const item = CATALOG[row.kind];
    const sku = requireSku(
      item.skus[row.finish],
      `${item.name}${row.finish === "charcoal" ? "岩嶺暗灰" : "奶油米白"}暫未提供可購買 SKU。`
    );
    return {
      sku,
      name: accessoryName(item, row.finish),
      quantity: row.purchaseQuantity,
      unit: item.packSize > 1 ? ("box" as const) : ("piece" as const),
      role: "accessory" as const,
    };
  });

  // Orientation is a layout preference, not a different sellable variation.
  return [
    ...accessories,
    {
      sku: clothSku,
      name: `${fabric.name}引磁布 ${boardLabel}`,
      quantity: 1,
      unit: "piece",
      role: "cloth",
    },
  ];
}

export function buildSetCartSelection(
  preset: PresetSet,
  pattern: Design["pattern"]
): CartSelectionLine[] {
  const fabric = getFabric(pattern);
  const variant = getSetVariant(preset, fabric.name);
  if (!variant || !variant.sku)
    throw new Error("此布款暫不適用於所選套裝，請選擇其他布款。");

  // A preset SKU already contains its cloth + accessories; do not add components twice.
  return [
    {
      sku: variant.sku,
      name: `${preset.title}（${fabric.name}）`,
      quantity: 1,
      unit: "set",
      role: "preset",
    },
  ];
}

export function selectionKey(lines: CartSelectionLine[]): string {
  return lines
    .map(line => `${line.sku}:${line.quantity}`)
    .sort()
    .join("|");
}
