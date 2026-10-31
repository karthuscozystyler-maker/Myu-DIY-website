import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "wouter";
import Konva from "konva";
import { Redo2, Trash2, Undo2, X } from "lucide-react";
import BoardCanvas from "../configurator/BoardCanvas";
import CatalogDock from "../configurator/CatalogDock";
import FabricPicker from "../configurator/FabricPicker";
import PurchaseReview from "../configurator/PurchaseReview";
import { getBoardImage } from "../configurator/assets";
import { getFabric } from "../configurator/fabrics";
import {
  CATALOG,
  EMPTY_DESIGN,
  SERIES,
  accessoryTotal,
  canPlacePiece,
  canReviewDesign,
  changeOrientation,
  constrain,
  freePosition,
  getBoard,
  historyReducer,
  parseDesign,
  resizeBoard,
  type BoardKind,
  type Design,
  type Finish,
  type Orientation,
  type Pattern,
  type PieceKind,
  type Series,
} from "../configurator/model";

const STORAGE_KEY = "myu-storage-planner-mobile-v3";
const PREFERENCES_KEY = "myu-storage-planner-preferences-v1";

const orientationLabel = (orientation: Orientation) =>
  orientation === "landscape" ? "橫放" : "直放";

function placementNotice(
  kind: PieceKind,
  board: BoardKind,
  orientation: Orientation
) {
  const item = CATALOG[kind];
  if (!item.dimensionsVerified) return `${item.name}尺寸待確認，暫未能排位。`;

  const otherOrientation: Orientation =
    orientation === "portrait" ? "landscape" : "portrait";
  const fitsOtherOrientation = canPlacePiece(kind, board, otherOrientation);
  const fitsLarge =
    board === "small" && canPlacePiece(kind, "large", orientation);
  const fitsLargeOtherOrientation =
    board === "small" && canPlacePiece(kind, "large", otherOrientation);

  if (fitsOtherOrientation)
    return `此配件請${orientationLabel(otherOrientation)}布面後再加入。`;
  if (fitsLarge) return "此配件需要大布，請改用 70 × 100 cm。";
  if (fitsLargeOtherOrientation) return "此配件需使用大布並橫放後再加入。";
  return "此配件目前未能放入所選布面。";
}

function keepsAllPieces(previous: Design, next: Design) {
  return previous.pieces.every(piece =>
    next.pieces.some(
      candidate =>
        candidate.id === piece.id &&
        candidate.kind === piece.kind &&
        candidate.finish === piece.finish
    )
  );
}

function initialDesign(): Design {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const design = saved
      ? (parseDesign(saved) ?? structuredClone(EMPTY_DESIGN))
      : structuredClone(EMPTY_DESIGN);
    return { ...design, pattern: getFabric(design.pattern).id };
  } catch {
    return structuredClone(EMPTY_DESIGN);
  }
}

function initialPreferences(): { finish: Finish; series: Series | null } {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(PREFERENCES_KEY) ?? "{}"
    );
    if (typeof saved !== "object" || saved === null)
      return { finish: "cream", series: null };

    const preferences = saved as { finish?: unknown; series?: unknown };
    return {
      finish: preferences.finish === "charcoal" ? "charcoal" : "cream",
      series: SERIES.some(item => item.id === preferences.series)
        ? (preferences.series as Series)
        : null,
    };
  } catch {
    return { finish: "cream", series: null };
  }
}

