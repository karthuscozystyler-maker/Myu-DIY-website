import { useMemo, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { getBoardImage, getProductImage } from "./assets";
import { getFabric } from "./fabrics";
import {
  CATALOG,
  accessoryTotal,
  getAccessoryPrice,
  getBoard,
  summary,
  type Design,
  hasFinishChoice,
  packUnit,
} from "./model";
import { buildDIYCartSelection } from "./cart-plan";
import CartActions from "./CartActions";
import PurchaseDialog from "./PurchaseDialog";

const money = (value: number) => `HK$${value.toLocaleString("en-HK")}`;
const priceLabel = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? money(value) : "待確認";
const colorName = (finish: string) =>
  finish === "charcoal" ? "岩嶺暗灰" : "奶油米白";

export default function PurchaseReview({
  design,
  onClose,
}: {
  design: Design;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const board = getBoard(design);
  const orientation = design.orientation === "landscape" ? "橫放" : "直放";
  const rows = summary(design);
  const fabric = getFabric(design.pattern);
  const lines = useMemo(() => {
    try {
      return buildDIYCartSelection(design);
    } catch {
      return [];
    }
  }, [design]);

  return (
    <PurchaseDialog onClose={onClose} busy={busy}>
      <section
        className="planner-purchase-sheet"
        aria-labelledby="purchase-title"
        aria-busy={busy}
      >
        <div className="planner-sheet-heading">
          <div>
            <p>購買清單</p>
            <h2 id="purchase-title">配置摘要</h2>
          </div>
          <button
            className="planner-sheet-close"
            onClick={onClose}
            disabled={busy}
            aria-label="關閉購買清單"
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        <div className="planner-sheet-scroll">
          <div className="planner-review-row planner-review-board">
            <img src={getBoardImage(design.pattern)} alt={fabric.name} />
            <div>
              <strong>{fabric.name}引磁布</strong>
              <small>
                {board.label} · {orientation} · 1 張
              </small>
            </div>
            <span>布價另計</span>
          </div>
          {rows.length === 0 ? (
            <p className="planner-review-empty">
              請先加入至少一件配件，引磁布不可單獨購買。
            </p>
          ) : (
            rows.map(row => {
              const item = CATALOG[row.kind];
              const packed = item.packSize > 1;
              const unitPrice = getAccessoryPrice(row.kind, row.finish);
              const rowPrice =
                typeof unitPrice === "number" && Number.isFinite(unitPrice)
                  ? unitPrice * row.purchaseQuantity
                  : null;
              return (
                <div
                  className="planner-review-row"
                  key={`${row.kind}-${row.finish}`}
                >
                  <img src={getProductImage(row.kind, row.finish)} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    {packed ? (
                      <small>
                        {hasFinishChoice(item) ? `${colorName(row.finish)} · ` : ""}
                        已排位 {row.quantity} 個 · 購買 {row.purchaseQuantity}{" "}
                        {packUnit(item)}（共 {row.includedQuantity} 個）
                        {row.unplacedQuantity > 0
                          ? ` · 餘 ${row.unplacedQuantity} 個未排位`
                          : " · 無餘數"}
                      </small>
                    ) : (
                      <small>
                        {colorName(row.finish)} · 購買 {row.purchaseQuantity} 件
                      </small>
                    )}
                  </div>
                  <span>{priceLabel(rowPrice)}</span>
                </div>
              );
            })
          )}
          <div className="planner-review-subtotal">
            <span>
              配件預估小計<small>布價另計</small>
            </span>
            <strong>{priceLabel(accessoryTotal(design))}</strong>
          </div>
          <p className="planner-review-limitation">
            價格、優惠及庫存以購物車為準。加入購物車後仍需完成結帳；圖片與排位只供參考。
          </p>
        </div>
        <div className="planner-sheet-actions">
          <CartActions
            lines={lines}
            disabled={!lines.length}
            onBusyChange={setBusy}
          />
          <button
            className="planner-back-button"
            onClick={onClose}
            disabled={busy}
          >
            <ArrowLeft size={17} />
            返回調整
          </button>
        </div>
      </section>
    </PurchaseDialog>
  );
}
