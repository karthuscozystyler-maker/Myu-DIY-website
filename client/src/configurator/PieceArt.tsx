import { useEffect, useState } from "react";
import { Group, Rect, Line, Circle, Image as KonvaImage } from "react-konva";
import { CATALOG, type PieceKind, type Finish } from "./model";
import { getProductImage } from "./assets";

export function useProductImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let active = true;
    setImage(null);
    const next = new window.Image();
    next.crossOrigin = "anonymous";
    next.onload = () => {
      if (active) setImage(next);
    };
    next.onerror = () => {
      if (active) setImage(null);
    };
    next.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}

export default function PieceArt({
  kind,
  finish,
}: {
  kind: PieceKind;
  finish: Finish;
}) {
  const { width: w, height: h } = CATALOG[kind];
  const image = useProductImage(getProductImage(kind, finish));
  const showPhoto = image;

  if (showPhoto) {
    // The front-view source retains its own ratio inside the physical product footprint.
    const scale = Math.min(w / image.width, h / image.height);
    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;
    return (
      <Group listening={false}>
        <KonvaImage
          image={image}
          x={(w - imageWidth) / 2}
          y={(h - imageHeight) / 2}
          width={imageWidth}
          height={imageHeight}
          // A soft cast shadow lifts the piece off busy fabric patterns.
          shadowColor="#000"
          shadowOpacity={0.4}
          shadowBlur={10}
          shadowOffsetX={2}
          shadowOffsetY={5}
        />
      </Group>
    );
  }

  // Keep a non-text physical footprint only while an image source is unavailable.
  const dark = finish === "charcoal";
  const fill = dark ? "#45484b" : "#d9d5cb";
  const stroke = dark ? "#25292c" : "#b5b0a7";

  if (kind === "tin") {
    return (
      <Group listening={false}>
        <Circle
          x={w / 2}
          y={h / 2}
          radius={w / 2 - 2}
          fill="#bcc0c2"
          stroke="#747a7e"
          strokeWidth={1.5}
        />
        <Circle
          x={w / 2}
          y={h / 2}
          radius={w / 2 - 9}
          fill="#e5e7e8"
          stroke="#a1a7aa"
          strokeWidth={1}
        />
      </Group>
    );
  }

  return (
    <Group listening={false}>
      <Rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        cornerRadius={1}
      />
      {kind === "hooks" &&
        Array.from({ length: 6 }, (_, i) => {
          const x = 20 + (i * (w - 40)) / 5;
          return (
            <Line
              key={i}
              points={[x, h - 14, x, h - 5, x + 7, h - 5]}
              stroke={dark ? "#92999e" : "#8b8880"}
              strokeWidth={2}
            />
          );
        })}
    </Group>
  );
}
