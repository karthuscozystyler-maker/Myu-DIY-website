import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
} from "lucide-react";
import { getProductImage } from "./assets";
import {
  CATALOG,
  SERIES,
  getAccessoryPrice,
  getSeriesItems,
  type Finish,
  type PieceKind,
  type Series,
  hasFinishChoice,
  packUnit,
  pieceUnit,
} from "./model";

type Props = {
  series: Series | null;
  seriesOpen: boolean;
  finish: Finish;
  subtotal: number | null;
  canReview: boolean;
  onSeriesChange: (series: Series) => void;
  onSeriesOpenChange: (open: boolean) => void;
  onFinishChange: (finish: Finish) => void;
  onAdd: (kind: PieceKind) => void;
  onReview: () => void;
  reviewTrigger: RefObject<HTMLButtonElement | null>;
};

const money = (value: number) => `HK$${value.toLocaleString("en-HK")}`;
const priceLabel = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? money(value) : "待確認";

export default function CatalogDock({
  series,
  seriesOpen,
  finish,
  subtotal,
  canReview,
  onSeriesChange,
  onSeriesOpenChange,
  onFinishChange,
  onAdd,
  onReview,
  reviewTrigger,
}: Props) {
  const [page, setPage] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => getSeriesItems(series), [series]);
  const pageCount = Math.max(1, Math.ceil(items.length / 4));
  const visibleItems = items.slice(page * 4, page * 4 + 4);
  const selectedSeries = SERIES.find(item => item.id === series);

  useEffect(() => setPage(0), [series]);
  useEffect(() => {
    const resetPage = () => setPage(0);
    window.addEventListener("resize", resetPage);
    return () => window.removeEventListener("resize", resetPage);
  }, []);
  useEffect(() => {
    if (page >= pageCount) setPage(pageCount - 1);
  }, [page, pageCount]);

  return (
    <aside
      className={`planner-catalog-dock ${collapsed ? "is-collapsed" : ""}`}
      aria-label="配件選擇"
    >
      {seriesOpen && (
        <button
          className="planner-series-scrim"
          onClick={() => onSeriesOpenChange(false)}
          aria-label="關閉系列選單"
          tabIndex={-1}
        />
      )}

      <div className="planner-catalog-heading">
        <div>
          <p>配件</p>
          <strong>{selectedSeries?.label ?? "先選系列"}</strong>
        </div>
        <button
          className="planner-dock-toggle"
          onClick={() => setCollapsed(value => !value)}
          aria-expanded={!collapsed}
          aria-controls="planner-catalog-content"
        >
          <span>{collapsed ? "展開" : "收起"}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="planner-catalog-expandable" id="planner-catalog-content">
        <div className="planner-catalog-controls">
          <div className="planner-series-picker">
            <span className="planner-field-label">系列</span>
            <button
              className="planner-series-trigger"
              onClick={() => onSeriesOpenChange(!seriesOpen)}
              aria-haspopup="menu"
              aria-expanded={seriesOpen}
            >
              <span>{selectedSeries?.label ?? "選擇配件系列"}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            {seriesOpen && (
              <div
                className="planner-series-menu"
                role="menu"
                aria-label="選擇配件系列"
              >
                {SERIES.map(option => (
                  <button
                    key={option.id}
                    role="menuitemradio"
                    aria-checked={option.id === series}
                    className={option.id === series ? "is-selected" : ""}
                    onClick={() => {
                      onSeriesChange(option.id);
                      onSeriesOpenChange(false);
                      setCollapsed(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="planner-new-finish" aria-label="新增配件顏色">
            <span className="planner-field-label">新增配件顏色</span>
            <div>
              <button
                className={`planner-finish cream ${finish === "cream" ? "is-active" : ""}`}
                onClick={() => onFinishChange("cream")}
                aria-label="新增奶油米白配件"
                aria-pressed={finish === "cream"}
              >
                <i aria-hidden="true" />
              </button>
              <button
                className={`planner-finish charcoal ${finish === "charcoal" ? "is-active" : ""}`}
                onClick={() => onFinishChange("charcoal")}
                aria-label="新增岩嶺暗灰配件"
                aria-pressed={finish === "charcoal"}
              >
                <i aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="planner-catalog-content">
          {!series && (
            <p className="planner-catalog-empty">
              先選系列，再查看可加入的配件。
            </p>
          )}
          {series && items.length === 0 && (
            <p className="planner-catalog-empty">此系列暫未有配件。</p>
          )}
          {series && items.length > 0 && (
            <>
              <div className="planner-catalog-grid">
                {visibleItems.map(kind => {
                  const item = CATALOG[kind];
                  const productFinish: Finish = finish;
                  const price = getAccessoryPrice(kind, productFinish);
                  const priceText = priceLabel(price);
                  const unit =
                    item.packSize > 1
                      ? `／${item.packSize}入${packUnit(item)}`
                      : `／${pieceUnit(item)}`;
                  return (
                    <button
                      key={kind}
                      className="planner-catalog-card"
                      onClick={() => onAdd(kind)}
                      aria-label={`加入${item.name}`}
                    >
                      <img src={getProductImage(kind, productFinish)} alt="" />
                      <span className="planner-catalog-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {priceText === "待確認"
                            ? priceText
                            : `${priceText} ${unit}`}
                        </small>
                      </span>
                      <span className="planner-catalog-add" aria-hidden="true">
                        <Plus size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {pageCount > 1 && (
                <div className="planner-pagination" aria-label="配件頁數">
                  <button
                    onClick={() => setPage(current => Math.max(0, current - 1))}
                    disabled={page === 0}
                    aria-label="上一頁配件"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>
                    {page + 1} / {pageCount}
                  </span>
                  <button
                    onClick={() =>
                      setPage(current => Math.min(pageCount - 1, current + 1))
                    }
                    disabled={page === pageCount - 1}
                    aria-label="下一頁配件"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="planner-catalog-summary">
        <div>
          <span>配件預估小計</span>
          <strong>{priceLabel(subtotal)}</strong>
          <small>布價另計</small>
        </div>
        <button
          ref={reviewTrigger}
          className="planner-review-cta"
          onClick={onReview}
          disabled={!canReview}
          aria-describedby={
            canReview ? undefined : "planner-review-requirement"
          }
        >
          <ClipboardList size={17} />
          查看清單
        </button>
        {!canReview && (
          <p
            id="planner-review-requirement"
            className="planner-review-requirement"
          >
            至少加入一件配件才可查看購買清單。
          </p>
        )}
      </div>
    </aside>
  );
}
