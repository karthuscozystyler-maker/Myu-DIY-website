# 沐幕引磁收納DIY：加入購物車 API 接駁說明

給負責 SHOPLINE 及後台 API 的同事。這份文件說明網站點樣將客人揀好嘅配件、引磁布或套裝加入 SHOPLINE 購物車，以及後台 API 需要提供咩。

---

## 1. 整體架構

```
SHOPLINE 頁面（cozystyler.com）
  └─ 自訂 HTML 短碼 <div data-myu-embed> … <script src="…/myu-runtime.js">
        └─ 收納工具（React + Konva，Shadow DOM 隔離，唔影響原店樣式）
              │  ① GET  {API}/api/kit/{handle}   讀商品及規格（每個 handle 一次）
              │  ② POST {API}/api/kit/add        逐行加入購物車
              ▼
        後台 API（同事負責）── 用 SHOPLINE Open API／店舖購物車，加入「該客人」的購物車
```

- 程式及圖片放喺 GitHub Pages：`https://karthuscozystyler-maker.github.io/Myu-DIY-website/`
- 原始碼：`https://github.com/karthuscozystyler-maker/Myu-DIY-website`
- 加車程式：`client/src/configurator/cart-client.ts`（請求格式）、`cart-plan.ts`（加咩貨）

**API token 絕對唔可以放喺前端**。前端只會傳 SKU 對應出嚟嘅 product／variation ID、數量同 session。

---

## 2. 喺短碼設定 API（唔使改程式）

```html
<div data-myu-embed
     data-cart-api="https://你的-api-網址"
     data-cart-handles="myumyu-lego-set-2,myumyu-lego-set-1,myumyu引磁布,浴室套裝handle,玄關套裝handle,書檯套裝handle">
  <p style="padding:20px;color:#5b3926;">載入收納工具…</p>
  <script src="https://karthuscozystyler-maker.github.io/Myu-DIY-website/myu-runtime.js"></script>
</div>
```

| 屬性 | 用途 | 唔填時 |
|---|---|---|
| `data-cart-api` | 後台 API 根網址（尾部唔使 `/`） | 用舊有 `https://cozystyle-xsddw2az.manus.space` |
| `data-cart-handles` | 要讀取嘅 SHOPLINE 商品 handle，以逗號分隔 | `myumyu-lego-set-2,myumyu-lego-set-1` |

handle 即商品網址 `/products/` 後面嗰段。新系列套裝上架後，把佢哋嘅 handle 加入 `data-cart-handles` 就得。

---

## 3. API 規格

前端用 `fetch`，`credentials: "omit"`，POST 帶 `Content-Type: application/json`，所以 API 要支援 **CORS**（允許 `https://www.cozystyler.com` 及 `https://cozystyler.com`，包括 OPTIONS preflight）。逾時 25 秒。

### 3.1 `GET {API}/api/kit/{handle}`：讀商品及規格

前端會為 `data-cart-handles` 每個 handle 各叫一次，**全部讀完先開始加車**。

回應（JSON）：

```json
{
  "available": true,
  "kind": "single",
  "productSetId": "6ae5b74b194595000e910df5",
  "children": [
    {
      "productId": "6ae5b74b194595000e910df5",
      "variations": [
        {
          "sku": "myu-legocloth-38-gwp",
          "key": "6ae5b74b6ec745000b3c6c3a",
          "quantity": 120,
          "preorderLimit": 9999
        }
      ]
    }
  ]
}
```

| 欄位 | 規則 |
|---|---|
| `available` | 必須係 `true`，否則成件商品會被忽略 |
| `kind` | 必須係 `"single"` |
| `productSetId` | SHOPLINE product ID（24 位十六進位） |
| `children[].productId` | 必須等於 `productSetId` |
| `variations[].sku` | SHOPLINE 規格 SKU，要同 Google Sheet 一字不差 |
| `variations[].key` | SHOPLINE **variation ID**（24 位十六進位）。**唔可以用 SKU 代替** |
| `quantity`、`preorderLimit` | 用嚟檢查庫存。`preorderLimit` 係 9999 或負數時當無限 |

