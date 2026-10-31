// Renders a straight-on front view of each accessory, to scale, in the same
// style as the approved hook rack / bottle rack / knife block images
// (warm cream or blue-grey powder-coated metal, soft shading, dark slots).
// Sizes come from the dimension labels on the supplier photos in
// source-photos/accessories/ and must match catalog-data.ts (checked in tests).
//
//   node scripts/render_accessory_fronts.mjs [ids...]
//   node scripts/render_accessory_fronts.mjs --sheet review.png
//
// Output: client/public/products/accessory-XX-{cream,charcoal}-front.webp
// The hook rack, bottle rack and knife block keep their approved images.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "client/public/products");
const PX = 4; // px per mm

const FINISHES = {
  cream: {
    light: "#F2EDE0",
    body: "#E8E2D2",
    low: "#DDD7C5",
    edge: "#C9C3AF",
    side: "#BDB9AC",
    line: "#ACA690",
    slot: "#1C1C1B",
    inner: "#D3CBB4",
    tanSlot: "#B9AD8F",
    base: "#1E1E1E",
    grain: 0.018,
  },
  charcoal: {
    light: "#596064",
    body: "#4E5458",
    low: "#464C4F",
    edge: "#3A3F42",
    side: "#33383A",
    line: "#2A2E30",
    slot: "#16191A",
    inner: "#3F4447",
    tanSlot: "#16191A",
    base: "#1B1D1E",
    grain: 0.02,
  },
};

const defs = p => `
<defs>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.55" stop-color="${p.body}"/><stop offset="1" stop-color="${p.low}"/>
  </linearGradient>
  <linearGradient id="sides" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.10"/><stop offset="0.025" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.975" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/>
  </linearGradient>
  <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.25" stop-color="${p.body}"/><stop offset="1" stop-color="${p.low}"/>
  </linearGradient>
  <linearGradient id="rod" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.45" stop-color="${p.body}"/><stop offset="1" stop-color="${p.edge}"/>
  </linearGradient>
  <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3A3A3A"/><stop offset="0.3" stop-color="${p.base}"/><stop offset="1" stop-color="#111"/>
  </linearGradient>
  <radialGradient id="knob" cx="0.4" cy="0.35" r="0.7">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.7" stop-color="${p.body}"/><stop offset="1" stop-color="${p.edge}"/>
  </radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${p.grain * 6} 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="drop" x="-10%" y="-10%" width="120%" height="140%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.8"/><feOffset dy="0.9"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

// --- Building blocks (all in millimetres) ---------------------------------
const rr = (x, y, w, h, r) => `x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"`;
/** A powder-coated metal panel: shaded face, darker side edges, fine rim highlight. */
const panel = (p, x, y, w, h, r = 2.5, filter = "") =>
  `<g ${filter ? `filter="url(#${filter})"` : ""}>
  <rect ${rr(x, y, w, h, r)} fill="url(#face)"/>
  <rect ${rr(x, y, w, h, r)} fill="url(#face)" filter="url(#grain)" opacity="0.9"/>
  <rect ${rr(x, y, w, h, r)} fill="url(#sides)"/>
  <rect ${rr(x + 0.35, y + 0.35, w - 0.7, h - 0.7, Math.max(0, r - 0.35))} fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.45"/>
  <rect ${rr(x, y, w, h, r)} fill="none" stroke="${p.edge}" stroke-width="0.5"/>
  </g>`;
/** A front-facing strip (shelf lip, tray front) that sits proud of the panel behind it. */
const lip = (p, x, y, w, h, r = 1.5) =>
  `<g filter="url(#drop)"><rect ${rr(x, y, w, h, r)} fill="url(#lip)"/><rect ${rr(x, y, w, h, r)} fill="url(#sides)"/>
  <rect ${rr(x, y, w, h, r)} fill="none" stroke="${p.edge}" stroke-width="0.45"/>
  <line x1="${x + r}" y1="${y + 0.4}" x2="${x + w - r}" y2="${y + 0.4}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.4"/></g>`;
/** A recessed opening: dark with a light lower bevel. */
const slot = (p, x, y, w, h, fill = p.slot) =>
  `<rect ${rr(x, y, w, h, h / 2)} fill="${fill}"/>
  <rect ${rr(x + h * 0.2, y + h * 0.62, w - h * 0.4, h * 0.3, h * 0.15)} fill="#fff" opacity="0.10"/>`;
/** Brand mark: three pressed lines (long, short, long). */
const logo = (p, x, y, w = 13) =>
  slot(p, x, y, w, 1.6) + slot(p, x + w * 0.2, y + 3.1, w * 0.6, 1.6) + slot(p, x, y + 6.2, w, 1.6);
