import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHARCOAL_IMAGES,
  FABRIC_IMAGES,
  HERO_IMAGE,
  PRODUCT_IMAGES,
  SCENE_IMAGES,
} from "./assets";
import { ACCESSORY_DATA } from "./catalog-data";
import { FABRIC_DATA } from "./fabric-data";
import { canPlacePiece } from "./model";
import { DETAIL_MEDIA } from "./detail-media";

const HOSTED_IMAGE = /^\/products\/[\w-]+\.webp$/;
const publicDir = path.resolve(import.meta.dirname, "../../public");

describe("received full catalog", () => {
  it("keeps all 25 accessories in both colour image maps", () => {
    expect(Object.keys(ACCESSORY_DATA)).toHaveLength(25);
    expect(Object.keys(PRODUCT_IMAGES)).toHaveLength(25);
    expect(Object.keys(CHARCOAL_IMAGES)).toHaveLength(25);
    for (const [id, item] of Object.entries(ACCESSORY_DATA)) {
      expect(item.skus.cream).toBeTruthy();
      expect(item.skus.charcoal).toBeTruthy();
      expect(PRODUCT_IMAGES[id as keyof typeof PRODUCT_IMAGES]).toMatch(
        HOSTED_IMAGE
      );
      expect(CHARCOAL_IMAGES[id as keyof typeof CHARCOAL_IMAGES]).toMatch(
        HOSTED_IMAGE
      );
    }
  });

  it("keeps all 21 received fabrics selectable with two board SKUs and image paths", () => {
    expect(Object.keys(FABRIC_DATA)).toHaveLength(21);
    expect(Object.keys(FABRIC_IMAGES)).toHaveLength(21);
    for (const [id, item] of Object.entries(FABRIC_DATA)) {
      expect(item.skus.small).toBeTruthy();
      expect(item.skus.large).toBeTruthy();
      expect(FABRIC_IMAGES[id as keyof typeof FABRIC_IMAGES]).toMatch(
        HOSTED_IMAGE
      );
    }
  });

  it("ships every referenced image with the hosted site", () => {
    const sources = [
      ...Object.values(PRODUCT_IMAGES),
      ...Object.values(CHARCOAL_IMAGES),
      ...Object.values(FABRIC_IMAGES),
      ...Object.values(SCENE_IMAGES),
      HERO_IMAGE,
      ...DETAIL_MEDIA.map(media => media.src),
    ];
    for (const src of sources) {
      expect(src).toMatch(/^\/(?:products|content)\//);
      expect(fs.existsSync(path.join(publicDir, src))).toBe(true);
    }
  });

  it("keeps the one unverified-width product visible but blocks unsafe placement", () => {
    expect(ACCESSORY_DATA["accessory-18"].dimensionsVerified).toBe(false);
    expect(canPlacePiece("accessory-18", "large", "portrait")).toBe(false);
  });
});