前端會用 SKU 搵返唯一一個 variation。搵唔到、或者同一 SKU 出現喺兩個規格，就會停止並顯示「暫未開放購買」，**唔會加任何貨**。

### 3.2 `POST {API}/api/kit/add`：加入購物車（每行一次）

請求：

```json
{
  "sessionId": "客人 SHOPLINE session",
  "customerId": "會員 ID；訪客係空字串",
  "kind": "single",
  "productSetId": "6ae5b74b194595000e910df5",
  "variationId": "6ae5b74b6ec745000b3c6c3a",
  "quantity": 1
}
```

成功回應：`{ "ok": true }`。其他回應或 HTTP 錯誤都當失敗。

- `sessionId` 來自頁面 `window.mainConfig.sessionId`；`customerId` 來自 `window.mainConfig.currentUser._id`（或 `.id`）。前端只喺 `cozystyler.com` 網域先會讀取同發出加車。
- 後台要加入**呢個客人**嘅購物車，**唔可以清空或改動購物車入面原有嘅貨品**。

---

## 4. 前端會加咩貨（SKU 來源）

| 情況 | 加入嘅行 | 次序 |
|---|---|---|
| DIY | 每款配件（按顏色 SKU，小鐵盒按盒數）＋ 1 張引磁布 | **先配件、後引磁布**（布唔可以單買，避免只加咗布） |
| 系列套裝 | 1 行套裝 SKU（已包布同配件，唔會再逐件加） | — |

SKU 全部來自 Google Sheet「Myu New Product」：

| 類別 | 分頁 | SKU 格式 |
|---|---|---|
| 配件 | 1 配件單品 | 例如 `myu-lego-knife-wt`、`myu-lego-knife-gy` |
| 引磁布 | 2 磁吸布 | `myu-legocloth-38-{布代碼}`、`myu-legocloth-70-{布代碼}` |
| 廚房套裝 | 4 廚房Set | `myu-lego-{s|l}-{布代碼}-set{n}` |
| 浴室套裝 | 5 浴室Set | `myu-lego-bath-{s|l}-{布代碼}-set{n}` |
| 玄關套裝 | 6 玄關Set | `myu-lego-entry-{s|l}-{布代碼}-set{n}` |
| 書檯套裝 | 7 書檯化妝檯Set | `myu-lego-desk-{s|l}-{布代碼}-set{n}` |

**SHOPLINE 上每個規格嘅 SKU 一定要同 Sheet 一樣**，否則前端配對唔到，會顯示「暫未開放購買」。

---

## 5. 前端已處理嘅保護

- 全張清單先檢查（SKU、庫存）先加車；有任何一行唔得就一件都唔加。
- 加車中鎖住按鈕，防止連點重複加貨。
- 每行加車前先記錄「未確認」，避免刷新頁面後重複加。
- 部分成功時列出已加入嘅貨品，並提示客人去購物車確認。
- 唔會自動重試；成功後客人要明確再按一次先可以再加一份。

---

## 6. 價錢

- 網站而家顯示嘅套裝價同引磁布價係**參考價**，來自 Google Sheet。最終價錢、優惠及庫存以 SHOPLINE 購物車為準。
- 廚房套裝喺 Sheet 已改新價（「4 廚房Set」I 欄「要跟進」有舊價 → 新價），SHOPLINE 要同步更新。

---

## 7. 測試

1. 先用測試／隱藏商品，喺 SHOPLINE 預覽頁測試。
2. **真正加入客人購物車嘅測試，要店主批准先做。**
3. 測試清單：訪客、已登入會員、庫存不足、SKU 唔存在、API 逾時、連按兩次加車、DIY 有小鐵盒（5 個要加 2 盒）。

---

## 8. 改程式後重新發佈

```bash
pnpm install
pnpm check
pnpm exec vitest run
pnpm build:runtime
```

之後 commit 及 push 到 GitHub，GitHub Pages 會自動更新，SHOPLINE 短碼唔使重新貼。
