# JOTI Project Status

## Purpose

本文件是 Luckster / JOTI 專案進度的**單一真實來源（Single Source of Truth）**。內容依實際 repo 檔案、Git 狀態與既有文件整理，不包含尚未開始或推測性的工作。每次重大進度變化後應更新本文件。

---

## Current Phase

**核心學習系統（Foundation / Module / Practice / Auth / Membership）已完成並上線。**

**JOTI Legal / Business Model v1（Membership Service Basic Agreement + Service Period）已確立並整理成文件。**

目前重心：

1. **Payment Readiness / Pre-submission preparation**——金流平台現況：**Oen 已通過相關申請／審核**；**ECPay（綠界）與 PAYUNi 目前正在申請中**，兩者現階段皆為候選平台，用於申請、測試與比較整合便利性、費用、操作方式及實際測試結果，**最終採用哪一個金流平台尚未決定**，不應視 ECPay 或 PAYUNi 為已確定採用之平台。以下為網站審核準備工作：Gap Analysis、Implementation Sprint（Pricing/Legal/Footer/CTA）、Legal/Contract Publication Refinement（Discovery＋Implementation）、Production Publication Readiness Audit＋Polish、Vercel Deployment Architecture 修正、Mobile Legal/Contract RWD 修正、Contract Terminology Consistency（Audit＋2 輪 Implementation）**皆已完成**。**已知阻塞項**：Supabase Auth 的 `Site URL`／`Redirect URLs` 設定過期，目前任何環境（Preview 或 Production）點擊登入都會被導向 `localhost:4190` 並出現 `ERR_CONNECTION_REFUSED`——根因已診斷確認，**修正需要到 Supabase Dashboard 手動操作**，尚未執行（見 Next Steps、Blockers）。這一整批工作**尚未 commit／push**。
2. **Payment Rebuild — 第 1–4 階段已完成**；**第 5 階段（Payment Core / Provider Adapter）Payment Core 實作已完成、Provider-agnostic 架構驗證已通過，不需要進行 Payment Core 架構重構**（詳見下方「Payment Rebuild — Step 5」小節）。**Oen Provider Adapter 尚未實作**，Payment Core 的 4 個 trusted RPC 尚缺 TEST Supabase 實際執行驗證（屬於驗證工作，不代表需要重新設計 Core）。下一個正式工作階段為 **Step 6：Oen One-time Checkout**——以 Oen 作為目前第一個 Provider 打通 Payment Core，**不代表最終選定 Oen**；Step 7（Webhook + Server-side Verification）／Step 8（Membership / Entitlement）／Step 9（Refund / Cancellation / Edge Cases）／Step 10（Production Readiness）維持原順序，尚未開始。
3. 內容擴充（新增 Module）
4. 網站體驗細節打磨（Module Library/Detail、Practice Builder）

> 注意：下方「Payment（Oen）—— Test 環境」小節記錄的 T-1/T-2 成果，是**舊付款模型（recurring subscription）**下的測試紀錄，與新確立的 Legal/Business Model v1（不採自動續約）存在已知架構落差，已由 `docs/business/payment/order-schema-proposal.md` 正式盤點（見下方「Payment Rebuild — Step 2」小節），現行程式碼本身尚未調整。

---

## Operational Status

**Pre-launch / 正式發布前**

- JOTI 尚未正式對外營運。
- 目前沒有正式會員。
- 目前沒有正式付費會員。
- 目前沒有任何正式會員 acceptance record。
- 尚未有消費者依 JOTI 合約完成正式訂閱／接受契約。
- Vercel 上已有網站部署，**不代表** JOTI 已經正式開始商業營運。

### Contract Status

- 目前的合約內容（`docs/legal/joti-online-teaching-contract.md`）就是接下來 JOTI 正式發布時預定採用的**第一版正式合約（v1）**，不是另外等待律師審閱的草案。
- 目前正在進行的是正式發布前的最後整理與網站呈現準備。
- 正式上線後，這份合約即作為 v1 使用。
- 目前尚未有會員 acceptance，因此 v1 尚未產生正式 acceptance history。
- **不建立 v1.1。**
- 未來只有在 v1 已正式使用、已有實際會員接受契約後，如果契約內容需要修改，才建立 v1.1 / v1.2 等後續版本。
- 契約與 `v1.0.md` 的會員閱讀呈現已完成清理：移除「草案」聲明、移除誤混入的系統欄位名稱（`contract_version` 等）與冗餘英文工程術語、統一中英文術語呈現規則、移除計算式與流程圖的 Markdown code block 呈現（改為一般段落／編號列表）；詳見下方「Contract Publication Refinement」與「Contract Terminology & Readability Cleanup」小節。兩份文件全程保持逐字一致。

### Legal Review Status

- JOTI 目前沒有安排在正式上線前進行律師審閱。
- JOTI 不把律師審閱列為本次正式發布的必要步驟。
- 本專案後續仍會依適用法規、消費者保護要求及金流平台要求進行合規與文件檢查。
- 「是否需要律師審閱」不列為目前專案的 blocker、待辦事項或上線條件。

### Contract Versioning

**Current release target: v1**

```
Pre-launch → 正式發布 → v1
```

目前：
- v1 的內容正在正式發布前整理。
- 尚無正式會員。
- 尚無正式 acceptance。
- 因此尚無 v1 的實際 acceptance history。

未來：

```
v1 正式使用 → 發生需要修改契約的情況 → v1.1
```

不因為目前仍在正式發布前調整內容，就建立 v1.1。

### Business / Address Status

