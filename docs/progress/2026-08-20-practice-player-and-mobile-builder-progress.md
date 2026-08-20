# 2026-08-20 工作紀錄：Mobile Practice Builder、Practice Player、Fullscreen/Autoplay、未來影片平台選型

本文件整理今天 session 內完成的工作與研究結果，方便明天接續。**尚未 commit 的正式程式碼修改仍留在 working tree 裡，本文件不會、也不應該去改動它們**（見文末「working tree 狀態」一節）。

---

## 1. Mobile Practice Builder

### Reference 01/02/03 的最終 UX 理解

- Mobile Practice Builder 採兩層式呈現：
  - **Level 1（Section Overview）**：`MobileSectionOverview.jsx` — 列出所有 Section 及其狀態（已完成／必要未完成／可省略）。
  - **Level 2（Module 選擇）**：`MobileSectionNav.jsx`（Section 間切換的緊湊列）＋ `MobileModulePanel.jsx`（目前作用中 Section 的 Module Picker，內容邏輯與 Tablet 共用 `PieceCard.jsx`／`utils/sectionStatusLabel.js`）。
- 這是**獨立於 Tablet 的呈現方式**，不是 Tablet 版面的縮小版——Tablet 用的是 `PracticeSectionCanvas.jsx` 的行內 accordion（展開／收合卡片），刻意分成兩個元件，避免其中一個的行為變動波及另一個。

### Mobile ≤767px 與 Tablet 768–1023px 的範圍界線

- Desktop ≥1024px（grid 版面）、Tablet 768–1023px（`PracticeSectionCanvas` 行內 accordion，`.builder-sections`）、Mobile ≤767px（`MobileSectionOverview`/`MobileSectionNav`/`MobileModulePanel`，`.mobile-sections-area`）。
- **三種版面同時掛載在 DOM 裡**，只靠 CSS `@media` 搭配 `display:none`/`display:block` 切換可見性——這是既有、刻意的架構決定，不是這次任務要改的東西。副作用：跨版面重用的表單控制項如果共用 DOM 層級的識別（例如 `name`），可能互相打架（見下方 Relaxation bug）。

### 今天已完成的 Mobile Builder 修改

今天 session 內針對 Mobile Builder **唯一的新修改**是 Relaxation radio bug 修正（見下）。`MobileSectionOverview.jsx`／`MobileSectionNav.jsx`／`MobileModulePanel.jsx`／`PieceCard.jsx`／`utils/sectionStatusLabel.js` 等整套 Mobile 呈現元件，是在今天這輪工作**開始前**就已經存在於 working tree（未 commit 的既有成果），今天沒有重新修改或重構它們。

### Relaxation「Meditation 之前／之後」radio 標識 bug 及修正方式

- **症狀**：Mobile 上點擊「在 Meditation 之後／之前」，藍色 selected 標識不會立即更新，要切到別的 Section 再切回來才會顯示正確狀態。
- **Root cause**：`PracticeBuilder.jsx` 原本用同一個 JSX element 同時餵給 Tablet（`PracticeSectionCanvas`，`.builder-sections`，CSS 隱藏於 Mobile 寬度）跟 Mobile（`MobileModulePanel`，`.mobile-sections-area`）。兩個 `<input type="radio">` 都用 `name="relaxationPosition"`。HTML 原生 radio 分組是**整個文件層級**的，跟 React component 邊界無關——因為兩個版面同時掛載在 DOM，瀏覽器原生的 radio toggle 行為跟 React 的 per-instance 受控值 reconciliation 互相衝突，導致點擊可見的（Mobile）radio 時，`checked` 狀態被誤同步到隱藏的（Tablet）那顆。
- **修正**：`PracticeBuilder.jsx` 把原本內聯的 fieldset 建構改成參數化的 `buildRelaxationPositionControl(radioName)`，回傳的資料拆成兩個欄位：
  - `relaxationPositionControl`：`name="relaxationPosition"`（餵給 Tablet 的 `PracticeSectionCanvas`，維持原名）
  - `mobileRelaxationPositionControl`：`name="mobileRelaxationPosition"`（新增，餵給 Mobile 的 `MobileModulePanel`）
  - `state.relaxationPosition` / `actions.setRelaxationPosition` 完全沒有變動，純粹是 DOM `name` 屬性的區隔，不涉及資料結構或行為。
