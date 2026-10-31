import type { Finish, Pattern, PieceKind, Series } from "./model";
import type { FabricId } from "./fabric-data";
import { getFabric } from "./fabrics";
import { assetUrl } from "./asset-url";

export const FABRIC_IMAGES = {
  "fabric-ksp": assetUrl("products/fabric-fabric-ksp.webp"),
  "fabric-wt": assetUrl("products/fabric-fabric-wt.webp"),
  "fabric-grid": assetUrl("products/fabric-fabric-grid.webp"),
  "fabric-mtg": assetUrl("products/fabric-fabric-mtg.webp"),
  "fabric-mtdfl": assetUrl("products/fabric-fabric-mtdfl.webp"),
  "fabric-cyw": assetUrl("products/fabric-fabric-cyw.webp"),
  "fabric-lps": assetUrl("products/fabric-fabric-lps.webp"),
  "fabric-gy": assetUrl("products/fabric-fabric-gy.webp"),
  "fabric-mkl": assetUrl("products/fabric-fabric-mkl.webp"),
  "fabric-wpk": assetUrl("products/fabric-fabric-wpk.webp"),
  floral: assetUrl("products/fabric-floral.webp"),
  "fabric-line": assetUrl("products/fabric-fabric-line.webp"),
  "fabric-dbn": assetUrl("products/fabric-fabric-dbn.webp"),
  "fabric-lgs": assetUrl("products/fabric-fabric-lgs.webp"),
  "fabric-gwp": assetUrl("products/fabric-fabric-gwp.webp"),
  gingham: assetUrl("products/fabric-gingham.webp"),
  "fabric-bgs": assetUrl("products/fabric-fabric-bgs.webp"),
  "fabric-bwp": assetUrl("products/fabric-fabric-bwp.webp"),
  "fabric-bg": assetUrl("products/fabric-fabric-bg.webp"),
  "fabric-fbl": assetUrl("products/fabric-fabric-fbl.webp"),
  "fabric-wh": assetUrl("products/fabric-fabric-wh.webp"),
} satisfies Record<FabricId, string>;

export const BOARD_IMAGE = FABRIC_IMAGES.gingham;
export const FLORAL_IMAGE = FABRIC_IMAGES.floral;
export const HERO_IMAGE = assetUrl("content/magnetic-storage-hero.webp");

// Two-color references retain the supplied product identity; the view is prepared for the planner.
export const PRODUCT_IMAGES = {
  "accessory-01": assetUrl("products/accessory-01-cream-front.svg"),
  hooks: assetUrl("products/accessory-02-cream-front.svg"),
  "accessory-03": assetUrl("products/accessory-03-cream-front.svg"),
  knife: assetUrl("products/accessory-04-cream-front.svg"),
  "accessory-05": assetUrl("products/accessory-05-cream-front.svg"),
  "accessory-06": assetUrl("products/accessory-06-cream-front.svg"),
  "accessory-07": assetUrl("products/accessory-07-cream-front.svg"),
  "accessory-08": assetUrl("products/accessory-08-cream-front.svg"),
  "accessory-09": assetUrl("products/accessory-09-cream-front.svg"),
  "accessory-10": assetUrl("products/accessory-10-cream-front.svg"),
  "accessory-11": assetUrl("products/accessory-11-cream-front.svg"),
  "accessory-12": assetUrl("products/accessory-12-cream-front.svg"),
  "accessory-13": assetUrl("products/accessory-13-cream-front.svg"),
  "accessory-14": assetUrl("products/accessory-14-cream-front.svg"),
  bottles: assetUrl("products/accessory-15-cream-front.svg"),
  "accessory-16": assetUrl("products/accessory-16-cream-front.svg"),
  "accessory-17": assetUrl("products/accessory-17-cream-front.svg"),
  "accessory-18": assetUrl("products/accessory-18-cream-front.svg"),
  "accessory-19": assetUrl("products/accessory-19-cream-front.svg"),
  "accessory-20": assetUrl("products/accessory-20-cream-front.svg"),
  "accessory-21": assetUrl("products/accessory-21-cream-front.svg"),
  "accessory-22": assetUrl("products/accessory-22-cream-front.svg"),
  "accessory-23": assetUrl("products/accessory-23-cream-front.svg"),
  "accessory-24": assetUrl("products/accessory-24-cream-front.svg"),
  tin: assetUrl("products/tin-front.webp"),
} satisfies Record<PieceKind, string>;

export const CHARCOAL_IMAGES = {
  "accessory-01": assetUrl("products/accessory-01-charcoal-front.svg"),
  hooks: assetUrl("products/accessory-02-charcoal-front.svg"),
  "accessory-03": assetUrl("products/accessory-03-charcoal-front.svg"),
  knife: assetUrl("products/accessory-04-charcoal-front.svg"),
  "accessory-05": assetUrl("products/accessory-05-charcoal-front.svg"),
  "accessory-06": assetUrl("products/accessory-06-charcoal-front.svg"),
  "accessory-07": assetUrl("products/accessory-07-charcoal-front.svg"),
  "accessory-08": assetUrl("products/accessory-08-charcoal-front.svg"),
  "accessory-09": assetUrl("products/accessory-09-charcoal-front.svg"),
  "accessory-10": assetUrl("products/accessory-10-charcoal-front.svg"),
  "accessory-11": assetUrl("products/accessory-11-charcoal-front.svg"),
  "accessory-12": assetUrl("products/accessory-12-charcoal-front.svg"),
  "accessory-13": assetUrl("products/accessory-13-charcoal-front.svg"),
  "accessory-14": assetUrl("products/accessory-14-charcoal-front.svg"),
  bottles: assetUrl("products/accessory-15-charcoal-front.svg"),
  "accessory-16": assetUrl("products/accessory-16-charcoal-front.svg"),
  "accessory-17": assetUrl("products/accessory-17-charcoal-front.svg"),
  "accessory-18": assetUrl("products/accessory-18-charcoal-front.svg"),
  "accessory-19": assetUrl("products/accessory-19-charcoal-front.svg"),
  "accessory-20": assetUrl("products/accessory-20-charcoal-front.svg"),
  "accessory-21": assetUrl("products/accessory-21-charcoal-front.svg"),
  "accessory-22": assetUrl("products/accessory-22-charcoal-front.svg"),
  "accessory-23": assetUrl("products/accessory-23-charcoal-front.svg"),
  "accessory-24": assetUrl("products/accessory-24-charcoal-front.svg"),
  tin: assetUrl("products/tin-front.webp"),
} satisfies Record<PieceKind, string>;

export function getBoardImage(pattern: Pattern): string {
  return FABRIC_IMAGES[getFabric(pattern).id];
}

export function getProductImage(
  kind: PieceKind,
  finish: Finish = "cream"
): string {
  return finish === "charcoal" ? CHARCOAL_IMAGES[kind] : PRODUCT_IMAGES[kind];
}

export const SCENE_IMAGES: Record<Series, string> = {
  kitchen: assetUrl("products/scene-kitchen.webp"),
  bathroom: assetUrl("products/scene-bathroom.webp"),
  entry: assetUrl("products/scene-entry.webp"),
  desk: assetUrl("products/scene-desk.webp"),
};
export const ACCESSORIES_URL =
  "https://www.cozystyler.com/products/myumyu-lego-set-2";