- 已確認並可公開使用的 JOTI 地址：**臺北市松山區吉祥路55之1號7樓**。
- 此地址已由使用者確認可以對外公開，不再標記為「待確認」或「不可公開」。
- 此地址是目前 JOTI 對外資訊（契約、`data/business.js`、Footer）應使用的地址。
- 後續 development / legal 文件若需要同步業者地址，應以此地址為 authoritative value。

### Final Website Domain

- JOTI 最終正式網站網域**尚未確定／尚未完成設定**。
- 因此目前不能自行把 Vercel deployment URL 當成最終正式網站網址。
- 法律文件中的 `[待填寫]`（網站欄位）目前仍存在，**是因為最終正式網域尚未確定**，不是因為合約仍處於法律草案狀態。

---

## Completed

### 核心學習系統
- Foundation Library（30 個 Lesson）、Module Library（22 個 Module）、Practice Hub、Practice Player（含 Resume / Progress，Phase 5E）
- Practice Builder：Custom（`/practice/build`）與 Admin Official（`/admin/practices`）共用同一套組課元件與驗證邏輯
- Auth / Membership：Google / Email 登入、Trial（30 天或 30 影片小時，先到者結束）、Admin / Subscriber / Trial / Trial Expired 四種狀態、entitlement gating（訪客與過期試用僅 10 秒試看）

### Bunny 影片遷移
- 全部 22 個 Module 已從 YouTube 遷移到 Bunny，`videoReference`（provider + URL）與 `.md` 的 `Primary Video` 完全同步
- 全部 22 個 Module 的 `duration`（秒）已對照 Bunny 實際影片長度校正
- 新增 `frontend/scripts/validate-module-video-sync.mjs`：離線檢查（`npm run validate:module-video`）+ 連線 Bunny 稽核（`npm run validate:module-video:audit`，驗證影片存在性與時長誤差 ±2 秒）

### 網站體驗
- 首頁改版（Hero / Why JOTI / 進入課程 / 完整課程流程 / 精選 Practice / About / Final CTA）
- About 頁（獨立編輯排版與真實攝影）
- Module Library / Module Detail 清理：修掉未套樣式的卡片（藍色底線連結）、Module Detail 不再洩漏內部 metadata（ID、Bunny 原始 URL、Previous Source），改為過濾後只顯示 Description + Learning Outcomes
- Practice Builder：候選 Module 卡片加入「預覽 / 詳細」——可查看完整資訊並單獨播放影片（套用既有 entitlement 10 秒上限），Custom 與 Admin Builder 共用
- Practice Builder：Desktop 的「放鬆順序」控制項位置修正，與 Mobile 行為一致

### Module 內容工作流程
- 移除 Module `.md` 的 `Duration:` 人工欄位（Foundation 不受影響）；Module `duration` 現在只存在於 `data/modules.js`，來源為 Bunny 實際影片長度，經 `validate:module-video:audit` 確認（僅回報，不自動寫入）
- 新增 `docs/course-system/module-authoring-workflow.md`：新增 Module 的標準操作流程

### Payment（Oen）—— Test 環境
- **T-1（One-time Checkout）**：Test 環境端到端驗證完成——建立 checkout → hosted 付款頁（需 Basic Auth `nobody:oenoen`）→ 測試卡付款成功 → transaction 轉為 `charged` → webhook 正確送達並解析
- **T-2 Discovery + Test 1（Subscription 建立）**：確認 `/checkout-schedule` 可建立「先綁卡、指定未來日期首扣」的排程訂閱（`status: scheduled`），建立當下不扣款；記錄多項與官方文件不符的實測行為（`productDetails` 必填、testing hosted checkout 需 Basic Auth、checkout link 短時效、webhook 無簽章）
- **T-2 Test 2（Subscription 自動首扣）**：查核 `S2026091055MVCVI8` 於排定時間 2026-09-13 09:00 UTC+8 後 20 秒內自動扣款成功（`status: charged`，用的正是建立訂閱時收的那張卡），`subscription.status` 轉為 `ongoing`，`nextChargeAt` 正確推進到下個月同一天（2026-10-13）；`purpose:charge, action:subscription` webhook 正確送達。**Trial → Paid 的核心機制（先綁卡、不立即扣款、到期自動扣款、按月續扣）確認可行。**該訂閱目前仍在跑（`numberOfPeriods: 0` 無限期），10/13 會再自動扣一次測試款，除非主動取消。
- Supabase 端已有對應基礎建設：`create-subscription-checkout` / `oen-webhook` Edge Functions、`schema_subscriptions.sql`（`subscriptions` / `subscription_checkouts` / `payment_events` 表 + RLS + 唯一寫入者 RPC）
- Payment Backend 正式環境部署 Discovery：比較 Supabase Edge Functions／Vercel Functions／小型常駐服務，推薦「維持 Supabase Edge Functions + 第三方固定 IP outbound proxy」，理由與比較已記錄於本次對話（尚未整理成獨立文件）

