# 收納牆原型更新：真實感產品規劃介面

## 更新範圍

沿用現有 React 19＋Konva 純前端原型，不接 SHOPLINE API、不付款、不修改原店或 Google Sheet。本次用戶提供了 70×100cm 直放經典奶茶格紋布、六勾架、瓶子收納架、刀架、小鐵盒原圖及尺寸；要求介面及配件不要太 cute，真實感多一點。

保留新增、拖動、邊界限制、重疊提醒、網格吸附、微調、刪除、撤銷、重做、本機保存及 PNG／JSON 匯出。第一版以指定 70×100cm 布為主，配件使用真實尺寸：六勾架 25×6cm，瓶架 28×10cm，刀架 18×20.5cm，小鐵盒圖上標示直徑 8.5cm。六勾架深度未知，不估算。未核实接觸面、開蓋、刀具取用及安全空間。

自由砌可混色。灰色產品原圖未提供，灰色以明確標示的中性尺寸佔位圖表示，不用改色照片冒充商品。小鐵盒畫布一個代表一個实物，四個一盒，購買數量向上取整並顯示餘數；小鐵盒不設灰／奶油色選項。

價格取用戶表內已列的參考售價（六勾架88、瓶架168、刀架188、小鐵盒四入138），不傳成本或毛利給前端。底板單售／自由組合售價未核實，不填假價或用固定 Set 價代替；顯示配件參考小計、底板價格待核實，無正式總價。表內價格不是即時售價／庫存。

## 實作與素材

現有同頁工作區三欄結構保持，避免不必要重構。真實產品圖去除背景／尺寸箭嘴，保留原外形、材質及視角；不製造額外可愛瓶子或刀具。去背圖片仍有透視，圖片是外觀參考，平面框按已提供尺寸計算，不能冒充精準 CAD。小鐵盒圖保留一個盒身，移除分開的蓋及標示；圖中咖啡豆只屬拍攝展示，不表示包含食品。

底板使用用戶提供圖片的布面區域，明確不承諾照片花紋比例與色差精確。素材加入現有靜態前端的公開素材目錄，僅放非敏感產品圖片；不放原始完整商品表。新本機保存鍵避免混入之前假尺寸設計。

## 專案結構

- `client/src/configurator/model.ts`：尺寸、可選配件、位置限制、四入盒換算與摘要。
- `client/src/configurator/PieceArt.tsx`：實物參考圖與灰色尺寸佔位。
- `client/src/configurator/BoardCanvas.tsx`：底板真圖、拖動與按比例尺寸框。
- `client/src/pages/Home.tsx`：中性文案、產品目錄、清單、參考價及保存／匯出。
- `client/src/index.css`：中性配色、俐落邊界、響應式工作區。
- `client/src/configurator/model.test.ts`：沿用現有模型測試，補四入盒及真尺寸案例。
- `client/public/products/`：已整理並供前端使用的非敏感商品素材。

## 設計

Design Movement：Swiss functional design／簡潔家居產品規劃工具，不做兒童感、手帳感或可愛插畫。

核心原則：產品先於裝飾；介面中性；實物材質可信；每個尺寸與數量提示有清楚依據。

Color Philosophy：白與淺灰降低版面干擾，炭黑作主要操作及選取色，奶茶格紋只來自實際布款，不把整個頁面染成粉彩。

Layout Paradigm：左產品目錄、中間畫布、右購買清單，不加大幅宣傳裝飾或無關區塊。

Signature Elements：細直線、直角／微圓角工具列、克制的尺寸標註。去除傾斜積木標記、圓形糖果加號及可愛插畫道具。

Interaction Philosophy：拖動與選取迅速，提示直接說明數量或限制，不用彈跳／賣萌回饋。

Animation：只用120–160ms顏色／透明度過渡，不縮放彈跳；保留減少動態偏好。

Typography System：Inter／Arial 搭配 Noto Sans TC，清晰無襯線標題與數字，移除装飾性衬線大字。

Brand Essence：用實物參考與清楚尺寸幫用戶規劃收納牆；理性、克制、可信。

Brand Voice：短句、自然香港用語，但不賣萌。例如「按尺寸規劃收納牆」、「已排位5個；購買2盒；另有3個未排位」。

