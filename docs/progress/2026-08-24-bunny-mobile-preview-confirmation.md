# 2026-08-24 工作紀錄：Bunny → Bunny 手機實機確認、Vercel Preview 工作流程

本文件接續 `2026-08-21-bunny-real-account-mt001-mw001-pilot-and-cross-provider-analysis.md`。那份文件在第 11 節列出的第一項待辦——「在真實、可見、聚焦的視窗最終確認 Bunny → Bunny 轉場」——桌面版已在那之後由使用者自行確認完成；**本文件記錄的是手機實機的部分**，以及為了達成這個確認而引入的 Vercel Preview 工作流程。

**這是一份 checkpoint 準備文件，尚未 commit。** 今天的所有操作都停在 working tree / 本機狀態，等使用者 review 後再決定是否 commit。

---

## 1. 目前最關鍵的結論

1. **Bunny → Bunny（MT001 → MW001）全螢幕自動播放，桌面與手機都已由使用者本人在真實、可見、聚焦的視窗確認成功。** 這正式解除了 2026-08-21 文件第 7 節與第 11 節第 1 項標註的「尚未確認」狀態——`document.hidden` 沙盒限制不再是這項結論的障礙，因為這次是手機瀏覽器的真實確認，不是自動化環境。
2. **因此不需要再上傳第三支影片來重複驗證這個核心行為**（使用者的判斷，也符合 2026-08-21 文件第 6 節的架構推論：Engine 型別不變 = React 保留同一個 instance，不會因為多幾支影片而有不同結果）。
3. **手機區網（LAN）存取問題今天沒有解決，改用 Vercel Preview 繞過**：2026-08-21 文件第 8 節記錄的「路由器 AP Isolation」懷疑，今天沒有再深入診斷，因為已經找到一條不需要修路由器就能達成手機實機測試的路徑。這個決定是今天工作階段一開始就定案的，不是本文件的新結論。
4. **今天完全沒有觸碰 Bunny 帳號、Library 或任何 Bunny 設定**——今天所有操作都是 Vercel CLI + 本機 git/build 檢查，沒有對 Bunny Dashboard 發出任何請求。
5. **今天沒有開始任何新影片的 migration**——`frontend/src/data/modules.js` 今天完全沒有被修改（`git diff` 確認），全 repo 搜尋 `provider: 'bunny'` 只有 MT001、MW001 兩筆，跟 2026-08-21 結束時完全一致。
6. **今天沒有動到任何既有 WIP**（Mobile Section Nav / Piece Card / Practice Builder 等一大批未 commit 的檔案，屬於 2026-08-20 那份文件記錄的獨立工作，今天全程沒有讀取或修改這些檔案的內容，它們目前的 diff 狀態跟今天工作階段開始前一致）。

---

## 2. 今天做了什麼：引入 Vercel Preview 作為手機實機測試管道

**背景**：2026-08-21 文件第 8 節記錄的手機 LAN 存取問題（`http://192.168.1.103:4190/`）今天仍未解決，判斷是路由器層級問題，不是這台電腦能單方面處理的。今天改用 Vercel Preview 部署，取得一個手機可以直接用 HTTPS 開啟的網址。

**執行方式**（刻意選擇不需要 git commit / push 的路徑）：
- 用 `npx vercel`（未安裝全域套件，用完即棄）而不是接 GitHub 觸發部署，因為後者需要 push，違反今天的安全邊界
- `vercel login`：使用者本人在瀏覽器完成 device-flow 授權（帳號 `lucksteraiworkspace-4895`），Claude 沒有觸碰帳號密碼、2FA 等敏感步驟
- `vercel deploy --yes`：直接把**本機當下的完整 working tree**（含前述未動過的既有 WIP）打包上傳，建立一個全新、獨立的 Vercel project `joti2/frontend`
- 這個 project 跟 JOTI 現有的任何正式站台、既有 Vercel 專案都無關——是今天全新建立的

**一個值得記錄的細節（已跟使用者說明過）**：Vercel 對「一個 project 的第一次部署」預設會把它標成 `production` target，這是 Vercel 平台的預設行為，不是刻意要求或修改了什麼設定。因為 project 是全新的，沒有動到任何既有正式環境，所以視為在安全邊界內；CLI 也回報之後的部署會自動變成 preview（除非明確加 `--prod`）。

**Deployment Protection（SSO）**：這個 team 帳號預設對所有部署開啟 Vercel Authentication，手機打開網址會先要求登入同一個 Vercel 帳號。有詢問使用者是否要關閉這個保護讓連結變公開，**使用者選擇維持預設保護、手機直接登入**——今天沒有修改任何 Deployment Protection 設定。

**最終取得的 Preview 網址**（手機登入後可用）：
- `https://frontend-jukoafopd-joti2.vercel.app`
- `https://frontend-ebon-seven-40.vercel.app`

---

## 3. 今天實際的檔案改動（僅限這三項，且都還在 working tree，未 commit）

