# 2026-08-21 工作紀錄：Bunny 真實帳號試點（MT001 + MW001）與跨 Provider 問題分析

本文件記錄 2026-08-21 這一整個工作階段的完整狀態，接續同一天稍早的
`2026-08-21-bunny-video-platform-poc-and-migration-prep.md`（那份文件記錄的是「免費、不需要真實帳號」的 Bunny-ready 程式準備階段）。**本文件獨立成篇，不需要先讀那份文件也能理解目前狀態**——如果之後 session 中斷、context 被壓縮、重新 login 或開新 session，只讀這份文件就能完整恢復目前決策狀態。

---

## 1. 目前最關鍵的結論（先講重點）

1. **Bunny Stream 真實帳號、真實 Library、兩支真實影片（MT001、MW001）都已經建立並驗證成功**，全程在 14 天 $20 免費試用額度內，**沒有產生任何實際費用**（Balance 全程 $0.00）。
2. **Chrome 原生 HLS 判斷有 bug，已修正**：`canPlayType('application/vnd.apple.mpegurl')` 在 Desktop Chrome 151 會回傳 `"maybe"`（誤判），導致原本的邏輯錯誤地讓 Chrome 走原生 `<video src>` 路徑，實際上會卡住不動。已修正為「必須真的是 Safari 才走原生路徑」。
3. **Bunny → Bunny 換片（同 provider）已經驗證成功**：自動切換、自動播放請求、DOM 元素（含 Fullscreen 依附的 wrapper）完全不被替換——這是全部遷移到 Bunny 之後可以預期的正常行為。
4. **Bunny → YouTube 換片（跨 provider）目前有兩個已知問題，根因都已查清楚**：
   - Fullscreen 會被瀏覽器強制退出——**這是瀏覽器平台限制，不修正**，因為根因是 Engine 元件型別改變導致 React 整個 unmount/remount，這是無法在不违反瀏覽器安全機制的前提下繞過的。
   - YouTube 不會自動播放——**這是我們自己程式碼的邏輯缺口，已經修正**（見第 5 節），但受限於這次的自動化測試環境，還沒有被使用者在真實視窗裡最終視覺確認成功。
5. **這兩個跨 provider 問題，如果最終方向是把 43 支影片全部遷移到 Bunny，會隨遷移完成自然消失**——因為屆時所有轉場都會是 Bunny→Bunny，不會再有任何跨 provider 或跨來源 iframe 的情況。
6. **手機區網測試（LAN access）目前卡住，原因尚未確定，最可能是路由器的 AP Isolation（用戶端隔離）**——不是 Windows 防火牆問題（已確認 node.exe 已有允許規則），這部分留給使用者自行到路由器後台確認，今晚沒有再繼續深入。
7. **目前所有變動都還停留在本機 working tree**，尚未 commit（本文件寫完後，這個工作階段會建立第一次 commit）。

---

## 2. Bunny 真實帳號與 Library

- 帳號：真實 Bunny.net 帳號，使用者本人親自完成註冊、email 驗證（Claude 全程未觸碰帳號建立、密碼、2FA、金流等敏感步驟）
- 試用方案：$20 免費試用額度，**沒有綁定信用卡**，14 天效期，效期結束未用完會直接失效（不會自動轉換成付費訂閱，因為沒有付款方式可扣款）
- Library：`luckster-mt001-pilot`，Library ID `733464`
- Pull Zone / CDN hostname：`vz-c3c60b7e-4d4.b-cdn.net`
- Encoding 設定：Free Encoding（$0）、1080p 以下解析度、只有 H.264 (AVC) 輸出、Just-In-Time encoding 關閉、Early-Play 關閉——沒有啟用任何會產生額外費用的付費功能
- Delivery 設定：High Volume Tier（$0.005/GB），沒有啟用 Routing Filters
- Security 設定：**全程沒有修改過**，「Block direct url file access」維持原本啟用狀態（見第 4 節説明這如何影響 403 問題）

---

## 3. MT001 試點（第一支 Bunny 影片）