### Payment Rebuild — Step 2（Order Schema / DB Migration Proposal）
- **文件**：`docs/business/payment/order-schema-proposal.md`（新建）——Status: Proposal（Design），**尚未實作，等待最後一次人工 Review 並授權後才進入 Step 3 Implementation**
- **已確認的架構決策**（Order 只在使用者實際發起購買且 Contract Review Gate 通過後才建立，不因契約審閱完成或 Service Period 到期自動建立）：
  - **Contract Acceptance**：採歷史紀錄模式（`contract_acceptances`，append-only），每次同意契約各留一筆；`orders.contract_acceptance_id` FK 回溯當次交易所用之 Contract Version
  - **Currency**：CURRENT 僅 TWD，schema 保留未來擴充其他幣別的空間，不做 multi-currency pricing
  - **Order status 七值**：`pending_payment / paid / payment_failed / payment_expired / refund_processing / refund_failed / refunded`；不含 `cancelled`/`active`/`expired`（這兩者分別屬於 Service Period 與 Basic Agreement 的 domain）
  - **`orders.payment_method`**：nullable、無 DB enum，付款經 Provider 驗證後由 Provider Adapter 正規化寫入；與 `provider`（誰處理付款）語意分開
  - **Core／Provider Adapter 命名邊界**：Core function（如 `create-order-checkout`、`apply-order-payment`）不得含 `subscription`／`oen`；Provider Adapter（含 Oen webhook 接收端點）可合理保留 provider 名稱
  - **Legacy**：`subscriptions`／`subscription_checkouts` 保留、不 DROP，新流程不依賴或建立它們，舊 Oen TEST Subscription 資料不自動 migration；未來若真的推出 Subscription 產品再重新評估這些 legacy 架構是否可重用
  - **Existing Paid Members Migration = N/A**（JOTI 尚未正式上線，無正式付款資料需要遷移，deferred until post-launch）
  - **Payment Expiration**：`payment_expires_at = created_at + 3 天`，由 trusted server-side logic 於 Order 建立時計算寫入（非 DB column default）；與 Contract Review 的 3 日審閱期無關
  - **Refund**：不建立獨立 Refund status／表，Refund lifecycle 直接由 `orders.status` 表示（`paid → refund_processing → refunded` 或 `refund_failed`）；Refund ≠ Basic Agreement termination，不會重新啟動 Contract Review
  - **Basic Agreement Termination**：需要獨立於 Order／Service Period 之外的 termination record，至少保存 `requested_at`／`effective_at`，不因申請提出就立即視為終止
  - **Oen Integration 邊界**：Webhook 是 Oen → JOTI 通知、目前無 signature/HMAC、payload 不可直接當付款最終證據，須由 Provider Adapter 回查 Oen API 驗證；正式環境 JOTI → Oen API 需固定來源 IP；Fixed IP 屬於 Provider／infrastructure 層，不進入 Core domain
  - **`payment_failed` 同一 Order 重試（Decision A）**：只要 `payment_expires_at`（3 天，重試不重置不延長）尚未到期，允許 `payment_failed → pending_payment`，使用者不需建立新 Order；新增 `orders.payment_attempt` 標示目前合法嘗試編號（不代表 provider transaction ID、不保存完整 attempt history）；trusted payment application function 轉為 `paid` 前須同時比對 order id、`status='pending_payment'`、`payment_attempt` 三者，防止舊嘗試晚到的 provider 事件誤標記新嘗試
  - **CURRENT／FUTURE 邊界**：CURRENT＝JOTI Learning + One-time Order + Service Period + 不自動續訂；FUTURE Subscription/Automatic Renewal 屬於 `docs/business/future-product-direction.md` 的未來產品研究，不因此修改目前 CURRENT 模型
- **Oen Webhook／固定 IP Verification**（唯讀盤點，支撐上述 Oen Integration 決策）：確認 Oen webhook 目前無簽章機制、payload 須經回查驗證；固定 IP 需求方向為 JOTI → Oen API（outbound），非 Oen → JOTI webhook 方向
- **仍列為 Open Question**（不阻塞 Step 3 開始，待實作對應功能或建立對應表時再決定）：Basic Agreement termination 完整 lifecycle/status enum；Refund failed 後是否允許 retry；Oen refund 在銀行處理延遲情況下是否可能非同步（需要進一步 Oen verification）；Service Period 提前終止後 `status` 的具體落值方式

### Payment Rebuild — Step 4（Contract Review & Acceptance Flow）
- **Implementation 已完成**：`contract_versions`（Registry，authoritative source for current applicable Basic Agreement）／`contract_acceptances`（immutable、append-only 的正式同意紀錄）／`profiles.review_contract_version`＋`review_presented_at`（pending Review Session，Version Binding：一旦開始審閱即釘住當時版本，不因後續 current version 更新而改變）三組 DB 結構＋`start_contract_review()`／`agree_to_contract()`／`reaccept_contract()` 三個 trusted RPC（SECURITY DEFINER，僅 `service_role` 可執行）＋對應的三支 Edge Function（`start-contract-review`／`agree-to-contract`／`reaccept-contract`）＋前端 `/contract-review` route（`ContractReviewPage.jsx`）與 `docs/legal/versions/v1.0.md` 版本化內容管線
- **TEST Supabase 專案（`ngznngqmbhxejkjbqomh`）實際 DB/RPC 測試完成**：對真實 TEST 專案套用 schema 並用 throwaway 測試帳號跑過新使用者 3 日審閱流程、Review 中途版本更新不影響已綁定版本、一般版本更新不觸發重新接受、`requires_reacceptance=true` 觸發既有會員重新接受（無 3 日等待）、並發 race condition、Historical Content 正確對應舊版本內容等情境；過程中發現並修正 `agree_to_contract()` 的 `UPDATE ... RETURNING` 邏輯錯誤，修正後重新驗證通過；測試資料已全數清理，TEST 專案已回復乾淨狀態
- `npm run lint`／`npm run build` 皆通過
- **Git checkpoint**：`e01fd57` — "Implement contract review and acceptance flow"，**已成功 push 到 `origin/main`**
- **Step 4 已完成**