Wordmark & Logo：沿用 wall/lab 名稱，改成對齊直線的字標，現有平台 logo 保留，避免另增裝飾。

Signature Brand Color：炭黑 #292d30 作互動主色。

## 最新版面指示：參考 IKEA 工具感

用戶追加「版面唔好咁AI，一睇就知用AI整，你參考下IKEA」。因此不做大Hero口號、eyebrow宣傳、裝飾標籤或三張賣點卡片。用緊湊的頂欄、主畫布、產品側欄與清單；重視控件層次、尺寸、可預期操作。參考來源詳見 `design-references/notes.md`；只借鑑使用邏輯，不複製品牌。此追加指示優先於原本裝飾性頁首。

## 商業目的：幫客人選擇並轉成購買

用戶確認「要實用，啲人試完真係會買，唔係玩完就算」。所以產品目錄與購買清單是主要流程，保存／圖像／JSON匯出是輔助。清單要顯示配件色款、真正出售單位與餘數，並讓客人確認將會購買甚麼。原型可以提供『查看購買清單』只讀確認，但尚未核實商品ID、布價、庫存與現有加車後端，不提供冒充可用的『購買／結帳』按鈕，也不向原店送請求。正式階段需縮短配置完成到一鍵加車的步驟，而不是只增加遊戲化操作。

## 已有加車方式（只讀核對）

用戶提供的DAKA HTML實際呼叫 `https://cozystyle-xsddw2az.manus.space/api/kit/add`，普通商品傳 `kind:single, productSetId, variationId, quantity, sessionId, customerId`；加購品傳 `kind:addon, productSetId, quantity, sessionId, customerId`。商店內讀取 `window.mainConfig.sessionId` 及會員ID，逐款順序加入後導向 `/cart`。因此下一階段可沿用其加車路徑，但需核對MYU商品／規格映射、加購品與布的資格關係、單售布價、庫存及後端是否支援這批商品；今次未呼叫以上接口，也未修改服務。

購買清單確認由 `PurchaseReview.tsx` 呈現；`purchase-data.ts` 統一文字清單及JSON匯出，每列明示 `purchaseUnit`、`packSize`，避免將盒數當成個數。產品目錄尺寸直接顯示，不藏在大螢幕專用樣式。

## 正面配件參考圖更新

用戶要求配件不要側面，改用正面圖。四款照片作為產品身份參考，經AI圖片編輯轉成正對鏡頭、無左右偏轉／無俯視的正面透明素材，保留奶油金屬材質、六個掛勾、原通風孔及小鐵盒圓形特徵，不加刀具、瓶子或額外道具。小鐵盒保持一個盒身，圖中咖啡豆只屬原有展示。

此要求取代前一版保留斜角視角的素材呈現；圖片必須明示為AI正面外觀參考，不當成原始正面產品攝影或精準CAD。尺寸框仍使用已確認尺寸，價格、盒數、混色及未接購物車限制保持不變。四款公用圖片manifest更新，目錄、畫布及購買確認一起換圖。灰色仍為中性尺寸佔位，未偽造灰色實物圖。

## 手機優先更新（2026-10-28 12:59 指示）

用戶的五項新要求優先於舊的桌面三欄、固定直放、箭嘴微調和開發控制設定。首頁改為100dvh內的簡潔購物配置工具：短頁首、布款與橫／直切換、按可用寬高自適應的主畫布、緊湊配件區，以及固定可見的配件預估小計／查看清單入口。主頁不靠長頁垂直捲動，分類選擇及購買清單使用覆蓋式面板；長清單只在面板內捲動。必要時可放大排位，暫時收起配件區，完成後返回，不改動設計。

布旋轉保持同一商品與尺寸（70×100cm直放／100×70cm橫放），布紋圖真正旋轉90度而不是拉伸；配件不跟著旋轉，切換方向時以相對中心位置重新定位並夾在新邊界內。保存及清單會帶方向，不更改件／盒數、顏色或價格。Orientation資料向後相容，舊設計沒有方向欄位時作直放。

『網格』與『吸附』控制、上下左右微調、毫米座標、首批/v2、JSON、API、AI圖片來源、資料導入與後端欠項等開發資訊不出現在客人介面。關閉格線，拖動自由定位；只保留選取、刪除、顏色、撤銷／重做等有用操作。內部README保留素材真相；客人只看必要的『圖片／排位供參考』、布價另計、預估售價與尚未下單等限制，不冒充即時價格或可付款購物車。