- 對應 Module：`id: 'MT001'`，`slug: 'tuning01-standard'`，「調頻（標準版）」，原始時長 195 秒
- 原始檔案：使用者從本機 `Video-Library` 資料夾親自上傳（Claude 沒有能力也沒有嘗試操作使用者本機檔案或執行實際上傳動作——`file_upload` 工具本身有路徑白名單與 10MB 大小限制，技術上做不到）
- **真實 Bunny videoId**：`00f9e1e3-6d0d-4a78-8770-e550d4239546`（取自 Bunny Dashboard 網址列本身，非猜測值）
- **真實 HLS Playlist URL**：`https://vz-c3c60b7e-4d4.b-cdn.net/00f9e1e3-6d0d-4a78-8770-e550d4239546/playlist.m3u8`
- 檔案大小：589 MB，時長 00:03:14，處理完成後 Dashboard 內建播放器可正常預覽播放

---

## 4. 一個重要的岔路：403 Forbidden 與 Referer Policy

**現象**：MT001 處理完成後，直接用 `curl` 或瀏覽器裸打 HLS URL，得到 **403 Forbidden**。

**根因**：Library 的 Security 設定裡「Block direct url file access」是啟用狀態——這個機制會擋下**任何沒有帶 Referer header 的直接請求**，不論來源網域是什麼。`curl` 裸打與瀏覽器網址列直接輸入導航都不會帶 Referer，所以兩者都被擋。

**驗證方式（沒有關閉任何 Bunny 安全設定）**：直接在真正跑起來的 Luckster 網頁（`http://localhost:4190`）裡用 `fetch()` 打同一個 URL——因為這是「從網頁發起的子資源請求」，瀏覽器會自動帶上 Referer，結果是 **HTTP 200**，拿到真正的 HLS manifest 內容。這證實了：**只要影片是透過 Luckster 網站本身載入（而不是裸連結分享），Bunny 目前的 Security 設定完全不需要調整。**

這個結論後續在 MW001 上再次被驗證，行為一致。

---

## 5. Root Cause 分析：Bunny → YouTube 跨 Provider 的兩個問題

### 5.1 架構背景

`VideoPlayer.jsx` 是一個依 `provider` 決定渲染哪個 Engine 的簡單 if/else dispatcher：
```js
const Engine = provider === 'bunny' ? HlsVideoEngine : YouTubeVideoEngine
```
`PracticePlayer.jsx` → `ModuleRenderer.jsx` → `VideoModule.jsx` 這條鏈路本身在整個 Practice 過程中不會重新 mount（沒有用 `key` 強制重建），但 `VideoPlayer.jsx` 內部選中的 `Engine` 型別如果因為 `provider` 改變而改變，**React 會把舊的 Engine 整個 unmount、新的整個重新 mount**——這是這兩個問題共同的根本觸發點。

### 5.2 問題一：Fullscreen 退出（瀏覽器平台限制，不修正）

`requestFullscreen()` 打在各自 Engine 的 `wrapperRef` 這個 div 上。跨 provider 轉場時，這個 wrapper div 會隨著舊 Engine 一起被砍掉重建——根據 Fullscreen API 規範，目前作為 fullscreen element 的節點被從 DOM 移除時，瀏覽器**必須**自動、完整退出 fullscreen。

**這是無法安全修正的**：就算想在新 Engine mount 後自動重新 `requestFullscreen()`，這個呼叫發生在 `ended` 事件觸發的 effect 裡，不在任何真人手勢的呼叫堆疊內，Chrome 會直接拒絕（`requestFullscreen()` 只能由真人手勢直接觸發）。嘗試繞過等於是要偽造使用者手勢，明確違反使用者的安全底線，**沒有做**。

**緩解措施（已存在，不是這次新增的）**：`PracticePlayer.jsx` 的 CSS-only `immersiveMode` 層本來就是為了應對「底層真正 Fullscreen 可能中途消失」而設計，只在使用者第一次手動按播放時觸發一次，之後不論真正 Fullscreen 有沒有被退出都不會重置。**理論上（尚未實測畫面確認）**，跨 provider 轉場後，畫面版面應該還是全滿觀感，只是瀏覽器自己的網址列等 UI 可能會重新出現。

### 5.3 問題二：YouTube 不自動播放（我們自己的邏輯缺口，已修正）