### Payment Rebuild — Step 5（Payment Core / Provider Adapter）
- **Payment Core Implementation 已完成**：`orders`／`service_periods` 兩張表＋ RLS（`schema_payment_core.sql`）、四個 trusted RPC（`apply_order_payment()`／`mark_payment_failed()`／`retry_order_payment()`／`expire_pending_orders()`）、Edge Function `create-order-checkout`（provider-independent，驗證 Contract Acceptance 存在、server-side 價格表、Order 建立於 `pending_payment`，`provider` 欄位刻意留 NULL）與 `retry-order-payment`、Provider Adapter 型別邊界（`_shared/paymentProviderAdapter.ts`，純型別介面宣告，無 runtime 實作）
- **Git checkpoint**：`91dc8ff` — "Implement payment core and provider adapter boundary"，**已 commit + push 到 `origin/main`**
- **Provider-agnostic Architecture Validation 已完成並通過**：確認 `orders.provider` 為 nullable 純文字欄位、Core 內無任何 Oen-specific 命名／欄位／流程、`apply_order_payment()` 等 RPC 僅接受已標準化之純量參數（不接受原始 provider payload）、Core function 命名符合 provider-neutral 邊界規則。**結論：不需要進行 Payment Core 架構重構**，Step 6-10 可自然接續。
- **尚未完成**：Oen Provider Adapter 尚未實作（目前僅有型別介面）；Payment Core 的 4 個 trusted RPC 尚未在 TEST Supabase 專案做實際執行驗證（不同於 Step 4 已有完整 TEST 專案驗證紀錄）——**這是驗證工作尚待執行，不代表架構設計有缺陷**；`get_membership_status()` 尚未擴充讀取 `service_periods`（Step 8 範圍）；webhook／server-side verification 尚未接上 `apply_order_payment()`（Step 6/7 範圍）
- **Legacy Subscription 路徑**（`create-subscription-checkout`／`oen-webhook`／`subscriptions`／`subscription_checkouts`）**目前仍存在、暫不退場**，與 Payment Core 完全分開、互不相依，**不是**新 Payment Core 路徑的一部分；working tree 目前有一筆未 commit 的 Legacy 修正（Oen `/checkout-subscription` → `/checkout-schedule`），與 Step 6 是兩條獨立工作

### JOTI Business & Legal Framework
- 新建 `docs/legal/joti-business-legal-framework.md`：JOTI 法律／商業營運框架與法源索引，整理網際網路教學服務定型化契約規範、消保法審閱期間與網路交易解除權例外、公平交易法第 21 條廣告規範、YouTube Audio Library 音樂授權、商業登記法與網路交易稅務等官方法源，逐項附官方來源連結，並區分 **CURRENT／OPEN-LEGAL REVIEW／FUTURE**
- 明確定位為索引文件，**不取代**既有契約（`joti-online-teaching-contract.md`）、Payment 規格（`payment-legal-spec.md`／`payment-integration-rules.md`）或其他專門文件，只指向對應文件並記錄法律來源、適用原因與目前狀態
- **Git checkpoint**：`c26916a` — "Add JOTI business/legal framework and source index"，**已 commit，尚未 push**

### Payment Readiness Gap Analysis（ECPay / PAYUNi 金流申請準備）
- **Gap Analysis 已完成**（Discovery / Audit only，**未進行任何 Implementation**）：以既有 `docs/development/website-refinement.md`（Website Refinement Audit）與其 Cross-check 結果為 baseline，額外套用「金流平台審核」這個新判斷維度，區分哪些既有 Refinement 缺口會實際影響 ECPay/PAYUNi 審核、哪些是一般網站優化可以延後。
- **已確認的 P0 缺口**（金流申請前必須處理）：Pricing/Plan 頁面不存在；Monthly NT$333／Annual NT$3,333 尚未在網站曝光；Trial 規則、Trial 不立即扣款、取消／退款規則尚未在網站曝光；Terms／Privacy／Refund／Cancellation 尚未有任何網站路由或連結；業者／客服資訊未曝光；「訂閱會員」CTA 目前仍與「免費體驗」一樣導向 `/login`，兩者無區別（已查證 `HeroSection.jsx` 兩個 CTA 皆為 `to="/login"`）。
- **已確認**：上述法律／商業規則的**內容本身已經存在於 repo**（`payment-legal-spec.md`、`joti-online-teaching-contract.md`、`joti-privacy-policy.md`、`joti-trial-and-usage-notice.md`），缺口是「尚未透過公開網站曝光／連結」，不是規則本身未定案。
- P1（建議申請前一併處理，非必須）：W2 按鈕視覺對比度。
- 明確延後（與金流審核無直接關係，維持既有 Refinement 順序）：M5（404）、W7（Module Library 導覽入口）、N1（Header mobile 收合）、W13（text-align）、W3（CSS/dark mode 整併）、M4（Module 詳細頁美化）、PWA/manifest、其餘一般 Website Refinement 項目。
- 本次**沒有**建立 Pricing 頁、Legal route、修改 Footer 或 CTA——這些是下一個 Sprint（Implementation）才會做的事。