/** Two groups of three ventilation slots centred on cx. */
const vents = (p, cx, y, gw, gap = 4, fill) =>
  [-1, 1]
    .map(side => {
      const x = side < 0 ? cx - gap / 2 - gw : cx + gap / 2;
      return slot(p, x, y, gw, 2.6, fill) + slot(p, x + gw * 0.12, y + 4.8, gw * 0.76, 2.6, fill) + slot(p, x, y + 9.6, gw, 2.6, fill);
    })
    .join("");
/** A hook tip seen from the front, hanging below a panel. */
const hook = (p, cx, y, h = 7, w = 4.6) =>
  `<g filter="url(#drop)"><path d="M${cx - w / 2} ${y} L${cx + w / 2} ${y} L${cx + w / 2} ${y + h - w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx - w / 2} ${y + h - w / 2} Z" fill="url(#rod)" stroke="${p.edge}" stroke-width="0.4"/>
  <rect x="${cx - w / 2 + 0.7}" y="${y + 0.5}" width="0.8" height="${h - w / 2}" fill="#fff" opacity="0.25"/></g>`;
const rod = (p, x, y, w, t = 3.2) =>
  `<g filter="url(#drop)"><rect ${rr(x, y, w, t, t / 2)} fill="url(#rod)" stroke="${p.edge}" stroke-width="0.4"/></g>`;
const post = (p, x, y, h, t = 3.2) =>
  `<g filter="url(#drop)"><rect ${rr(x, y, t, h, t / 2)} fill="url(#rod)" stroke="${p.edge}" stroke-width="0.4"/></g>`;
const knob = (p, cx, cy, r = 6) =>
  `<g filter="url(#drop)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#knob)" stroke="${p.edge}" stroke-width="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="${p.edge}" stroke-opacity="0.6" stroke-width="0.4"/></g>`;
const hole = (p, cx, cy, r = 1.6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.slot}"/>`;
const darkBase = (x, y, w, h) =>
  `<rect ${rr(x, y, w, h, 1.6)} fill="url(#base)"/><line x1="${x + 1}" y1="${y + 0.4}" x2="${x + w - 1}" y2="${y + 0.4}" stroke="#fff" stroke-opacity="0.15" stroke-width="0.4"/>`;

