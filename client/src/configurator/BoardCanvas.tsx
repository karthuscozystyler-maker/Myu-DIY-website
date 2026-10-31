import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Line,
  Text,
  Image as KonvaImage,
} from "react-konva";
import PieceArt, { useProductImage } from "./PieceArt";
import {
  BOARDS,
  CATALOG,
  constrain,
  getBoard,
  overlapping,
  type Design,
} from "./model";
import { getBoardImage } from "./assets";

type Props = {
  design: Design;
  selected: string | null;
  grid?: boolean;
  snap?: boolean;
  readonly?: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
};

type Viewport = { width: number; height: number };
type TouchDrag = {
  id: string;
  identifier: number;
  startPosition: { x: number; y: number };
  grabOffset: { x: number; y: number };
};

type BoardMetrics = { boardX: number; boardY: number; scale: number };

const MOBILE_QUERY = "(max-width: 1023px)";
const MOBILE_BOARD_WIDTH_RATIO = 0.89;
const MOBILE_RULER_HEIGHT = 22;
const MOBILE_RULER_GUTTER = 16;

function touchByIdentifier(touches: TouchList, identifier: number) {
  for (let index = 0; index < touches.length; index += 1) {
    if (touches[index].identifier === identifier) return touches[index];
  }
  return null;
}

function clientPointToBoardPoint(
  point: Touch,
  rect: DOMRect,
  metrics: BoardMetrics
) {
  return {
    x: (point.clientX - rect.left - metrics.boardX) / metrics.scale,
    y: (point.clientY - rect.top - metrics.boardY) / metrics.scale,
  };
}