### Payment Readiness Implementation Sprint（Pricing / Legal / Footer / CTA）
- **Pricing／Plan**：新增 `/pricing`（`PricingPage.jsx` ＋ `data/pricing.js`）——清楚列出 Monthly NT$333／Annual NT$3,333、Trial 規則（30 天或 30 小時先到者、不立即扣款）、不自動續約／無需取消訂閱、退款摘要＋連結；內容皆轉錄自 `payment-legal-spec.md`／`joti-online-teaching-contract.md`／`joti-trial-and-usage-notice.md` 既有已確認規則，未新增任何商業規則
- **Legal 曝光**：新增 `/legal`（Hub，`LegalHubPage.jsx`）＋ `/legal/:doc`（`LegalPage.jsx`，`doc` ∈ terms／privacy／refund／cancellation）。Terms／Privacy 渲染 `docs/legal/` 內對應文件全文；Refund／Cancellation 沒有獨立來源文件，改由新增的 `utils/legalDocuments.js`（`extractContractSection()`）直接從 `joti-online-teaching-contract.md` 擷取「第十一條 提前終止與退款」／「第九條 服務期間屆滿與續購」條文全文顯示，避免另外手寫摘要造成與契約文字不一致；已用實際擷取結果核對兩段文字皆在下一條「## 」標題前正確截斷
- **Content pipeline**：沿用既有 `react-markdown`；新增 `remark-gfm` 依賴（`frontend/package.json`）以正確渲染 `joti-privacy-policy.md`／契約內的 Markdown 表格（原本會顯示成裸露的 `| a | b |` 文字）。**順帶發現但本次未處理**：`ContractReviewPage.jsx`（Step 4，/contract-review）與其 `contractContent.js` 管線有相同的表格渲染缺口（`v1.0.md` 內也有表格），因與本 Sprint 無關，維持原狀，留待日後處理
- **Footer／業者資訊**：新增 `data/business.js`（姓名／個人經營者／客服信箱／客服電話，逐字取自 `joti-online-teaching-contract.md` 第一條），`Footer.jsx` 新增四個 Legal 頁連結與業者聯絡資訊區塊
- **CTA**：`HeroSection.jsx`／`FinalCtaSection.jsx` 的「訂閱會員」改為導向 `/pricing`（原為 `/login`，與「免費體驗」完全相同）；「免費體驗」維持 `/login` 不變。`Header.jsx` 新增「方案」導覽連結（供一般瀏覽與金流審核人員直接找到 Pricing 頁，不只依賴 CTA）
- **視覺（W2，P1，本次順帶處理）**：`.button`／`.button.secondary` 對比度調整（更飽和的金色主色＋粗體、更明確區隔的次要色），純色彩調整、無 box model／padding 變動，全站沿用 `.button` 的既有按鈕（Hero、Practice Player、Builder 等）同步受益，未做全站 CSS 重構
- **範圍排除（依 Sprint 指示，確認未觸碰）**：Warm Up Modules、既有課程內容、Oen 正式付款串接、ECPay/PAYUNi API 串接、Vercel／Domain／DNS、PWA、Module 詳細頁美化、404/loading/error（P2）、全站 CSS 重構——皆未變更
- `npm run lint`／`npm run build` 皆通過；已於本機 dev server 逐頁檢視 `/pricing`、`/legal`、`/legal/terms`、`/legal/privacy`、`/legal/refund`、`/legal/cancellation`、首頁 CTA、Header、Footer 連結與 `/modules`（既有頁面回歸檢查），無 console error
- **未 commit／未 push**（依指示，等待使用者另行確認）

### Legal / Contract Publication Refinement（Discovery ＋ Implementation）
- **Discovery**：盤點 `joti-online-teaching-contract.md`／`v1.0.md`／`joti-privacy-policy.md`／`joti-trial-and-usage-notice.md` 四份會員可見文件的文件角色、draft/final 狀態；確認 `v1.0.md` 與 live 契約逐字一致；**發現公開 JS bundle 意外打包了 `docs/legal/README.md`／`joti-business-legal-framework.md` 全文**（內部治理文件，含對 Claude Code / Luckster AI Agent 的指示與法律研究筆記），因 `legalDocuments.js` 原本用資料夾層級 glob（`docs/legal/*.md`）；同時發現公開契約頁面直接暴露 repo 內部路徑與壞連結（如 `docs/legal/README.md`、`./joti-privacy-policy.md` 相對連結）
- **Implementation**：四份文件的「草案，尚未經法律專業人士審閱」聲明（含契約標題本身的「（草案）」）全部移除，改為「文件版本：v1」定位，符合 `project-status.md` 已確認之 Pre-launch／v1 治理狀態；`legalDocuments.js` 改為明確檔名白名單（排除 README.md／business-legal-framework.md），已重新 build 並核對 bundle 確認內部文件內容不再被打包；契約與隱私政策內的內部路徑交叉引用改為站內連結（`/legal/privacy`、`/legal/terms`）；`v1.0.md` 地址同步為「臺北市松山區吉祥路55之1號7樓」（與 live 契約一致）；`ContractReviewPage.jsx` 補上 `remark-gfm`（修正 Markdown 表格裸露渲染缺口，呼應上方 Sprint 已知但未處理的問題）；`joti-business-legal-framework.md` §2 地址狀態由「CURRENT／待最終確認」改為「CONFIRMED」；隱私政策 2 處「⚠️ 待確認」（Cookie 技術細節、交易資料保存期間）正式定案為既定文字
- `npm run lint`／`npm run build` 皆通過；未 commit／未 push

### Production Publication Readiness Audit ＋ Polish
- **Audit 發現**：`index.html` 的 `<html lang="en">` 語系錯誤（應為 `zh-TW`）、`<title>frontend</title>` 為 Vite 預設值、無 `meta description`／Open Graph 標籤（社群分享會顯示空白預覽）、完全沒有 404 頁（未匹配路徑渲染成空白 `<main>`）、`.cards`／`.card` 手機版面溢出（原 Website Refinement Audit M6，重新確認仍未修）、Hero／About 5 張 PNG 圖片共約 9.9MB 未壓縮；另外重新核對舊版 `website-refinement.md` 發現其中兩項（M1 Module Library 樣式、M4 Module 詳細頁內部 metadata 外洩）其實已在更早的工作中修好，該文件本身已過時
- **Polish Implementation**：`lang="zh-TW"`、`<title>JOTI Kundalini ABC Yoga</title>`、補 `meta description` 與 Open Graph／Twitter Card（`og:image` 用相對路徑，未因最終網域未定而自行填入 Vercel 網址）；新增 `NotFoundPage.jsx` ＋ catch-all route；`.cards`／`.foundation-page .cards` 補 `1024px`／`640px` 手機斷點；5 張圖片 PNG→WebP（quality 82，總大小降至約 530KB，降幅 94.6%），並產出 `public/og-image.jpg` 社群分享圖；順手清理 Trial Notice 內一處裸露的 `.md` 內部連結
- `npm run lint`／`npm run build` 皆通過；未 commit／未 push

