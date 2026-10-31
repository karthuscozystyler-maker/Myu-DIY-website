// Turns the supplier's angled product photos into straight-on front views.
// For each accessory, the four corners of its front face in the photo
// (scripts/accessory-photo-corners.json) are mapped onto a rectangle of the
// product's real size (4 px per mm), then the plain photo background is removed.
// Only real photo pixels are used: nothing is drawn or generated.
//
//   node scripts/rectify_accessory_photos.cjs [ids...]
//   node scripts/rectify_accessory_photos.cjs --sheet review.png   (contact sheet for checking)
//
// Corner format per photo: [TLx,TLy, TRx,TRy, BRx,BRy, BLx,BLy] in source pixels.
// Optional: plate (mm box the corners describe, when the product is wider than its back plate),
// erase (source-pixel boxes painted over, e.g. dimension labels), key ([t0,t1] background
// tolerance per finish) and noKey (keep the background, for the clear acrylic case).
const sharp = require("sharp"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const cfgPath = path.join(__dirname, "accessory-photo-corners.json");
const outDir = path.join(root, "client/public/products");
const photos = path.join(root, "source-photos/accessories");
const args = process.argv.slice(2);
const sheetAt = args.indexOf("--sheet");
const sheet = sheetAt >= 0 ? args.splice(sheetAt, 2)[1] : null;
const only = args;
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const PX = 4;
function solve(A, b) { const n = b.length; for (let i = 0; i < n; i++) { let m = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k; [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]]; for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } } const x = Array(n); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x; }
function homography(R, P) { const [x0, y0, x1, y1] = R; const dst = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], A = [], b = []; for (let i = 0; i < 4; i++) { const [x, y] = dst[i], u = P[i * 2], v = P[i * 2 + 1]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); } return solve(A, b); }
async function warp(file, W, H, P, erase = [], plate = null, noKey = false, key = [9, 24]) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Background colour: median of three points on the top edge (some photos have a dark label at the bottom).
  const sw = info.width;
  for (const [x, y, w, h] of erase) { // fill with each row's left/right border colour, blended across
    for (let yy = y; yy < y + h; yy++) { const L = (yy * sw + x - 2) * 3, Rr = (yy * sw + x + w + 1) * 3; for (let xx = x; xx < x + w; xx++) { const t = (xx - x) / w, i = (yy * sw + xx) * 3; for (let c = 0; c < 3; c++) data[i + c] = data[L + c] * (1 - t) + data[Rr + c] * t; } } }
  const bgs = [[5, 5], [sw - 6, 5], [sw >> 1, 5]].map(([x, y]) => { const i = (y * sw + x) * 3; return [data[i], data[i + 1], data[i + 2]]; });
  const bg = [0, 1, 2].map(c => bgs.map(p => p[c]).sort((a, b) => a - b)[1]);
  const R = plate ? plate.map(v => v * PX) : [0, 0, W, H]; const h = homography(R, P), out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = h[6] * (x + .5) + h[7] * (y + .5) + 1, u = (h[0] * (x + .5) + h[1] * (y + .5) + h[2]) / d - .5, v = (h[3] * (x + .5) + h[4] * (y + .5) + h[5]) / d - .5;
    const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    for (let ch = 0; ch < 3; ch++) {
      const g = (xx, yy) => data[(Math.min(info.height - 1, Math.max(0, yy)) * sw + Math.min(sw - 1, Math.max(0, xx))) * 3 + ch];
      out[(y * W + x) * 4 + ch] = (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
    }
    out[(y * W + x) * 4 + 3] = 255;
  }
  // Remove background connected to the border: flood fill over pixels near the bg colour.
  const dist = i => { const r = out[i] - bg[0], g = out[i + 1] - bg[1], b = out[i + 2] - bg[2]; const magenta = out[i] > 200 && out[i + 1] < 90 && out[i + 2] > 200; return magenta ? 0 : Math.sqrt(r * r + g * g + b * b); };
  const [T0, T1] = key, seen = new Uint8Array(W * H), stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  if (noKey) stack.length = 0;
  while (stack.length) { const p = stack.pop(); if (seen[p]) continue; const dd = dist(p * 4); if (dd > T1) continue; seen[p] = 1; out[p * 4 + 3] = dd <= T0 ? 0 : Math.round(255 * (dd - T0) / (T1 - T0)); const x = p % W, y = (p / W) | 0; if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1); if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W); }
  for (let p = 0; p < W * H; p++) if (dist(p * 4) === 0) out[p * 4 + 3] = 0;
  return out;
}
(async () => {
  const tiles = [];
  for (const [id, c] of Object.entries(cfg)) {
    if (only.length && !only.includes(id)) continue;
    const W = c.w * PX, H = c.h * PX;
    for (const [f, finish] of [["we", "cream"], ["bk", "charcoal"]]) {
      if (!c[f]) continue;
      const buf = await warp(path.join(photos, `${c.name}${f}.webp`), W, H, c[f], c.erase?.[f], c.plate, c.noKey, c.key?.[f]);
      const file = path.join(outDir, `${c.file}-${finish}-front.webp`);
      await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(file);
      if (!sheet) continue;
      const scale = Math.min(300 / W, 260 / H);
      tiles.push(await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).resize(Math.round(W * scale), Math.round(H * scale)).png().toBuffer().then(b => ({ b, w: Math.round(W * scale), h: Math.round(H * scale), label: `${c.name}${f} ${c.w}x${c.h}` })));
    }
  }
  console.log(`Wrote front views to ${path.relative(root, outDir)}`);
  if (!sheet) return;
  const cols = 4, cw = 320, ch = 300, rows = Math.ceil(tiles.length / cols);
  const comps = [];
  tiles.forEach((t, i) => { const x = (i % cols) * cw + (cw - t.w) / 2, y = Math.floor(i / cols) * ch + (270 - t.h) / 2; comps.push({ input: t.b, left: Math.round(x), top: Math.round(y) }); comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="24"><text x="6" y="16" font-size="13" font-family="Microsoft JhengHei">${t.label}</text></svg>`), left: (i % cols) * cw, top: Math.floor(i / cols) * ch + 274 }); });
  // checkerboard-ish grey background reveals transparency
  await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: "#9fb8a8" } }).composite(comps).png().toFile(sheet);
})();