- **唯一修改檔案**：`frontend/src/components/PracticeBuilder.jsx`。

### Desktop / Tablet / Mobile 的驗證結果

- **Mobile**：已用強制窄視口（CSS 注入模擬 ~390px）＋直接 DOM 檢查驗證——點擊可見的 `mobileRelaxationPosition` radio 後，`checked` 立即正確反映，不需要切換 Section。截圖確認視覺上藍色標識正確即時更新。
- **Tablet**：`relaxationPositionControl`（原始 `name`）完全沒有改動，理論上不受影響；這次沒有另外重新截圖驗證 Tablet 路徑（因為改動本身是加法式的，不影響既有 `name`），如果要嚴謹起見，明天或之後可以補一次 Tablet 手動驗證。
- **Desktop**：Desktop 不使用這組 Relaxation radio 元件（Desktop 用的是 `PracticeCompositionOverview.jsx` 裡另一組獨立的 `name="overviewRelaxationPosition"`，本來就沒有牽涉在這次 bug 或修正裡）。
- `npm run lint`、`npm run build` 皆通過。

---

## 2. Practice Player

### 第一部影片需要使用者手動播放

- `VideoModule.jsx` 的「播放」按鈕呼叫 `playerRef.current.play()`（`VideoPlayer.jsx` 內部呼叫 `YT.Player.playVideo()`）。`new YT.Player()` 建構時沒有帶 `playerVars.autoplay`，所以第一部影片預設是 cued（未播放）狀態，需要使用者主動點擊——這是刻意的，沒有加任何 autoplay-bypass hack，符合瀏覽器對「未經使用者互動的有聲自動播放」的政策預期。

### Module 之間的自動播放機制

- 沿用既有架構，完全沒有重寫：`VideoPlayer.jsx` 內的 `YT.Player` 在 `ENDED` 狀態時呼叫 `onEnded`（即 `PracticePlayer.jsx` 的 `goNext`）→ `currentIndex` 改變 → `VideoPlayer.jsx` 的 `useEffect([videoId])` 偵測到 `videoId` 變化 → 對**同一個** `YT.Player` instance 呼叫 `loadVideoById(videoId)`（不會 destroy/recreate iframe，只要連續都是有影片的 Module，同一個 iframe 會一路用到底）。

### autoplay fallback / 6 秒 buffering watchdog

- `VideoPlayer.jsx` 在 Module 轉換（`loadVideoById()` 觸發）後監聽 YT 的 `PLAYING`/`PAUSED` 狀態（`watchingAutoplayRef`）：
  - 轉成 `PLAYING` → 呼叫 `onPlaybackResumed`（一切正常）。
  - 轉成 `PAUSED` → 呼叫 `onAutoplayBlocked`（代表 loadVideoById 成功載入但瀏覽器擋下了自動播放）。
- 實測發現：有時候會卡在 `BUFFERING`，既不到 `PLAYING` 也不到 `PAUSED`，導致上面的機制完全偵測不到。因此加了一個**明確標註為 backstop、非權威信號**的 `AUTOPLAY_WATCHDOG_MS = 6000` 計時器：Module 轉換後 6 秒內都沒有等到 `PLAYING`/`PAUSED`，就視同自動播放被擋，一樣呼叫 `onAutoplayBlocked`。
- `VideoModule.jsx` 在 `onAutoplayBlocked` 時顯示「繼續播放」按鈕（`.video-resume-prompt`），點擊呼叫 `playerRef.current.play()`；`onPlaybackResumed` 或下一次 Module 轉換時會自動隱藏（用 render 時比對 `module.slug` 的方式重置，不是用 `useEffect`，避免 `react-hooks/set-state-in-effect` lint 錯誤，也避免用 `key` remount `VideoModule` 導致 `YT.Player` instance 被摧毀重建）。
- 已實測：手動觸發卡住的 buffering 情境後，6 秒後正確顯示「繼續播放」，點擊後正確消失、恢復播放，全程沒有任何錯誤訊息或卡住的觀感。

### Fullscreen button

- `VideoModule.jsx` 的「全螢幕」按鈕呼叫 `playerRef.current.requestFullscreen()`（`VideoPlayer.jsx` 的 imperative handle）。
- 打的對象是**穩定不變的 wrapper `<div className="video-player">`**，不是會被 `YT.Player` internals 置換掉的 iframe——這樣即使 Module 切換造成 iframe 被替換內容，wrapper 本身的身分不變。
- 用標準 `Element.requestFullscreen()`／`webkitRequestFullscreen()`／`msRequestFullscreen()`，失敗（不支援、被拒絕）時完全靜默，不顯示錯誤、不影響播放。

