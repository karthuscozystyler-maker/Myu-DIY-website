import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { Link } from "wouter";
import NotFound from "./NotFound";
import FabricPicker, { FABRIC_COLOUR_NOTE } from "../configurator/FabricPicker";
import PurchaseDialog from "../configurator/PurchaseDialog";
import CartActions from "../configurator/CartActions";
import BoardCanvas from "../configurator/BoardCanvas";
import { buildSetDesign, restyleSetDesign } from "../configurator/set-layout";
import { buildSetCartSelection } from "../configurator/cart-plan";
import { getBoardImage, getProductImage } from "../configurator/assets";
import {
  BOARDS,
  SERIES,
  constrain,
  type BoardKind,
  type Design,
  type Pattern,
  type Series,
} from "../configurator/model";
import { FABRICS, getFabric } from "../configurator/fabrics";
import {
  getSetPrice,
  getSetsForSeries,
  getSetVariant,
  setFinishForPatternName,
  setItemKind,
  type PresetSet,
} from "../configurator/sets";
import "./pages.css";

const DEFAULT_PATTERN: Pattern = FABRICS[0]?.id ?? "plain";

// Reference set prices from the owner's sheet (set-prices.ts), shown until the
// sets are listed on SHOPLINE and live prices come from the cart API.
const SHOW_SET_PRICES = true;

const money = (n: number) => `HK$${n.toLocaleString("en-HK")}`;

/** Set price for the chosen fabric: 特價 with the 原價 struck through. */
function SetPrice({ price }: { price: readonly [number, number] | undefined }) {
  if (!SHOW_SET_PRICES || !price) return null;
  return (
    <p className="set-price">
      <small>套裝價</small>
      <strong>{money(price[1])}</strong>
      <s>{money(price[0])}</s>
    </p>
  );
}

/** Lowest 特價 across the fabrics a set is sold in. */
function lowestSetPrice(preset: PresetSet): number | undefined {
  const prices = FABRICS.map(
    fabric => getSetPrice(getSetVariant(preset, fabric.name))?.[1]
  ).filter((n): n is number => typeof n === "number");
  return prices.length ? Math.min(...prices) : undefined;
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
  const price = getSetPrice(variant);
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
              const kind = setItemKind(item);
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
          <SetPrice price={price} />
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
  const [design, setDesign] = useState<Design | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const detail = useRef<HTMLElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const fabric = getFabric(pattern);
  const finish = setFinishForPatternName(fabric.name);
  const variant = preset ? getSetVariant(preset, fabric.name) : undefined;
  const price = getSetPrice(variant);
  useEffect(() => {
    setPreset(null);
    setDesign(null);
    setSize("small");
    setPattern(DEFAULT_PATTERN);
  }, [seriesId]);
  if (!category) return <NotFound />;
  const presets = getSetsForSeries(seriesId as Series).filter(
    s => s.board === size
  );
  function select(next: PresetSet) {
    setPreset(next);
    setDesign(buildSetDesign(next, pattern, finish));
    setSelected(null);
    requestAnimationFrame(() =>
      detail.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }
  function closeSet() {
    setPreset(null);
    setDesign(null);
  }
  function move(id: string, x: number, y: number) {
    setDesign(
      current =>
        current && {
          ...current,
          pieces: current.pieces.map(piece =>
            piece.id === id
              ? {
                  ...piece,
                  ...constrain(
                    piece.kind,
                    current.board,
                    x,
                    y,
                    false,
                    current.orientation
                  ),
                }
              : piece
          ),
        }
    );
  }
  function choosePattern(next: Pattern) {
    setPattern(next);
    setDesign(
      current =>
        current &&
        restyleSetDesign(
          current,
          next,
          setFinishForPatternName(getFabric(next).name)
        )
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
                closeSet();
              }}
            >
              38×70 cm
            </button>
            <button
              className={size === "large" ? "is-active" : ""}
              aria-pressed={size === "large"}
              onClick={() => {
                setSize("large");
                closeSet();
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
              {SHOW_SET_PRICES && lowestSetPrice(s) !== undefined && (
                <em className="set-card-price">
                  {money(lowestSetPrice(s)!)} 起
                </em>
              )}
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
        {preset && design && (
          <section
            ref={detail}
            className="set-detail"
            aria-label="已選套裝內容"
          >
            <div className="set-detail-heading">
              <h2>{preset.title}</h2>
              <button onClick={closeSet} aria-label="收起套裝內容">
                <X size={19} />
              </button>
            </div>
            <div className="set-detail-body">
              <div className="set-canvas">
                <div className="planner-canvas-slot">
                  <BoardCanvas
                    design={design}
                    selected={selected}
                    onSelect={setSelected}
                    onMove={move}
                    stageRef={stageRef}
                  />
                </div>
                <p>
                  {BOARDS[preset.board].label}
                  {design.orientation === "landscape" ? " · 橫放" : " · 直放"}
                  ；拖動配件可調整位置。
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
                <p className="set-reference-note">{FABRIC_COLOUR_NOTE}</p>
                <SetPrice price={price} />
                <div className="set-contents">
                  <h3>套裝已包含</h3>
                  {preset.composition.map((item, i) => {
                    const kind = setItemKind(item);
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
                  最終價格、優惠及庫存以購物車為準。
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
            choosePattern(p);
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
