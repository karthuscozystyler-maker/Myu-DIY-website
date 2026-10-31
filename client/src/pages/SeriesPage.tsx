import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { Link } from "wouter";
import NotFound from "./NotFound";
import FabricPicker from "../configurator/FabricPicker";
import PurchaseDialog from "../configurator/PurchaseDialog";
import CartActions from "../configurator/CartActions";
import { buildSetCartSelection } from "../configurator/cart-plan";
import { getBoardImage, getProductImage } from "../configurator/assets";
import {
  BOARDS,
  CATALOG,
  SERIES,
  type BoardKind,
  type Pattern,
  type PieceKind,
  type Series,
} from "../configurator/model";
import { FABRICS, getFabric } from "../configurator/fabrics";
import {
  getSetsForSeries,
  getSetVariant,
  setFinishForPatternName,
  type PresetSet,
} from "../configurator/sets";
import "./pages.css";

const DEFAULT_PATTERN: Pattern = FABRICS[0]?.id ?? "plain";

function catalogKindForName(name: string): PieceKind | undefined {
  return (Object.keys(CATALOG) as PieceKind[]).find(
    kind => CATALOG[kind].name === name
  );
}

function SetReview({
  preset,
  pattern,
  onClose,
}: {
  preset: PresetSet;
  pattern: Pattern;
  onClose: () => void;
}) {
  const fabric = getFabric(pattern);
  const variant = getSetVariant(preset, fabric.name);
  const finish = setFinishForPatternName(fabric.name);
  const color = finish === "charcoal" ? "岩嶺暗灰" : "米白";
  const [busy, setBusy] = useState(false);
  const lines = variant ? buildSetCartSelection(preset, pattern) : [];
  return (
    <PurchaseDialog onClose={onClose} busy={busy}>
      <section
        className="planner-purchase-sheet"
        aria-labelledby="set-review-title"
        aria-busy={busy}
      >
        <div className="planner-sheet-heading">
          <h2 id="set-review-title">套裝購買清單</h2>
          <button
            className="planner-sheet-close"
            aria-label="關閉套裝清單"
            onClick={onClose}
            disabled={busy}
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        <div className="planner-sheet-scroll">
          <p className="set-reference-note">{preset.title}</p>
          <ul className="set-review-lines">
            <li>
              <span>
                {fabric.name}引磁布
                <br />
                <small>{BOARDS[preset.board].label}</small>
              </span>
              <b>1 張</b>
            </li>
            {preset.composition.map((item, i) => {
              const kind = catalogKindForName(item.name);
              return (
                <li key={i}>
                  {kind && (
                    <img
                      src={getProductImage(kind, finish)}
                      alt=""
                      width={40}
                      height={40}
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  <span>
                    {item.name}
                    <br />
                    <small>{color}</small>
                  </span>
                  <b>{item.quantity} 件</b>
                </li>
              );
            })}
          </ul>
          <p className="planner-review-limitation">
            價格、優惠及庫存以購物車為準。加入購物車後仍需完成結帳；圖片與排位只供參考。
          </p>
        </div>
        <div className="planner-sheet-actions">
          <CartActions
            lines={lines}
            disabled={!variant}
            onBusyChange={setBusy}
          />
          <button
            className="planner-back-button"
            onClick={onClose}
            disabled={busy}
          >
            返回套裝
          </button>
        </div>
      </section>
    </PurchaseDialog>
  );
}

export default function SeriesPage({ seriesId }: { seriesId: string }) {
  const category = SERIES.find(s => s.id === seriesId);
  const [size, setSize] = useState<BoardKind>("small");
  const [preset, setPreset] = useState<PresetSet | null>(null);
  const [pattern, setPattern] = useState<Pattern>(DEFAULT_PATTERN);
  const [picker, setPicker] = useState(false);
  const [review, setReview] = useState(false);
  const detail = useRef<HTMLElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const fabric = getFabric(pattern);
  const finish = setFinishForPatternName(fabric.name);
  const variant = preset ? getSetVariant(preset, fabric.name) : undefined;
  useEffect(() => {
    setPreset(null);
    setSize("small");
    setPattern(DEFAULT_PATTERN);
  }, [seriesId]);
  if (!category) return <NotFound />;
  const presets = getSetsForSeries(seriesId as Series).filter(
    s => s.board === size
  );
  function select(next: PresetSet) {
    setPreset(next);
    requestAnimationFrame(() =>
      detail.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }
  return (
    <div className="shop-page">
      <main className="set-main">
        <Link className="content-backlink" href="/">
          返回首頁
        </Link>
        <div className="set-title-row">
          <div>
            <h1>{category.label}</h1>
            <p>揀好套裝，再揀喜歡嘅布款。</p>
          </div>
          <div className="set-filter" role="group" aria-label="套裝布面尺寸">
            <button
              className={size === "small" ? "is-active" : ""}
              aria-pressed={size === "small"}
              onClick={() => {
                setSize("small");
                setPreset(null);
              }}
            >
              38×70 cm
            </button>
            <button
              className={size === "large" ? "is-active" : ""}
              aria-pressed={size === "large"}
              onClick={() => {
                setSize("large");
                setPreset(null);
              }}
            >
              70×100 cm
            </button>
          </div>
        </div>
        <div className="set-list">
          {presets.map(s => (
            <button
              key={s.id}
              className={`set-card ${preset?.id === s.id ? "is-selected" : ""}`}
              onClick={() => select(s)}
            >
              <strong>{s.title.replace(/ (?:38×70|70×100) cm/, "")}</strong>
              <p>
                {s.composition.map(i => `${i.name} × ${i.quantity}`).join("、")}
              </p>
              <span>
                {preset?.id === s.id ? "已選套裝" : "查看套裝"}
                {preset?.id === s.id ? (
                  <Check size={17} />
                ) : (
                  <ChevronRight size={17} />
                )}
              </span>
            </button>
          ))}
        </div>
        {preset && (
          <section
            ref={detail}
            className="set-detail"
            aria-label="已選套裝內容"
          >
            <div className="set-detail-heading">
              <h2>{preset.title}</h2>
              <button onClick={() => setPreset(null)} aria-label="收起套裝內容">
                <X size={19} />
              </button>
            </div>
            <div className="set-detail-body">
              <div className="set-cloth-preview">
                <div
                  className="set-cloth-surface"
                  role="img"
                  aria-label={fabric.name}
                  style={{
                    aspectRatio: `${BOARDS[preset.board].width}/${BOARDS[preset.board].height}`,
                    backgroundImage: `url(${getBoardImage(pattern)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <p>
                  引磁布 × 1 張<br />
                  {BOARDS[preset.board].label}
                  <br />
                  完整配件內容列於旁邊；部分配件圖片待補，暫不提供整套排位預覽。
                </p>
              </div>
              <div className="set-controls">
                <button
                  className="set-pattern-trigger"
                  onClick={() => setPicker(true)}
                >
                  <img src={getBoardImage(pattern)} alt="" />
                  <div>
                    <small>引磁布款式</small>
                    <strong>{fabric.name}</strong>
                  </div>
                  <ChevronDown size={18} />
                </button>
                <div className="set-contents">
                  <h3>套裝已包含</h3>
                  {preset.composition.map((item, i) => {
                    const kind = catalogKindForName(item.name);
                    return (
                      <div className="set-contents-row" key={i}>
                        {kind && (
                          <img src={getProductImage(kind, finish)} alt="" />
                        )}
                        <div>
                          {item.name}
                          <small>
                            {finish === "charcoal" ? "岩嶺暗灰" : "米白"}
                          </small>
                        </div>
                        <b>× {item.quantity}</b>
                      </div>
                    );
                  })}
                </div>
                <p className="set-reference-note">
                  配件固定配搭。想自由加減或混色？
                  <Link href="/diy">
                    <u>改用 DIY</u>
                  </Link>
                </p>
                <button
                  className="set-main-action"
                  ref={reviewButton}
                  disabled={!variant}
                  onClick={() => setReview(true)}
                >
                  查看套裝清單 <ChevronRight size={17} />
                </button>
                <p className="set-reference-note">
                  {!variant && "此布款暫不適用於此套裝，請揀其他布款。"}
                  套裝價格及庫存以 SHOPLINE 為準，尚未下單。
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      {picker && (
        <FabricPicker
          value={pattern}
          onChange={p => {
            setPattern(p);
            setPicker(false);
          }}
          onClose={() => setPicker(false)}
        />
      )}
      {review && preset && (
        <SetReview
          preset={preset}
          pattern={pattern}
          onClose={() => {
            setReview(false);
            setTimeout(() => reviewButton.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}