### YouTube Mobile Fullscreen 遇到的問題

見下方第 3 節完整記錄。摘要：**Module 切換時，YouTube 自己的 player 邏輯會在 Mobile 環境下主動退出真正的瀏覽器 Fullscreen**，這不是我們的 DOM 結構或程式碼問題，是 YouTube app 層級的決定，無法從我們的頁面攔截或阻止。

### 今天已實作的 CSS immersive mode，以及它與真正 Browser Fullscreen API 的區別

- 新增 `immersiveMode` state（`PracticePlayer.jsx`），透過 `.practice-player--immersive` class 套用（`App.css`）。
- 觸發時機：使用者第一次點擊「播放」（`VideoModule.jsx` 用 `hasStartedRef` 只在第一次觸發），**同時**呼叫既有的 `requestFullscreen()`（真正的 Fullscreen API 嘗試）跟新的 `onImmersiveStart()` callback（往上傳到 `PracticePlayer.jsx` 把 `immersiveMode` 設成 `true`）。
- 之後每次 Module 切換完全不會重新呼叫這兩者——`immersiveMode` 是純粹的 React state，不監聽 `fullscreenchange`，不受 YouTube 內部行為影響，持續維持到使用者離開 Practice Player 為止。
- CSS 效果：`.practice-player-module` 變成 `position:fixed;inset:0` 撐滿 viewport、隱藏 `.practice-player-progress`（進度列表）、`.practice-player-exit`（離開練習連結）浮動在左上角維持可點擊。修正過一個窄螢幕水平溢出的問題（`.video-player-frame` 用 `vw` 單位定寬，會忽略祖先 `.module-playback` 的 padding，已改成該 padding 只留上下、水平歸零＋`overflow-x:hidden` 保險）。

> **明確記錄，避免未來混淆：CSS immersive mode 不等於真正的手機 OS Fullscreen。**
> CSS 滿版**不會**隱藏瀏覽器自己的網址列／系統列——那個效果只有真正呼叫 `requestFullscreen()`／`webkitEnterFullscreen()` 且成功時才會發生。CSS immersive mode 純粹是版面撐滿 viewport 的視覺效果，用來確保「即使真正的 Fullscreen session 中途被 YouTube 退出，畫面看起來還是連續、不中斷」，這兩者是刻意分離、互相獨立的兩個機制，程式碼與 CSS 命名上也刻意沒有用「fullscreen」稱呼 CSS 這一層（用的是 `immersive`／沉浸式）。

---

## 3. YouTube Fullscreen 調查結論

### 已確認的事實

- **實機測試結果**（使用者提供）：Module 1 手動進入全螢幕成功；Module 1→2 切換時，第二部影片正常自動播放，但**真正的瀏覽器 Fullscreen 被退出**。
- **Mozilla Bugzilla #1604450**（"Youtube fullscreen mode is exited when playing the next video"）：負責調查的工程師留言明確指出「this is youtube telling us to exit fullscreen」，並且「可以在 Chrome Desktop / Firefox Desktop 用 Mobile UA 字串重現，但真正的 desktop UA 重現不了」——確認這是 **YouTube player 自己的邏輯**，以 mobile User-Agent 偵測為觸發條件，不是瀏覽器限制。
- **iPhone Safari 對「非 video 元素」的通用 `Element.requestFullscreen()` 不支援**（只有 iPadOS 16.4+ 支援），但**針對原生 `<video>` 元素**，iOS 專屬的 `webkitEnterFullscreen()` 是明確支援的（來源：WebKit bug tracker、Apple Developer Forums）。
- **Fullscreen API 規格層級的事實**：退出全螢幕是由「文件／browsing context 被 navigate 或 unload」觸發，單純改變一個元素的 `src` 屬性不算 navigation——這點跟 YouTube 無關，是規格本身的行為。

### 推論（合理但未直接證實）