**根因**：`YouTubeVideoEngine.jsx`／`HlsVideoEngine.jsx` 都有「首次 mount 的影片不自動播放，等使用者真的按播放鍵」的既有設計（避免違反瀏覽器 autoplay 政策、也符合「第一支影片需要真人手勢」的原本邏輯）。跨 provider 轉場時，新 Engine 是**這個 instance 的第一次 mount**，即使 Practice 進度上其實是第 2、3…支影片，Engine 本身不知道這件事，於是套用了「首次 mount 不自動播放」的規則，導致卡住不播放。

**曾經考慮過但被真實測試推翻的錯誤假設**：一開始以為只要 `playerVars: { autoplay: 1 }` 就會成功，實測（真人、可見、聚焦的 Chrome 視窗）證實**單純加這個參數並不會成功**——因為 Chrome 的「帶聲音自動播放」規則是**依照來源（origin）+ 該 frame 有沒有被真人直接互動過**來判斷，父頁面的手勢不會下放給之後才動態建立的**跨來源** YouTube iframe。這是 Chrome 刻意的安全設計（防止網站「存一次點擊額度」偷塞會出聲的廣告）。

**已完成的修正（最小範圍，已上線但尚未最終視覺驗證）**：
- `VideoModule.jsx`：既有的 `hasStartedRef`（追蹤「這個 Practice 裡是否已經手動播放過一次」）改成 `hasStarted`（`useState`，因為現在要拿去影響 render 輸出，ESLint 的 `react-hooks/refs` 規則不允許在 render 時讀 ref）,並新增 `autoplay={hasStarted}` prop 往下傳。
- `VideoPlayer.jsx`：新增 `autoplay` prop，原樣轉傳給目前選中的 Engine。
- `YouTubeVideoEngine.jsx`：mount 時，若 `autoplay` 為真，`new YT.Player()` 帶上 `playerVars: { autoplay: 1 }`。
- `HlsVideoEngine.jsx`：mount 時（hls.js 路徑），若 `autoplay` 為真，`loadSource()` 後呼叫 `video.play()`（原生 HLS 分支原本就無條件呼叫 `.play()`，這次補齊 hls.js 路徑的對稱缺口）。同時在 fatal error 分支加了一行 `console.error`，避免真正嚴重錯誤被靜默吞掉。

**尚未最終確認的部分**：這個修正在自動化測試環境裡，`autoplay=1` 確實正確出現在 YouTube embed URL 裡（wiring 正確），但因為這個沙盒環境的分頁 `document.hidden` 永遠是 `true`（詳見第 7 節），沒辦法在這裡百分之百確認畫面真的動起來。**这一項需要使用者在自己真正可見、聚焦的視窗裡最終確認。**

---

## 6. MW001 試點（第二支 Bunny 影片）與 Bunny → Bunny 驗證

選擇 MW001 的原因：驗證「Bunny → Bunny 連續換片」這個未來全面遷移後會是常態的路徑，同時把問題進一步隔離成「Bunny→Bunny」vs「Bunny→YouTube」兩條獨立路徑。判斷過**不需要**再上傳第三支影片，因為 Bunny→Bunny 的行為完全由程式碼結構決定（Engine 型別不變 = React 保留同一個 instance），不會因為多幾支影片而有不同結果。

- 對應 Module：`id: 'MW001'`，`slug: 'warmup01-surya-namaskar'`，「拜日式熱身 (3遍)」，原始時長 267 秒（4:27）
- **真實 Bunny videoId**：`ca1b09dd-36e1-4c17-aff0-697cd23b159d`
- **真實 HLS Playlist URL**：`https://vz-c3c60b7e-4d4.b-cdn.net/ca1b09dd-36e1-4c17-aff0-697cd23b159d/playlist.m3u8`（用已確認的 Pull Zone pattern 組出，並且已經用 `fetch()` 從真實 Luckster 頁面情境驗證過 HTTP 200、真實 manifest 內容）
- 檔案大小：795 MB，處理時間比 MT001 略長，最終狀態正常，無異常

### Bunny → Bunny 實測結果（MT001 自然結束 → 自動切到 MW001）

用 `video.dispatchEvent(new Event('ended'))` 模擬 MT001 自然播完（跳過真的等 195 秒，但影片、程式碼、事件鏈都是真的，不是 mock）：

