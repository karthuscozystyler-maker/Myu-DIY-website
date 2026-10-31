# 沐幕引磁收納DIY — 純前端原型

本專案使用React19.2.1、react-konva19.2.0、Konva10.8.0。無登入、資料庫或付款；已加入購物車接駁程式，但布／新套裝未建商品，未驗證真實全單加車，未改動SHOPLINE或Google Sheet，未正式發佈。此處為內部操作／素材記錄；客人畫面不顯示開發套件、JSON、API、首批等資訊。

## 頁面與操作

首頁 `/` 有玄關、廚房、浴室、書檯/化妝檯、DIY及配件六入口。配件直接連用戶SHOPLINE商品頁，只有這個入口可單獨選購配件。`/series/:series` 的固定套裝按表列真實組成，選套裝後只能換布；岩岭暗灰布配岩岭暗灰件，其他一律米白（DIY不限）。套裝清單必然包括1張布及原配件，價格／庫存以SHOPLINE為準，不冒充落單。

全頁及卡片文字區純白；原店已有頁首與頁尾，所以原型不自製品牌頁首或頁尾，只有內容內返回首頁連結。主頁按用戶原圖主視覺 →「你想先改造哪裡？」六入口（四系列「套裝選擇」）→原產品詳情圖與動畫排序，不新增假銷量、評論、促銷或付款功能。

`/diy` 自由加入、直接拖動及刪除配件，已取消一秒長按。手機布面為容器89%闊，保留比例並顯示橫／豎cm尺，整頁自然捲動，不在畫布內平移或按視窗高度縮布。配件每頁4款2×2，先揀系列，目錄可收起且布闊不變；桌面左目錄右畫布。小計與清單在手機固定底部，頁面留足底部空間；至少一件配件才可查看購買清單及加入購物車。首頁及系列頁不載Konva。

手機用native capture、non-passive touchstart，單指hit配件即preventDefault及記錄偏移，touchmove即更新位置，touchend提交，取消/Esc/尺寸方向變更還原；碰空白位置從不接管，維持touch-action:auto及整頁捲動。不存在計時器、進度或解鎖DOM；桌面滑鼠直接拖。仍需店主實際iPhone/Android試手感，合成測試不能代表每個裝置。

新增前色點24px、點擊區44px，顏色與系列偏好記住；轉色只影響目錄和新加入實例，上布後不提供改色，可以刪除再加。奶油／灰可混色，小鐵盒固定色。保存仍用v3鍵，舊plain/slate本機資料回退可用布款；清空只移除配件，不重設布款尺寸方向。撤銷／重做保留。

## 布款與圖片來源

目前只有經典奶茶格紋、沐慕小花磚兩款有素材，各可38×70、70×100、橫／直。縮圖搜尋面板可擴充20多款，但不憑空填未收到圖片。物理尺寸使用毫米，小布從700×1000來源按380×700同尺度crop，不壓扁；橫放旋轉底紋90度，配件朝上不轉。改尺寸／方向保留全部配件、按相對中心重排限界並提示檢查位置；不是實物碰撞、開蓋、取刀、深度或磁吸承重驗證。

原始素材取自用戶，米白配件曾AI去背及轉正面，3款暗灰圖由正面參考AI改色，是色款示意，不是灰色原始實拍。小鐵盒圖片咖啡豆屬拍攝展示，不含食品。客人只看必要圖片參考提示。首頁四場景取自用戶提供參考圖的照片裁圖，非生成場景。原始照片未覆蓋；`assets.ts`經`asset-url.ts`使用`client/public/products/`及`content/`，SHOPLINE runtime 由 GitHub Pages（`docs/`）同一資料夾載入圖片，詳見 `GITHUB-UPLOAD-README.md`。

## 套裝資料與欠項

`sets.ts`從用戶已讀取的表去重出32套：廚房10（小6大4）、浴室10（小4大6）、玄關4（小3大1）、書檯8（小4大4），每套24款公開布名/SKU變體。未輸出套裝價、成本、毛利、ERP內部資料或工作欄，避免把不同布款價差當同價。