- YouTube 這個「mobile 環境下 app 層級主動退出全螢幕」的行為，很可能同樣適用於**嵌入用的 iframe player**（不只 youtube.com 本身），因為兩者很可能共用相近的 player 核心程式碼——這是推論，不是直接檢視 iframe 內部程式碼得出的結論（cross-origin，無法檢視）。
- Desktop Chrome 上，目前的 YouTube 架構理論上應該能讓真正 Fullscreen 跨 Module 切換維持——推論自「mobile UA 才會觸發退出」這個已確認事實，但**這次沒有在真實 Desktop 瀏覽器上實機驗證過**（測試沙盒的 Fullscreen 權限本身被完全擋掉）。

### 尚未證明的事情

- Bunny／Cloudflare Stream／Mux 自己的 iframe embed player，是否也有類似的退出全螢幕行為——沒有測試，沒有證據。
- 自架 `<video>` + HLS + 換 src 的架構，能不能在真實 Practice（3 個以上 Module 連續切換）中可靠維持 iOS 原生 Fullscreen——只做過一次 A→B 的測試（見第 5 節），樣本數是 1。

### 明確記錄的產品決策

- **不採用**「每個 Module 都要求使用者重新點 Fullscreen」作為最終 UX（使用者已明確否決，體驗不理想）。
- **不採用** UA 偽裝騙過 YouTube 的 mobile 偵測、抓取 YouTube 直連串流網址等 hack（不可靠、可能違反服務條款、隨時會失效）。

---

## 4. 未來影片平台研究

### Bunny Stream / Cloudflare Stream / Mux 研究結果摘要

| 項目 | Bunny Stream | Cloudflare Stream | Mux |
|---|---|---|---|
| iframe embed | 有（`player.mediadelivery.net/embed/...`），用開放標準 **Player.js**（`ready`/`play`/`pause`/`ended` 等事件） | 有（Stream Player） | 有（`<mux-player>` web component） |
| 原始串流網址（供自訂 `<video>`/hls.js 使用） | 有（官方文件明確提供「raw video files」存取） | 有，明確的 HLS (`.m3u8`) 與 DASH (`.mpd`) manifest 網址格式 | 有，明確的 HLS (`.m3u8`) 網址，官方文件列出可搭配 video.js／hls.js／JWPlayer 等 |
| 官方付費／免費 | 需付費，量級可控（頻寬 $0.005–0.06/GB 依地區、儲存 ~$0.005–0.01/GB/月、最低 $1/月，來源：bunny.net/pricing/stream） | 需付費（未深入比價） | 需付費（未深入比價） |

**特別記錄：**

- **如果使用 iframe embed**：不管選哪一家，都存在「第三方 player 是否也有自己的 app 層級 fullscreen 行為」這個不確定性——沒有證據顯示 Bunny/Cloudflare/Mux 會像 YouTube 一樣主動退出全螢幕（它們是 B2B 基礎設施產品，沒有 YouTube 那種「導回瀏覽介面」的消費端產品動機），但也沒有直接證據排除這個風險。
- **如果使用原始 HLS/DASH + 我們自己的 `<video>` 元素**：徹底移除「第三方 iframe 決定退出全螢幕」這一整類風險，因為根本沒有第三方 app 邏輯介入——這是三家都能提供、YouTube 完全無法合法提供的能力，是換平台在這個問題上最主要的結構性優勢。

### 目前程式架構的 platform-agnostic 現況

**已經是 platform-agnostic（跟影片平台無關）：**
- `PracticePlayer.jsx`：`currentIndex`／`goNext`／`goPrevious`／`restart`、`immersiveMode` state 與其 CSS
- `ModuleRenderer.jsx`：依 Module 類型分派、`onImmersiveStart` callback 的傳遞
- `ModulePlaceholder.jsx`：非影片 Module
- Callback／imperative handle 介面本身：`onEnded`、`onAutoplayBlocked`、`onPlaybackResumed`、`onImmersiveStart`、`play()`／`pause()`／`requestFullscreen()`

**目前仍是 YouTube-specific：**
- `VideoPlayer.jsx` 內部：`YT.Player`、`loadVideoById()`、`YT.PlayerState` 判斷、`utils/loadYouTubeIframeAPI.js`
- `VideoModule.jsx` 幾乎已經是 platform-agnostic 的 UI 外殼，唯一的 YouTube 相關之處只有它 import 的是 `VideoPlayer`（YouTube engine）這一行

**未做任何平台遷移。尚未決定 Bunny／Cloudflare Stream／Mux 三者中要選哪一個，也尚未決定是否要換平台。**