- Module 進度正確從「第 1/6 — 調頻（標準版）」切到「第 2/6 — 拜日式熱身 (3遍)」✅
- **切換前後的 `<video>` 元素、wrapper div 是完全相同的 DOM 節點**（直接用 JS 參照比對確認 `sameWrapper: true`、`sameVideoElement: true`）——這是這一輪最重要的結構性證據：只要 DOM 節點沒被替換，瀏覽器就不會被觸發強制退出 Fullscreen
- `video.currentSrc` 正確換成新的 blob URL，確認 hls.js 真的載入了 MW001 的新內容
- MW001 的 `playlist.m3u8`、`360p/video.m3u8` 皆為 HTTP 200，無 403，Console 無任何錯誤
- `video.play()` 呼叫後 `paused: false`（沒有被同步拒絕）

**同樣受限於 `document.hidden` 沙盒限制**：`readyState`／`currentTime` 沒辦法在這個環境裡推進到能確認「畫面真的在動」的程度，這部分（連同 Fullscreen 是否真的視覺持續）需要使用者在自己視窗裡做最終確認。

---

## 7. 一個持續影響測試可信度的環境限制：`document.hidden`

這個自動化瀏覽器環境（Claude in Chrome 分頁）的 `document.hidden` 屬性全程都是 `true`，即使實際點擊互動、`document.hasFocus()` 變成 `true` 之後依然如此。這不是這次才發現的問題——先前 iPhone Safari / Desktop Chrome 的免費 POC 階段就已經遇過同類限制並記錄在案。

**這件事的實際影響**：
- 真正的 HLS 解碼／播放進度（`readyState`、`currentTime` 推進）沒辦法在這裡被驗證到底成功還是失敗——manifest／segment 抓取層面的驗證完全不受影響（那些走的是一般的 network fetch，跟分頁是否可見無關），但「畫面真的有沒有動」這件事只有真人在真實視窗裡才能給出確定答案。
- `requestFullscreen()` 在這個環境裡的行為也不穩定（有時能進入、有時完全沒反應），跟這個限制是同一個根源。

**因此，凡是牽涉「真的有沒有播放」「Fullscreen 是否真的維持」的最終驗證，這份文件裡凡是標註「尚未確認」的項目，都需要使用者在自己真正可見、聚焦的瀏覽器視窗裡完成，不是我這邊能單方面確定的。**

---

## 8. 手機區網測試（未完成，暫時擱置）

**目標**：讓同一 Wi-Fi 下的手機可以存取 `http://192.168.1.103:4190/` 做 Bunny → Bunny 實機測試（真正的行動裝置瀏覽器，不受上述 `document.hidden` 沙盒限制）。

**已完成的診斷與設定**：
- Dev server 已改用 `npm run dev -- --port 4190 --strictPort --host` 啟動，確認監聽 `::`（所有介面），從這台電腦本身打區網 IP（`http://192.168.1.103:4190/`）可以連通
- 這台電腦的 Wi-Fi 網路類型確認是「Private（私人網路）」
- Windows 防火牆檢查（唯讀查詢，沒有修改任何規則）：三個 profile 的防火牆都是開啟狀態，但**已經存在**啟用中的「Node.js JavaScript Runtime」規則（TCP + UDP 各一條），範圍是 Private 網路、Any port、Any 來源、動作 Allow，沒有找到任何衝突的 Block 規則——**結論是 Windows 防火牆本身很可能不是問題**

**目前卡住的狀態**：手機仍然無法開啟 `http://192.168.1.103:4190`。最可能的原因是路由器層級的「AP Isolation / 用戶端隔離」（會在封包到達這台電腦之前就被路由器擋掉，Windows 防火牆完全看不到這種情況）。已請使用者做兩個簡單測試（手機是否能開啟路由器管理頁 `http://192.168.1.1`、確認手機連的是不是完全同一個 SSID 而非訪客網路），但**今晚沒有繼續深入**，這部分還沒有結論，也沒有做任何路由器端的設定變更（路由器設定不是 Windows 這台電腦能處理的範圍）。

---

## 9. 目前 Repo 狀態（今天這一輪具體改了什麼）

**本輪（今天，2026-08-21 全天）新增/修改，且已通過 `npm run lint` 與 `npm run build` 的檔案**：

