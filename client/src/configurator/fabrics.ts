import { FABRIC_DATA, type FabricId } from "./fabric-data";

export type Fabric = {
  id: FabricId;
} & (typeof FABRIC_DATA)[FabricId];

const fabricIds = Object.keys(FABRIC_DATA) as FabricId[];

// The picker and every consumer derive their choices from the single source of truth.
export const FABRICS = fabricIds.map(
  id => ({ id, ...FABRIC_DATA[id] }) as Fabric
);

const FABRIC_ALIASES: Readonly<Record<string, FabricId>> = {
  plain: "fabric-wt",
  legacyplain: "fabric-wt",
  slate: "fabric-gy",
};

/**
 * Resolves a current fabric ID, an exact public fabric name, or a historical ID.
 * Unknown values remain safe by falling back to the original gingham selection.
 */
export function getFabric(value: string): Fabric {
  const normalized = value.trim();
  const id = Object.hasOwn(FABRIC_DATA, normalized)
    ? (normalized as FabricId)
    : FABRIC_ALIASES[normalized];

  return (
    FABRICS.find(fabric => fabric.id === id || fabric.name === normalized) ??
    FABRICS.find(fabric => fabric.id === "gingham")!
  );
}

/**
 * 引磁布 prices from the owner's sheet ("2 磁吸布"), [原價, 特價] in HKD.
 * Every fabric shares one price per size except 奶茶小方磚.
 */
const FABRIC_PRICES: Readonly<Record<"small" | "large", readonly [number, number]>> = {
  small: [418, 288],
  large: [838, 598],
};
const FABRIC_PRICE_OVERRIDES: Partial<
  Record<FabricId, Readonly<Record<"small" | "large", readonly [number, number]>>>
> = {
  "fabric-grid": { small: [468, 328], large: [948, 678] },
};

export function getFabricPrice(
  value: string,
  board: "small" | "large"
): readonly [number, number] {
  const { id } = getFabric(value);
  return (FABRIC_PRICE_OVERRIDES[id] ?? FABRIC_PRICES)[board];
}

export type { FabricId } from "./fabric-data";