---

## 5. iPhone Safari POC

### POC 目的

獨立驗證一個單一、明確的技術問題：**同一個原生 `<video>` 元素，在 iPhone Safari 進入真正的原生 video fullscreen（`webkitEnterFullscreen()`）後，只更換 `src`（不重新建立 element），fullscreen 是否維持？** 這個結果直接影響「換平台是否真的能解決 YouTube 那個已確認的 Mobile Fullscreen 退出問題」。

### 測試方法

- **獨立頁面**，跟正式 Luckster Practice Player、正式網站完全無關，不依賴任何 App 程式碼。
- 檔案位置：`C:\Users\Luckster\AppData\Local\Temp\claude\C--Luckster-core\4b5b5997-9a82-4819-98ff-d2b1269ad2bf\scratchpad\ios-fullscreen-poc.html`（另有一個零依賴的 Node 靜態伺服器 `poc-server.cjs`，監聽 `0.0.0.0:4177`）。
  > ⚠️ **這個檔案存放在系統暫存目錄（scratchpad），是 session 範圍的暫存空間，不保證會保留到明天**。明天要做第 6 節的更嚴格 POC 時，可能需要重新建立或搬到更持久的位置（例如專案外的個人筆記資料夾），不需要、也不應該放進 `frontend/` 這個正式 repo 裡。
- **影片來源**：Apple 官方公開 HLS 測試串流（已驗證兩者皆可正常存取）：
  - 影片 A：`https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8`
  - 影片 B：`https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8`
- **流程**：因為進入 iOS 原生 fullscreen 後整個網頁畫面會被系統原生播放介面蓋掉，頁面上的按鈕在全螢幕中完全無法點擊，所以測試流程設計成只需要兩次點擊：
  1. 「載入並播放 影片 A」
  2. 「進入全螢幕」（呼叫 `video.webkitEnterFullscreen()`）→ 監聽 `webkitbeginfullscreen` 事件確認真的進入後，**由程式自動排程**（`setTimeout`，5 秒），5 秒後自動把同一個 `<video>` 的 `src` 換成影片 B、呼叫 `load()`/`play()`——全程不需要、也不可能在全螢幕中操作。
- **Debug 記錄**：每個關鍵時間點都記錄 `document.fullscreenElement`、iOS 專屬的 `video.webkitDisplayingFullscreen` 旗標，並監聽 `webkitbeginfullscreen`／`webkitendfullscreen`／`loadstart`／`loadedmetadata`／`playing`／`pause`／`waiting`／`stalled`／`error`／`emptied`／`ended`／`fullscreenchange` 事件，全部帶時間戳記寫入頁面上的記錄區塊（因為全螢幕中看不到頁面，退出後回來看記錄即可）。

### 實測時間線與結論（2026-08-20，使用者 iPhone Safari 實機測試）

```
18:29:00.380  呼叫 video.webkitEnterFullscreen()
18:29:00.398  webkitbeginfullscreen 觸發，webkitDisplayingFullscreen = true
18:29:05.400  自動換片開始（5.002 秒後，符合設計）—— 換 src 前 fullscreen 仍為 true
18:29:05.401  video.src 設為影片 B，呼叫 load()/play() —— fullscreen 仍為 true
18:29:07.838  影片 B 第一次 playing 事件（換 src 後 2.437 秒）—— fullscreen 仍為 true
18:29:08.657  影片 B 第二次 playing 事件（短暫 rebuffer 後恢復）—— fullscreen 仍為 true
18:29:17.356  stalled 事件（B 開始播放後約 9 秒）—— 此時 fullscreen 旗標仍未翻轉
18:29:42.580  pause 事件
18:29:42.587  webkitendfullscreen 觸發（僅比 pause 晚 7ms）
18:29:42.696  webkitDisplayingFullscreen: true -> false
```

**確認的事實：**
- 進入 Fullscreen 成功。
- A → B 換 `src` 當下，fullscreen 仍為 `true`。
- B 開始播放時，fullscreen 仍為 `true`。
- Fullscreen 在換片後**持續超過 34 秒**（從 B 開始播放算起）才退出，換 src 動作本身跟退出動作相差達 37.187 秒。
- 最後 `pause` 與 `webkitendfullscreen` 幾乎同時發生（相差 7ms），而不是跟換 src 那個時間點同時。