- `frontend/src/components/HlsVideoEngine.jsx`（新檔案）：Bunny HLS 播放引擎。今天在既有基礎上修正了 `isRealSafari` 判斷（見 5.3 之前的 canPlayType 修正，詳見下方補充）、新增 `autoplay` prop 支援、fatal error 加上 `console.error`
- `frontend/src/components/YouTubeVideoEngine.jsx`（新檔案）：從原本的 `VideoPlayer.jsx` 抽出的 YouTube 播放引擎，今天新增 `autoplay` prop 支援（`playerVars: { autoplay: 1 }`）
- `frontend/src/components/VideoPlayer.jsx`：provider dispatcher，今天新增 `autoplay` prop 轉傳
- `frontend/src/components/VideoModule.jsx`：今天把 `hasStartedRef`（ref）改成 `hasStarted`（state），新增 `autoplay={hasStarted}` 傳給 `VideoPlayer`
- `frontend/src/data/modules.js`：**只有 MT001、MW001** 這兩筆 `videoReference` 改成 `provider: 'bunny'` + 真實 HLS URL，**其他 41 支影片維持 `provider: 'youtube'`，完全未變動**

**Chrome 原生 HLS 誤判修正**（今天稍早完成，內容併入上面 `HlsVideoEngine.jsx` 的修改）：
```js
const isRealSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent)
```
把原本「`canPlayType()` 回傳非空字串就走原生 HLS」改成「必須是真正 Safari 而且 `canPlayType()` 回傳非空字串才走原生 HLS」，其餘瀏覽器一律走 hls.js。原因：Desktop Chrome 151 對 `canPlayType('application/vnd.apple.mpegurl')` 會誤判回傳 `"maybe"`，導致原本的邏輯錯誤地讓 Chrome 走一個實際上會卡死（`loadstart` → `stalled`，永遠不會 `loadedmetadata`）的原生路徑。

**Bunny 相關但屬於今天稍早（同一天，Bunny-ready prep 階段）就已經完成、本輪沒有再變動的檔案**：`frontend/src/components/ModuleRenderer.jsx`、`frontend/src/components/PracticePlayer.jsx`、`frontend/src/pages/ModulePage.jsx`、`frontend/src/utils/moduleThumbnail.js`、`frontend/src/components/LessonDetail.jsx`、`frontend/package.json` / `frontend/package-lock.json`（新增 `hls.js` 依賴）——這些檔案的完整改動內容記錄在同一天稍早的 `2026-08-21-bunny-video-platform-poc-and-migration-prep.md`。

**明確沒有動的東西**：
- 其他 41 支 YouTube 影片的 `videoReference`，一支都沒有改
- Bunny Security 任何設定
- Windows 防火牆規則（只有唯讀查詢）
- 任何跟今天 Bunny 工作無關的既有 working tree 修改（Desktop Practice Builder Workbench 相關的一大批檔案，記錄在 `2026-08-20-practice-player-and-mobile-builder-progress.md`，跟今天的 Bunny 工作完全獨立，今天的 commit 不會納入這些）

---

## 10. Trial 額度與費用（全程追蹤結果）

從真實帳號建立、MT001 上傳、MW001 上傳，到目前為止的所有操作，Bunny Dashboard 顯示的 Balance 與 Trial credits 從頭到尾沒有變化：

- **Balance：$0.00**
- **Trial credits：$20.00**
- Trial ends in 14 days

沒有產生任何實際費用。

---

## 11. 下一步（需要使用者決定或確認才能繼續）

1. **在真實、可見、聚焦的視窗最終確認**：MT001 → MW001（Bunny → Bunny）轉場時，畫面是否真的自動播放、`currentTime` 是否持續推進、如果當時處於全螢幕，切換後 Fullscreen 是否真的視覺維持
2. **手機區網測試**：確認是否為 AP Isolation，如果是，需要使用者自行到路由器後台處理
3. 上述兩項如果都確認 OK，才是討論「是否要往全面遷移到 Bunny 的方向規劃」的合理時機——**這份文件不代表已經決定要全面遷移**，只是記錄目前證據對這個方向是有利的
4. Bunny → YouTube 的 Fullscreen 退出問題維持「不修正、依賴既有 immersive CSS 層」的結論，除非使用者之後有新的想法