分類為玄關系列、廚房系列、浴室系列、書檯/化妝檯系列。先選系列，再显示該系列配件；目前四款只歸廚房，不猜其他產品或分類。其他系列顯示簡短無配件狀態，後續按商品資料補充。配件每頁兩款、按下一頁切換，避免長列表；新增前可揀顏色，選取後可改色或刪除，沒有方向按鈕。小鐵盒仍固定款，逐個排位，按四入整盒買並顯示餘數。

模型由model.ts提供getBoard、changeOrientation、SERIES與getSeriesItems。BoardCanvas.tsx以ResizeObserver量度父容器寬高，按物理比例置中並提供至少44px的透明觸控區，不放大實際商品；Home及CatalogDock負責手機固定框架、系列面板、分頁及自動本機保存，index.css重寫應用樣式但保留Tailwind基础。PurchaseReview使用簡潔手機清單且顯示方向，purchase-data的可讀清單同樣帶方向，沒有開發詞彙。原商店、Google Sheet、購物車與付款仍不接駁。

## 已批准完整選購流程（2026-10-28 17:38，優先於以上舊版安排）

用戶已OK上一則完整方案。名稱「沐幕引磁收納DIY」，採用用戶圖1暖黃、圖3深啡配奶白底；首頁六入口：玄關、廚房、浴室、書檯/化妝檯、DIY、配件。配件直接連https://www.cozystyler.com/products/myumyu-lego-set-2，其餘流程必須包含布＋至少1配件，不能只買布。套裝按現有商品表，選套裝後自動展示固定組成，只改布，只有引磁布「岩岭暗灰」配岩岭暗灰配件，所有其他布配米白；DIY可混色。缺少圖片/尺寸的套裝不能憑空當成已完成精準排位，可展示真實組成清單與待補預覽；今次不冒充套裝全部有可拖素材。

DIY手機：布按屏幕可用寬度展開，不因手機高度縮成細塊；每頁4配件2×2，可收起面板，切換面板不縮布。用戶明確不要畫布內平移，採整頁自然捲動；配件要長按1秒才可移動，前1秒滑動超閾值取消長按供碌頁，滿秒給進度完成回饋再拖，放手鎖定。桌面滑鼠直接拖。不得用touch-action:none永久阻止整頁捲動；解鎖後非被動touchmove/手動指針位置拖，取消時恢復。不要新增點一下永久解鎖。

配件色點視覺縮小但44px可按，加入前揀且記住，改色只影響新加入實例，不再給已排位配件改色。產品目錄及畫布依選色更新圖；缺少灰色原圖時只可標色款示意，不假冒實拍。小鐵盒固定外觀、整盒4入/向上取整及餘數不變。

布選擇為覆蓋式縮圖面板，搜尋/分類與內捲可支援未來20多款，但今次只展示有素材的經典奶茶格紋及沐慕小花磚，各38×70與70×100，皆可橫直。素材保持物理比例和花紋密度；小布採同尺度局部取景不壓扁；resize後保留配件/位置並告知重新排位，不靜默刪件。岩岭暗灰配色規則寫入資料函式，無原圖不假裝新增已核實布。

桌面>=1024：左邊配件選擇（系列/初始色/4款/分頁）、右邊大畫布，清單入口容易到；不要把手機拉闊。首頁為暖色家居選擇卡而非大型AI式宣傳Hero。字體Noto Sans TC/系統黑體，暖黃按鈕、深啡文字、薄暖灰線，布與實物為主，120ms輕過渡無彈跳。字標用布摺矩形小標＋中文名稱，避免舊MYU英文開發品牌。資料/路由：Home.tsx改DIY工作區；新增Start.tsx、SeriesPage.tsx；App routes /、/diy、/series/:series；FabricPicker.tsx、CatalogDock.tsx、BoardCanvas.tsx分工。新套裝資料只輸出公開商品名/組成/SKU，不把成本、毛利、內部工作欄放前端。不接SHOPLINE、不付款、不改Google Sheet、不正式發佈。

## 18:25 批准更新（優先於以上舊版）