### Vercel Deployment Architecture（Monorepo 修正）
- **Discovery 發現根因**：Vercel Project `joti` 的 Root Directory 原設定為 `.`（未正確反映 monorepo 結構），且**此專案從未接過 Git Integration**（一直是 CLI 手動 `vercel deploy`）；因為每次部署都是從 `frontend/` 子目錄執行，CLI 只會上傳 `frontend/` 本身的內容，repo 根目錄的 `docs/legal/` 完全沒有進入 build context，導致 `import.meta.glob('../../../docs/legal/...')` 在 Vercel 上找不到任何檔案——這正是「Legal / Contract Review 頁面顯示『目前無法載入內容』」的根因，已用 `vercel curl` 直接下載線上部署的 bundle 逐字核對確認
- **Fix**：Vercel Project Root Directory 改為 `frontend`；往後一律從 **repo root**（`C:\Luckster-core`）執行 `vercel deploy`（已驗證新部署「Downloading 439 deployment files」，確認 `docs/` 有進入 build context）；此設定為 Project 層級，Preview 與 Production 共用同一套規則
- 已產出多個新 Preview 供實機驗收（最新：`https://joti-dow6az9bp-jotiyoga.vercel.app`），皆為 Preview，未部署 Production

### Mobile Legal / Contract RWD Fix
- **Diagnosis**：契約內原本用 fenced code block（```）呈現的流程圖與計算公式，渲染成 `<pre>`，瀏覽器預設 `white-space: pre` 不換行；實測在 342px（iPhone 可用寬度）下，這些區塊的真實內容需要 419～502px，撐破整頁造成水平溢出、文字被截斷
- **Fix**：`.legal-content pre`／`.contract-review-content pre` 補 `white-space: pre-wrap` + `overflow-wrap: break-word` + `overflow-x: auto`；`ContractReviewPage.jsx` 新增 `.contract-review-content` wrapper 讓 `/contract-review`（`.auth-page` scope，與公開 `/legal` 頁不同）套用同一條規則；已用「強制容器寬度至 342px 量測 scrollWidth」方式驗證桌面與模擬手機寬度皆無溢出
- `npm run lint`／`npm run build` 皆通過；未 commit／未 push

### Contract Terminology & Readability Cleanup
- **Text Audit 發現**：契約與隱私政策混入系統欄位名稱／工程事件名稱——`contract_version`、`contract_presented_at`、`contract_review_available_at`、`contract_acceptance_at`、`trial_start`、`review_completed`（契約）；`trial_started_at`、`module_usage_seconds`、`marketing_consent`／`marketing_consent_at`（隱私政策）——逐一核對 `supabase/schema*.sql` 確認何者為真實 DB 欄位、何者僅為 `payment-legal-spec.md` 的概念性命名
- **Implementation**：以上 10 項全部改為自然中文（如「契約版本」「基本契約成立時點」），`v1.0.md` 同步；隱私政策未動（依指示範圍限定）
- **Terminology Consistency Audit**：完整掃描契約全文中英文混用情況——`Membership Service Basic Agreement`／`Service Period`／`Order`／`Purchase Intent`／`Purchase Confirmation`／`Payment Authorization` 多處重複加註英文；Foundation／Module／Practice 三者呈現方式不一致（且網站本身 Header/Module Library/Practice Hub 對這三者的呈現也彼此不一致，非契約獨有問題）；`foreground`／`background`／`minimized`／`sleep`／`paused`／`buffering / stalled` 等技術狀態詞（`joti-trial-and-usage-notice.md` 已有現成純中文寫法可沿用）；`calendar days`／`checkbox`／`Day 0`／`no auto-renewal`／`login days`／`video watch time`／`lesson completion`／`UI` 等冗餘英文；`Monthly`／`Annual` 加註與附件一純中文寫法不一致；「三日」／「3 日」數字格式不一致（全文其餘數字皆用阿拉伯數字，「三日」才是例外）
- **Implementation（2 輪）**：正式法律／商業術語改為「僅於全文最早定義處保留英文，後續統一中文」；Foundation／Module／Practice 統一為「英文固定名稱＋通用中文名詞」（不加中文括號翻譯，不自創新譯名）；技術狀態詞全部改為自然中文；冗餘英文全數移除；`Monthly`／`Annual` 統一為純中文；「三日」統一為「3 日」（改採全文既有的阿拉伯數字慣例）；3 個計算式（審閱期公式、月／年方案退款公式）由 code block 改為一般段落；第八條購買流程圖由 code block 改為 Markdown 編號列表——**契約全文現已完全沒有 `<pre>`／code block**
- 每一步修改皆同步套用到 `joti-online-teaching-contract.md` 與 `v1.0.md`，並用 `diff` 逐次確認兩份文件逐字一致；`npm run lint`／`npm run build` 皆通過；未 commit／未 push

### JOTI Legal / Business Model v1（法律／商業付款規則）
- **架構模型確立**：Membership Service Basic Agreement（會員服務基本契約）＋ Service Period（付費服務期間）兩層模型——基本契約持續存在，月／年方案是其下購買的付費服務期間，不再視每次付款為獨立固定期限契約
- **Trial**：30 個日曆日或累計 30 小時有效使用時間，以先達成者為準（規則不變，僅重新整理進正式文件）
- **Trial 與 Contract Review 分離**：兩者為獨立計時，可互相重疊，不得合併或互相取代
- **Contract Review**：至少 3 個日曆日之契約審閱期間
- **`review_completed` ≠ `purchase_confirmed`**：完成契約審閱僅代表具備同意契約之資格，不代表已決定購買
- **`purchase_confirmation` ≠ `payment_authorization`**：確認購買與付款方式授權為兩個獨立、明確之意思表示
- **審閱期結束不自動購買、不自動扣款**
- **【已確認】同一份仍然有效存續之基本契約下，會員主動購買新的 Service Period（續購），不重新啟動完整 3 日基本契約審閱期**（僅基本契約已終止需重新加入、或契約條款發生重大變更兩種情形例外）
- **基本契約終止（連續 12 個月無有效 Service Period → 通知 → 至少 15 日處理機會 → 終止）後，會員重新加入視為重新成立新的基本契約，須重新進入契約審閱程序**
- **不採自動續約**：Service Period 到期不自動扣款、不自動建立下一期
- **已確認產品流程**：Trial → 主動購買（Purchase Intent/Confirmation）→ Payment Authorization（可先綁卡不立即扣款）→ Trial 條件成就 → 執行一次性扣款 → Order 完成 → Service Period 啟用
- **文件產出**（`docs/legal/`、`docs/business/payment/`）：
  - `docs/legal/joti-online-teaching-contract.md`：完成重寫（Basic Agreement + Service Period 模型）
  - `docs/legal/joti-trial-and-usage-notice.md`：新建立
  - `docs/legal/joti-privacy-policy.md`：新建立
  - `docs/legal/README.md`：完成更新
  - `docs/business/payment/payment-legal-spec.md`：完成更新
  - `docs/business/payment/payment-integration-rules.md`：完成更新
  - `docs/business/payment/README.md`：完成更新

---

## In Progress

- **新增 3 個 Warm Up Module**（`MW005` 脊椎彎曲熱身、`MW006` 脊椎扭轉熱身、`MW007` 貓牛式熱身）：`.md` 內容（Summary / Description / Learning Outcomes / Tags / Prerequisites）已撰寫，**尚未上傳 Bunny 影片**（`.md` 的 `Primary Video URL` 是空的），**尚未加入 `data/modules.js`**，未 commit。
- **Payment Backend 固定 IP proxy 技術驗證**：Discovery 已完成並提出建議方案，**尚未開始實際驗證**（需先選定供應商、申請試用帳號）。
- **登入導向 localhost 問題**：根因診斷已完成（用 `supabase config diff` 直接核對遠端 Supabase 專案設定確認，非猜測）——Supabase Auth 的 `site_url` 仍是本機開發殘留值 `http://localhost:4190`，`additional_redirect_urls` 只涵蓋 Vercel 改名前的舊網址格式，完全沒涵蓋改名後的新格式或目前實際的 Production 別名；已在 Preview 上實際重現（點擊登入後導向 `localhost:4190` 並出現 `ERR_CONNECTION_REFUSED`），確認不是程式碼問題（`AuthProvider.jsx` 的 `redirectTo` 動態計算正確）。**修正尚未執行**——需要到 Supabase Dashboard 手動更新 `Site URL`／`Redirect URLs`，不在 repo／CLI 範圍內。Production 很可能有同樣問題，尚未實際重現驗證。
  - **2026-10-01 更新——已從推論提升為可重現、有第一手證據的問題**：Payment Rebuild Step 6 TEST Runtime Verification 過程中，用授權的 TEST 帳號（`luckster.ai.workspace+trial2@gmail.com`）實際完成 Magic Link 登入，**核對了兩封不同時間（下午 6:24、下午 6:30）由 `supabase.auth.signInWithOtp()` 寄出的信件**：即使呼叫時明確指定 `emailRedirectTo: http://localhost:5173/auth/callback`，**兩封信實際產生的 Magic Link，`redirect_to` 參數都是 `http://localhost:4190`**，不是只在 Preview 環境、也不是只在點擊後才出現的現象，而是連結本身在寄出當下就已經是錯的。驗證當下為了讓 session 能成功建立，**手動把 `redirect_to` 改成 `http://localhost:5173/auth/callback` 後直接呼叫 `/auth/v1/verify`**，確認可以取得有效 session（回傳的 `sb-auth-user-id` 與該帳號相符）——**這個手動替換只是為了驗證 Step 6，不是修正，Supabase Auth 設定本身完全未被更動**。