export default function Home() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: initialDesign(),
    future: [],
  }));
  const design = history.present;
  const board = getBoard(design);
  const orientation = design.orientation ?? "portrait";
  const fabric = getFabric(design.pattern);
  const preferences = useRef(initialPreferences()).current;
  const [selected, setSelected] = useState<string | null>(null);
  const [series, setSeries] = useState<Series | null>(preferences.series);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [finish, setFinish] = useState<Finish>(preferences.finish);
  const [review, setReview] = useState(false);
  const [fabricPickerOpen, setFabricPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const reviewTrigger = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const selectedPiece = design.pieces.find(piece => piece.id === selected);
  const canReview = canReviewDesign(design);

  const commit = (next: Design) => dispatch({ type: "commit", design: next });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
    } catch {
      // 儲存空間不可用時仍讓規劃器保持可用。
    }
  }, [design]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ finish, series })
      );
    } catch {
      // 偏好無法保存時，仍可於目前頁面選擇。
    }
  }, [finish, series]);

  useEffect(() => {
    if (selected && !design.pieces.some(piece => piece.id === selected)) {
      setSelected(null);
    }
  }, [design.pieces, selected]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!review && !seriesOpen && !fabricPickerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (seriesOpen) setSeriesOpen(false);
      if (fabricPickerOpen) setFabricPickerOpen(false);
      if (review) {
        setReview(false);
        window.setTimeout(() => reviewTrigger.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fabricPickerOpen, review, seriesOpen]);

  function add(kind: PieceKind) {
    if (!canPlacePiece(kind, design.board, orientation)) {
      setNotice(placementNotice(kind, design.board, orientation));
      return;
    }
    // A 套 (e.g. the left/right adjustable rack) cannot be split, so add the whole set.
    const count = CATALOG[kind].packUnit === "套" ? CATALOG[kind].packSize : 1;
    if (design.pieces.length + count > 30) {
      setNotice("此布面最多可排 30 件配件。");
      return;
    }
    let next = design;
    let id = "";
    for (let index = 0; index < count; index++) {
      id = crypto.randomUUID();
      next = {
        ...next,
        pieces: [
          ...next.pieces,
          { id, kind, finish, ...freePosition(next, kind) },
        ],
      };
    }
    commit(next);
    setSelected(id);
    setNotice(`已加入${CATALOG[kind].name}。`);
  }

  function move(id: string, x: number, y: number) {
    commit({
      ...design,
      pieces: design.pieces.map(piece =>
        piece.id === id
          ? {
              ...piece,
              ...constrain(
                piece.kind,
                design.board,
                x,
                y,
                false,
                design.orientation ?? "portrait"
              ),
            }
          : piece
      ),
    });
  }

  function removeSelected() {
    if (!selectedPiece) return;
    commit({
      ...design,
      pieces: design.pieces.filter(piece => piece.id !== selectedPiece.id),
    });
    setSelected(null);
  }

  function clearCanvas() {
    commit({ ...design, pieces: [] });
    setSelected(null);
    setNotice("畫布已清空。");
  }

  function setBoard(next: BoardKind) {
    if (next === design.board) return;
    const nextDesign = resizeBoard(design, next);
    if (nextDesign === design || !keepsAllPieces(design, nextDesign)) {
      const blocked = design.pieces.find(
        piece => !canPlacePiece(piece.kind, next, orientation)
      );
      setNotice(
        blocked
          ? placementNotice(blocked.kind, next, orientation)
          : "目前配件無法套用此尺寸。"
      );
      return;
    }
    commit(nextDesign);
    setSelected(null);
    setNotice("尺寸已更改，請確認配件位置");
  }

  function setOrientation(next: Orientation) {
    if (next === orientation) return;
    const nextDesign = changeOrientation(design, next);
    if (nextDesign === design || !keepsAllPieces(design, nextDesign)) {
      const blocked = design.pieces.find(
        piece => !canPlacePiece(piece.kind, design.board, next)
      );
      setNotice(
        blocked
          ? placementNotice(blocked.kind, design.board, next)
          : "目前配件無法套用此方向。"
      );
      return;
    }
    commit(nextDesign);
    setSelected(null);
    setNotice("尺寸已更改，請確認配件位置");
  }

  function setPattern(pattern: Pattern) {
    if (pattern === design.pattern) return;
    commit({ ...design, pattern });
  }

  function openReview() {
    if (!canReview) {
      setNotice("至少加入一件配件才可查看購買清單。");
      return;
    }
    setReview(true);
  }

  const accessorySubtotal = accessoryTotal(design);

  return (
    <div className="planner-app">
      <main className="planner-main">
        <Link className="planner-home-backlink" href="/">
          返回首頁
        </Link>
        <div className="planner-workspace">
          <section className="planner-setup" aria-label="布款、尺寸與方向">
            <button
              className="planner-cloth"
              onClick={() => setFabricPickerOpen(true)}
              aria-haspopup="dialog"
            >
              <img src={getBoardImage(design.pattern)} alt="" />
              <span>
                <small>布款</small>
                <strong>{fabric.name}</strong>
              </span>
              <em>更換</em>
            </button>

            <div className="planner-board-controls">
              <div
                className="planner-size-picker"
                role="group"
                aria-label="布面尺寸"
              >
                <span>尺寸</span>
                <button
                  className={design.board === "small" ? "is-active" : ""}
                  onClick={() => setBoard("small")}
                  aria-pressed={design.board === "small"}
                >
                  38 × 70
                </button>
                <button
                  className={design.board === "large" ? "is-active" : ""}
                  onClick={() => setBoard("large")}
                  aria-pressed={design.board === "large"}
                >
                  70 × 100
                </button>
              </div>
              <div
                className="planner-orientation"
                role="group"
                aria-label="布面方向"
              >
                <button
                  className={orientation === "portrait" ? "is-active" : ""}
                  onClick={() => setOrientation("portrait")}
                  aria-pressed={orientation === "portrait"}
                >
                  直放
                </button>
                <button
                  className={orientation === "landscape" ? "is-active" : ""}
                  onClick={() => setOrientation("landscape")}
                  aria-pressed={orientation === "landscape"}
                >
                  橫放
                </button>
              </div>
            </div>
          </section>

          <section className="planner-studio" aria-label="收納牆排位畫布">
            <div className="planner-toolbar">
              <div className="planner-canvas-title">
                <strong>按尺寸排位</strong>
                <span>
                  {board.label} · {orientationLabel(orientation)}
                </span>
              </div>
              <div className="planner-toolbar-actions">
                <button
                  className="planner-icon-button"
                  onClick={() => dispatch({ type: "undo" })}
                  disabled={!history.past.length}
                  aria-label="撤銷"
                  title="撤銷"
                >
                  <Undo2 size={18} />
                </button>
                <button
                  className="planner-icon-button"
                  onClick={() => dispatch({ type: "redo" })}
                  disabled={!history.future.length}
                  aria-label="重做"
                  title="重做"
                >
                  <Redo2 size={18} />
                </button>
                <button
                  className="planner-tool-button planner-clear-button"
                  onClick={clearCanvas}
                >
                  <Trash2 size={17} />
                  <span>清空</span>
                </button>
              </div>
            </div>

            <div className="planner-canvas-slot">
              <BoardCanvas
                design={design}
                selected={selected}
                onSelect={setSelected}
                onMove={move}
                stageRef={stageRef}
              />
            </div>

            <div className="planner-canvas-foot">
              <span>拖動配件調整位置；空白位置滑動可捲頁。</span>
              <span>{design.pieces.length} 件已排位</span>
            </div>

            {selectedPiece && (
              <div className="planner-selection-bar" aria-label="選取配件操作">
                <div className="planner-selected-name">
                  <strong>{CATALOG[selectedPiece.kind].name}</strong>
                  <span>
                    {selectedPiece.finish === "charcoal"
                      ? "岩嶺暗灰"
                      : "奶油米白"}
                  </span>
                </div>
                <button
                  className="planner-delete-selected"
                  onClick={removeSelected}
                  aria-label={`刪除${CATALOG[selectedPiece.kind].name}`}
                >
                  <Trash2 size={17} />
                  <span>刪除</span>
                </button>
              </div>
            )}
          </section>

          <CatalogDock
            series={series}
            seriesOpen={seriesOpen}
            finish={finish}
            subtotal={accessorySubtotal}
            canReview={canReview}
            onSeriesChange={setSeries}
            onSeriesOpenChange={setSeriesOpen}
            onFinishChange={setFinish}
            onAdd={add}
            onReview={openReview}
            reviewTrigger={reviewTrigger}
          />
        </div>
      </main>

      {notice && (
        <div className="planner-toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="關閉提示">
            <X size={16} />
          </button>
        </div>
      )}

      {fabricPickerOpen && (
        <FabricPicker
          value={design.pattern}
          onChange={setPattern}
          onClose={() => setFabricPickerOpen(false)}
        />
      )}

      {review && (
        <PurchaseReview
          design={design}
          onClose={() => {
            setReview(false);
            window.setTimeout(() => reviewTrigger.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}