網站作為SHOPLINE頁面主體使用，不自行再造頁首、品牌導覽或頁尾；首頁、系列、DIY均移除現有自製header，只保留流程內必要返回連結。全頁背景與卡片文字區改純白，暖黃CTA和深啡文字保持。避免模板化裝飾、重複口號、浮誇陰影，不加假銷量／評論／限時促銷，購物資訊保持真實。

首頁順序：用戶圖3原圖主視覺（完整等比不裁內容）→精確標題『你想先改造哪裡？』與六入口（四系列按鈕『套裝選擇』）→指定 https://www.themyumyu.com/pages/magnetic-storage 原始產品詳情圖及GIF。排除圖2新手入門組購買卡，不移植原店價錢／會員LINE／免運資訊。詳情按原順序放主頁選擇區以下，不加入DIY畫布；圖片響應式全寬，GIF保留動畫，近視窗才載入以免首次下載所有大檔。素材保存／上傳專案，來源映射在內部manifest文件。

手機取消長按一秒：碰配件即能拖，空白布面可碌整頁，不做內部平移。布較上一版稍縮（約可用闊度88–90%，保持真尺寸比例），補水平與垂直cm尺，方向／尺寸切換正確；不按屏幕高度壓成極小布。保持兩布×兩size×雙方向、四卡、混色及四入盒邏輯。桌面左選配件右畫布保持。BoardCanvas精簡移除計時／進度，觸控hit時即接管、空白不阻捲。原型仍不接真加車、GoogleSheet或付款，不正式發佈。

實作分工：Start/pages.css/Home/index.css/SeriesPage移除自製header與改白底；BoardCanvas更新直接觸控與雙邊尺；ProductDetails.tsx和detail-media.ts管理原頁詳情媒體的lazy載入及完整呈現；assets.ts加用戶主視覺；原始素材另存public/content備份，不覆蓋用戶附件。

## 18:37 完整HTML交付

用戶明確要求完整HTML，可從既有已批准React原型編譯而非重造或簡化功能。匯出使用獨立entry與bundle：React/Konva/所有頁面inline JavaScript（IIFE，無動態chunk），CSS內嵌且以ShadowRoot隔離免污染原SHOPLINEheader/footer；路由改hash並保持實際SHOPLINE /pages/... 路徑，返回主頁在同一HTML內。主頁、四系列、DIY布選/方向/四卡/直接手機拖動/清單均保持；不附原店token或假結帳。

媒體必須改成可跨網站使用的真正HTTPS資產（公共上傳CDN，不用ManusPreview或/manus-storage相對路徑）；不改產品像素，不上傳額外原店宣傳圖片，只已有呈現素材。提供可貼入的body片段HTML及可單獨打開的完整document檔，README清楚貼HTML原始碼模式並測试、現無真加車、保存原碼。匯出特有入口在client/src/export，build腳本在scripts；不改变现有Preview路由。先檢查ShadowDOM/portal與href，編譯、獨立HTML嵌入測試通過再交付文件。

## SHOPLINE內容量限制修正

用戶截圖明示『儲存失敗，您的頁面內容資料量過大，請減少元件或調整元件文字內容』。原1.35MB內嵌片段超過其實際編輯器容許大小，改為數百byte HTML loader，完整CSS、授權、React/Konva、資料及canvas內嵌圖片仍在單一外置classic JS。使用真正公開HTTPS檔案，不用Preview或需要授權的projectstorage；驗證HTTP MIME及實際跨站script執行。ShadowRoot與hash、所有功能不變，不登入原店操作。短版為新推薦貼入檔，原完整document保留backup。外置JS有新版本換URL，圖片仍沿用已有CDN。

## 19:00 內部入口失效修正

用戶實際SHOPLINE preview URL尾段為#%2Fdiy（斜線經編碼），與原Wouter hash讀值不符；已在opaque sandbox iframe重現原短版：首頁顯示、DIY點擊後仍首頁並Script error，外部配件普通連結不受同一路由影響。實際shopline頁待驗證，不擅稱兩者同一根因。匯出專用改memoryLocation（不操作location/history/hash、每個app實例独立），內部Link轉button讓宿主anchor handler不干預；外部配件仍正常a。原PreviewApp路由及商品資料不變。測試四系列+DIY往返、opaque sandbox/編碼hash及實際SHOPLINE更新前後；發新外置runtimeURL與短HTML，未拿到新碼前不可稱原店已修正。