// --- Front views: [width mm, height mm, palette => svg] -------------------
const DRAWINGS = {
  // 公仔展示收納架 31 × 20.5 cm: clear acrylic case, middle shelf, coloured base plate.
  "accessory-01": [310, 205, p =>
    `<rect ${rr(6, 6, 298, 190, 1)} fill="${p.body}" fill-opacity="0.85"/><rect x="6" y="6" width="298" height="190" fill="url(#face)" opacity="0.5"/>
    <rect ${rr(0, 0, 310, 197, 2)} fill="#F4F7F8" fill-opacity="0.35" stroke="#B9C2C6" stroke-width="1"/>
    <rect ${rr(3, 3, 304, 191, 1.5)} fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.8"/>
    <rect x="3" y="94" width="304" height="3" fill="#DCE3E6" fill-opacity="0.9"/><line x1="3" y1="97.5" x2="307" y2="97.5" stroke="#A9B3B7" stroke-width="0.4"/>
    <line x1="18" y1="6" x2="80" y2="188" stroke="#fff" stroke-opacity="0.55" stroke-width="5"/>
    <circle cx="290" cy="22" r="4.5" fill="#E8EEF0" stroke="#AEB8BC" stroke-width="0.6"/>` +
    panel(p, 0, 194, 310, 11, 1.5)],
  // 六連勾雙層置物架 25 × 9 cm: shelf box front on top, six hooks below.
  "accessory-03": [250, 90, p =>
    panel(p, 0, 0, 250, 72, 2.5) + lip(p, 0, 22, 250, 30, 2) +
    [0, 1, 2, 3, 4, 5].map(i => hook(p, 22 + i * 41.2, 70, 20, 5)).join("")],
  // 可調節雙層平板置物架 25 × 12 cm: back plate with two shelf edges.
  "accessory-05": [250, 120, p =>
    panel(p, 0, 0, 250, 120, 4) +
    [28, 46, 64, 82, 100].map(y => slot(p, 12, y, 1.6, 6) + slot(p, 236.4, y, 1.6, 6)).join("") +
    lip(p, 4, 50, 242, 5, 1.2) + lip(p, 0, 113, 250, 7, 1.5)],
  // 吹風機架 20.5 × 8 cm: back plate, two prongs on the left, cup with knob on the right.
  "accessory-06": [205, 80, p =>
    panel(p, 0, 0, 205, 62, 6) +
    hook(p, 24, 56, 22, 7) + hook(p, 66, 56, 22, 7) +
    panel(p, 102, 6, 103, 74, 14, "drop") + knob(p, 150, 44, 9)],
  // 單層平板置物架 25 × 8.7 cm
  "accessory-07": [250, 87, p =>
    panel(p, 0, 0, 250, 87, 6) + logo(p, 12, 12) + hole(p, 238, 26, 1.4) + lip(p, 0, 80, 250, 7, 1.5)],
  // 單格收納桶 12 × 9 cm: back plate behind a rounded cup with knob.
  "accessory-08": [120, 90, p =>
    panel(p, 4, 0, 112, 30, 6) + panel(p, 0, 10, 120, 80, 14, "drop") + knob(p, 88, 50, 9)],
  // 四格筆筒收納架 8 × 25 cm: back plate with four stacked pockets.
  "accessory-09": [80, 250, p =>
    panel(p, 0, 0, 80, 250, 2.5) + hole(p, 40, 9, 1.6) +
    [0, 1, 2].map(i => `<rect x="2" y="${22 + i * 64}" width="76" height="20" fill="${p.inner}" opacity="0.8"/>` + lip(p, 0, 40 + i * 64, 80, 44, 1.5)).join("") +
    `<rect x="2" y="214" width="76" height="6" fill="${p.inner}" opacity="0.8"/>` + lip(p, 0, 216, 80, 34, 2)],
  // 多功能雙桿架 26 × 9 cm: back plate with an upper and a lower rod.
  "accessory-10": [260, 90, p =>
    panel(p, 6, 0, 248, 70, 4) + logo(p, 16, 10) +
    post(p, 0, 16, 66) + post(p, 256.8, 16, 66) + rod(p, 0, 16, 260) + rod(p, 0, 82.8, 260)],
  // 手機架 10 × 12 cm: back panel with a front lip.
  "accessory-11": [100, 120, p =>
    panel(p, 0, 0, 100, 120, 6) + lip(p, 0, 102, 100, 18, 2.5)],
  // 方格收納架 短款 18 × 11 cm: back plate behind a vented front wall.
  "accessory-12": [180, 110, p =>
    panel(p, 0, 0, 180, 110, 4) + lip(p, 0, 36, 180, 74, 3) + vents(p, 112, 78, 44, 5, p.tanSlot)],
  // 方格收納架 長款 25 × 11.5 cm
  "accessory-13": [250, 115, p =>
    panel(p, 0, 0, 250, 115, 4) + lip(p, 0, 38, 250, 77, 3) + vents(p, 160, 82, 60, 6, p.tanSlot)],
  // 梳妝收納架 長款 21 × 9 cm: box with knob and an open end compartment.
  "accessory-14": [210, 90, p =>
    panel(p, 0, 0, 210, 90, 8) + `<rect ${rr(168, 6, 36, 78, 5)} fill="${p.inner}"/>` + panel(p, 0, 0, 166, 90, 8) + knob(p, 120, 50, 10)],
  // 砧板架 20 × 12.6 cm: back plate and a 5.5 cm front panel.
  "accessory-16": [200, 126, p =>
    panel(p, 0, 0, 200, 126, 6) + lip(p, 0, 71, 200, 55, 4) + logo(p, 176, 82, 12)],
  // 紙巾雙層置物架 18 × 14.5 cm: top tray, open frame, lower tray.
  "accessory-17": [180, 145, p =>
    panel(p, 0, 0, 180, 145, 3) + `<rect ${rr(12, 34, 134, 96, 6)} fill="${p.inner}"/>` +
    lip(p, 0, 0, 180, 32, 3) + logo(p, 9, 10) + lip(p, 0, 133, 180, 12, 2)],
  // 自由調節收納架: one upright, 5.5 × 25 cm (sold as a left/right pair).
  "accessory-18": [55, 250, p =>
    panel(p, 0, 0, 55, 250, 4) + logo(p, 16, 16, 12) + hole(p, 27.5, 36, 1.5) + lip(p, 0, 238, 55, 12, 2)],
  // 鍋蓋架 18 × 12 cm: back plate and a notched, vented front panel.
  "accessory-19": [180, 120, p =>
    panel(p, 0, 0, 180, 120, 6) +
    `<g filter="url(#drop)"><path d="M3 34 L42 34 Q50 34 54 44 L62 62 Q66 70 74 70 L106 70 Q114 70 118 62 L126 44 Q130 34 138 34 L177 34 Q180 34 180 37 L180 117 Q180 120 177 120 L3 120 Q0 120 0 117 L0 37 Q0 34 3 34 Z" fill="url(#lip)" stroke="${p.edge}" stroke-width="0.45"/></g>` +
    vents(p, 90, 88, 52, 6, p.tanSlot)],
  // 長方開放置物架 10 × 25 cm: tall back plate, bottom shelf.
  "accessory-20": [100, 250, p =>
    panel(p, 0, 0, 100, 250, 4) + hole(p, 50, 16, 1.6) + lip(p, 0, 243, 100, 7, 1.5)],
  // 隱形六勾衣帽架 42.5 × 6 cm: plate with six fold-down hooks.
  "accessory-21": [425, 60, p =>
    panel(p, 0, 0, 425, 60, 3) +
    [0, 1, 2, 3, 4, 5].map(i => `<rect ${rr(24 + i * 66, 9, 49, 42, 2)} fill="${p.inner}"/>` + lip(p, 44 + i * 66, 13, 9, 34, 2)).join("")],
  // 雙鉤牙刷架 17 × 8 cm: cup with two arch-shaped holders.
  "accessory-22": [170, 80, p =>
    panel(p, 0, 0, 170, 80, 10) +
    [14, 52].map(x => `<g filter="url(#drop)"><path d="M${x} 80 L${x} 34 Q${x} 16 ${x + 15} 16 Q${x + 30} 16 ${x + 30} 34 L${x + 30} 80 L${x + 22} 80 L${x + 22} 34 Q${x + 22} 24 ${x + 15} 24 Q${x + 8} 24 ${x + 8} 34 L${x + 8} 80 Z" fill="url(#lip)" stroke="${p.edge}" stroke-width="0.45"/></g>`).join("") +
    logo(p, 120, 16, 12)],
  // 餐具架 18 × 13.5 cm: two-compartment box with vents and dark base.
  "accessory-23": [180, 135, p =>
    panel(p, 0, 0, 180, 126, 3) + `<rect x="2" y="0.5" width="176" height="3" fill="${p.inner}"/><rect x="89" y="0.5" width="2" height="3" fill="${p.edge}"/>` +
    vents(p, 90, 92, 72, 6) + darkBase(1, 124, 178, 11)],
  // 餐巾紙捲架 27 × 8 cm overall: 23 cm back plate plus the roll rod.
  "accessory-24": [270, 80, p =>
    panel(p, 20, 0, 230, 74, 4) + logo(p, 30, 12) +
    post(p, 0, 50, 26) + post(p, 266.8, 50, 26) + rod(p, 0, 74.8, 270)],
};

