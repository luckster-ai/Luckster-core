# 2026-08-21 工作紀錄：Bunny 影片平台 POC 與 Bunny-ready 程式準備

本文件記錄目前這個決策節點的完整狀態。**如果之後 session 中斷、context 被壓縮、重新 login 或開新 session，只讀這份文件就能恢復目前決策狀態，不需要重新翻找對話紀錄。**

---

## 1. YouTube Fullscreen 問題與結論

**已確認的事實**：YouTube iframe player 在 Mobile 環境下，Module 切換時會**主動退出真正的瀏覽器 Fullscreen**——這是 YouTube player 自己的 app 層邏輯（以 mobile User-Agent 偵測為觸發條件），不是我們的程式碼問題，也不是瀏覽器限制。證據來源：Mozilla Bugzilla #1604450（工程師留言明確指出「this is youtube telling us to exit fullscreen」）＋使用者在真實 iPhone Safari 上的實機重現（Module 1→2 切換時全螢幕被退出）。

**結論**：YouTube iframe 無法可靠滿足核心需求——「使用者第一次操作 → 進入真正 Fullscreen → Module 連續自動播放 → 後續不需要再次操作」。**這是已確認結論，不是推測。**

**已否決的方向**：
- 每個 Module 都要求使用者重新點 Fullscreen（體驗不理想，使用者已明確否決）
- UA 偽裝騙過 YouTube 的 mobile 偵測、抓取 YouTube 直連串流網址等 hack（不可靠、可能違反服務條款）

---

## 2. 免費 POC 結果：自有 `<video>` + HLS 技術路徑驗證

### iPhone Safari（`webkitEnterFullscreen()`）

- **3 輪完整實機測試**，每輪都是 A→B→C→D 連續自動換片（Apple 官方公開 HLS 測試串流）
- 每輪換片期間、以及序列跑完後繼續播放期間，fullscreen **全程維持**
- 最終退出全螢幕，三輪皆由使用者明確自我回報「是我自己主動退出的」——不是系統或播放器自動退出
- 最長一輪：fullscreen 從進入到使用者主動退出，維持超過 **13 分鐘**，中間經過完整的 A→B→C→D 四段切換

### Desktop Chrome（`hls.js` + 原生 `<video>`）

- **3 輪真人操作測試**，同樣 A→B→C→D 連續自動換片，共 **9 次自動換片**
- 每一次換片後都確認影片**真的進入 `playing` 狀態**（`readyState=4/HAVE_ENOUGH_DATA`，`currentTime` 隨真實經過時間穩定推進，不是假播放）
- 每輪「序列全部完成」檢查點，fullscreen 都仍然維持
- 最終退出全螢幕，三輪皆由使用者明確確認是主動退出

**技術細節（重要，避免未來重踩坑）**：
- Chrome（Desktop/Android）**沒有原生 HLS `<video src>` 支援**，必須搭配 hls.js
- 過程中發現並修正一個 POC 自身的 bug：換片時只呼叫 `hls.loadSource()`，忘記接著呼叫 `video.play()`，導致 B/C/D 停在 `currentTime=0, paused=true`——修好後三輪重測全部確認真實播放
- Run 3 出現過 `mediaSourceRequiresReset` 錯誤（`fatal=false`，自行復原），只在使用者手動重新點擊初始化按鈕時穩定重現，跟正常自動換片流程本身無關——**已確認根因**：重新初始化時沒有先 `destroy()` 前一個 `Hls` instance，導致新舊 instance 打架。**這個 root cause 已經在本輪正式程式碼的 `HlsVideoEngine.jsx` 裡處理掉**（見第 4 節）。

### 免費研究：Bunny／Cloudflare Stream／Mux

三家都**明確、官方支援**提供原始 HLS/DASH manifest 網址供自訂 `<video>`/hls.js 使用，不強制用它們自己的 iframe player。

**成本試算**（情境 A：10 小時內容/月遞送 1,000 分鐘；情境 B：30 小時內容/月遞送 50,000 分鐘）：

| | Bunny Stream | Cloudflare Stream | Mux |
|---|---|---|---|
| 情境 A | ~$1/月 | ~$4/月 | ~$1.44/月 |
| 情境 B | ~$4.9/月 | ~$59/月 | ~$4.3/月（10 萬分鐘遞送內免費） |

**為什麼暫定 Bunny 作為第一候選**：
1. 兩種情境下成本都是最低或並列最低，且計價模型（GB-based）最直覺，不會像 Cloudflare 那樣隨播放量成長而不成比例暴衝
2. Encoding 完全免費（1080p 以下），符合目前內容需求，沒有 Mux 那種「畫質升級要另外收費」的隱性成本結構
3. Collections 機制天然對應「一個 Practice 由多個 Module 組成」的內容結構
4. 三家在「開放原始串流供自訂 player 使用」這件核心能力上是同一等級，Bunny 沒有因為便宜打折扣

Mux 是合理次選（開發體驗好、10 萬分鐘免費遞送額度寬裕）。Cloudflare Stream 不作為首選（分鐘計價在播放量成長後最不利）。

---

## 3. 43 支影片的實際資料結構

直接檢查 repo 程式碼確認（不是憑記憶）：

- `frontend/src/data/modules.js`：**22 支**影片
- `frontend/src/data/foundations.js`：**21 支**影片（掛在每個 foundation 的 `lessons[]` 底下，先前分析一度遺漏這個檔案）
- **總計 43 支，全部** `{ provider: 'youtube', videoId: '...' }`，沒有例外或變體