export default function BoardCanvas({
  design,
  selected,
  grid = false,
  snap = false,
  readonly = false,
  onSelect,
  onMove,
  stageRef,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const pieceNodes = useRef(new Map<string, Konva.Group>());
  const touchDrag = useRef<TouchDrag | null>(null);
  const latestInteraction = useRef({ design, snap, onMove, onSelect });
  const metricsRef = useRef<BoardMetrics>({ boardX: 0, boardY: 0, scale: 0 });
  const [viewport, setViewport] = useState<Viewport>({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );
  const texture = useProductImage(getBoardImage(design.pattern));

  latestInteraction.current = { design, snap, onMove, onSelect };

  // Grid remains an accepted control prop, but the focused mobile canvas has no grid overlay.
  void grid;

  const clearTouchDrag = () => {
    touchDrag.current = null;
  };

  const restoreTouchDrag = () => {
    const activeDrag = touchDrag.current;
    if (activeDrag) {
      const group = pieceNodes.current.get(activeDrag.id);
      if (group) {
        group.position(activeDrag.startPosition);
        group.getLayer()?.batchDraw();
      }
    }
    clearTouchDrag();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const update = (width: number, height: number) => {
      setViewport(current =>
        current.width === width && current.height === height
          ? current
          : { width, height }
      );
    };

    update(element.clientWidth, element.clientHeight);
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      update(width, height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      restoreTouchDrag();
    },
    []
  );

  useEffect(() => {
    // A resized or rotated board invalidates the gesture's captured coordinates.
    restoreTouchDrag();
  }, [design.board, design.orientation]);

  const board = getBoard(design);
  const baseBoard = BOARDS[design.board];
  const desktopRulerGutter = Math.min(
    26,
    viewport.width * 0.14,
    viewport.height * 0.14
  );
  const desktopEdgePadding = Math.min(6, desktopRulerGutter / 3);
  const desktopDrawableWidth = Math.max(
    0,
    viewport.width - desktopRulerGutter - desktopEdgePadding
  );
  const desktopDrawableHeight = Math.max(
    0,
    viewport.height - desktopRulerGutter - desktopEdgePadding
  );
  const scale = isMobile
    ? Math.max(0, (viewport.width * MOBILE_BOARD_WIDTH_RATIO) / board.width)
    : Math.min(
        desktopDrawableWidth / board.width,
        desktopDrawableHeight / board.height
      );
  const boardPixelWidth = board.width * scale;
  const boardPixelHeight = board.height * scale;
  const boardX = isMobile
    ? (viewport.width - boardPixelWidth) / 2
    : desktopRulerGutter + (desktopDrawableWidth - boardPixelWidth) / 2;
  const boardY = isMobile
    ? MOBILE_RULER_HEIGHT
    : desktopRulerGutter + (desktopDrawableHeight - boardPixelHeight) / 2;
  const stageHeight = isMobile
    ? Math.ceil(MOBILE_RULER_HEIGHT + boardPixelHeight + 4)
    : viewport.height;
  const conflicts = overlapping(design);
  const showMobileRulers = isMobile && scale > 0;
  const showRulers = !isMobile && scale > 0 && desktopRulerGutter >= 12;
  const ruler = "#92979a";
  const tick = Math.min(5, desktopRulerGutter * 0.35);
  const rulerFontSize = Math.min(12, desktopRulerGutter * 0.55);
  const mobileRulerTick = 3;
  const mobileRulerFontSize = 10;
  const textureScale =
    texture && texture.width > 0 && texture.height > 0
      ? Math.max(
          baseBoard.width / texture.width,
          baseBoard.height / texture.height
        )
      : 0;
  const textureWidth = texture ? texture.width * textureScale : 0;
  const textureHeight = texture ? texture.height * textureScale : 0;
  const textureX = (baseBoard.width - textureWidth) / 2;
  const textureY = (baseBoard.height - textureHeight) / 2;

  metricsRef.current = { boardX, boardY, scale };

  useEffect(() => {
    if (!isMobile || readonly) return;

    const stage = stageRef.current;
    if (!stage) return;

    const content = stage.content;
    const previousContentTouchAction = content.style.touchAction;
    const canvases = Array.from(content.querySelectorAll("canvas"));
    const previousCanvasTouchActions = canvases.map(
      canvas => canvas.style.touchAction
    );
    content.style.touchAction = "auto";
    canvases.forEach(canvas => {
      canvas.style.touchAction = "auto";
    });

    const onTouchStart = (event: TouchEvent) => {
      if (touchDrag.current || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const contentRect = content.getBoundingClientRect();
      const target = stage.getIntersection({
        x: touch.clientX - contentRect.left,
        y: touch.clientY - contentRect.top,
      });
      const group = target?.findAncestor(".board-piece", true) as
        | Konva.Group
        | undefined;
      const id = group?.id();
      const piece = id
        ? latestInteraction.current.design.pieces.find(item => item.id === id)
        : undefined;

      if (!group || !piece || !pieceNodes.current.has(piece.id)) return;

      const metrics = metricsRef.current;
      if (metrics.scale <= 0) return;

      // A direct piece hit owns the gesture. A blank fabric touch is never
      // prevented, so the page continues to scroll natively.
      if (!event.cancelable) return;
      event.preventDefault();

      const point = clientPointToBoardPoint(touch, contentRect, metrics);
      const session: TouchDrag = {
        id: piece.id,
        identifier: touch.identifier,
        startPosition: { x: group.x(), y: group.y() },
        grabOffset: { x: point.x - group.x(), y: point.y - group.y() },
      };

      touchDrag.current = session;
      latestInteraction.current.onSelect(piece.id);
    };

    const onTouchMove = (event: TouchEvent) => {
      const activeDrag = touchDrag.current;
      if (!activeDrag) return;

      const touch = touchByIdentifier(event.touches, activeDrag.identifier);
      if (!touch) return;

      if (!event.cancelable) {
        restoreTouchDrag();
        return;
      }
      event.preventDefault();
      const group = pieceNodes.current.get(activeDrag.id);
      const piece = latestInteraction.current.design.pieces.find(
        item => item.id === activeDrag.id
      );
      const metrics = metricsRef.current;
      if (!group || !piece || metrics.scale <= 0) {
        clearTouchDrag();
        return;
      }

      const point = clientPointToBoardPoint(
        touch,
        content.getBoundingClientRect(),
        metrics
      );
      const nextPosition = constrain(
        piece.kind,
        latestInteraction.current.design.board,
        point.x - activeDrag.grabOffset.x,
        point.y - activeDrag.grabOffset.y,
        false,
        latestInteraction.current.design.orientation ?? "portrait"
      );
      group.position(nextPosition);
      group.getLayer()?.batchDraw();
    };

    const finishTouchDrag = (event: TouchEvent) => {
      const activeDrag = touchDrag.current;
      if (!activeDrag) return;
      const endedTouch = touchByIdentifier(
        event.changedTouches,
        activeDrag.identifier
      );
      if (!endedTouch) return;

      const group = pieceNodes.current.get(activeDrag.id);
      const piece = latestInteraction.current.design.pieces.find(
        item => item.id === activeDrag.id
      );
      let point: { x: number; y: number } | null = null;
      if (group && piece) {
        point = constrain(
          piece.kind,
          latestInteraction.current.design.board,
          group.x(),
          group.y(),
          latestInteraction.current.snap,
          latestInteraction.current.design.orientation ?? "portrait"
        );
        group.position(point);
        group.getLayer()?.batchDraw();
      }

      clearTouchDrag();
      if (point)
        latestInteraction.current.onMove(activeDrag.id, point.x, point.y);
    };

    const cancelTouchDrag = () => restoreTouchDrag();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelTouchDrag();
    };
    const onOrientationChange = () => cancelTouchDrag();

    content.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: false,
    });
    content.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: false,
    });
    content.addEventListener("touchend", finishTouchDrag, { capture: true });
    content.addEventListener("touchcancel", cancelTouchDrag, { capture: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      content.removeEventListener("touchstart", onTouchStart, true);
      content.removeEventListener("touchmove", onTouchMove, true);
      content.removeEventListener("touchend", finishTouchDrag, true);
      content.removeEventListener("touchcancel", cancelTouchDrag, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("orientationchange", onOrientationChange);
      content.style.touchAction = previousContentTouchAction;
      canvases.forEach((canvas, index) => {
        canvas.style.touchAction = previousCanvasTouchActions[index];
      });
      restoreTouchDrag();
    };
  }, [
    design.board,
    design.orientation,
    isMobile,
    readonly,
    stageRef,
    viewport.height,
    viewport.width,
  ]);

  const onBlank = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (
      e.target === e.target.getStage() ||
      e.target.hasName("board-background")
    )
      onSelect(null);
  };

  return (
    <div
      className="canvas-container"
      ref={container}
      style={{
        position: "relative",
        width: "100%",
        height: isMobile ? stageHeight : "100%",
        minHeight: isMobile ? stageHeight : 0,
        flex: isMobile ? "0 0 auto" : "1 1 0",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        overflow: isMobile ? "visible" : "hidden",
        padding: 0,
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
    >
      {scale > 0 && (
        <Stage
          ref={stageRef}
          width={viewport.width}
          height={stageHeight}
          preventDefault={false}
          onMouseDown={onBlank}
          onTouchStart={onBlank}
          onContextMenu={event => {
            if (isMobile) event.evt.preventDefault();
          }}
          style={{
            touchAction: isMobile ? "auto" : "none",
            display: "block",
          }}
        >
          <Layer>
            {isMobile
              ? showMobileRulers && (
                  <Group listening={false}>
                    <Line
                      points={[
                        boardX,
                        MOBILE_RULER_HEIGHT - 4,
                        boardX + boardPixelWidth,
                        MOBILE_RULER_HEIGHT - 4,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX,
                        MOBILE_RULER_HEIGHT - 4 - mobileRulerTick,
                        boardX,
                        MOBILE_RULER_HEIGHT - 4 + mobileRulerTick,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX + boardPixelWidth,
                        MOBILE_RULER_HEIGHT - 4 - mobileRulerTick,
                        boardX + boardPixelWidth,
                        MOBILE_RULER_HEIGHT - 4 + mobileRulerTick,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Text
                      x={boardX}
                      y={0}
                      width={boardPixelWidth}
                      height={MOBILE_RULER_HEIGHT - 7}
                      text={`${board.width / 10} cm`}
                      align="center"
                      verticalAlign="middle"
                      fontFamily="Arial, sans-serif"
                      fontSize={mobileRulerFontSize}
                      fill="#52585c"
                    />
                    <Line
                      points={[
                        boardX - MOBILE_RULER_GUTTER / 2,
                        boardY,
                        boardX - MOBILE_RULER_GUTTER / 2,
                        boardY + boardPixelHeight,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX - MOBILE_RULER_GUTTER / 2 - mobileRulerTick,
                        boardY,
                        boardX - MOBILE_RULER_GUTTER / 2 + mobileRulerTick,
                        boardY,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX - MOBILE_RULER_GUTTER / 2 - mobileRulerTick,
                        boardY + boardPixelHeight,
                        boardX - MOBILE_RULER_GUTTER / 2 + mobileRulerTick,
                        boardY + boardPixelHeight,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Group
                      x={Math.max(
                        0,
                        boardX - MOBILE_RULER_GUTTER / 2 - mobileRulerFontSize
                      )}
                      y={boardY + boardPixelHeight}
                      rotation={-90}
                    >
                      <Text
                        width={boardPixelHeight}
                        text={`${board.height / 10} cm`}
                        align="center"
                        fontFamily="Arial, sans-serif"
                        fontSize={mobileRulerFontSize}
                        fill="#52585c"
                      />
                    </Group>
                  </Group>
                )
              : showRulers && (
                  <Group listening={false}>
                    <Line
                      points={[
                        boardX,
                        boardY - desktopRulerGutter / 2,
                        boardX + boardPixelWidth,
                        boardY - desktopRulerGutter / 2,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX,
                        boardY - desktopRulerGutter / 2 - tick,
                        boardX,
                        boardY - desktopRulerGutter / 2 + tick,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX + boardPixelWidth,
                        boardY - desktopRulerGutter / 2 - tick,
                        boardX + boardPixelWidth,
                        boardY - desktopRulerGutter / 2 + tick,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Text
                      x={boardX}
                      y={0}
                      width={boardPixelWidth}
                      height={Math.max(
                        0,
                        boardY - desktopRulerGutter / 2 - tick
                      )}
                      text={`${board.width / 10} cm`}
                      align="center"
                      verticalAlign="middle"
                      fontFamily="Arial, sans-serif"
                      fontSize={rulerFontSize}
                      fill="#52585c"
                    />
                    <Line
                      points={[
                        boardX - desktopRulerGutter / 2,
                        boardY,
                        boardX - desktopRulerGutter / 2,
                        boardY + boardPixelHeight,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX - desktopRulerGutter / 2 - tick,
                        boardY,
                        boardX - desktopRulerGutter / 2 + tick,
                        boardY,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        boardX - desktopRulerGutter / 2 - tick,
                        boardY + boardPixelHeight,
                        boardX - desktopRulerGutter / 2 + tick,
                        boardY + boardPixelHeight,
                      ]}
                      stroke={ruler}
                      strokeWidth={1}
                    />
                    <Group
                      x={Math.max(
                        0,
                        boardX - desktopRulerGutter / 2 - rulerFontSize
                      )}
                      y={boardY + boardPixelHeight}
                      rotation={-90}
                    >
                      <Text
                        width={boardPixelHeight}
                        text={`${board.height / 10} cm`}
                        align="center"
                        fontFamily="Arial, sans-serif"
                        fontSize={rulerFontSize}
                        fill="#52585c"
                      />
                    </Group>
                  </Group>
                )}

            <Rect
              name="board-background"
              x={boardX}
              y={boardY}
              width={boardPixelWidth}
              height={boardPixelHeight}
              fill="#e8e2d4"
              cornerRadius={1}
              stroke="#b9bab6"
              strokeWidth={1}
              shadowColor="#23272a"
              shadowBlur={8}
              shadowOpacity={0.1}
              shadowOffsetY={3}
              preventDefault={false}
            />

            <Group
              x={boardX}
              y={boardY}
              scaleX={scale}
              scaleY={scale}
              clipX={0}
              clipY={0}
              clipWidth={board.width}
              clipHeight={board.height}
            >
              {texture && textureWidth > 0 && textureHeight > 0 && (
                <Group
                  x={design.orientation === "landscape" ? board.width : 0}
                  y={0}
                  rotation={design.orientation === "landscape" ? 90 : 0}
                  listening={false}
                >
                  <KonvaImage
                    image={texture}
                    x={textureX}
                    y={textureY}
                    width={textureWidth}
                    height={textureHeight}
                  />
                </Group>
              )}

              {design.pieces.map(piece => {
                const spec = CATALOG[piece.kind];
                const active = selected === piece.id;
                const conflict = conflicts.has(piece.id);
                const hitWidth = Math.max(spec.width, 44 / scale);
                const hitHeight = Math.max(spec.height, 44 / scale);
                const hitX = (spec.width - hitWidth) / 2;
                const hitY = (spec.height - hitHeight) / 2;
                const outline = active || conflict;

                return (
                  <Group
                    key={piece.id}
                    ref={node => {
                      if (node) pieceNodes.current.set(piece.id, node);
                      else pieceNodes.current.delete(piece.id);
                    }}
                    id={piece.id}
                    name="board-piece"
                    x={piece.x}
                    y={piece.y}
                    draggable={!isMobile && !readonly}
                    preventDefault={false}
                    onClick={() => onSelect(piece.id)}
                    onTap={() => onSelect(piece.id)}
                    onMouseDown={event => {
                      if (!readonly && !isMobile)
                        event.currentTarget.draggable(true);
                    }}
                    onDragStart={event => {
                      if (readonly || isMobile) return;
                      onSelect(piece.id);
                      event.currentTarget.getStage()!.container().style.cursor =
                        "grabbing";
                    }}
                    onDragMove={event => {
                      if (readonly || isMobile) return;
                      event.currentTarget.position(
                        constrain(
                          piece.kind,
                          design.board,
                          event.currentTarget.x(),
                          event.currentTarget.y(),
                          false,
                          design.orientation ?? "portrait"
                        )
                      );
                    }}
                    onDragEnd={event => {
                      if (readonly || isMobile) return;
                      const point = constrain(
                        piece.kind,
                        design.board,
                        event.currentTarget.x(),
                        event.currentTarget.y(),
                        snap,
                        design.orientation ?? "portrait"
                      );
                      event.currentTarget.position(point);
                      onMove(piece.id, point.x, point.y);
                      event.currentTarget.getStage()!.container().style.cursor =
                        "grab";
                    }}
                    onMouseEnter={event => {
                      if (!readonly && !isMobile)
                        event.currentTarget
                          .getStage()!
                          .container().style.cursor = "grab";
                    }}
                    onMouseLeave={event => {
                      event.currentTarget.getStage()!.container().style.cursor =
                        "default";
                    }}
                  >
                    <Rect
                      x={hitX}
                      y={hitY}
                      width={hitWidth}
                      height={hitHeight}
                      fill="rgba(0, 0, 0, 0)"
                      preventDefault={false}
                    />
                    <PieceArt kind={piece.kind} finish={piece.finish} />
                    {outline && (
                      <Rect
                        width={spec.width}
                        height={spec.height}
                        cornerRadius={1}
                        stroke={conflict ? "#a65b3d" : "#252b30"}
                        strokeWidth={1 / scale}
                        listening={false}
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}
