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

export type { FabricId } from "./fabric-data";