每套目前至少一種配件未收到照片與尺寸，因此頁面完整列齊真實配件名稱和數量，但明示尚未提供整套排位預覽；未知物品不亂造圖/尺寸，不會將四款DIY配件冒充所有套裝。下一步需要補足各套裝全配件正面圖、尺寸及預設排位／套裝圖。布面灰款的唯一配灰規則已資料函式及測試確認，但灰布原圖未到，試用面板只列兩款有圖布。

## 數量、售價與接駁

六勾架25×6cm、瓶架28×10cm、刀架18×20.5cm、圓盒直徑8.5cm。小鐵盒每實例1個，4入一盒，5個排位→2盒8個→3個未排位；購物車程式傳盒數，不是排位個數。參考價六勾88、瓶架168、刀架188、四入盒138；不是即時價格或庫存，布自由組合售價未知，不填假總價，配件預估小計＋布價另計。成本毛利不入前端。

19:26用戶確認兩款試用布及新套裝未建於SHOPLINE。已核對配件公開kit API並準備精確SKU匹配與商戶既有`/api/kit/add`接駁，但缺少布／新套裝來源；必須建立商品、提供連結後再補來源及測實際加車。全清單先preflight，缺任何SKU則不POST；DIY先加配件最後加布；partial/uncertain不自動重試，success需客人明確再加一份才允許重複。session/customer於click讀，無admin token。清單已置中native dialog top-layer，手機desktop都測中心及主按鈕可見。短HTML可貼SHOPLINE，切頁用元件內狀態，不使用hash。

## 結構與開發

`Start.tsx/SeriesPage.tsx`與`pages.css`為選購頁；`Home.tsx`為DIY狀態；`CatalogDock/FabricPicker`為目錄與布款面板；`BoardCanvas/PieceArt`為Konva與素材；`model/fabrics/sets`管理公開資料與尺寸；`long-press.ts`純觸控座標邏輯；`purchase-data/PurchaseReview`管理購買單位及清單。

建議Node22、pnpm10.18.0。預設本機http://localhost:3000，無需SHOPLINE token或資料庫。專案保留未使用server/drizzle範本檔。

```bash
npx --yes pnpm@10.18.0 install --frozen-lockfile
npx --yes pnpm@10.18.0 dev:static
npx --yes pnpm@10.18.0 check
npx --yes pnpm@10.18.0 exec vitest run
npx --yes pnpm@10.18.0 build:static
```

靜態輸出dist/public。最新TypeScript、49項測試及建置通過。真實POST未測；成功flow、5個小鐵盒→2盒與防連點以mock測試，未建cloth實際GET preflight發POST數為0。

## 詳情媒體（18:25批准）

來源 https://www.themyumyu.com/pages/magnetic-storage ，完整DOM媒體映射在design-references/detail-media-sources.json，呈現／排除原因在detail-media-selection.json。主視覺使用用戶2048×1280原圖，沒有改字或裁邊。詳情保留安裝動畫、產品比較、適用牆面及兩張Q&A；排除原頁入門組購買卡、重複系列選擇圖片及原店導流入口。

牆面圖只裁底部LINE／原店鑑賞與保固聯絡CTA，三列建議及完整油漆／粉化警語保留；使用Q&A只裁原店七天退貨項，不搬未核實條款，保留四題產品問題。文字來源未重新生成。原始圖片在public/content/source，不覆蓋原件；原GIF轉網站animatedWebP仍67幀、3940ms、無限loop，由1296×810重編960×600，約2.74MB；完整原動畫保留。ProductDetails透過IntersectionObserver接近視窗220px才設src，避免首次載入大動畫，手機單欄，桌面FAQ可並排。公開detail-media.ts只包含選用媒體路徑／alt／尺寸，不含原店導流。

本次TypeScript、6檔34tests及靜態建置通過。手機390×844合成觸控核對：touchstart命中配件即接管，30ms後move已移動並保存；touchcancel還原；空白start/move均未阻止nativepage捲動；四卡及cm尺（70/100→70/38）正確，無水平overflow或自製header。主頁DOM順序hero→selection→details，四『套裝選擇』，所有卡與body純白；未捲到詳情前5項都未設src，捲到後全載入。無原店LINE／促銷導流link，無startercard。GIF已檢查67frames/3940ms/loop0。手機截圖確認略縮布與兩軸cm可見；尚未等同真機全面觸控驗證。