## 19:19 置中清單與SHOPLINE加車

用戶要求手機／桌面購買清單都置中彈出，移除下載清單主動作，客人點『加入購物車』才把選中的布+配件／預設套裝加入SHOPLINE，無需等新照片。現有gift landing page使用商戶既有 https://cozystyle-xsddw2az.manus.space 的 /api/kit/{handle}只讀商品查詢、/api/kit/add 單規格POST，在點擊當刻讀window.mainConfig.sessionId及currentUser ID。不能把SKU當variationID或猜測endpoint；先核對公開商品資料/後端白名單支援，若缺商品mapping或API未支援不可假成功。

實作分離cart-catalog mapping/read-onlyresolve、cart-plan純函式換算（布1件、四入盒ceil、set父sku一件而非重複加components）、cart-client sequentialtransport與cart-actionUI。所有商品先preflight resolvemapping再發POST；doubleclickguard、busy/error/success、部分加入時停止並列已加入、不盲重試未知POST避免雙份，成功可去/cart，不直接付款。測試只用mock transport，不真改商店cart；如未有可用讀取資料/所需backend，不偽造能力，UI顯示不能完成原因並告知用戶具體欠項。

新出口仍memory route/button+ShadowROOT，hostSHOPLINE祖先transform/isolation可能把fixed置中限制容器，需檢查實際環境；需要時modal使用native dialog top-layer避開hoststack，不篡改原body。匯出主原型同更新，再新runtime/短HTML交付。

19:26 用戶回覆「未建」：目前兩款測試布與新四系列套裝尚未在SHOPLINE建立，無法有真實SKU→variationId。此輪完成中心彈窗與可執行加車接駁，missingSKU時在任何POST前阻擋，客人只見未開放購買提示。不可宣稱真實全單已能入車；下一輪店主建商品並提供連結後補CART_CATALOG_HANDLES，仍按精確SKU匹配，不用舊款替代。保留商品未建阻礙為工作清單open。

## 2026-10-29 全素材目錄更新

用戶要求將Myu配件ZIP全部24款×兩色及引磁布ZIP全部21個單款加入现有配置器，保留之前小鐵盒單色資料，所以DIY總25款。今次保持純白、暖黃深啡、原圖主視覺與詳情動畫、六入口、無自製頁首頁尾，手機4配件2×2／桌面左側目錄、選顏色後加入不可上布改色、直接拖動、略縮布面與cm尺、置中購買清單及memory-route短HTML。

配件一款獨立核對圖內寬高深、兩色與表內系列／SKU，保留明確缺項而不估。從兩色實物參考製作正面無字透明外觀素材，保留結構與材質，不製造新物品；原尺寸圖只作規格原件，不能把尺寸字與箭嘴放上畫布。只按測量尺寸處理2D佔位，不把照片透視或AI前視當CAD/承重保證。若不能確定尺寸不捏造，仍列目錄並限制不可靠的排位。布面圖片不重新生成；保留花紋、不非等比拉伸，21款均可兩尺寸與橫直，岩岭暗灰套裝配灰、其他配米白，DIY不限。

資料改為catalog-data.ts（25款公開規格／系列／SKU／參考價）、fabric-data.ts（21款圖名／supplierCode／兩尺寸SKU）、assets.ts共用色圖。model.ts從資料推導PieceKind／Pattern而不是四配件兩花色hardcode，保留舊已存ID兼容。cart-plan精確讀對應SKU；未建商品仍全單preflight前擋，不真加測試車、不改店內商品或Google Sheet。SeriesPage使用新增21款FABRICS按getSetVariant資料核對布名，不把新布套裝編錯SKU。價格只用表內售價欄，成本毛利不進前端。

匯出程式由明確圖片索引供所有圖路徑，保留ShadowDOM及元件內導航，不依賴/manus-storage或臨時預覽域；画布圖內嵌避免CORS破壞，詳細媒體以既有公開HTTPS。重新編譯及上傳完整runtime，交付少量短HTML以避免SHOPLINE容量錯誤，同時可提供完整備份。完成後保存原型版本而不正式發佈或替用戶貼入商店。