- **Payment Rebuild — Step 6（Oen One-time Checkout）TEST Runtime Verification — 主要 Checkout / Payment Flow 已完成**：`create-order-checkout`／`retry-order-payment` 已部署到 TEST Supabase 專案（`ngznngqmbhxejkjbqomh`）並實際驗證成功。過程中發現 Oen `/checkout` 實際要求 `productDetails`（TEST API 回傳 `{"code":"V0001","message":"must have required property 'productDetails'"}`），`_shared/oen.ts` 的 `createOneTimeCheckout()` 已依此實測結果修正（欄位結構比照已驗證可用的 `createSubscriptionCheckout()`），修正後重新部署並重測成功。**已實測確認成功**：Order 正確建立、`orders.provider`（`oen`）與 `provider_checkout_ref` 正確寫入、`redirectUrl` 正確導向 Oen TEST hosted checkout（頁面顯示金額／商品內容與送出的 `productDetails` 完全相符）、用 Oen TEST 卡號完成一次測試付款並成功跳轉回 `/checkout/return?result=success`。
  - **尚未完成、留給 Step 7**：付款完成後 `orders.status` 仍是 `pending_payment`（正確、預期行為——目前沒有任何東西會呼叫 `apply_order_payment()`，這屬於 server-side webhook／payment verification，是 Step 7 的範圍，不是 Step 6 失敗）；查核 `payment_events` 確認**這次一次性付款沒有收到任何 Oen webhook 事件**（現有 `oen-webhook` 只處理訂閱事件，一次性付款的 webhook 收不到或未串接，待 Step 7 查證）；因此 server-side transaction lookup 目前也還沒有管道可以做。`CheckoutReturnPage.jsx` 顯示的 `result=success` 目前只是 Oen 的前端導向結果，**不是** server-side 驗證過的付款結果，程式碼註解已明確標示這點。
  - **環境備註（非 Step 6 失敗，是後續環境整理事項）**：TEST 專案的 `SITE_URL` secret 目前指向既有的 `frontend-oen-test.vercel.app` 部署（非 localhost），該部署沒有這次新增的 `/checkout/return` 路由，所以付款完成跳轉回去的頁面目前是空白的。

