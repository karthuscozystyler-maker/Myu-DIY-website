import {
  CATALOG,
  accessoryTotal,
  canReviewDesign,
  getAccessoryPrice,
  getBoard,
  summary,
  type Design,
} from "./model";
import { getFabric } from "./fabrics";

const money = (n: number) => `HK$${n.toLocaleString("en-HK")}`;
const priceText = (price: number | null) =>
  price === null ? "價格待確認" : `預估金額 ${money(price)}`;
const colorName = (finish: string) =>
  finish === "charcoal" ? "岩嶺暗灰" : "奶油米白";
const orientationName = (design: Design) =>
  design.orientation === "landscape" ? "橫放" : "直放";

export function exportPlan(design: Design) {
  const board = getBoard(design);
  return {
    ...design,
    orientation: design.orientation ?? "portrait",
    boardDimensions: {
      width: board.width,
      height: board.height,
      label: board.label,
      price: board.price,
    },
    summary: summary(design).map(row => {
      const item = CATALOG[row.kind];
      return {
        ...row,
        name: item.name,
        purchaseUnit: item.packSize > 1 ? ("box" as const) : ("piece" as const),
        packSize: item.packSize,
        referenceUnitPrice: getAccessoryPrice(row.kind, row.finish),
      };
    }),
    accessorySubtotal: accessoryTotal(design),
    boardPrice: board.price,
    livePriceVerified: false,
    currency: "HKD",
    unit: "mm",
    imageReferenceNotice: "圖片與排位供參考，安裝以商品說明為準。",
  };
}

export function purchaseListText(design: Design) {
  if (!canReviewDesign(design)) {
    throw new Error("請先選擇有效布款並加入至少一件配件，才可建立購買清單。");
  }

  const board = getBoard(design);
  const fabric = getFabric(design.pattern);
  const lines = [
    "沐幕引磁收納DIY 購買清單（尚未下單）",
    `${fabric.name}引磁布 ${board.label} ${orientationName(design)} × 1件；布價另計`,
    "",
  ];
  for (const row of summary(design)) {
    const item = CATALOG[row.kind];
    const isPack = item.packSize > 1;
    const unitPrice = getAccessoryPrice(row.kind, row.finish);
    lines.push(
      `${item.name}${isPack ? "" : `（${colorName(row.finish)}）`}：${row.purchaseQuantity}${isPack ? `盒／每盒${item.packSize}入` : "件"}；${priceText(
        unitPrice === null ? null : unitPrice * row.purchaseQuantity
      )}`
    );
    if (isPack)
      lines.push(
        `已排位${row.quantity}個，購買合共${row.includedQuantity}個，另有${row.unplacedQuantity}個未排位。`
      );
  }

  const subtotal = accessoryTotal(design);
  lines.push(
    "",
    `配件預估金額：${subtotal === null ? "價格待確認" : money(subtotal)}`,
    "此清單尚未下單；布價另計。",
    "圖片與排位供參考，安裝以商品說明為準。"
  );
  return `${lines.join("\n")}\n`;
}
