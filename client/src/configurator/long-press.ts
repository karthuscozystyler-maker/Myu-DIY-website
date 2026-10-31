export const LONG_PRESS_DELAY = 1000;
export const LONG_PRESS_MOVE_TOLERANCE = 8;

type ClientPoint = { clientX: number; clientY: number };
type Rect = { left: number; top: number };

type BoardMetrics = {
  boardX: number;
  boardY: number;
  scale: number;
};

export function exceedsLongPressMovement(
  start: ClientPoint,
  current: ClientPoint,
  tolerance = LONG_PRESS_MOVE_TOLERANCE
) {
  return (
    Math.hypot(
      current.clientX - start.clientX,
      current.clientY - start.clientY
    ) > tolerance
  );
}

export function clientPointToBoardPoint(
  point: ClientPoint,
  rect: Rect,
  metrics: BoardMetrics
) {
  return {
    x: (point.clientX - rect.left - metrics.boardX) / metrics.scale,
    y: (point.clientY - rect.top - metrics.boardY) / metrics.scale,
  };
}