**這次測試「沒有證明」的事情：**
- 沒有證明「換 src 會導致 fullscreen 退出」——時間線反而比較支持「退出跟換 src 無直接關聯，可能跟後續某個造成播放暫停的事件（很可能是串流 stall／緩衝問題）比較相關」，但這個解讀本身也未被證實，只是比「換 src 立即導致退出」更貼合這次的實測數據。
- 沒有證明 iPhone Safari 可以可靠完成完整 A → B → C → D 的長時間連續播放——只測了一次 A→B，樣本數是 1，且用的是 Apple 測試串流而非真實課程內容。
- 最後退出全螢幕的真正原因仍未完全確定（串流卡住／iOS 對「暫停過久」的自動退出機制／這支測試串流本身在這次連線的穩定性問題，三者都合理，無法從這次的 log 排除任一個）。

---

## 6. 明天的下一步

**不要立刻付費、不要遷移影片、不要修改正式 Player。**

下一步只做**一個更嚴格的小型 POC**，驗證：

> 一次使用者操作進入真正 Fullscreen → A 自動播放 → B 自動播放 → C 自動播放 → D 自動播放 → 全程不碰手機

需要記錄的欄位／事件：
- `video.webkitDisplayingFullscreen`
- `webkitbeginfullscreen`
- `webkitendfullscreen`
- `playing`
- `waiting`
- `stalled`
- `pause`
- `video.buffered`
- `video.networkState`

**唯一目的**：確認「iPhone Safari + 自己控制的 `<video>` + HLS + 連續換 src」是否真的可以滿足——

> 一次操作 → 全程真正 Fullscreen → Module 自動連播 → 不需要再次操作

（今天的 POC 檔案／伺服器可以作為起點，但如第 5 節所述，暫存目錄內容不保證留存，明天可能需要重新確認檔案還在或重建。）

---

## 7. 最終產品原則

**目前不要因為今天的 POC 就認定 iPhone 可行或不可行。**

目前狀態：

- **YouTube**：不適合作為這個核心 Fullscreen UX 的最終方案（已有明確、可信的證據——Bugzilla 工程師留言＋使用者實機測試雙重確認）。
- **自有 `<video>` + HLS**：有希望，但仍需更嚴格的 POC 驗證（見第 6 節）——今天的單次測試給出正面訊號，但不足以下定論。
- **Bunny / Cloudflare Stream / Mux**：候選方案，尚未選擇，三者在「開放原始串流供自訂 player 使用」這件事上是同一等級，沒有哪一家特別突出。
- **尚未付費**。
- **尚未搬遷影片**。
- **尚未開始平台遷移**。

---

## working tree 狀態（本次「存檔」任務不涉及、不應改動）

以下是本文件建立當下，working tree 裡**除了這份 progress 文件之外**的既有修改，全部是今天／先前 session 已完成、尚未 commit 的正式程式碼與內容變更，**這次只做文件存檔，不會一併 commit 這些檔案**：

```
 M frontend/src/App.css
 M frontend/src/components/HeroSection.jsx
 D frontend/src/components/ModulePicker.jsx
 M frontend/src/components/ModulePickerCanvas.jsx
 M frontend/src/components/ModuleRenderer.jsx
 M frontend/src/components/PracticeBuilder.jsx
 D frontend/src/components/PracticeBuilderSection.jsx
 M frontend/src/components/PracticeCompositionOverview.jsx
 M frontend/src/components/PracticePlayer.jsx
 M frontend/src/components/PracticeSectionCanvas.jsx
 M frontend/src/components/VideoModule.jsx
 M frontend/src/components/VideoPlayer.jsx
 M frontend/src/data/homepage.js
 M frontend/src/utils/validatePracticeBuilder.js
?? docs/design/
?? docs/website/about.md
?? frontend/src/components/MobileModulePanel.jsx
?? frontend/src/components/MobileSectionNav.jsx
?? frontend/src/components/MobileSectionOverview.jsx
?? frontend/src/components/PieceCard.jsx
?? frontend/src/utils/sectionStatusLabel.js
```

其中 `App.css`、`ModuleRenderer.jsx`、`PracticePlayer.jsx`、`VideoModule.jsx`、`VideoPlayer.jsx`、`PracticeBuilder.jsx` 這幾個是今天 session 內實際修改的檔案（對應第 1、2 節的內容）；其餘是更早之前既有、本次沒有動過的變更。
