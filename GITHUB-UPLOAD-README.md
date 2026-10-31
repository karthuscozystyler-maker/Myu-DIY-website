# 沐幕引磁收納DIY：GitHub 及 SHOPLINE 部署

Repo：`https://github.com/karthuscozystyler-maker/Myu-DIY-website`
網站（GitHub Pages）：`https://karthuscozystyler-maker.github.io/Myu-DIY-website/`

## 架構

| 位置 | 用途 |
|---|---|
| `client/src/` | React／Konva 配置器原始碼 |
| `client/public/products/`、`client/public/content/` | 配件、布款、場景及詳情圖片 |
| `docs/` | **GitHub Pages 發佈資料夾**（由 build 產生，要一齊 commit） |
| `docs/myu-runtime.js` | SHOPLINE 載入的完整程式（含 CSS） |
| `deliverables/myu-shopline-cart-ready.html` | 貼入 SHOPLINE 的短 HTML |
| `deliverables/myu-complete.html` | 完整備份（程式內嵌，圖片仍由 GitHub Pages 載入）；**不要**貼入 SHOPLINE |

Runtime 會由自己所在的資料夾載入圖片，所以 `docs/` 入面嘅 `products/`、`content/` 要同 `myu-runtime.js` 放埋一齊。

## 第一次開 GitHub Pages（只需做一次）

1. GitHub repo → **Settings** → **Pages**。
2. **Source** 揀 **Deploy from a branch**。
3. Branch 揀 `main`，資料夾揀 `/docs`，按 **Save**。
4. 等 1–2 分鐘，打開 `https://karthuscozystyler-maker.github.io/Myu-DIY-website/` 應該見到收納工具。

GitHub Pages 免費版需要 repo 為 Public。程式碼本身冇密碼、API key 或成本／毛利資料。

## 修改後重新發佈

```bash
pnpm install
pnpm check
pnpm exec vitest run
pnpm build:runtime      # = vite build + scripts/build_shopline_html.mjs
```

然後喺 GitHub Desktop commit 及 **Push origin**。SHOPLINE 短 HTML 唔使重新貼，因為佢永遠載入最新 `myu-runtime.js`（GitHub Pages 約 10 分鐘快取）。

如要改用其他 hosting：`MYU_PUBLIC_BASE=https://你的網址/ pnpm build:runtime`，再把 `docs/` 全部上載。

## 本機預覽

```bash
pnpm dev:static          # http://localhost:3000
```