- **`frontend/vercel.json`（新檔案）**：新增 SPA rewrite（`/(.*)` → `/index.html`），避免手機上重新整理子頁面時出現 404。這是今天唯一一筆「程式碼相關」的新增，內容極小，跟 Bunny 播放邏輯完全無關。
- **`frontend/.gitignore`（修改，+1 行 `.vercel`）**：由 `vercel deploy` 在建立本機 project 連結時自動加上，不是手動編輯的。
- **`frontend/.vercel/`（新目錄，未追蹤，已被上面那行 gitignore 排除）**：只有 `project.json`（`projectId` / `orgId` / `projectName`，不含任何密鑰）與 Vercel 自動產生的說明文字檔，確認過內容不含任何機密資訊。

**明確沒有改動的東西（今天逐一確認過 `git diff` / 全域搜尋）**：
- `frontend/src/data/modules.js` — 完全沒有 diff
- `HlsVideoEngine.jsx`、`YouTubeVideoEngine.jsx`、`VideoPlayer.jsx`、`VideoModule.jsx` — 完全沒有 diff
- 全 repo 沒有新增任何 `provider: 'bunny'` 的項目
- 2026-08-20 遺留的 Mobile Builder WIP 那一批檔案 — 狀態與今天工作階段開始前一致

---

## 4. 今天執行的收尾檢查

- `npm run build`：✅ 成功，使用今天當下完整 working tree（含既有 WIP），無錯誤
- `npm run lint`：✅ 乾淨通過，零 error、零 warning
- `git status` / `git diff --stat`：完整核對過，改動範圍與上面第 3 節描述一致，沒有意外改動
- Bunny provider 計數：`modules.js` 內 `provider: 'bunny'` 固定 2 筆（MT001、MW001），全 repo 搜尋沒有其他檔案含這個 provider 值
- `frontend/.vercel/project.json` 內容檢查：不含機密
- Vercel deployment 內容核對：部署上傳的是加入 `vercel.json` 之後的 working tree 快照，跟後續的手機測試結果對應一致（測試期間沒有再重新部署）

---

## 5. 哪些問題現在可以定案

1. **Bunny → Bunny（同 provider）轉場的核心行為（自動切換、自動播放、Fullscreen 維持）在桌面與手機真實裝置上都已驗證成功。** 這是這幾天 Bunny POC 最核心的技術問題，現在可以視為已解決，不需要更多影片重複驗證。
2. **不需要再處理家用 LAN / 路由器 AP Isolation 問題**——不是因為它被解決了，而是因為手機實機測試已經有 Vercel Preview 這條不依賴它的路徑，這個路由器問題本身仍然沒有根因確認，只是不再是阻塞項。
3. **今天的 Vercel 操作沒有觸及 Bunny、Production、或任何既有 migration 範圍**，全部驗證通過。

---

## 6. 哪些事情還不能下結論

1. **Bunny → YouTube 跨 provider 轉場**（Fullscreen 退出、YouTube autoplay 修正）**今天完全沒有測試**，2026-08-21 文件裡「尚未最終視覺確認」的狀態維持原樣，不受今天工作影響。
2. **是否要把全部 43 支（或實際總數，今天沒有重新核對這個總數字本身）影片遷移到 Bunny，仍然是未決定的方向性問題**。今天的手機確認只是讓「Bunny → Bunny 行為可靠」這個技術前提更紮實，不代表遷移方向已經拍板。
3. **家用路由器 AP Isolation 是否真的是 LAN 存取失敗的根因，仍未確認**——今天選擇繞過而非診斷，如果之後有場景必須用回本機 LAN（例如需要更快的本機 iteration 速度），這個問題還是會回來。
4. **Bunny 帳號目前的 trial 額度、到期時間，今天沒有重新查詢**，2026-08-21 記錄的「$20 額度、14 天效期、Balance $0.00」是最後一次已知狀態，不是今天驗證過的數字。
5. **Vercel 是否會成為 JOTI 長期的 hosting 或 Preview 工作流程的一部分，今天沒有做這個決定**——今天單純把它當作「繞過 LAN 問題的一次性測試工具」使用，`vercel.json` 要不要留著、要不要正式收進專案的部署流程，是一個獨立於 Bunny POC 的決定，需要另外討論。

---

## 7. 建議的下一步順序

1. **使用者 review 這份文件與目前 working tree 的實際 diff**（`git status` / `git diff`），確認第 3 節列出的三項改動（`vercel.json`、`.gitignore`、`.vercel/`）是否要連同這份文件一起 commit 成一次 checkpoint。
2. **獨立於 Bunny POC 之外**，決定 Vercel 這個工具today是否要正式留在專案工作流程裡（例如是否要在 README / engineering guide 補一句「手機測試用 Vercel Preview」的說明），或者只是這次的一次性繞道，之後就不再需要。
3. 如果下一步是討論「是否往全面遷移到 Bunny」的方向規劃，建議先處理 Bunny → YouTube 跨 provider 的最終視覺確認（第 6 節第 1 項），把兩條路徑都拿到真人確認後，再一起評估遷移範圍與批次順序——**這不是今天要開始的工作，只是排序建議**。
4. 家用路由器 LAN 問題可以無限期擱置，除非之後有具體理由需要回到本機 LAN 測試模式。
5. 2026-08-20 遺留的 Mobile Builder WIP 是完全獨立的一條工作線，不建議跟 Bunny 相關的 commit 混在一起——如果要 commit 今天的 Vercel 相關改動，建議 commit message 只描述 Vercel Preview 這件事，不要牽扯到那批 WIP。