**這輪額外發現、先前分析沒注意到的 YouTube-specific 邏輯**：
1. `utils/moduleThumbnail.js` 的 `getModuleThumbnailUrl()`——用 `ref.provider === 'youtube'` 組 YouTube 縮圖網址，被 **9 個元件**使用（Practice Hub、Builder 各層級的縮圖顯示）
2. `pages/ModulePage.jsx`——寫死組 `https://www.youtube.com/watch?v=${videoId}` 的「前往 YouTube 觀看」連結
3. `VideoPlayer.jsx` 不只被 `VideoModule.jsx`（Practice Player 流程）使用，`LessonDetail.jsx`（Foundation 課程詳情頁）也是獨立的第二個消費端

以上三點在本輪已經處理成 provider-aware（見第 4、5 節），YouTube 行為完全沒有被破壞。

---

## 4. VideoPlayer 架構重構（本輪已完成）

**設計**：`VideoPlayer.jsx` 變成一個薄的 provider 分派器（if/else，不是 registry/factory），依 `provider` prop 決定渲染哪個 engine：

- `provider === 'bunny'` → `HlsVideoEngine.jsx`（新增）
- 其他（含未指定，預設 `'youtube'`）→ `YouTubeVideoEngine.jsx`（從原本的 `VideoPlayer.jsx` 原封不動抽出，行為零變動）

外部介面完全不變：
- Props：`{ videoId, onEnded, onAutoplayBlocked, onPlaybackResumed }`（新增可選的 `provider`，預設 `'youtube'`，保證所有既有呼叫端零改動也能正常運作）
- Imperative handle：`{ play(), pause(), requestFullscreen() }`

**`HlsVideoEngine.jsx` 設計要點**：
- Safari 優先走原生 `<video src>` HLS（`canPlayType('application/vnd.apple.mpegurl')` 偵測）
- 其他瀏覽器動態 `import('hls.js')`（只有真的需要時才載入 ~200KB，不影響目前全部是 YouTube 內容的使用者）
- **同一個 `Hls` instance 用整個元件生命週期**，換片用 `loadSource()` + 明確呼叫 `video.play()`（POC 抓到的 bug 已修正），不會像 POC 早期版本那樣每次重新初始化導致 `mediaSourceRequiresReset`
- `unmount` 時正確呼叫 `hls.destroy()`
- 6 秒 autoplay watchdog、`requestFullscreen()` 打在穩定 wrapper div——跟 `YouTubeVideoEngine` 概念對稱，維持一致的使用者體驗

**目前 `videoId` 在 Bunny 路徑下被當成「已經是完整的 HLS URL」直接使用**——這是刻意的簡化，因為真正 Bunny 帳號的 library/pull-zone 資訊還不存在。**真正的 Bunny videoReference（library id + video GUID）該怎麼組出 HLS URL，需要 Bunny 真實環境才能定案，留到下一階段。**

---

## 5. Provider-aware 的其他修改

- `utils/moduleThumbnail.js`：非 YouTube provider 明確回傳 `null`（graceful fallback），所有既有呼叫端（`PieceCard.jsx`、`PracticeCard.jsx` 等 9 處）本來就已經有 `thumbnailUrl ? <img/> : <fallback>` 的空值處理，不會因此出錯，只是暫時沒有縮圖
- `pages/ModulePage.jsx`：「前往 YouTube 觀看」連結加上 `provider === 'youtube'` 條件，非 YouTube 時不渲染任何連結（不會產生指向錯誤網址的壞連結）
- `VideoModule.jsx`、`LessonDetail.jsx`：呼叫 `VideoPlayer` 時新增 `provider={...Reference.provider}`，把資料裡本來就有、但先前完全沒被讀取的欄位接上

---

## 6. 目前狀態（務必看清楚）

- **尚未建立 Bunny 帳號**
- **尚未上傳任何影片**
- **尚未產生任何 Bunny 費用**
- **43 支影片全部仍是 `provider: 'youtube'`**，一支都沒有改
- **MT001（調頻標準版）已選定為第一支試點候選**，原始影片檔案已確認存在，**目前放在隨身碟，尚未搬到 Bunny 或任何地方**
- 這一輪（2026-08-21）做的是**免費的 Bunny-ready 程式準備**——讓架構「準備好」支援 Bunny provider，但完全不依賴真實 Bunny 帳號、真實影片、或任何 Bunny API 呼叫。所有驗證都用 Apple 公開 HLS 測試串流，透過一個臨時測試路由（測試完已刪除，未進入最終 diff）
- **下一個真正付費階段**，才是「建立 Bunny 帳號 + 上傳 MT001 單支試點」——量級約每月 $1，跟「正式大量遷移 43 支影片」是完全不同層級的決定
- **明確：不要直接遷移 43 支影片。** 就算下一階段的單支試點順利，後續也應該是逐支評估、漸進遷移，不是一次性搬完。

---

## 7. 下一步（需要使用者決定才能繼續）

真正開始 Bunny 試點前，需要確認：
1. 是否同意小額付費建立 Bunny 帳號（約每月 $1 等級，不是大額決定）
2. MT001 原始檔案從隨身碟實際上傳到 Bunny 的操作時機
3. 確認 MT001 作為第一支試點沒有問題，或指定其他 Module

技術面（架構、程式碼）目前沒有阻塞，已經是 Bunny-ready 狀態，只等真實 Bunny 環境到位。