const FILE_IDS = { hooks: "02", knife: "04", bottles: "15" };
const args = process.argv.slice(2);
const sheetAt = args.indexOf("--sheet");
const sheet = sheetAt >= 0 ? args.splice(sheetAt, 2)[1] : null;
const tiles = [];
for (const [id, [w, h, draw]] of Object.entries(DRAWINGS)) {
  if (args.length && !args.includes(id)) continue;
  const number = FILE_IDS[id] ?? id.replace("accessory-", "");
  for (const [finish, p] of Object.entries(FINISHES)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * PX}" height="${h * PX}" viewBox="0 0 ${w} ${h}">${defs(p)}${draw(p)}</svg>`;
    const file = path.join(out, `accessory-${number}-${finish}-front.webp`);
    const png = await sharp(Buffer.from(svg), { density: 72 * PX }).resize(w * PX, h * PX).png().toBuffer();
    await sharp(png).webp({ quality: 90, alphaQuality: 95 }).toFile(file);
    if (sheet) tiles.push({ png, w: w * PX, h: h * PX });
  }
}
console.log(`Rendered ${tiles.length || "all"} accessory front views.`);
if (sheet) {
  const cw = 420, ch = 300, cols = 4;
  const comps = [];
  for (const [i, t] of tiles.entries()) {
    const s = Math.min((cw - 20) / t.w, (ch - 20) / t.h);
    const input = await sharp(t.png).resize(Math.round(t.w * s), Math.round(t.h * s)).toBuffer();
    comps.push({ input, left: (i % cols) * cw + 10, top: Math.floor(i / cols) * ch + 10 });
  }
  await sharp({ create: { width: cols * cw, height: Math.ceil(tiles.length / cols) * ch, channels: 3, background: "#9fb8a8" } }).composite(comps).png().toFile(sheet);
}