---

## Next Steps

1. **修正 Supabase Auth 的 `Site URL`／`Redirect URLs`（目前唯一會阻塞金流申請的問題）**：需要到 Supabase Dashboard（Authentication → URL Configuration）手動更新，把過期的 `localhost:4190` 與 Vercel 改名前的舊網址格式，換成目前實際使用中的 Production 別名與 Preview 萬用字元（`joti-*-jotiyoga.vercel.app`）。這是外部服務設定，不在 repo／CLI 範圍內，需要使用者或有權限的人親自操作。
2. **大批累積工作的 Git checkpoint**：本文件所述 Payment Readiness Implementation Sprint 之後的所有工作（Legal/Contract Publication Refinement、Production Publication Polish、Mobile RWD Fix、Contract Terminology Cleanup 等）**全部尚未 commit／push**，待使用者 Review 後指示建立 Git checkpoint（範圍涵蓋多輪工作，commit 時注意 `docs/legal/versions/v1.0.md` 與 `joti-online-teaching-contract.md` 需一起進、保持逐字一致）。
3. **Vercel Production 正式部署**：待第 1、2 項完成後，用已確認正確的部署方式（repo root、Root Directory=`frontend`）部署到 Production，取代目前落後的 Production 內容。
4. **ECPay（綠界）／PAYUNi 申請進度**：Oen 已通過相關申請／審核。ECPay 與 PAYUNi 目前正在申請中，現階段皆為候選平台，將依整合便利性、費用、操作方式及實際測試結果比較後，決定最終採用之金流平台；**最終平台尚未決定**，不視 ECPay 或 PAYUNi 為已確定採用之平台。
5. **Payment Rebuild — Step 7（Webhook + Server-side Verification）**：Step 6（Oen One-time Checkout）的主要 Checkout / Payment Flow（Order 建立 → Oen `/checkout` → TEST 付款 → 導回）已在 TEST 環境實測成功（見上方「In Progress」小節），**不代表最終選定 Oen**——ECPay／PAYUNi 仍在申請審核中，最終平台尚未決定。下一步：查明 Oen 一次性付款的 webhook 為何沒有送達現有 `oen-webhook`，並建立／擴充能呼叫 `apply_order_payment()` 的 server-side 驗證路徑，讓 Order 能從 `pending_payment` 正確轉為 `paid`。Step 8（Membership / Entitlement）／Step 9（Refund / Cancellation / Edge Cases）／Step 10（Production Readiness）維持原順序，尚未開始。
6. 補完 3 個新 Warm Up Module：上傳 Bunny 影片、填入 `.md` 的 `Primary Video URL`、加入 `modules.js`、跑 `validate:module-video` + `:audit`、commit。
7. 決定測試用訂閱 `S2026091055MVCVI8` 要不要現在取消，還是留著拿來測 T-3（續扣 / 取消 / 續扣失敗）。
8. 固定 IP proxy 技術驗證（PoC）：選定供應商（建議 QuotaGuard）、申請試用、驗證 Supabase Edge Function 可透過 `Deno.createHttpClient` 走固定 IP。

---

## Blockers

- **Supabase Auth `Site URL`／`Redirect URLs` 過期**：目前會導致任何環境（Preview 或 Production）點擊登入都被導向 `localhost:4190` 並失敗。需要使用者本人到 Supabase Dashboard 手動更新，AI 無法代為修改外部服務設定。這是目前唯一會直接阻塞「會員實際完成登入」的問題，詳見上方「登入導向 localhost 問題」小節。**2026-10-01 已有第一手重現證據**（見同小節）：即使 `emailRedirectTo` 明確指定正確網址，TEST 專案實際寄出的 Magic Link，`redirect_to` 仍是 `localhost:4190`，不再只是根因推論。
- **固定 IP proxy PoC** 需要建立第三方服務帳號（含免費試用），此步驟需使用者本人操作，AI 無法代為建立帳號或輸入付款資訊。
- **新 Warm Up Module** 需要先把來源影片上傳到 Bunny 才能繼續（非程式碼工作，需人工操作 Bunny Dashboard）。
- Production Vercel 部署與目前 `main` 分支程式碼是否同步：**根因已找到**（見上方「Vercel Deployment Architecture」小節，過去 CLI 部署方式不會帶到 `docs/`），但實際 Production 尚未用正確方式重新部署，目前 Production 內容仍是落後版本。

## Open Questions（法律／商業模型，待決）

- 契約條款發生重大變更時，審閱／通知程序具體如何處理（是否需要新的審閱期、期間多長）——待法律顧問或經營者確認。
- Payment Authorization 具體採用哪一個 Oen API 端點／參數組合實現「先綁卡、僅扣款一次」，且如何技術上保證不會變成持續扣款——工程決策，未決定。
- 會員如何實際取消 Service Period（網站自助按鈕 vs 聯繫客服辦理）——未定義。
- 退款金流實際執行方式（呼叫 Oen 退款 API 原路退回 vs 人工處理）——未定義。

---

## Last Updated

2026-10-01
