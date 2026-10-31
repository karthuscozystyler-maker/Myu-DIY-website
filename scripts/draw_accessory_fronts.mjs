// Draws the front (wall-facing) view of every accessory as SVG, to scale.
// Sizes come from the dimension labels on the supplier photos in
// source-photos/accessories/ and must match catalog-data.ts (checked in tests).
// Output: client/public/products/accessory-XX-{cream,charcoal}-front.svg
//
//   node scripts/draw_accessory_fronts.mjs
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "client/public/products");
const PX_PER_MM = 4;

const PALETTES = {
  cream: {
    top: "#F4EEE0",
    body: "#E8DEC7",
    shade: "#D5C8AA",
    edge: "#B8A988",
    hole: "#9A8D74",
    inner: "#CBBD9C",
    base: "#3E3A36",
  },
  charcoal: {
    top: "#4B4845",
    body: "#3A3836",
    shade: "#2B2927",
    edge: "#1D1C1A",
    hole: "#121110",
    inner: "#252321",
    base: "#1F1D1B",
  },
};

// Helpers return SVG fragments in millimetres.
const r = (x, y, w, h, fill, rx = 1.5, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const panel = (p, x, y, w, h, rx = 2) =>
  r(x, y, w, h, "url(#g)", rx, `stroke="${p.edge}" stroke-width="0.6"`);
const flat = (p, x, y, w, h, fill, rx = 1) =>
  r(x, y, w, h, fill, rx, `stroke="${p.edge}" stroke-width="0.5"`);
/** Brand mark: three short lines. */
const logo = (p, x, y, w = 9) =>
  [0, 2.2, 4.4]
    .map(d => r(x, y + d, d === 4.4 ? w * 0.7 : w, 0.9, p.hole, 0.45))
    .join("");
/** Two groups of three ventilation slots, centred on cx. */
const vents = (p, cx, y, groupW, gap = 4) =>
  [-1, 1]
    .map(side => {
      const x = side < 0 ? cx - gap / 2 - groupW : cx + gap / 2;
      return [0, 3.4, 6.8]
        .map(d => r(x, y + d, groupW, 1.6, p.hole, 0.8))
        .join("");
    })
    .join("");
/** A hook seen from the front: a short stem ending in a rounded tip. */
const hook = (p, cx, y, h, w = 4) =>
  r(cx - w / 2, y, w, h, p.shade, w / 2, `stroke="${p.edge}" stroke-width="0.5"`) +
  `<circle cx="${cx}" cy="${y + h - w / 2}" r="${w / 2 + 0.6}" fill="${p.body}" stroke="${p.edge}" stroke-width="0.5"/>`;
const knob = (p, cx, cy, rad = 6) =>
  `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${p.top}" stroke="${p.edge}" stroke-width="0.6"/><circle cx="${cx}" cy="${cy}" r="${rad * 0.55}" fill="${p.body}"/>`;
const rod = (p, x, y, w, t = 3) =>
  r(x, y, w, t, p.shade, t / 2, `stroke="${p.edge}" stroke-width="0.5"`);

// Each drawing: [width mm, height mm, (palette) => svg body]
const DRAWINGS = {
  // 公仔展示收納架 31 × 20.5 cm: clear acrylic case with a middle shelf.
  "accessory-01": [310, 205, p =>
    r(0, 0, 310, 205, "rgba(235,240,242,0.55)", 3, `stroke="#AEB6BA" stroke-width="1.2"`) +
    r(4, 4, 302, 189, "rgba(255,255,255,0.25)", 2, `stroke="#C9D0D3" stroke-width="0.6"`) +
    r(4, 92, 302, 3, "rgba(190,200,205,0.8)", 1) +
    `<circle cx="292" cy="28" r="5" fill="rgba(200,208,212,0.9)" stroke="#AEB6BA" stroke-width="0.6"/>` +
    flat(p, 0, 193, 310, 12, p.body, 2)],
  // 六勾架 25 × 6 cm
  hooks: [250, 60, p =>
    panel(p, 0, 0, 250, 46) + logo(p, 10, 10) +
    [0, 1, 2, 3, 4, 5].map(i => hook(p, 25 + i * 40, 30, 30)).join("")],
  // 六連勾雙層置物架 25 × 9 cm: shelf box on top, six hooks below.
  "accessory-03": [250, 90, p =>
    flat(p, 0, 0, 250, 68, p.shade, 2) +
    panel(p, 0, 0, 250, 38) +
    [0, 1, 2, 3, 4, 5].map(i => hook(p, 25 + i * 40, 56, 34)).join("")],
  // 刀架 18 × 20.5 cm
  knife: [180, 205, p =>
    panel(p, 0, 0, 180, 196, 3) + r(0, 0, 180, 5, p.top, 2) +
    vents(p, 90, 150, 58) + flat(p, 2, 194, 176, 11, PALETTES.charcoal.base, 1.5)],
  // 可調節雙層平板置物架 25 × 12 cm: back plate, upper and lower shelf edges.
  "accessory-05": [250, 120, p =>
    panel(p, 0, 0, 250, 120, 3) + logo(p, 10, 10) +
    [30, 52, 74, 96].map(y => `<circle cx="12" cy="${y}" r="1.4" fill="${p.hole}"/><circle cx="238" cy="${y}" r="1.4" fill="${p.hole}"/>`).join("") +
    flat(p, 0, 54, 250, 6, p.top, 1) + flat(p, 0, 113, 250, 7, p.top, 1.5)],
  // 吹風機架 20.5 × 8 cm: back plate, prongs on the left, cup with knob on the right.
  "accessory-06": [205, 80, p =>
    panel(p, 0, 0, 205, 58, 3) +
    hook(p, 22, 40, 34, 6) + hook(p, 62, 40, 34, 6) +
    panel(p, 108, 4, 97, 76, 10) + knob(p, 156, 42, 9)],
  // 單層平板置物架 25 × 8.7 cm
  "accessory-07": [250, 87, p =>
    panel(p, 0, 0, 250, 87, 4) + logo(p, 12, 12) +
    `<circle cx="238" cy="24" r="1.4" fill="${p.hole}"/>` +
    flat(p, 0, 80, 250, 7, p.top, 1.5)],
  // 單格收納桶 12 × 9 cm: cup with knob.
  "accessory-08": [120, 90, p =>
    flat(p, 6, 0, 108, 20, p.shade, 4) +
    panel(p, 0, 12, 120, 78, 12) + knob(p, 86, 50, 9)],
  // 四格筆筒收納架 8 × 25 cm: four stacked pockets.
  "accessory-09": [80, 250, p =>
    flat(p, 0, 0, 80, 250, p.shade, 2) +
    [0, 1, 2].map(i => panel(p, 0, 22 + i * 62, 80, 40, 1)).join("") +
    `<path d="M0 208 L80 208 L80 236 L66 250 L0 250 Z" fill="url(#g)" stroke="${p.edge}" stroke-width="0.6"/>` +
    `<circle cx="40" cy="8" r="1.5" fill="${p.hole}"/>`],
  // 多功能雙桿架 26 × 9 cm: back plate with an upper and a lower rod.
  "accessory-10": [260, 90, p =>
    panel(p, 6, 0, 248, 66, 3) + logo(p, 16, 10) +
    rod(p, 0, 18, 260, 4) + flat(p, 0, 18, 4, 62, p.shade, 2) + flat(p, 256, 18, 4, 62, p.shade, 2) +
    rod(p, 0, 80, 260, 4)],
  // 手機架 10 × 12 cm
  "accessory-11": [100, 120, p =>
    panel(p, 0, 0, 100, 120, 4) + logo(p, 8, 10) + flat(p, 0, 104, 100, 16, p.top, 2)],
  // 方格收納架 短款 18 × 11 cm: back plate behind a lower front wall with vents.
  "accessory-12": [180, 110, p =>
    flat(p, 0, 0, 180, 110, p.shade, 3) + panel(p, 0, 38, 180, 72, 3) + vents(p, 112, 82, 36)],
  // 方格收納架 長款 25 × 11.5 cm
  "accessory-13": [250, 115, p =>
    flat(p, 0, 0, 250, 115, p.shade, 3) + panel(p, 0, 40, 250, 75, 3) + vents(p, 165, 86, 46)],
  // 梳妝收納架 長款 21 × 9 cm: box with knob and an end compartment.
  "accessory-14": [210, 90, p =>
    panel(p, 0, 0, 210, 90, 4) + flat(p, 168, 6, 38, 80, p.top, 3) + knob(p, 120, 50, 10)],
  // 瓶子收納架 28 × 10 cm: back plate, rail and vented basket.
  bottles: [280, 100, p =>
    flat(p, 0, 0, 280, 100, p.shade, 3) + rod(p, 0, 40, 280, 4) +
    panel(p, 0, 54, 280, 46, 3) + vents(p, 140, 72, 70, 10)],
  // 砧板架 20 × 12.6 cm: back plate and a 5.5 cm front panel.
  "accessory-16": [200, 126, p =>
    panel(p, 0, 0, 200, 126, 4) + flat(p, 0, 71, 200, 55, p.top, 3) + logo(p, 176, 82, 12)],
  // 紙巾雙層置物架 18 × 14.5 cm: top tray, open frame, lower tray.
  "accessory-17": [180, 145, p =>
    flat(p, 0, 0, 180, 145, p.inner, 3) + panel(p, 0, 0, 180, 30, 3) + logo(p, 8, 9) +
    flat(p, 0, 30, 10, 115, p.body, 1) + flat(p, 150, 30, 30, 104, p.body, 2) +
    flat(p, 0, 134, 180, 11, p.top, 2)],
  // 自由調節收納架: one upright, 5.5 × 25 cm (sold in pairs).
  "accessory-18": [55, 250, p =>
    panel(p, 0, 0, 55, 250, 3) + logo(p, 15, 14, 11) + `<circle cx="27.5" cy="32" r="1.5" fill="${p.hole}"/>` +
    flat(p, 0, 238, 55, 12, p.top, 2)],
  // 鍋蓋架 18 × 12 cm: back plate and a front panel with a centre notch.
  "accessory-19": [180, 120, p =>
    panel(p, 0, 0, 180, 120, 4) +
    `<path d="M0 34 L42 34 Q50 34 54 44 L62 62 Q66 70 74 70 L106 70 Q114 70 118 62 L126 44 Q130 34 138 34 L180 34 L180 120 L0 120 Z" fill="${p.top}" stroke="${p.edge}" stroke-width="0.6"/>` +
    vents(p, 90, 92, 40)],
  // 長方開放置物架 10 × 25 cm: tall back plate, bottom shelf with side gusset.
  "accessory-20": [100, 250, p =>
    panel(p, 0, 0, 100, 250, 3) + `<circle cx="50" cy="16" r="1.5" fill="${p.hole}"/>` +
    `<path d="M100 150 L100 244 L6 244 Z" fill="${p.shade}" stroke="${p.edge}" stroke-width="0.6"/>` +
    flat(p, 0, 243, 100, 7, p.top, 1.5)],
  // 隱形六勾衣帽架 42.5 × 6 cm: plate with six fold-down hooks.
  "accessory-21": [425, 60, p =>
    panel(p, 0, 0, 425, 60, 3) +
    [0, 1, 2, 3, 4, 5].map(i => flat(p, 24 + i * 66, 10, 49, 40, p.shade, 2) + r(44 + i * 66, 16, 9, 28, p.inner, 2)).join("")],
  // 雙鉤牙刷架 17 × 8 cm: cup with two arch-shaped holders.
  "accessory-22": [170, 80, p =>
    panel(p, 0, 0, 170, 80, 6) +
    [16, 52].map(x => `<path d="M${x} 80 L${x} 34 Q${x} 18 ${x + 14} 18 Q${x + 28} 18 ${x + 28} 34 L${x + 28} 80 L${x + 20} 80 L${x + 20} 34 Q${x + 20} 26 ${x + 14} 26 Q${x + 8} 26 ${x + 8} 34 L${x + 8} 80 Z" fill="${p.shade}" stroke="${p.edge}" stroke-width="0.5"/>`).join("") +
    flat(p, 104, 6, 60, 68, p.top, 4)],
  // 餐具架 18 × 13.5 cm: two-compartment box with vents and dark base.
  "accessory-23": [180, 135, p =>
    panel(p, 0, 0, 180, 126, 3) + r(0, 0, 180, 4, p.top, 2) + r(89, 0, 2, 4, p.edge, 0) +
    vents(p, 90, 92, 58) + flat(p, 2, 124, 176, 11, PALETTES.charcoal.base, 1.5)],
  // 餐巾紙捲架 27 × 8 cm overall: 23 cm back plate plus the roll arm.
  "accessory-24": [270, 80, p =>
    panel(p, 0, 0, 230, 80, 3) + logo(p, 10, 12) +
    rod(p, 6, 66, 264, 4) + flat(p, 262, 40, 8, 30, p.shade, 2)],
};

function svg(width, height, body, palette) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * PX_PER_MM}" height="${height * PX_PER_MM}" viewBox="0 0 ${width} ${height}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.top}"/><stop offset="1" stop-color="${palette.body}"/></linearGradient></defs>
${body}
</svg>
`;
}

const FILE_IDS = { hooks: "02", knife: "04", bottles: "15" };
for (const [id, [width, height, draw]] of Object.entries(DRAWINGS)) {
  const number = FILE_IDS[id] ?? id.replace("accessory-", "");
  for (const [finish, palette] of Object.entries(PALETTES)) {
    fs.writeFileSync(
      path.join(out, `accessory-${number}-${finish}-front.svg`),
      svg(width, height, draw(palette), palette)
    );
  }
}
console.log(`Drew ${Object.keys(DRAWINGS).length * 2} accessory front views.`);
