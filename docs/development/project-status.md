# JOTI Project Status

## Purpose

本文件是 Luckster / JOTI 專案進度的**單一真實來源（Single Source of Truth）**。內容依實際 repo 檔案、Git 狀態與既有文件整理，不包含尚未開始或推測性的工作。每次重大進度變化後應更新本文件。

**追蹤規則（2026-10-19 起為固定流程）**：

1. 本文件是 JOTI 專案進度、未完成事項與決策狀態的**單一追蹤來源**。
2. Discovery、Implementation、Testing／Regression 中發現、但當輪未處理完成的事項，不得只留在 Claude 回報或對話中，必須在**當輪結束前**分類寫入本文件。
3. 固定使用以下分類：
   - **TODO**：已確定需要修改，但尚未安排／完成
   - **Future Decision**：需要未來做商業、法律、產品或技術決策；決策完成前不得自行假設（一併列入「Open Questions」）
   - **External / Pending**：等待外部條件、第三方、正式環境、帳號、核准或其他前置條件
   - **Pending（驗證）**：實作已完成或已有合理依據，但尚未完成指定的 TEST／Preview／Production 驗證；**不得**寫成 legacy issue 或 bug
4. 事項已存在時更新原條目，不建立重複項目；本輪新發現事項若已有對應 Open Question／Next Step，更新既有項目，不另建第二份追蹤；不另建其他追蹤系統。
5. 每輪完成後，將「已完成／PASS」與「待後續」同步到對應小節及 Current Phase、Next Steps、Open Questions 等既有區段，使全文前後一致。
6. 已 PASS 的事項不再列為未完成；仍有未驗證的特殊路徑時，拆成獨立的 Pending（驗證）項目。
7. Future Decision 不得由實作人員自行決定或默認，保留至正式決策。
8. 不因當輪未處理某事項就將其描述為 bug，依實際狀態分類。
9. 任何後續工作開始前，先以本文件判斷該事項目前是已完成、Pending（驗證）、TODO、Future Decision 或 External／Pending，避免重複工作或遺漏。

---

## Current Phase

**核心學習系統（Foundation / Module / Practice / Auth / Membership）已完成並上線。**

**JOTI Legal / Business Model v1（Membership Service Basic Agreement + Service Period）已確立並整理成文件。**

目前重心：

1. **Payment Readiness / Pre-submission preparation**——金流平台現況：**2026-10-19 已確定正式採用綠界科技 ECPay**（購買當下付款、不先綁卡；目前不提供方案變更，見「Step 11 — 付款模式與方案變更規則落實」）；ECPay 正式特店審核與正式金鑰尚待完成；PAYUNi 不採用（申請是否撤回待決定）；Oen 相關程式保留為歷史／相容性實作。以下為網站審核準備工作：Gap Analysis、Implementation Sprint（Pricing/Legal/Footer/CTA）、Legal/Contract Publication Refinement（Discovery＋Implementation）、Production Publication Readiness Audit＋Polish、Vercel Deployment Architecture 修正、Mobile Legal/Contract RWD 修正、Contract Terminology Consistency（Audit＋2 輪 Implementation）**皆已完成**。**已知阻塞項**：TEST Supabase 專案 Auth 的 `Site URL`／`Redirect URLs` 設定過期，目前連到 TEST 專案的環境點擊登入都會被導向 `localhost:4190` 並出現 `ERR_CONNECTION_REFUSED`——根因已診斷確認，**修正需要到 Supabase Dashboard 手動操作**，尚未執行；Production 將使用獨立新專案，另行設定（見 Next Steps、Blockers）。這一整批工作已於 `f22f412` commit 並 push。
2. **Payment Rebuild — 第 1–9 階段已完成**：Step 5（Payment Core / Provider Adapter）、Step 6（Oen One-time Checkout）、Step 7（Webhook + Server-side Verification）、Step 8（Membership / Entitlement）、Step 9（Refund / Cancellation / Edge Cases）皆已完成並在 TEST Supabase 專案實測成功（含真實呼叫 Oen TEST 退款 API，詳見下方對應小節）。**Oen one-time 付款＋提前終止退款的完整鏈路（Order 建立 → 付款 → webhook → server-side re-query 驗證 → `apply_order_payment()` → Service Period 建立 → 會員主動提前終止 → `apply_service_period_early_termination()` → Oen 退款 API → `refunded`）已端到端驗證通過，不代表最終選定 Oen**——2026-10-19 已確定正式採用 ECPay。另已完成 ECPay／PAYUNi 與現有 Provider Adapter 架構之 Compatibility Check，**確認兩者皆未發現需要修改 Payment Core 的架構阻塞**（詳見下方「Provider Compatibility Check」小節）。`get_membership_status()` 與前端 `getMembershipStatus()` 現在會讀取 `service_periods`，付費存取狀態不再只依賴 Legacy 的 `subscription_status`；「方案變更（Plan Change）」的完整 Discovery／Design／契約與 `payment-legal-spec.md` 文字實作已完成，**Plan Change 自己的協調流程與前端（Step 10）亦已完成並在 TEST Supabase 專案實測成功**（Eligibility Gate、After-Expiry 排程、Immediate Change 協調、Overlap 防護回歸驗證，詳見下方對應小節）。**Step 11（Production Readiness）已開始**：11.1 Renewal Purchase Entry、11.2 Refund Failure UI 已完成並經 TEST 驗證（已 commit／push）；TEST Auth（Email + Password + Google、移除 Magic Link）已完成並經 TEST 驗證（`2acade2`，已 push）；Production 基礎設施 Discovery（Supabase Organization／方案／Region、Free 閒置暫停與 health check、Auth 登入方式）已完成並確立決策，**Production 環境建置進行中**：Production Supabase Project、Database Schema、4 個官方 Practices 匯入、Health Check（GitHub Actions keep-alive）、**Production Auth（Email + Password + Google，Resend SMTP／`auth.joti.yoga`）已完成並經 E2E 驗證（2026-10-15）**（見下方「Step 11 — Production Readiness Discovery」「Step 11 — Production Environment Build」「Step 11 — Production Auth 完成」小節）。**ECPay TEST 整合已完成並端到端驗證通過**（AIO formPost checkout → `ecpay-webhook` → QueryTradeInfo 回查 → `apply_order_payment()` → Service Period → 會員開通，詳見下方「ECPay Integration」小節）；退款程式已實作但尚未完成正式環境驗證；**2026-10-19 已確定正式採用 ECPay**。**2026-10-19 ECPay LIVE mode 程式支援已完成並部署 TEST，TEST 回歸 PASS**（Production 尚未部署／未切換 LIVE，見「Step 11 — ECPay LIVE mode Implementation」）。
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
- 目前尚未有會員 acceptance，因此 v1 尚未產生正式 acceptance history。**TEST Supabase 專案中的 `contract_acceptances` 測試資料（Payment Rebuild Step 6/7 驗證過程中由測試帳號產生）為測試資料，不是正式會員 acceptance，不影響本節結論或版本政策。**
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

- JOTI 正式網站網域**已確定為 `joti.yoga`**（2026-10-12 Production Readiness Discovery 確認）。
- **尚未綁定**：依決策，待 Production 環境（Supabase Production 專案、Auth、SMTP、health check 等）準備完成後才綁定 `joti.yoga`；在此之前不設定 DNS／Vercel／Supabase 網域。
- 因此目前仍不能把 Vercel deployment URL 當成最終正式網站網址。
- 法律文件中的 `[待填寫]`（網站欄位）目前仍存在，**原因是正式網域尚未綁定上線**，不是因為合約仍處於法律草案狀態；何時填入 `joti.yoga`（綁定前或綁定後）尚未決定。

---

## Completed

### 核心學習系統
- Foundation Library（30 個 Lesson）、Module Library（22 個 Module）、Practice Hub、Practice Player（含 Resume / Progress，Phase 5E）
- Practice Builder：Custom（`/practice/build`）與 Admin Official（`/admin/practices`）共用同一套組課元件與驗證邏輯
- Auth / Membership：Google / Email + Password 登入（2026-10-13 起取代 Magic Link，TEST 已驗證；Production Auth 已於 2026-10-15 完成並經 E2E 驗證，見「Step 11 — TEST Auth：Email + Password」與「Step 11 — Production Auth 完成」）、Trial（30 天或 30 影片小時，先到者結束）、Admin / Subscriber / Trial / Trial Expired 四種狀態、entitlement gating（訪客與過期試用僅 10 秒試看）

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

### Payment Rebuild — Step 6（Oen One-time Checkout）
- **Implementation 已完成**：`create-order-checkout`／`retry-order-payment` 已部署到 TEST Supabase 專案（`ngznngqmbhxejkjbqomh`）並實際驗證成功；`_shared/oen.ts` 的 `createOneTimeCheckout()` 依 TEST API 實測結果（`/checkout` 實際要求 `productDetails`）修正後重新部署
- **已實測確認成功**：Order 正確建立、`orders.provider`（`oen`）與 `provider_checkout_ref` 正確寫入、`redirectUrl` 正確導向 Oen TEST hosted checkout、用 Oen TEST 卡號完成測試付款並成功跳轉回 `/checkout/return?result=success`
- **原本待 Step 7 解決的缺口（付款完成後 `orders.status` 仍是 `pending_payment`、一次性付款的 webhook 未串接）已在 Step 7 完整解決**，見下方
- **環境備註**：TEST 專案的 `SITE_URL` secret 已於 2026-10-12 改為目前的 Preview `https://joti-u9os97gw1-jotiyoga.vercel.app`（含 `/checkout/return` 新流程），見「ECPay Checkout Session Flow」小節
- **Step 6 已完成**

### Payment Rebuild — Step 7（Webhook + Server-side Verification）
- **Implementation 已完成**：`supabase/functions/oen-webhook/index.ts` 新增 `action === "onetime"` 分支，與既有 `action === "subscription"`（Legacy）分支並存，彼此不共用資料表或 RPC；新分支呼叫既有、Step 5 建立至今首次被實際呼叫的 `apply_order_payment()`／`mark_payment_failed()`，對一次性付款做 mandatory server-side re-query（`getTransaction()`）後才授予權益，不信任 webhook payload 本身
- **TEST 環境端到端驗證完成**：全新 Order 走完整流程——Oen TEST 付款成功 → webhook 送達並進入 onetime 分支 → re-query 驗證通過 → `orders.status` 轉為 `paid` → `service_periods` 正確建立（期間長度與方案相符）；`payment_events.order_id`／`verification_status` 正確記錄
- **Duplicate webhook idempotency 已驗證**：重送同一筆真實 payload，正確回傳 `{"duplicate":true}`，未產生第二筆 `service_periods` 或重複入帳
- **付款失敗路徑已驗證**：新 Order 以 Oen TEST 失敗卡付款，webhook 正確觸發 `mark_payment_failed()`，`orders.status` 轉為 `payment_failed`，無 `service_periods` 建立
- **Oen 行為驗證（支撐 webhook 設計決策）**：以全新 TEST checkout 確認一次性付款失敗後，該 checkout session 立即終止、無法在同一頁面換卡重試，若要重新付款必須由 JOTI 建立新的 checkout／payment attempt——確認「`status==="failed"` 可直接視為終局並呼叫 `mark_payment_failed()`」之設計安全，不存在「標記失敗後又收到遲到的成功事件」之競態風險
- **既有 Legacy subscription webhook 分支已確認零異動**：以 `git diff` 核對，該分支僅縮排變化，無任何邏輯修改；`subscription_checkouts`／`apply_oen_subscription_charge()` 完全未被觸碰
- **Git checkpoint**：`8100642` — "Implement Oen one-time webhook verification"，**已 commit + push 到 `origin/main`**
- **Step 7 已完成**

### Provider Compatibility Check（PayUNi／ECPay，Discovery only）
- **PayUNi**：已研讀官方文件（`docs.payuni.com.tw`），確認其一次性付款（整合式支付頁 UPP）、webhook（NotifyURL 逐筆隨 request 帶入，非 Oen 式全域單一設定）、交易查詢 API 皆可在不修改 Payment Core／`PaymentProviderAdapter` 介面的前提下實作對應 Adapter；PayUNi 採 AES-256-GCM 加密＋SHA256 簽章（HashKey/HashIV）的 Form POST 模式，比 Oen 複雜，但複雜度完全侷限於未來 Adapter 內部，不影響 Core 邊界。**尚缺**：`EncryptInfo` 完整欄位 schema、PAYUNi SDK 實際內容、TEST 環境金鑰與測試卡、實際 webhook payload 範例——這些在 PayUNi 真正獲選前不需要補齊
- **ECPay**：已研讀官方文件（`developers.ecpay.com.tw`），確認全方位金流付款（AIO）屬 Hosted Redirect 模式，與目前 Oen 整合方向一致；具備訂單查詢 API（`QueryTradeInfo`），官方文件本身即建議搭配 webhook 做 server-side 二次驗證，與 Core 既有「mandatory re-query」設計理念相符。**發現一個 Adapter 層級（非 Core）的結構差異**：ECPay 的付款啟動是前端表單直接 POST 到 ECPay（無「建立 checkout 取得 ID」的 server-to-server 步驟），未來 Adapter 需要多一個中介頁面產生 `redirectUrl`，但 `PaymentProviderAdapter` 介面本身不需要修改。**「站內付」一詞在已讀取的官方文件頁面中完全沒有出現**，為明確的文件缺口，待確認其確切來源後再補查
- **結論**：兩者皆未發現需要修改 Payment Core／`PaymentProviderAdapter` 介面的架構阻塞，進一步驗證 Step 5 Core 設計的 provider-agnostic 邊界成立，不只對 Oen 適用
- **後續窄範圍 Boundary Check 已重新確認同一結論**：逐一核對 `PaymentProviderAdapter`／`StartCheckoutResult`／`oenAdapter.ts`／`oen-webhook` server-side verification／Order-Adapter 交界，確認 `redirectUrl` 可由 Adapter 自行產生 JOTI bridge URL 而不需修改 Core 介面；Oen 固定 outbound IP／allowlist 維持在 Provider／infrastructure 層（`order-schema-proposal.md` Decision 11），未進入 Core domain；**沒有發現需要修改 Payment Core、Order schema 或既有 RPC 的實際 incompatibility**

### Payment Rebuild — Step 8（Membership / Entitlement）
- **Implementation 已完成**：`get_membership_status()`（SQL）新增於新檔案 `supabase/schema_membership_entitlement.sql`（additive CREATE OR REPLACE，比照 `schema_subscriptions.sql` 當初疊加 `schema.sql` 的既有慣例，未修改 `schema_subscriptions.sql` 本身），`frontend/src/utils/membershipStatus.js`（`getMembershipStatus()` 新增 service_periods 分支＋新增 `hasActiveServicePeriod()`／`getActivePaidServicePeriod()`／`getUpcomingServicePeriod()`）、`frontend/src/state/AuthProvider.jsx`（`loadProfile()` 併行查詢 `service_periods` 並合併為 `profile.servicePeriods`）、`frontend/src/pages/AccountPage.jsx`（新增「目前方案」／「服務期間到期日」／「下一個方案」顯示）
- **Entitlement 規則**：雙邊界 `terminated_at IS NULL AND now() >= service_period_start AND now() < service_period_end`，SQL／JS 兩邊邏輯一致；多筆 Service Period 採 EXISTS 判定，不以 latest row 判斷；future-start Service Period 不計入目前 Paid Access，但 UI 可顯示其未來開始日期
- **`getMembershipStatus(profile)` 簽章未變**：改由 `AuthProvider` 把 `service_periods` 合併進 `profile.servicePeriods`，9 個既有呼叫點（`VideoModule.jsx`／`ModulePage.jsx`／`Header.jsx` 等）零修改
- **Legacy 相容**：`profiles.subscription_status='active'` 與新的 service_periods 判定維持 OR 關係並存，皆輸出既有 `'subscriber'` 值，**未進行 Legacy 重構，未新增狀態命名**（命名 Open Question 仍未裁示，本次不自行決定）
- **TEST 環境驗證完成**：已套用到 TEST Supabase 專案；`+trial2` 帳號（`subscription_status='none'`，有一筆有效 `service_periods`）確認 `get_membership_status()` 正確回傳 `subscriber`（修正前為 `trial_expired`）；3 個無 `service_periods` 的既有帳號確認無回歸（`trial_expired`／`admin` 不變）；JS 端 11 項純函式單元驗證全數通過（EXISTS 語意、future-start 排除、`terminated_at` 排除、Legacy 相容路徑、admin 優先序）；`npm run lint`／`npm run build` 皆通過
- **Git checkpoint**：`39d6035` — "Implement membership entitlement from service periods"，**已 commit + push 到 `origin/main`**
- **Step 8 已完成（最小必要範圍）**：未擴大到 Plan Change UI／Refund／PayUNi／ECPay Adapter／到期提醒／續購導流／`retry-order-payment` UI／Legacy subscription 重構，依指示維持原樣

### Payment Rebuild — Step 9（Refund / Cancellation / Edge Cases）
- **Implementation 已完成**：新檔案 `supabase/schema_refund.sql`——`apply_order_payment()`（**DROP + CREATE**，非 CREATE OR REPLACE，理由：Postgres 以名稱＋參數型別識別函式，單純新增參數會產生第二個 overload、既有呼叫者永遠吃不到新能力，DROP+CREATE 收斂回單一函式；新增 optional 第 7 參數 `p_service_period_start`，預設 `NULL` 時行為與修改前逐位元相同）、`apply_service_period_early_termination()`（新 RPC，第十一條會員主動提前終止＋退款計算，原子操作，退款金額終止當下算好即固定、之後不重算）、`mark_refund_processed()`／`mark_refund_failed()`（新 RPC，`refund_processing` 的兩個終態轉換）、`service_periods_no_overlap`（新 EXCLUDE constraint，`btree_gist`，`where (terminated_at is null)` 確保提前終止的期間不會繼續擋住新期間）
- `_shared/oen.ts` 新增 `createRefund()`（`POST /refunds/:transactionHid`）；`_shared/oenAdapter.ts` 新增 `refundOenOrder()`（刻意不進入 `PaymentProviderAdapter` 介面，維持「不重新設計 Adapter boundary」的既定範圍）；新 Edge Function `terminate-service-period`（協調 RPC → 呼叫 Oen 真實退款 API → 依乾淨回應或網路不確定時的 `getTransaction()` re-query finalize）
- **TEST 環境驗證完成，含真實端到端**：SQL 層以 rolled-back transaction 驗證退款公式（月方案 10 天已提供服務 → 223；年方案 2 個月 5 天已提供服務 → 2612，皆與手算相符）、finalize RPC 成功/失敗兩路徑、overlap constraint 三種情境（重疊拒絕、首尾相接允許、已終止期間不擋）；**真實呼叫**已部署的 `terminate-service-period` 對既有真實付款訂單執行，實際打 Oen TEST 退款 API 成功，`orders.status` 正確轉 `refunded`、`provider_refund_ref` 正確寫入；終止後 `get_membership_status()` 正確從 `subscriber` 降回 `trial_expired`（Step 8 cross-check）；對同一期間重複呼叫正確回傳 409、未重複退款
- **回歸驗證**：`apply_order_payment()` 只傳原本 6 個參數時，`service_period_start` 與 `now()` 完全相等，月方案期間長度不變，與 Step 7 既有行為逐位元一致
- **Git checkpoint**：`82fa7ac` — "Implement Step 9 refund, cancellation, and overlap-prevention edge cases"，**已 commit + push 到 `origin/main`**（`_shared/oen.ts` 內與本次無關的既有 Legacy 修正已用 hunk 級 staging 排除，未一併 commit）
- **Step 9 已完成（本次核定範圍）**：未擴大到 Basic Agreement Termination Record、第二十條違約終止（不予退款路徑）、`refund_failed` 重試機制、Plan Change UI／技術流程、PayUNi／ECPay、Payment Adapter boundary 重新設計

### Payment Rebuild — Plan Change（方案變更）
- **Discovery／Design／Reconciliation 已完成**：確認「方案變更」本質上是既有「第十一條提前終止退款」＋「第八條正常購買」兩個既有機制的組合，不建立新的 Payment Type／Order Type／獨立制度；「立即變更」幾乎不需要 Plan Change 專屬的新技術能力（所需的是 Step 9 退款功能本來就要建的通用「提前終止＋退款記錄」能力的最小切片——**該切片已於 Step 9 完成並實測**）；「到期後開始」是唯一真正需要新技術能力的地方（讓 Service Period 可以未來生效，`apply_order_payment()` 的新 `p_service_period_start` 參數已於 Step 9 補上），且範圍很小
- **Contract / Legal Implementation 已完成**：契約新增「第九條之一　方案變更」（`joti-online-teaching-contract.md`／`v1.0.md`，逐字同步，採「之一」編號避免重新編號後續條文）；`payment-legal-spec.md` 新增對應「§7A 方案變更」。規則涵蓋：月→年可選立即變更或到期後開始、年→月僅提供到期後開始（如需立即變更沿用既有第十一條提前終止＋另行購買路徑，不另建專屬流程）、不同服務期間之實際服務期間不得重疊、新舊方案為獨立交易且退款遲延/失敗不影響已成立之新方案權益（未擴張 `refund_failed` 後續處理規則）、不重新啟動 3 日審閱期、付款前須明確告知並取得確認
- **Git checkpoint**：`a6047d3` — "Finalize plan change contract rules"，**已 commit + push 到 `origin/main`**
- **協調流程與前端已完成，詳見下方「Payment Rebuild — Step 10」小節**

### Payment Rebuild — Step 10（Plan Change Coordination & UI）
- **Implementation 已完成**：新檔案 `supabase/schema_plan_change.sql`——`orders.scheduled_service_start`（additive nullable timestamptz，**已套用到 TEST** 專案 `ngznngqmbhxejkjbqomh`）；`create-order-checkout` 新增 Plan Change eligibility gate——已有有效 Service Period 的使用者必須明確帶 `afterExpiry: true` 才可購買，否則回 409 `active_service_period_exists`（一般首購流程因永遠不會有有效 period，完全不受影響）；`afterExpiry` 時由 server-side 計算 `scheduled_service_start` = 該會員現有 period 的 `service_period_end`（不信任前端）；`oen-webhook` 的 onetime 分支讀出該值並原封不動傳給既有 `apply_order_payment()` 第七參數（Step 9 已建、本次第一次被實際呼叫）；新 Edge Function `create-plan-change-checkout`——僅處理 Monthly→Annual Immediate，依序呼叫既有、已測試過的 `terminate-service-period`（Step 9）再呼叫 `create-order-checkout`，不重做 Step 9 邏輯；Annual→Monthly Immediate 一律回 400 `immediate_change_not_available_for_this_plan`，導向既有「終止＋另購」路徑；`AuthProvider.jsx` 的 `service_periods` select 補 `id`；`AccountPage.jsx` 新增「方案變更」UI 區塊（`activePeriod && !upcomingPeriod` 時顯示），含 After-Expiry 購買、Immediate 升級、提前終止三種按鈕
- **TEST 環境驗證完成**：因瀏覽器視窗持續回報 `0x0` viewport（環境限制，非程式缺陷，已嘗試 resize/新分頁/navigate 皆無法恢復），改用已登入分頁的 `javascript_tool` 直接對已部署的 Edge Function 發真實 HTTP 請求，搭配 SQL 層驗證（含 rolled-back transaction）：
  - Eligibility gate 正確擋下已有有效 Monthly／Annual period 時的一般購買（409 `active_service_period_exists`）
  - After-Expiry 排程正確（Monthly→Monthly、Annual→Annual），`scheduledServiceStart` 與該會員現有 period 的 `service_period_end` 經 DB 查詢逐字元核對相符
  - Webhook→RPC 接線正確：以 rolled-back transaction 模擬 webhook 呼叫 `apply_order_payment(..., p_service_period_start)`，產生的 `service_periods.service_period_start` 與排程值完全一致，`service_period_end` 正確為 start + 1 month
  - `service_periods_no_overlap` EXCLUDE constraint 在新增 nullable 欄位後仍正確擋下重疊 insert（回歸驗證，`23P01`）
  - Immediate Change（Monthly→Annual）正確終止舊 period（`terminated_at` 寫入、退款金額依既有公式算出）、建立新 Annual 一般訂單（`scheduledServiceStart: null`，走一般路徑無需特殊旗標）
  - Immediate Change 拒絕路徑正確：Annual 使用者呼叫 Immediate→Annual（400）、呼叫 Immediate→Monthly（400）、無有效 period 時呼叫（409 `no_active_service_period`）
  - 所有測試用合成資料（synthetic orders／service_periods）已於驗證後清除，TEST 帳號已還原為測試前狀態
  - `npm run lint`／`npm run build` 皆通過
- **已知限制（環境問題，非功能缺陷）**：未能透過 Oen 真實 hosted checkout 頁面完成一次視覺化刷卡的端到端測試；上述驗證改以「API 層計算」＋「RPC 層套用」兩端分別驗證同一條鏈路，應可視為等效覆蓋，但尚無一次「真實刷卡 → Oen callback → `oen-webhook` 實際收到 → 寫入新 period」的完整真實請求記錄
- **Git checkpoint**：`4e5d827` — "Implement Plan Change coordination and UI"，**已 commit + push 到 `origin/main`**
- **Step 10 已完成（本次核定範圍）**：未擴大到「已有排程中的方案變更時再次變更」的 UI（目前僅在 `activePeriod && !upcomingPeriod` 時顯示方案變更區塊）、PayUNi／ECPay、Payment Adapter boundary 重新設計

### ECPay Integration（綠界 TEST 環境）
- **Discovery 已完成**：確認 ECPay AIO 可沿用既有 Payment Core（Order／`apply_order_payment()`／Service Period／退款 RPC 皆不修改），只需新增 provider-specific 部分。重要發現：AIO 必須由瀏覽器表單 POST 到綠界（不能只用 GET redirect）；Supabase 預設網域不能回傳 HTML（須 Custom Domain）；**ECPay 信用卡請退款 API（`CreditDetail/DoAction`）測試環境不支援**，退款只能在正式環境驗證。ReturnURL 依官方文件技術規格可使用 Supabase Edge Function URL；`payment.joti.yoga` 維持為 fallback，**未建立**，待綠界回覆再評估（Supabase Custom Domain 為付費 add-on、每專案僅能綁一個網域）
- **Implementation 已完成**（方案 A：`formPost`，不採用 bridge URL）：
  - `_shared/ecpay.ts`：CheckMacValue（SHA256、.NET UrlEncode 規則，已用綠界官方範例驗算一致）、`QueryTradeInfo/V5`（含回應驗章）、`CreditDetail/DoAction`
  - `_shared/ecpayAdapter.ts`：實作 `PaymentProviderAdapter`；MerchantTradeNo 每次付款嘗試重新產生（`J`＋yyMMddHHmmss＋7 碼亂數＝20 碼英數字，**不使用 UUID order ID**），存於 `orders.provider_checkout_ref`；`ChoosePayment=Credit`；`ClientBackURL` 不帶 `result`；`CustomField1` 帶 orderId 僅作交叉比對；退款函式 `refundEcpayOrder()`（`Action=R`）
  - `_shared/paymentProviders.ts`：Provider routing——新 Order 依 `ACTIVE_PAYMENT_PROVIDER`（**未設定時預設 `oen`，既有行為不變**）；`retry-order-payment` 沿用 `orders.provider`，不會中途換 provider
  - `_shared/paymentProviderAdapter.ts`：`StartCheckoutResult` 新增選填 `formPost`（Oen 不設定，行為不變）
  - 新 Edge Function `ecpay-webhook`（`verify_jwt = false`）：CheckMacValue 驗證 → `payment_events` idempotency 錨點（沿用 Oen 設計）→ 僅處理 `RtnCode=1` 且非 `SimulatePaid` → **強制 `QueryTradeInfo` 回查**（`TradeStatus=1`、金額、TradeNo 相符）→ 只從自己的 `orders` 解析 Order → `apply_order_payment()`；回應 `1|OK`，暫時性錯誤回 `0|…` 讓綠界重送。**付款失敗通知刻意不標記 `payment_failed`**（尚未確認同一 MerchantTradeNo 失敗後不會再成功），Order 停在 `pending_payment` 依 3 天期限過期
  - `terminate-service-period`：依 `orders.provider` 分支，ECPay 走 `refundViaEcpay()`；網路不確定時停在 `refund_failed` 並註記需至綠界後台人工核對；Oen 路徑不變
  - 前端：新增 `utils/startProviderCheckout.js`（有 `formPost` 時自動送出隱藏表單，否則照舊 redirect），`ContractReviewPage.jsx`／`AccountPage.jsx` 三個呼叫點改用；`CheckoutReturnPage.jsx` 改為 provider-neutral，讀取會員自己的 Order 狀態並輪詢（每 3 秒、最多 10 次），不再依賴 URL 的 `result`
  - 新環境變數：`ECPAY_MODE`、`ECPAY_PAYMENT_BASE`、`ECPAY_MERCHANT_ID`、`ECPAY_HASH_KEY`、`ECPAY_HASH_IV`、`ECPAY_RETURN_URL`、`ACTIVE_PAYMENT_PROVIDER`；程式未寫死任何金鑰，非 `test` 模式或主機不符時拒絕執行
- **TEST 環境端到端驗證完成（2026-10-07，TEST 專案 `ngznngqmbhxejkjbqomh`，綠界公開測試商店 `3002607`）**：
  - 本機前端 → 測試帳號 `luckster.ai.workspace+trial2@gmail.com` → `/contract-review` 同意 → 月方案 → formPost 成功開啟綠界 TEST 付款頁
  - 使用者手動以測試卡完成付款 → `ecpay-webhook` 實際收到綠界通知 → `payment_events` 一筆 `verified`（CheckMacValue＋QueryTradeInfo 回查一次通過，綠界未重送）→ Order `1438ce74…` 變為 `paid`（`provider_ref`＝綠界 TradeNo、`payment_method`＝`card`）→ Service Period `active`（2026-10-07 → 2026-11-07）
  - `/checkout/return` 顯示「付款已確認」；`/account` 顯示付費會員／月方案／到期日 2026/11/7
  - 另以本機測試驗證：簽章錯誤（400）、MerchantID 不符、`RtnCode≠1`、重送去重、`SimulatePaid=1`、找不到 Order、**簽章正確但綠界回查未付款時不開通**、竄改金額被綠界拒絕（`CheckMacValue Error`）
  - `deno check`、`npm run lint`、`npm run build` 皆通過
  - 測試後已移除 `ACTIVE_PAYMENT_PROVIDER`（TEST 新 Order 恢復預設 Oen）；`ECPAY_*` secrets 保留於 TEST 專案
- **TEST 資料保留中（未清理）**：上述測試帳號新增 1 筆 `contract_acceptances`、1 筆 ECPay `paid` Order、1 筆 `active` Service Period、1 筆 `payment_events`
- **TEST 尚未驗證**：付款失敗時綠界是否發通知、「返回商店」實際跳轉（TEST `SITE_URL` 已於 2026-10-12 改為 Preview `https://joti-u9os97gw1-jotiyoga.vercel.app`；新流程付款後的返回頁實際顯示仍待驗證，見「ECPay Checkout Session Flow」小節）、綠界當日 4 次重送全失敗時的對帳補救（尚未實作對帳）、透過 ECPay 的 Plan Change 流程
- **Production 尚未驗證**：**退款程式已實作、尚未完成正式退款驗證**（測試環境不支援 DoAction，須以正式環境真實小額交易驗證，包含 `Action=R` 的 `TotalAmount` 語意；已授權未請款時的全額退款 `E`→`N` 未實作）；正式環境金鑰、`joti.yoga`、ReturnURL 網域、綠界審核
- **已知待處理**：契約審閱頁付款方式欄仍寫「透過 Oen 金流服務」，若確定採用 ECPay 需另行處理法律文字（2026-10-19 已處理：契約第八條、第十九條、附件一改為綠界科技 ECPay，見「Step 11 — 付款模式與方案變更規則落實」）
- **Git checkpoint**：`299e386` — "Implement ECPay TEST integration (AIO checkout, webhook, provider routing)"＋`4a675fd`（project status），**已 commit + push 到 `origin/main`**

### ECPay 官方文件查核（5 個待確認問題，Discovery only）
- **範圍**：僅查官方來源（developers.ecpay.com.tw、support.ecpay.com.tw、www.ecpay.com.tw），未修改程式、資料庫或環境設定。結論：5 題中僅「退款期限」官方已有明確答案，且**影響 JOTI 退款的執行方式（非退款金額公式）**；其餘仍須向綠界確認
- **Q1 ReturnURL 用 `*.supabase.co`**：官方已規範——須為特店 Server／主機 URL、僅 80／443 port、不支援中文網址、使用 CDN 時須填主機網址而非 CDN 網址、僅支援 TLS 1.2、須可由外部連線並回 `1|OK`。官方**未說明**是否禁止 serverless／第三方平台網域；Supabase 入口前有 Cloudflare 代理，是否觸及「CDN」條款未說明 → **需綠界確認**（TEST 已實際收到通知）
- **Q2 是否須商家自有網域（`payment.joti.yoga`）**：官方僅要求申請時填寫網站網址、會員服務規範要求揭露交易網址；技術文件**未要求** ReturnURL 與登記網站同網域 → **需綠界審核單位確認**（不影響程式，ReturnURL 已由 env 設定）
- **Q3 固定 outbound IP／白名單**：官方已說明「綠界主機 IP 不固定，請以 FQDN 方式設定」（商家防火牆放行 `payment.ecpay.com.tw:443`；入站來源 `postgate.ecpay.com.tw:443`），防火牆需要時可線上申請「主機 IP 鎖定」；AIO／QueryTradeInfo／DoAction 文件**皆未要求**商家固定 outbound IP（以 CheckMacValue 驗證）。合理判斷：**不需要 Oen 式固定 IP proxy**；「主機 IP 鎖定」是否僅為選用功能 → 建議向綠界確認
- **Q4 特約賣家**：官方已說明一般賣家可「自行串接」全方位金流（導轉綠界付款頁），信用卡為國內卡一次付清（符合 JOTI 目前用法）；分期、銀聯、國外卡、站內付 2.0 才需特約。官方**未說明**：預收制線上課程是否須特約審核、一般賣家收款額度、一般賣家可否使用 DoAction → **需綠界確認**
- **新發現（官方規範）**：會員服務規範（1140224）第一點第 8 款——「會員就所銷售之遞延性商品或服務，依相關法規規定辦理履約保證（含信託），並應揭露該履約保證資訊予交易相對人知悉」。年方案屬預收服務，可能適用；repo `docs/` 目前**無任何履約保證記載** → 需經營者／法律顧問與綠界確認
- **Q5 退款期限（官方已有答案）**：付款後 **90 天內**可系統（後台／API）退刷；**90～360 天須至廠商後台人工申請退刷**（附授權碼、金額、簽署文件，約 7～10 個工作天）；**超過 360 天無法退刷**。另：一般授權才可部分退刷（分期、紅利折抵須全額）；帳戶餘額不足無法退刷（須先預付信用卡退刷款）；21 天內須完成關帳；TEST 不支援 DoAction。官方**未說明／不一致**：`Action=R` 的 `TotalAmount` 是退款金額或剩餘金額；一般會員可否使用 DoAction；關帳前可否部分退刷（support 頁與開發文件說法不同）；自動關帳時間（23:59 與 20:15 兩種說法）→ 需綠界確認＋正式環境小額驗證
- **對 JOTI 退款規則的影響**（依 `payment-legal-spec.md` §11 與 `schema_refund.sql`：月方案約服務開始 30 天內有退款、年方案約 10 個月／約 300 天內有退款）：
  - 一般購買月方案、立即升級（退原月方案）、年方案服務開始 90 天內：✅ 90 天內，API 可處理
  - 年方案服務開始第 91～約 300 天：⚠️ **僅能人工退刷**，目前 API 路徑會失敗並停在 `refund_failed`
  - 到期後開始（After-Expiry）：付款早於服務開始，最多約一整年——年→月約付款後 365～395 天、年→年約 365～665 天退款：❌ **大部分超過 360 天，無法退刷至原卡**；月→年約 31～331 天：⚠️ 前段 API、後段人工
  - **退款金額公式不受影響**，但超過 90 天須人工處理、超過 360 天須以其他方式（如匯款）退款——屬經營／法律決策（契約是否載明退款方式、是否限制到期後開始的提前購買時間），待裁示
  - 目前程式未區分 90 天內外；另退款金額為 0 時仍會呼叫退款 API（Oen 路徑相同），列為後續待檢查項目。**本次未修改任何程式**（2026-10-19 更新：ECPay 路徑退款金額為 0 時已不呼叫 DoAction，見「Step 11 — ECPay LIVE mode Implementation」；90 天規則仍為 Future Decision，見 Open Questions；Oen 路徑為歷史／相容性程式，未修改）

### ECPay 付款頁重用／付款重試實測（2026-10-10，Discovery only）
- **範圍**：以獨立測試付款頁直接對 ECPay TEST（公開測試商店 `3002607`）實測，ReturnURL 為無效網址，**未連接 JOTI Order Flow、未寫入任何 JOTI 資料**；未修改程式、SQL、資料庫或設定
- **同一 MerchantTradeNo 不可重新建立付款頁（已實測確認）**：第二次送出完全相同表單、或同編號更換日期／金額，ECPay 皆回「訂單編號重覆，建立失敗，請返回商店頁面重新下單。」；付款頁為表單 POST 的回應，無可保存的重新進入 URL（GET `/Cashier/AioCheckOut/V5` 不論是否帶原 session cookie 皆回 HTTP 500）。會員只能在原本仍開啟的分頁繼續付款
- **3D OTP 失敗後可在同一付款頁重試並成功（已實測確認）**：MerchantTradeNo `JRETRY1613831753T1`——使用者以測試卡 `4311-9522-2222-2222` 付款，3D OTP 第一次故意輸入錯誤 `0000`，ECPay 顯示「OTP 密碼錯誤，請再試一次」；未離開頁面，於同一付款頁改輸入正確 OTP `1234` 後付款成功。QueryTradeInfo（回應 CheckMacValue 驗證通過）：`TradeStatus=1`、`TradeNo=2610101445512864`、`TradeAmt=333`、`PaymentType=Credit_CreditCard`、`TradeDate=2026/10/10 14:45:51`、`PaymentDate=2026/10/10 14:48:21`（送出前基準為 `TradeStatus=10200047`、無 TradeNo）
- **結論**：同一個 MerchantTradeNo／同一付款頁在 OTP 錯誤後可直接重試並完成付款；**目前沒有任何證據顯示 OTP 失敗後必須建立新的 MerchantTradeNo／新付款頁**
- **未付款交易狀態**：未付款的 AIO 交易於 ECPay 端維持 `TradeStatus=0`（2026-10-07 建立者至 2026-10-10 仍為 0），不會自動轉為過期／未完成，因此無法以 QueryTradeInfo 判斷舊付款頁是否仍可付款；付款頁前端程式無倒數／逾時邏輯（若有期限屬伺服器端 session，長度未知）
- **仍無法確認**：發卡銀行實際拒絕授權（額度不足、卡片拒絕等，OTP 錯誤屬 3D 驗證階段，未送至發卡行；官方未提供模擬此類失敗的測試卡）後能否於同一頁重試；OTP 連續多次錯誤後是否鎖定或終止交易；未付款離開後付款頁伺服器端 session 有效期與逾時後能否付款。官方文件（付款失敗 FAQ、測試介接資訊、信用卡一次付清）皆無相關說明

### Payment Flow — 付款成功後才建立正式 Order（2026-10-11，Discovery only）
- **範圍**：純 Read-only Design Discovery，未修改程式、SQL、資料庫、TEST 資料或設定；**尚未授權 Implementation**
- **背景**：先前 Discovery 規劃的 Pending Order 生命週期（3 天付款期限、Continue Payment、`cancelled` 狀態、`order_payment_attempts`、取消後舊 ECPay 付款頁的放棄授權處理）複雜度高；本次探索更簡單的方向——會員 UX 只有「購買 → ECPay 付款頁（含 3DS／OTP）→ 回到 JOTI → 付費會員」，付款失敗／離開一律視為「沒有完成購買」，**沒有成功付款就沒有正式 JOTI Order**；ECPay 端殘留的未付款交易（`TradeStatus=0`）不需 JOTI 處理
- **結論：可行，且值得進入下一階段 Implementation Discovery / Design**，但付款前仍需保存一筆輕量 **checkout session**（非 Order，無付款期限／重試／取消，會員看不到）
- **現有實作的限制**：`ecpay-webhook` 以 `orders.provider_checkout_ref` 解析 Order（找不到 → `order_not_matched`）；`apply_order_payment()` 只能把既有 `pending_payment` Order 轉為 `paid`（條件含 `payment_attempt`、`payment_expires_at > now()`、`provider`）→ 需新增「付款確認時同交易建立 `paid` Order＋Service Period」的 RPC。Schema 允許直接寫入 `status='paid'`；唯一障礙是 `orders.payment_expires_at` 為 NOT NULL（填 `now()` 或改 nullable，待決定）
- **可直接沿用**：MerchantTradeNo 產生、CheckMacValue 驗證、`payment_events` 去重、RtnCode／SimulatePaid 判斷、QueryTradeInfo 回查與金額比對、退款流程（新流程建立的 Order 欄位相同）、`service_periods_no_overlap`；需調整：CustomField1／ClientBackURL 改帶 session id、webhook 改以 session 解析、`create-order-checkout`（ECPay 路徑）改建 session、`CheckoutReturnPage` 改以 session 輪詢
- **建議的 `checkout_sessions`（最小欄位）**：`user_id`、`plan_code`、`amount`、`contract_acceptance_id`、`contract_version`、`provider`、`merchant_trade_no`（unique）、`status`（`open`／`fulfilled`／`rejected`）、`order_id`（開通後填）、`trade_no`、時間戳、`note`；RLS 僅會員讀自己的，寫入只經 service role／SECURITY DEFINER RPC。不採「完全不存、只靠 CustomField1～4」：回傳頁無法辨識、無法對帳（不知道該查哪些 MerchantTradeNo）、稽核薄弱
- **主要風險**：
  - **ECPay 已付款但 JOTI 開通失敗**：暫時性失敗 → webhook 回 `0|…` 讓 ECPay 重送（一天 4 次），RPC 以 `merchant_trade_no` 冪等，建議加回傳頁的伺服器端主動確認（QueryTradeInfo → 同一 RPC）作為備援；永久性失敗（已有有效方案、金額不符）→ RPC 必須明確回傳拒絕而非丟出例外（避免現有 23P01 無限重試）→ session 標記 `rejected` → 回 `1|OK` → 進入退款清單（第一版人工；DoAction 僅正式環境可驗證）
  - **重複付款**（兩個分頁、或舊付款頁延遲付款）：ECPay 無法讓舊頁失效，只能「第一筆開通、後到者拒絕＋退款」；在此方向下，舊付款頁付款若會員當時沒有有效方案，即視為正常購買
  - 舊付款頁延遲付款時價格／契約版本已變更；Oen 路徑仍為「先建 Order」；法律文件（`payment-legal-spec.md`、`order-schema-proposal.md` Decision 8、契約）是否提及付款期限／待付款訂單**尚未逐條核對**
- **採用後不再需要（ECPay 路徑）**：3 天付款期限與 `expire_pending_orders`、`retry_order_payment`／`retry-order-payment`、`mark_payment_failed`、`pending_payment`／`payment_failed`／`payment_expired` 狀態；先前規劃的 `cancelled`、`cancel-order`、`order_payment_attempts`、Pending 部分唯一索引、Continue Payment／取消 UI、取消後舊付款頁放棄授權流程；AccountPage 重試按鈕與 CheckoutReturnPage 的付款失敗／付款期限已過訊息。第一版不刪 schema，只停用（歷史資料與 Oen 仍使用）
- **建議的下一階段最小 Implementation 範圍（待授權）**：(1) migration：`checkout_sessions`＋RLS＋開通 RPC（例如 `fulfill_checkout_session`），不改既有 RPC；(2) `create-order-checkout` ECPay 路徑改建 session（Oen 不動）；(3) `ecpayAdapter` CustomField1／ClientBackURL 改用 session id；(4) `ecpay-webhook` 改以 session 解析並呼叫新 RPC，拒絕時回 `1|OK` 並記錄；(5) `CheckoutReturnPage` 改以 session 輪詢；(6)（選用）`confirm-checkout-session` 以 QueryTradeInfo 主動確認；(7) AccountPage 對 ECPay 不顯示重試。不動：`oen-webhook`、`oenAdapter`、`oen.ts`、退款流程、`service_periods_no_overlap`
- **待決策**：見下方「Open Questions」

### ECPay Checkout Session Flow（2026-10-12，Implementation ＋ TEST 部署 ＋ E2E 驗證通過 — 未 commit）
- **已確認決策**：付款成功前不建立 Order；Checkout Session 為付款中的暫時識別（非 Order）；同一會員同時只能有一個有效 open Session，**有效期 30 分鐘**（期間顯示「付款進行中」、不提供新購買入口）；有有效 Service Period 不得開始購買；不做 Continue／Retry／Cancel、Advance Purchase／After-Expiry／Plan Change；webhook 與 `confirm-checkout-session` 共用同一套冪等確認／開通邏輯；付款成功但無法開通 → 第一版人工退款；Session 鎖定建立當下的方案、價格與契約接受資訊；未付款 Session 不清理；TEST 既有 pending Order 不處理、不影響新流程；Oen 流程不變
- **新增**：`supabase/schema_checkout_sessions.sql`（`checkout_sessions` 表＋RLS read own／admin、`create_checkout_session()`、`fulfill_checkout_session()`，皆 SECURITY DEFINER、僅 service_role 可執行）與 `_ROLLBACK.sql`；`_shared/ecpayFulfillment.ts`（QueryTradeInfo 回查＋TradeNo／金額比對＋呼叫 `fulfill_checkout_session()` 的共用邏輯）；Edge Function `confirm-checkout-session`（`verify_jwt = true`，僅限本人 Session）；`frontend/src/utils/checkoutSession.js`
- **修改**：`create-order-checkout`（ECPay 時改建 Session、拒絕 `afterExpiry`；Oen 路徑不變）；`_shared/ecpayAdapter.ts`（新增 `startEcpaySessionCheckout()`，CustomField1／ClientBackURL 帶 session id）；`ecpay-webhook`（改以 `checkout_sessions.merchant_trade_no` 解析，不再查舊 Order → `session_not_matched`）；`retry-order-payment`（ECPay Order 回 409 `retry_not_supported`）；`create-plan-change-checkout`（ECPay 啟用時於終止前回 409 `plan_change_not_supported`）；`CheckoutReturnPage`（新增 `?session=` 模式，每 3 次輪詢呼叫一次 confirm；`?order=` 模式保留給 Oen）；`ContractReviewPage`、`AccountPage`（顯示「付款進行中」；AccountPage 移除到期後開始／立即升級按鈕，保留提前終止）；`config.toml`
- **`fulfill_checkout_session()` 行為**：鎖 Session 列（`FOR UPDATE`）＋會員 advisory lock；已 fulfilled → `already_fulfilled`；金額不符／已有未終止且未結束的 Service Period（含未來開始者）→ `rejected`（保留 TradeNo 供人工退款）；否則同交易建立 `paid` Order（`provider_checkout_ref`=MerchantTradeNo、`provider_ref`=TradeNo、`payment_method`、契約／方案／金額取自 Session；`payment_expires_at` 填付款確認時間，orders schema 不變）＋Service Period；`exclusion_violation` 轉為 `rejected`（不再發生 23P01 無限重試）；業務結果一律回傳 jsonb、不 raise。逾期（>30 分鐘）才付款的 Session，若會員當時無有效方案仍會開通
- **人工退款清單**：`checkout_sessions where status = 'rejected'`（另有 `payment_events.note = 'paid_but_rejected:<reason>'`）
- **已驗證（本機）**：frontend `npm run lint`、`npm run build` 通過；`deno check`／`deno lint`（受影響的 7 個 Edge Functions／shared）通過；以 PGlite（本機 Postgres）執行 migration 與 27 項 SQL 測試全數通過（建立／30 分鐘有效期／第二個 open Session 被擋／逾期後可重建／付款後建立 paid Order＋Service Period 欄位正確／重複呼叫冪等／雙分頁第二筆 rejected／金額不符／未來開始期間阻擋／exclusion_violation 回滾／RLS 只讀自己／一般會員無法呼叫 RPC／歷史 pending Order 不影響）；共用確認邏輯 11 項單元測試（stub QueryTradeInfo）通過；Session 付款表單 CheckMacValue 驗證通過
- **TEST 部署（2026-10-12）**：
  - `schema_checkout_sessions.sql` 已在 TEST Supabase（`ngznngqmbhxejkjbqomh`）執行成功（表、RLS 兩條 policy、兩個 RPC 僅 service_role 可執行）
  - 已部署 Edge Functions：`confirm-checkout-session`（新，verify_jwt=true）、`ecpay-webhook`（verify_jwt=false）、`create-order-checkout`、`retry-order-payment`、`create-plan-change-checkout`；`oen-webhook`／`terminate-service-period`／`create-subscription-checkout` 未重新部署
  - **部署方式**：工作樹中有與本次無關、未 commit 的 `_shared/oen.ts`（Oen subscription）等修改，且上述 Functions 會打包 `oen.ts`，因此改以 `git archive HEAD` 建立乾淨副本、僅放入本次檔案後部署（已比對副本與工作樹差異僅為無關修改），避免把無關 Oen 變更推上 TEST
  - 前端：Vercel **Preview** `https://joti-u9os97gw1-jotiyoga.vercel.app`（同一乾淨副本；未部署 Production），bundle 已確認含新流程並指向 TEST Supabase
  - TEST secrets：`ACTIVE_PAYMENT_PROVIDER=ecpay`（原為未設定）；`SITE_URL` 由 `frontend-oen-test.vercel.app` 改為上述 Preview（僅 TEST 專案；Oen 返回網址亦使用 `SITE_URL`，Oen 目前未啟用）
- **測試前置（經授權）**：`+trial2` 原有上一輪 ECPay TEST 留下的有效 Service Period（至 2026-11-07），於 Preview「提前終止目前方案並退款」→ `terminated_at` 已設定；ECPay stage DoAction 回 `RtnCode=10000002 更新失敗.(error_amount_R)` → Order `refund_failed`（退款金額 289，屬可接受範圍；另見：stage 實際回應業務錯誤而非「不支援」，正式環境仍待驗證）。UI 在退款失敗時只顯示「Edge Function returned a non-2xx status code」，但終止實際已成功——文案待改善
- **E2E 驗證通過（2026-10-12，`+trial2`，月方案 NT$333）**：
  - Checkout Session `c692a9df-81a6-464d-92ac-840b769c8a5b`、MerchantTradeNo `J261012121305A52RF9R` → 使用者手動 ECPay TEST 刷卡成功
  - Session：`fulfilled`，`order_id` 已填、`provider_ref`（TradeNo）`2610121213144946`、`payment_method=card`；建立 04:13:05 → 開通 04:17:36 UTC
  - Order `ccea829a-87b2-4113-b5d8-d1857df32430`：付款確認時才建立，`status=paid`、333 TWD、`provider=ecpay`、`provider_checkout_ref`=MerchantTradeNo、`provider_ref`=TradeNo、`plan_code=monthly`、契約 `v1.0`（`contract_acceptance_id` 為該帳號最新一筆）、`payment_attempt=1`、`scheduled_service_start` 空
  - Service Period `87655368-…`：monthly，2026-10-12 04:17:36 → 2026-11-12 04:17:36 UTC；全資料庫無未終止重疊期間
  - payment_event `2610121213144946:1`：`verified`、RtnCode 1、TradeAmt 333、CustomField1=Session ID、SimulatePaid 0、`order_id` 對應；收到 → 處理完成約 0.7 秒
  - 無重複：當日 Order 1 筆、Service Period 1 筆、`checkout_sessions` 全表 1 筆、payment_events 1 筆；6 筆舊 `pending_payment` Order 未被觸及
  - 本次由 webhook 先完成開通；無 `confirm:*` 事件（回傳頁主動確認未自行開通，是否被呼叫無法從 DB 得知）
- **尚未驗證**：webhook 晚到由 `confirm-checkout-session` 開通；回傳頁實際顯示；雙分頁重複付款 → `rejected`；有效期間內購買 → 409；逾 30 分鐘後付款；併發（兩連線同時建立／開通，僅以鎖設計保證）；全部尚未 commit
- **已知前端缺口（非本次變更造成；已由 Step 11.1 Renewal Purchase Entry 實作，見同名小節）**：`agree_to_contract()` 同意後即清除 pending review，而方案按鈕只在 ContractReviewPage 同意當下顯示——已完成契約同意、目前無有效方案的會員（如終止或到期後）在 UI 上**沒有購買入口**，再進入 `/contract-review` 會重新開始 3 天審閱。本次 E2E 經授權改由已登入的 Preview 分頁直接呼叫 `create-order-checkout`（與頁面相同的呼叫）並送出 ECPay 表單，未修改前端

### Step 11.1 — Renewal Purchase Entry（2026-10-12，Implementation ＋ Preview 部署 ＋ TEST E2E 驗證通過 — 已 commit／push）
- **目的**：補上 Checkout Session 小節所列的前端缺口——已完成契約同意、目前沒有有效或未開始 Service Period 的會員，可直接重新購買，不重新開始 3 天契約審閱（契約第九條第五項）
- **只改前端**（後端已支援：`create-order-checkout` 只要求有契約同意紀錄，ECPay `create_checkout_session()` 另檢查無有效／未來期間與 open Session；SQL、Edge Functions、Payment Core、Membership 皆未修改）：
  - 新增 `frontend/src/components/PlanPurchase.jsx`：自 ContractReviewPage 抽出的共用方案按鈕（`create-order-checkout` → `startProviderCheckout`、錯誤訊息、open Session 時顯示「付款進行中」），並加入購買前說明「月方案 NT$333，服務期間自付款確認起算 1 個月，不會自動續約。」與年方案對應說明
  - 新增 `frontend/src/utils/purchaseEligibility.js`：`getContractAcceptanceState()`（讀自己的 `contract_acceptances`；讀取失敗回 `null`，呼叫端不得視為「未同意」）、`canOfferPurchase(profile)`（無有效／未來期間、非 admin、非 Legacy subscription 的 SUBSCRIBER）
  - `AccountPage`：符合條件時顯示「購買方案」區塊（`PlanPurchase`）；原本獨立的「付款進行中」提示併入 `PlanPurchase`
  - `ContractReviewPage`：一般模式下，已有契約同意者**不再呼叫 `start-contract-review`**（避免重新開始 3 天審閱），改顯示「購買方案／你已完成契約同意」並提供 `PlanPurchase`（已有方案或 admin 則導向我的帳號）；首購流程（審閱 → 同意 → 方案按鈕）改用 `PlanPurchase`，行為不變；reacceptance 模式不變
  - `PricingPage`：已同意契約者按鈕改導向 `/account`（可購買時文字為「已完成契約同意，前往我的帳號購買」，否則「前往我的帳號」）；未同意者維持「準備好了，開始契約審閱」；讀取失敗時導向 `/account`，不導向審閱
- **已知限制（未決規則，本輪不處理）**：新契約版本 `requires_reacceptance = true` 時的續購、基本契約依第十條終止後重新加入——目前任何既有同意紀錄皆視為有效
- **驗證**：`npm run lint`、`npm run build` 通過；`canOfferPurchase()` 10 種會員狀態單元測試（Vite SSR 載入實際模組）全數通過；本機 dev server 以 `+trial2`（有有效月方案）實測：AccountPage 不顯示購買區塊、PricingPage 只顯示「前往我的帳號」、`/contract-review` 顯示「購買方案／已完成契約同意」且未開始新審閱（DB 確認 `profiles.review_*` 仍為 null、未新增 Session）
- **Preview 部署**：`https://joti-3e82xtu9i-jotiyoga.vercel.app`（以 HEAD `b79151e` 乾淨副本＋本輪 5 個前端檔案與本文件部署，排除工作樹 10 個無關變更；未部署 Production）；TEST `SITE_URL` 已改為此 Preview（僅 TEST 專案）
- **測試前置（經授權）**：`+trial2` 於新 Preview「提前終止目前方案並退款」→ Service Period `87655368-…` `terminated_at` 2026-10-12 05:11:44 UTC；退款金額 333（未滿 1 天，全額）；ECPay stage DoAction 回 `RtnCode=10000002 更新失敗.(error_amount_R)` → Order `ccea829a-…` `refund_failed`（已知、可接受）；契約同意紀錄 4 筆保留、未開始新審閱、無其他資料異動
- **TEST E2E 第 1 次（未完成付款）**：AccountPage「購買方案」正確出現（會員狀態「免費體驗已結束」、含購買前說明）→ 月方案 → Session `45eb56a9-af16-4565-8455-6440cf281589`／MerchantTradeNo `J2610121316310MVHOB9` → ECPay 付款頁 13:16:32（台灣時間）開啟，付款頁閒置一段時間後送出卡號 → ECPay 回 **10300025「訂單已過期，請回到原廠商頁面重新操作」**。QueryTradeInfo：`TradeStatus=0`、無 PaymentDate；JOTI 端無 payment_event、無 Order／Service Period，Session 維持 `open`（30 分鐘後自然不再阻擋）；返回頁正確顯示「尚未收到付款結果……如果沒有完成付款，這次購買不會成立」。判斷為 ECPay 付款頁伺服器端逾時（官方文件未公開有效時間；過去成功付款皆於開頁後 2.5～4.5 分鐘內完成），非 JOTI 程式問題
- **TEST E2E 第 2 次（通過）**：
  - Session `4640a76e-d132-4e8f-9fb8-40a0c4836c42`、MerchantTradeNo `J26101213491142GMCMJ`、TradeNo `2610121349125166`；建立 05:49:11 → 開通 05:50:08 UTC；`fulfilled`、`payment_method=card`、`contract_acceptance_id` 沿用既有 `8494c887-…`（未重新審閱）
  - Order `945a7ec6-e72f-45a6-9200-006162efe369`：付款確認時建立，`paid`、333 TWD、`ecpay`、`provider_checkout_ref`=MerchantTradeNo、`provider_ref`=TradeNo、monthly、`v1.0`、`payment_attempt=1`、`scheduled_service_start` 空
  - Service Period `fcc11a1f-…`：monthly，2026-10-12 05:50:08 → 2026-11-12 05:50:08 UTC
  - payment_event `2610121349125166:1`：`verified`、RtnCode 1、TradeAmt 333、CustomField1=Session ID、SimulatePaid 0、對應 Order；webhook 先開通（無 `confirm:*` 事件）
  - 返回頁顯示「付款已確認，你的帳號狀態已更新。」
  - 無重複／異常：新增 Order 1 筆（該交易對應 1 筆）、Service Period 1 筆、payment_event 1 筆；全資料庫無未終止重疊期間；`+trial2` 有效方案 1 筆、契約同意仍 4 筆、`review_presented_at` 仍為 null；6 筆舊 `pending_payment` Order 未觸及
- **結論**：**Step 11.1 正常續購 E2E 已通過**——功能完成並經 TEST 驗證
- **尚待處理（不影響 Step 11.1 本身，本次不處理）**：
  - **ECPay 付款頁有效時間短於 JOTI 30 分鐘 Session**：付款頁過期後，會員回到 JOTI 仍會看到「付款進行中」直到 30 分鐘屆滿，期間無法重新購買——需向綠界確認付款頁有效時間（固定或閒置逾時、起算點），再決定是否調整 30 分鐘或補充文案
  - Preview（`VITE_ENABLE_SUBSCRIBE=true`）的 AccountPage 同時顯示舊 Oen「訂閱 JOTI」（`/subscribe`）連結，與續購按鈕並列易混淆（既有遺留，非本輪造成）
  - 未同意帳號的首購畫面未實際登入測試（程式路徑未變）；active plan 409、雙分頁重複付款仍未實測

### Step 11.2 — Refund Failure UI（2026-10-12，Implementation ＋ Preview 部署 ＋ TEST 驗證通過 — 已 commit／push）
- **問題**：`terminate-service-period` 分兩階段——(1) 終止＋退款計算於同一交易 commit；(2) 之後才呼叫 ECPay／Oen 退款。退款失敗時回 502 `{ status: 'refund_failed' }`，但方案**已終止**。原 AccountPage 只看 `data?.error || error?.message`（non-2xx 時 supabase-js 的 `data` 為 null），一律顯示「Edge Function returned a non-2xx status code」，且失敗路徑不 `refreshProfile()`，畫面仍顯示有效方案；另外結果訊息位於「目前方案」區塊內，`refreshProfile()` 後區塊消失、訊息也隨之不見（成功路徑亦受影響）
- **Implementation（僅前端）**：
  - 新增 `frontend/src/utils/terminationResult.js`：`readTerminationBody()`（成功讀 `data`；non-2xx 從 `error.context` 讀 JSON；網路錯誤／非 JSON 回 `null`）、`classifyTerminationResult()`（分類為 `refunded`／`refund_pending`／`not_terminated`／`unknown`，並決定是否重新載入）
  - `frontend/src/pages/AccountPage.jsx`：`handleEarlyTermination` 依分類顯示中文訊息；**方案已終止（`refunded`、`refund_processing`／`refund_failed`、`termination_recorded_*`、`refund_*_mark_failed`）與結果不明時呼叫 `refreshProfile()`**，畫面立即反映沒有有效方案；確定未終止（`termination_failed`、`order_not_eligible_for_refund`、400／401／405）不重新載入；409 `service_period_not_eligible`（通常為畫面過時）會重新載入；結果訊息移到「目前方案」區塊外，重新載入後仍可見
  - 文案不承諾尚未建立的人工退款流程（僅「如有疑問，請與我們聯絡」），不顯示英文錯誤代碼
- **未修改**：退款 backend、SQL、Edge Function、既有退款流程
- **驗證**：`npm run lint`、`npm run build` 通過；單元測試 **18/18** 通過（以 supabase-js 實際的 `FunctionsHttpError`／`FunctionsFetchError`／`FunctionsRelayError` 包真實 Response，涵蓋後端全部回應、網路錯誤、閘道錯誤、非 JSON、無法辨識的 200）
- **Preview 部署**：`https://joti-qqjjaovrr-jotiyoga.vercel.app`（以 HEAD `24755b6` 乾淨副本＋`AccountPage.jsx`、`terminationResult.js`、本文件部署，排除工作樹 10 個無關變更；未部署 Production；bundle 已確認含 11.2 文案）
- **TEST 驗證通過（2026-10-12，`+trial2`）**：於新 Preview 對有效月方案（Service Period `fcc11a1f-…`／Order `945a7ec6-…`）執行「提前終止目前方案並退款」（一次請求）
  - 前端：顯示「已提前終止目前方案，退款金額已依契約第十一條計算，但退款尚未完成。如有疑問，請與我們聯絡。」；未出現英文錯誤；會員狀態立即由「付費會員」更新為「免費體驗已結束」，「目前方案」區塊與終止按鈕消失、訊息仍可見，並出現 Step 11.1「購買方案」區塊
  - 後端回 502 `refund_failed`，前端由 `error.context` 讀出並歸類為「已終止、退款未完成」＋ `refreshProfile()`，符合設計
  - DB：`terminated_at` 2026-10-12 07:25:38 UTC；Order `refund_failed`、`refund_amount` 333（未滿 1 天，全額）、`refund_processed_at` 為空、`provider_refund_error` = ECPay stage `RtnCode=10000002 更新失敗.(error_amount_R)`（已知、預期）；`+trial2` 有效方案 0、契約同意仍 4 筆；Order／Service Period／Session／payment_events 筆數不變（11／4／3／10）
- **結論**：**Step 11.2 TEST 驗證通過**，無需修改程式
- **已知限制（不屬於 11.2）**：Supabase 閘道層自行回的 401（JWT 失效）會歸為「結果不明」（只重新載入）；退款金額／退款狀態顯示、終止前確認步驟依決策另行處理；AccountPage 仍顯示舊「訂閱 JOTI」（`/subscribe`）連結（已列待處理）

### Step 11 — Production Readiness Discovery（2026-10-12，Discovery only — 決策已確認，尚未實作）
- **範圍**：三項 Read-only Discovery——(1) Supabase Free／Pro 與 Organization 架構；(2) Free 閒置暫停與 Production health check；(3) Auth 登入方式。**未建立 Production 專案、未修改 Supabase／Auth／Vercel／DNS 設定、未修改程式**
- **Step 11 子步驟現況**：11.1 Renewal Purchase Entry、11.2 Refund Failure UI 已完成（見上方兩節）；本 Discovery 為 Production 基礎設施部分，其後的 Production 建置子步驟編號尚未排定
- **已確認決策**：
  - **Organization**：Production 使用**獨立的 Supabase Organization**，與現有 TEST 專案（`ngznngqmbhxejkjbqomh`）分開
  - **方案**：Production Supabase **先使用 Free**，**正式開放付款前再升級 Pro**（2026-10-20 更新：是否升級 Pro **改列 Future Decision**——是否長期維持 Free，待自建 backup／restore 驗證與整體風險評估後決定，見「Step 11 — Production Hosting／$0 平台費用評估」與 Open Questions）
  - **Region**：**Singapore（`ap-southeast-1`）**
  - **資料**：Production 建立**乾淨 DB**；**不遷移 TEST 帳號**，亦不遷移 TEST 的交易資料（orders、service_periods、checkout_sessions、payment_events、contract_acceptances 等皆為測試資料）。**僅遷移必要資料**：`contract_versions` 與 **4 個 official practices**
- **TEST DB 遷移資料核對（2026-10-13，Read-only）**：以 `supabase db query --linked` 對 TEST 專案僅執行 SELECT，**未寫入資料庫**，未執行任何 Production 建置或資料遷移
  - **`contract_versions`**：1 筆——`version` = `v1.0`、`content_identifier` = `v1.0`、`is_current` = true、`requires_reacceptance` = false（TEST `effective_at` 為建立時間 2026-09-20）
  - **Official Practices**：`practices` 全表 4 筆（P001–P004），**全部 `published`**，無 draft／archived；4 筆皆通過 repo 的 Official Practice 驗證（`validateOfficialPracticeStructure()`：無缺漏 Module、結構有效、`canPublish` = true、全部 Bunny）
  - **Module ID**：4 個 Practice 引用的 12 個 Module ID 均存在於 `data/modules.js`
  - **結論**：未發現會阻擋 Production 遷移的資料問題
- **遷移資料決策**：
  - 4 個 Practice **原樣遷移**，不因本次遷移修改 slug（含 P002 `SaTaNaMa-30min-meditation` 的大寫）
  - P002–P004 的空白 `description` 暫不處理，列為後續內容工作
  - Production `contract_versions.effective_at` **採正式上線時間**，不沿用 TEST 的 2026-09-20；**正式上線時間尚未決定（待決）**
  - **Auth**：Production 採 **Email + Password + Google**；**不保留 Magic Link**。前端已於 `2acade2` 實作並經 TEST 驗證（見「Step 11 — TEST Auth：Email + Password」）；Production Auth 設定尚未進行
  - **SMTP**：Production **需要自訂 SMTP**（供應商尚未選定）
  - **Health check**：Free 方案閒置會被暫停，health check **列入 Production 基礎設施**（2026-10-14 已上線，見「Step 11 — Production Environment Build」）
  - **網域**：正式網域 **`joti.yoga`**，待 Production 準備完成後再綁定（見上方「Final Website Domain」）
- **ECPay ReturnURL／Custom Domain 條件（記錄條件，未做新決策）**：
  - 目前 ECPay `ReturnURL` 使用 Supabase Edge Function URL（`*.supabase.co`），TEST 已實際收到通知；正式環境是否接受仍待綠界確認（見「ECPay 官方文件查核」Q1／Q2）
  - `payment.joti.yoga` 為既有 fallback（未建立），需要 Supabase **Custom Domain**——此為**付費 add-on，Free 方案無法使用**，且每專案僅能綁一個網域
  - 因此：若綠界確認可用 `*.supabase.co`，與「先 Free、正式付款前升 Pro」不衝突；若綠界要求自有網域，則 Production 需先升級付費方案並加購 Custom Domain 才能採用 fallback，升級時間點可能需要提前——**是否提前、如何處理尚未決定**，待綠界回覆後再裁示
- **建置進度**：見下方「Step 11 — Production Environment Build」

### Step 11 — Production Environment Build（2026-10-13，進行中）
- **Production Supabase Project 已建立**：Organization `JOTI Production`（`hswfrhidxshnmfkceogs`，與 TEST 的 `joti` Organization 分開）；Project `joti-production`，**Project Ref `qhyfpabyqksuwjzshjtu`**，Region `ap-southeast-1`（Singapore），Plan **Free**；Postgres 17.11
  - 以 CLI 建立；本機 `supabase/.temp` 仍 link 到 TEST（`ngznngqmbhxejkjbqomh`），未執行 `supabase link`——**所有 Production CLI 操作一律明確帶 `--linked --project-ref qhyfpabyqksuwjzshjtu`**，不帶 ref 的指令會打到 TEST
  - DB password 由使用者自行保管（不在 repo）
- **Production Database Schema 已建立並驗證**：
  - 依序執行 repo 14 份 SQL 全部成功：`schema.sql` → `learning_progress` → `module_usage` → `practice_activity` → `practice_notes` → `practices` → `practice_resume` → `subscriptions` → `contract_review` → `payment_core` → `membership_entitlement` → `refund` → `plan_change` → `checkout_sessions`（未執行任何 `*_ROLLBACK.sql`，未修改 SQL）
  - 結果：14 張表（全部 RLS enabled）、6 個 extension（含 `btree_gist`）、21 個 public 函式、2 個 trigger（`auth.users.on_auth_user_created`、`profiles.protect_profile_system_fields_trigger`）
  - **與 TEST 結構比對一致**（read-only 盤點 columns／constraints／indexes／RLS policies／table grants／triggers／函式 security definer、`search_path`、執行權限）；6 個早期函式原始碼 hash 不同，經確認僅為 TEST 函式內含 CR 換行（Windows 貼入 SQL Editor），去除 CR 後完全相同，無邏輯差異
  - **TEST 額外的 `ensure_rls` event trigger（`rls_auto_enable()`）不納入 Production**——不在 repo 內，推測為 TEST 建立時 Dashboard 選項；**採用 A：維持 repo 為 Schema Source of Truth**，新表照既有慣例於 SQL 中明確啟用 RLS
- **4 個官方 published Practices 已匯入 Production**：自 TEST read-only 取出原始資料，直接產生 `json_populate_recordset` INSERT 匯入（未手抄欄位值）；P001–P004 與 TEST 原始資料**逐列 md5 一致**（含 `created_at`／`updated_at`、slug、空白 description 原樣）；Production `practices` 目前**只有這 4 筆**；以 Production anon key 經 REST 讀取（前台路徑）驗證 anon + RLS 可正確讀到 4 筆 published
- **目前資料狀態**：Production **沒有 Auth users**、測試交易或其他 TEST 資料（`auth.users` 與其餘 13 張 public 表皆為 0 筆）
- **`contract_versions` 尚未建立**：v1.0 待正式上線時間確定後再建立（`effective_at` 採正式上線時間，見上方「遷移資料決策」）
  - **前置條件（2026-10-20 確認，尚未全部具備，目前不可建立）**：
    1. **Future Decision**：正式上線時間（`effective_at` 為 `not null`，依決策採正式上線時間）
    2. **v1.0 契約文字定稿後才建立**：`content_identifier = 'v1.0'` 直接對應 `docs/legal/versions/v1.0.md`，Production 首位會員同意後即不得再改 v1.0（只能建立 v1.1）；目前尚待——契約第 25 行網站欄位 `[待填寫]`（External／Pending：依 `joti.yoga` 綁定）、第七條第三項「單次給付之總價」與年方案分期之關係（Future Decision）
    3. **順序**：v1.0 定稿 → 建立 `contract_versions` v1.0 → 部署契約類 Functions（`start-contract-review`／`agree-to-contract`／`reaccept-contract`）→ Production 真實帳號開始審閱 → 付款類 Functions＋secrets → 滿 3 日後 Production E2E
  - **注意**：程式只依 `is_current` 判斷目前版本（schema 以部分唯一索引保證同時僅一筆 `is_current`），**不檢查 `effective_at`**——`is_current = true` 且 Functions 已部署時，契約審閱即可開始，不會等到 `effective_at`；`effective_at` 僅為紀錄欄位
  - **排程**：Production 真實 E2E 帳號須於預定測試日至少 3 日前開始審閱（前提為 contract version 與契約類 Functions 已就緒）
- **Admin 尚未建立**：待 Production Auth 完成、第一個正式帳號建立後再設定 `profiles.role = 'admin'`（2026-10-15：Production Auth 已完成、第一個正式帳號已建立；`profiles.role = 'admin'` 待設定）
- **Auth Email 決策（2026-10-13）**：Production Auth Email 採 **Resend Free**，寄件網域 **`auth.joti.yoga`**；目前不使用 Brevo；行銷／CRM Email 另行評估。**2026-10-14 Resend 網域 `auth.joti.yoga` 已 Verified**（見下方「Step 11 — Production Auth Email（Resend）網域驗證」）；**2026-10-15 Production Supabase Auth SMTP 已設定，並成功寄送驗證信**（見下方「Step 11 — Production Auth 完成」）
- **Production Auth 已完成（2026-10-15）**：Email + Password + Google，見下方「Step 11 — Production Auth 完成」（設定前的盤點見「Step 11 — Production Auth Discovery」）
- **Health Check 已上線（2026-10-14）**：GitHub Actions workflow `.github/workflows/supabase-keepalive.yml`（`fb15510`，已 push 到 `origin/main`），workflow 已啟用
  - **用途**：對 Production Supabase `practices` endpoint（`/rest/v1/practices?select=id&limit=1`）發出唯讀 API request（anon + RLS，只讀 published），降低 Free Plan 因閒置而自動 pause 的風險；只能降低、不能保證（官方未公開活動門檻，僅升級 Pro 可完全避免）；不改 schema、不寫入資料
  - **排程**：每 6 小時一次（`17 */6 * * *`，UTC :17），另可 `workflow_dispatch` 手動執行
  - **設定**：`permissions: {}`、`timeout-minutes: 5`、僅用內建 `curl`（`--fail --retry 3 --max-time 20`），不引入第三方 Action；Repository Secret `SUPABASE_PROD_ANON_KEY` 已設定，workflow 只接受 publishable key／legacy anon key（拒絕 `service_role`／secret key），Secret 未設定時明確失敗
  - **驗證**：已手動執行一次，結果 Success；失敗時由 GitHub 寄送通知
  - **通知**：Supabase 暫停警告信寄給 Organization Owner——`JOTI Production` 唯一成員 `luckster.ai.workspace@gmail.com`（Owner），已確認可正常收信
  - **注意**：repo 為 public，連續 60 天無 commit 時 GitHub 會自動停用排程
- **Vercel Production（2026-10-16 確認）**：已為新版程式並指向 **Production Supabase**（見下方「Step 11 — Production Purchase Entry 開關」的 Git／部署）
- **尚未開始**：Production Edge Functions／secrets、`joti.yoga` 綁定

### Step 11 — TEST Auth：Email + Password（2026-10-13，Implementation ＋ Preview 部署 ＋ TEST 驗證通過 — 已 commit／push）
- **範圍**：只改前端；DB schema、Edge Functions、`supabase/config.toml` 皆未修改（`handle_new_user` trigger 不受登入方式影響）；Google OAuth 設定未變更
- **Implementation**：
  - `state/AuthProvider.jsx`：移除 `sendMagicLink()`（`signInWithOtp`）；新增 `signUpWithPassword`／`signInWithPassword`／`resendSignupConfirmation`／`sendPasswordResetEmail`／`updatePassword`；`PASSWORD_RECOVERY` 時設定 `isPasswordRecovery` 並導向重設密碼頁（即使重設信連結落在其他頁面）
  - `state/authContext.js`：新增 `AUTH_CALLBACK_PATH`（`/auth/callback`）／`RESET_PASSWORD_PATH`（`/auth/reset-password`）
  - `pages/LoginPage.jsx`：登入／註冊（`?mode=signup`）／忘記密碼（`?mode=forgot`）三種模式；註冊後提示到信箱驗證；未驗證帳號可重新寄送驗證信；Google 按鈕保留
  - `pages/ResetPasswordPage.jsx`（新增）＋ route `/auth/reset-password`：以重設信建立的 session 設定新密碼；連結過期／無效時提示重新申請
  - `pages/AuthCallbackPage.jsx`：驗證連結過期／無效時顯示說明頁，不再無聲導回 `/login`；recovery session 不會被導向 `/account`
  - `utils/authErrors.js`（新增）：Supabase 錯誤碼 → 會員看得懂的中文訊息（不顯示英文錯誤）、密碼檢查、信件連結回跳錯誤解析；`App.css` 僅新增表單欄位間距
- **Password policy**：最低 8 字元，不強制大小寫／數字／符號——前端 `MIN_PASSWORD_LENGTH = 8`；TEST Supabase `Minimum password length` 已由使用者於 Dashboard 從 6 改為 8
- **驗證**：
  - `npm run lint`／`npm run build` 通過；`authErrors` 單元測試 25/25 通過；Login／Reset／Callback 10 種狀態 render 檢查正常；對 TEST 以不存在帳號呼叫 `signInWithPassword` 正確得到 `invalid_credentials`
  - **Preview 部署**：`https://joti-hgv403rht-jotiyoga.vercel.app`（以 `git archive 2acade2` 乾淨副本部署，Vercel Preview 環境、指向 TEST Supabase；未部署 Production）
  - **使用者於 Preview 實際驗證成功**：Email + Password 註冊、Email 驗證、登入、忘記密碼／重設密碼、Google 登入
  - **Server-side 密碼規則驗證**：遠端設定 `auth.minimum_password_length = 8`；以新測試 Email 直接呼叫 Auth API、7 字元密碼註冊 → `weak_password`（HTTP 422，`reasons: ["length"]`），`auth.users` 前後皆 5 筆、未建立使用者
- **Git checkpoint**：`2acade2` — "Implement TEST email password authentication"，**已 commit + push 到 `origin/main`**（連同先前未 push 的 `24755b6`／`0324c2d`／`8d9ec00`）
- **已知限制／後續（本次未處理）**：TEST 仍使用 Supabase 內建寄信（只寄 Organization 成員信箱、每小時 2 封）；TEST `Site URL` 仍為 `localhost:4190`（僅在 redirect 不在允許清單時作為 fallback）；Supabase 信件範本仍為預設英文；首頁「免費體驗」CTA 進入登入模式（是否直接帶 `?mode=signup` 待決定）；開啟 Confirm email 時 Trial 自 `signUp` 起算；`joti-privacy-policy.md` 第 18 行「Email 驗證登入」與新流程不一致（法律文件，待另行處理）；AccountPage 尚無「變更密碼」入口；信件安全掃描器預先點擊連結導致失效的風險待實際觀察

### Step 11 — Production Auth Discovery（2026-10-13，Discovery only — 尚未設定）
- **範圍**：以 `supabase config pull --dry-run --project-ref qhyfpabyqksuwjzshjtu`（未寫入 `config.toml`）、`auth.users` 計數、Vercel 環境變數名稱／部署別名與線上 bundle 進行 read-only 盤點；未修改任何 Supabase／Vercel／DNS／Resend 設定，未建立 key
- **已確認決策**：Email + Password + Google；移除 Magic Link；最低密碼長度 8、不強制字元種類；Email verification 開啟；會員 MFA UI 暫不需要
- **Production Supabase Auth 現況**：

  | 項目 | 現況 | 目標 |
  |---|---|---|
  | Email provider／Confirm email | 開啟／開啟 | ✅ 已符合 |
  | Minimum password length | 6（預設） | 改為 8 |
  | Password requirements／Secure password change | 無／關閉 | ✅ 維持 |
  | Site URL | `http://localhost:3000` | `https://joti-jotiyoga.vercel.app`（`joti.yoga` 綁定後再改） |
  | Redirect URLs | 空 | 精確路徑 `https://joti-jotiyoga.vercel.app/auth/callback`、`https://joti-jotiyoga.vercel.app/auth/reset-password`（不放 Preview 萬用字元、localhost 或舊 `frontend-…` 別名；Preview 續用 TEST） |
  | SMTP | 未設定（Supabase 內建寄信） | Resend：`smtp.resend.com:465`、帳號 `resend`、密碼為 Resend API key、寄件人 `JOTI <no-reply@auth.joti.yoga>`（待確認） |
  | 信件範本 | 預設英文 | 中文 Confirm sign up／Reset password，網址一律用 `{{ .ConfirmationURL }}` 等變數 |
  | Google provider | 未啟用 | 填入 Production OAuth Client ID／Secret |
  | MFA（TOTP） | 開啟（預設） | 不處理（App 無 MFA UI） |
  | SMS／Twilio | 標示開啟、無帳號資料（與 TEST 相同） | 不影響，可日後關閉 |
  | Auth users | 0 | — |

- **Vercel Production 現況**：正式別名 **`https://joti-jotiyoga.vercel.app`**（另有舊別名 `frontend-ebon-seven-40.vercel.app`）；線上為 13 天前的**舊版程式**（仍為 Magic Link）且 bundle 指向 **TEST Supabase**；Production 環境的 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 為 39 天前設定，依 bundle 判斷指向 TEST。前端 `2acade2` 已具備 Email + Password + Google，不需再改程式
- **Google OAuth 準備（使用者於 Google Cloud Console 操作）**：Web application OAuth Client；Authorized JavaScript origins `https://joti-jotiyoga.vercel.app`；Authorized redirect URI `https://qhyfpabyqksuwjzshjtu.supabase.co/auth/v1/callback`（官方建議自 Supabase Dashboard Google provider 頁面複製）；Scopes `openid`／email／profile；Branding（App 名稱、支援信箱、首頁、`/legal/privacy`、`/legal/terms`；上傳 Logo 需品牌驗證，約數個工作天）；Audience 發布狀態須為 **In production**（停在 Testing 時僅測試名單可登入）；同意畫面將顯示 `qhyfpabyqksuwjzshjtu.supabase.co`（自訂網域需 Pro 加購 Custom Domain，初期接受）
- **Blockers**：(1) Resend 未註冊、`auth.joti.yoga` DNS 未設定——完成前一般會員收不到驗證信／重設密碼信，Email 註冊實際不可用（Google 登入不受影響）；(2) 尚無指向 Production Supabase 的前端（Vercel Production 為舊版且連 TEST）；(3) Google OAuth Production Client 未建立；(4) 非 Auth 但影響上線：health check 未上線、`contract_versions` v1.0 未建立（契約審閱流程在 Production 會失敗）、隱私權政策需加入 Resend 並修正第 18 行
- **待決定**：(1) Site URL 採 `https://joti-jotiyoga.vercel.app`；(2) Google OAuth 使用既有（TEST Client 所在）GCP 專案或另開 Production 專用 GCP 專案；(3) 切換 Vercel Production 前的 Production Auth 測試方式——方案 1（建議）：以 `vercel deploy --build-env` 部署僅該次 build 指向 Production Supabase 的 Preview，暫時加入 Production Redirect URLs／Google origins，測完移除；方案 2：直接切換 Vercel Production 後於正式網址測試；(4) Resend 寄送區域（建議東京 `ap-northeast-1`，建立後不可直接更改）、寄件地址／名稱、DMARC `rua` 收件信箱；(5) Production Email 註冊是否先維持開啟（前端未上線、anon key 未公開，風險低）
- **2026-10-14 已決定**：Site URL 暫用 `https://joti-jotiyoga.vercel.app`（`joti.yoga` 完成後切換為 `https://joti.yoga`）；Google OAuth 使用既有 GCP Project、Production 建立獨立 OAuth Client；Production Auth 實測採臨時 Vercel Preview（方案 1，尚未處理）；Email Signup 維持開啟；寄件地址 `no-reply@auth.joti.yoga`。仍待決定：Resend 寄送區域、Sender name、DMARC `rua` 收件信箱
- **建議順序**：決定上述事項 → 使用者處理 Resend／Cloudflare DNS 與 Google Cloud OAuth（可並行）→ Supabase Production 先設定密碼長度 8、Site URL、Redirect URLs（不需等 SMTP）→ Resend 驗證完成後設定 SMTP 與中文範本、Google Client 建立後填入 provider → 依待決定 (3) 部署前端並以使用者正式帳號完成 Production Auth 測試（註冊、驗證信、登入、忘記／重設密碼、Google、7 字元密碼被拒），之後將該帳號設為 admin

### Step 11 — Production Auth Email（Resend）Discovery（2026-10-14，Discovery only — 尚未設定）
- **範圍**：repo 搜尋、公開 DNS 查詢（1.1.1.1）、`config pull --dry-run` 讀取 Production Auth 設定（`config.toml` 未變動）；未建立帳號／API Key，未修改 DNS／Supabase／Resend
- **既有設計**：repo 內**無任何** Resend／SMTP／寄件網域相關程式或設定（無 `supabase/templates/`，`config.toml` 無 auth／smtp／template 區段）；搜尋到的「resend」為前端「重新寄送驗證信」（`supabase.auth.resend`，實際經 Supabase SMTP 寄出）與 ECPay webhook 重送，與 Resend 服務無關
- **DNS 現況**：`auth.joti.yoga`、`resend._domainkey.auth`、`send.auth`、`_dmarc.joti.yoga`、`_dmarc.auth` 皆無任何紀錄；`joti.yoga` 無 MX／TXT，不會衝突
- **需新增的 Cloudflare 紀錄**（實際值以 Resend 頁面產生者為準，全部 DNS only）：`resend._domainkey.auth`（TXT，DKIM）、`send.auth`（MX priority 10，退信路徑）、`send.auth`（TXT，SPF）、`_dmarc`（TXT，`v=DMARC1; p=none; rua=mailto:<待定>`）；認證信不開 tracking，不需 tracking CNAME
- **Supabase Production SMTP**：目前**未設定**（仍為內建寄信）。需設定：Enable Custom SMTP、Sender email `no-reply@auth.joti.yoga`、Sender name（待定）、Host `smtp.resend.com`、Port `465`、Username `resend`、Password = Resend API key；接上 SMTP 後確認 Rate Limits（預設每小時 30 封；Resend Free 每日 100 封、UTC 午夜重置）
- **信件範本**：Email + Password 流程只用到 **Confirm sign up**（含重新寄送驗證信）與 **Reset password**；連結維持預設 `{{ .ConfirmationURL }}`（implicit flow 已於 TEST 驗證），僅需中文主旨／內文與品牌文字；Magic Link／Invite／Change email／Reauthentication 不需處理
- **一致性**：寄件網域與 `no-reply@auth.joti.yoga` 一致（DKIM 與 Return-Path 皆在寄件網域之下，DMARC 對齊）；tracking 關閉與隱私權政策「無追蹤」一致；DMARC `p=none` 一致但 `rua` 未定
- **Reply-To 限制**：Supabase SMTP 設定只有 Sender email／name，**沒有 Reply-To 欄位**（需 Send Email Auth Hook，不建議），且 `no-reply@auth.joti.yoga` 無收信信箱——建議於範本註明「此信件由系統寄出，請勿直接回覆」並附客服信箱（目前 `luckster.ai.workspace@gmail.com`，見 `data/business.js`）
- **尚缺**：Resend 帳號／網域／API Key；Cloudflare DNS 紀錄；Supabase Production SMTP 與 Rate Limits；中文範本；（與 SMTP 無關）最低密碼長度 8、Site URL、Redirect URLs；上線前隱私權政策加入 Resend 並修正第 18 行
- **建議順序**：決定待定事項 → Supabase Production 先設定最低密碼長度 8、Site URL、Redirect URLs（不需等 SMTP）→ 使用者註冊 Resend、新增 `auth.joti.yoga`、於 Cloudflare 加紀錄並驗證 → read-only 確認 DNS 生效 → 使用者建立 Production 專用 API Key（最小權限、限定 `auth.joti.yoga`）並填入 Supabase SMTP → 擬定中文範本供審核後貼入 Dashboard → 之後以臨時 Vercel Preview 進行 Production Auth 實測
- **待決定**：(1) Resend 寄送區域（建議東京 `ap-northeast-1`，建立後不可直接更改）；(2) Sender name；(3) DMARC `rua` 收件信箱；(4) Reply-To 處理方式（建議範本註明請勿回覆＋客服信箱）；(5) 範本 HTML 是否納入 repo 版本管理；(6) TEST 是否也接 Resend（另開子網域，與 Production 共用每日 100 封額度）

### Step 11 — Production Auth Email（Resend）網域驗證（2026-10-14，已完成 — API Key／SMTP 尚未設定）
- **網域**：Resend Production Auth Email 使用寄件網域 **`auth.joti.yoga`**；Region **Tokyo（`ap-northeast-1`）**
- **SPF CNAME Host 修正**：初次設定時 SPF CNAME 的 Host 誤設為 `resend.auth`，Resend 判定 `Missing SPF records`（狀態由 Pending 轉為 Partially Failed）；經 **Resend Support 確認正確 Host 為 `rsend.auth`**。已於 Cloudflare 新增 `rsend.auth.joti.yoga` → `rsend-apne1.forge.rmta.net`（CNAME，**DNS only**），並**刪除舊的錯誤 `resend.auth` CNAME**
- **驗證結果**：DKIM（`resend._domainkey.auth`）、`send.auth`、`rsend.auth` **均已 Verified**；Resend Domain Status 為 **`Verified`**，Resend 頁面確認 domain ready to send emails
- **DMARC**：`_dmarc.joti.yoga` TXT `v=DMARC1; p=none;`（`rua` 暫不設定）
- **尚未進行**：**尚未建立 Resend API Key**；**尚未設定 Production Supabase Auth SMTP**（Rate Limits、中文信件範本亦未設定）
- **下一步（2026-10-15 繼續）**：建立 Resend API Key（Production 專用、最小權限、限定 `auth.joti.yoga`）→ 設定 Production Supabase Auth SMTP——**已於 2026-10-15 完成**，見下一節

### Step 11 — Production Auth 完成（2026-10-15，設定 ＋ E2E 驗證通過）
- **登入方式**：Production 採 **Email + Password + Google**（無 Magic Link），前端沿用 `2acade2`
- **Production Supabase Auth 設定（`qhyfpabyqksuwjzshjtu`）**：
  - 最低密碼長度 8、Site URL `https://joti-jotiyoga.vercel.app`、Redirect URLs（`/auth/callback`、`/auth/reset-password` 精確路徑）——2026-10-14 已設定
  - **Custom SMTP（Resend）**：寄件網域 `auth.joti.yoga`（2026-10-14 Verified，見上一節）；Production Auth SMTP 已設定，**已成功寄送驗證信**
  - **Google**：Production Google OAuth Client（既有 GCP Project 內獨立建立）與 Supabase Google Provider 已完成設定
- **E2E 驗證通過**：
  - Email + Password 註冊 → 驗證信 → 驗證 → 登入正常
  - Password reset（忘記密碼／重設密碼）正常
  - Google 登入正常
  - JOTI Account 頁面正常
  - Production Supabase Authentication → Users **僅建立正確的單一正式帳號**，Provider 為 **Email + Google**
- **後續（尚未進行）**：Admin（`profiles.role = 'admin'`）待設定；隱私權政策加入 Resend 並修正第 18 行「Email 驗證登入」（2026-10-20 已修正、未 commit，見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」）（2026-10-16 更新：Vercel Production 已為新版並指向 Production Supabase，見「Step 11 — Production Purchase Entry 開關」的 Git／部署）

### Step 11 — Production Purchase Entry 開關（2026-10-16，Implementation — 已 commit／push `8ac0bcd`，Production 已自動部署）
- **背景**：Production 尚未部署 Contract／Payment Edge Functions、`contract_versions` 為空；已登入會員可從 Pricing「準備好了，開始契約審閱」進入 `/contract-review`，呼叫不存在的 `start-contract-review` 而出錯
- **新增前端開關 `VITE_ENABLE_PURCHASE`**：**預設關閉**，只有值為 `'true'` 才啟用新的購買流程（與 `VITE_ENABLE_SUBSCRIBE` 相同模式；`VITE_ENABLE_SUBSCRIBE` 邏輯未變更）
  - `router/AppRouter.jsx`：關閉時不註冊 `/contract-review`、`/checkout/return`（直接輸入網址為 404）
  - `pages/PricingPage.jsx`：關閉時已登入會員不顯示「開始契約審閱」，改顯示「付費方案即將開放，目前可先使用免費體驗。」＋「前往我的帳號」，且不讀取契約同意狀態；未登入訪客仍為「先免費試用 30 天」
  - `pages/AccountPage.jsx`：「購買方案」（`PlanPurchase`）區塊加上同一開關；**提前終止／退款不受開關影響**
- **環境設定**：Production **不設定**（維持關閉，直到正式開放付款）；Vercel **Preview** 需設定 `VITE_ENABLE_PURCHASE=true` 才能繼續在 TEST 測試契約審閱／付款流程（**已由使用者於 Preview 環境設定**）
- **驗證**：`npm run lint` 通過；開關關閉／開啟各 build 一次並比對 bundle——關閉時不含 `/contract-review`、`/checkout/return` route 與 `start-contract-review`／`create-order-checkout`／`confirm-checkout-session` 呼叫，含「付費方案即將開放」；開啟時與原行為相同；兩者皆保留提前終止按鈕
- **Git／部署**：`8ac0bcd`（"Gate contract review and checkout behind VITE_ENABLE_PURCHASE"）已 push 到 `origin/main`；push 觸發 Vercel Git integration **自動部署 Production**（`joti-cr7nu23h4`，2026-10-16 11:43 台灣時間）。線上 `joti-jotiyoga.vercel.app` bundle 確認：指向 Production Supabase、購買流程關閉（含「付費方案即將開放」、無 `/contract-review`）

### Step 11 — Contract Review Preview 測試（2026-10-16，TEST — Passed）
- **環境**：Vercel Preview `https://joti-ea6aypr15-jotiyoga.vercel.app`（branch alias `joti-git-preview-purchase-flag-test-jotiyoga.vercel.app`），branch `preview/purchase-flag-test`（暫時 branch，保留中），測試 commit **`8ac0bcd`**；Preview 使用 **TEST Supabase**（`ngznngqmbhxejkjbqomh`），`VITE_ENABLE_PURCHASE=true`
  - 部署方式：推送 branch 未自動觸發 Preview（branch 無新 commit），改以 Vercel API 指定 branch＋`8ac0bcd` 建立 Git-source Preview Deployment；未修改 Vercel 專案設定
- **測試結果**（一般會員以 TEST Supabase 登入）：
  - Pricing →「準備好了，開始契約審閱」→ `/contract-review` 流程正常
  - `start-contract-review` 正常建立審閱狀態
  - Contract Review 頁面正確顯示契約版本、契約提供時間（`presentedAt`）、最早可同意時間（`reviewAvailableAt`）
  - 3 天最低審閱期間由後端限制：`agree_to_contract()` 檢查 `review_presented_at + interval '3 days' <= now()`，未滿則 `no_eligible_pending_review`（`agree-to-contract` 回 409），前端無法繞過
- **本次功能測試：Passed**
- **UI／RWD 後續事項（非本次功能測試 failure，目前不處理）**：
  1. **Desktop 版排版過窄**：`ContractReviewPage.jsx` 外層沿用 `.auth-page`（`App.css`：`max-width: 480px`、置中對齊，為登入／帳號頁小卡片版型），契約全文、表格與方案區塊在桌面被擠成類手機版排列；公開 `/legal` 使用 `.legal-page`（760px、靠左）。修正時不宜直接改 `.auth-page`（Login／Account／Reset 等共用）
  2. **同意按鈕 UX**：審閱期內按鈕雖為 `disabled`，但 `.button` 無 disabled 視覺樣式（仍為主色、`cursor: pointer`），且無剩餘時間倒數；可同意狀態每 30 秒才重新判斷一次。後續應加倒數與明確 disabled 樣式、到期自動轉為主按鈕；倒數僅為前端 UX，審閱期限制仍以後端為準；`reacceptance` 模式不受倒數影響
  - 建議另開「Contract Review UI／RWD 修正」小階段，於正式開放付款前完成（Production 目前已由 `VITE_ENABLE_PURCHASE` 關閉此頁）；先修排版再修按鈕，於 Preview（TEST）一併驗證
- **注意**：Vercel 已連結 GitHub（Production Branch `main`），**push 到 `main` 即自動部署 Production**；後續修正應先於 branch Preview 驗證再合併

### Step 11 — Contract Review UI／RWD Refinement（2026-10-16，Implementation ＋ Preview 驗證通過 — 已合併 `main` `8592900`）
- **範圍**：只改 `frontend/src/pages/ContractReviewPage.jsx`、`frontend/src/App.css`；後端 3 天審閱規則、付款核心、`.auth-page`／`.button` 既有全域規則、`/subscribe`、契約中的 Oen 金流文字皆未修改
- **Implementation**：
  - 容器由 `.auth-page`（480px、置中）改為專用 `.contract-review-page`（`max-width: 760px`、靠左、`line-height: 1.8`，比照 `.legal-page`）
  - 審閱期間每秒更新倒數「審閱期間尚未結束，距離可同意還有 X 天 X 小時 X 分 X 秒」（原為每 30 秒判斷一次）；到達 `reviewAvailableAt` 自動啟用同意按鈕並停止計時，不需重新整理
  - 同意按鈕加 `.contract-review-agree`，審閱期間及 `agreeing` 時有明確 disabled 外觀（灰色、`cursor: not-allowed`）；啟用時維持 `.button` 主色
  - 倒數僅為前端 UX，審閱期仍以 `agree_to_contract()` server-side 檢查為準（未滿回 409 `no_eligible_pending_review`）；`reacceptance` 模式（無 `reviewAvailableAt`）行為不變
- **驗證**：`npm run lint`、`npm run build` 通過
- **Preview**：branch `preview/contract-review-ui`，commit `dee932c`（基於 `8ac0bcd`，僅含上述 2 個檔案）；`https://joti-iitkubqc5-jotiyoga.vercel.app`（branch alias `joti-git-preview-contract-review-ui-jotiyoga.vercel.app`），TEST Supabase、`VITE_ENABLE_PURCHASE=true`
- **Preview 驗證通過**（使用者以審閱中的測試會員實測）：桌面版排版正常；手機 RWD 正常；審閱倒數正常；未到期同意按鈕為 disabled 狀態
- **待驗證**：`reviewAvailableAt` 到期後自動啟用——待 **2026-10-19 12:18（台灣時間）**該測試會員審閱期屆滿時實測，與首購 E2E 一併進行；不因此項重新修改本輪 UI
- **Git 狀態**：`dee932c` 已於 2026-10-16 隨 A1 fast-forward 合併並 push 到 `main`（`8592900`），Production 已自動部署；Production `/contract-review` 仍由 `VITE_ENABLE_PURCHASE` 關閉（見「Production Readiness Checkpoint A1–A3」）

### Step 11 — Pricing 契約入口狀態化（2026-10-16，Implementation ＋ Preview 驗證通過 — 已合併 `main` `8592900`）
- **目的**：Pricing 頁契約入口依會員狀態只顯示一個按鈕（原本「查看完整會員服務契約」無條件顯示，已登入未同意者會與「準備好了，開始契約審閱」並列）
- **只改 `frontend/src/pages/PricingPage.jsx`**：新增 `getContractEntry()`，沿用 `useAuth()`、`getContractAcceptanceState()`、`canOfferPurchase(profile)`；未新增資料庫查詢，未修改 AuthProvider／membershipStatus／purchaseEligibility；其他 CTA（「先免費試用 30 天」「前往我的帳號」「已完成契約同意，前往我的帳號購買」）未變更
- **規則（`VITE_ENABLE_PURCHASE=true`）**：
  - 未登入 →「查看完整會員服務契約」（`/legal/terms`）
  - 已登入、尚未同意契約、具購買資格 →「準備好了，開始契約審閱」（`/contract-review`）；已有 `review_presented_at`（審閱進行中）時顯示「繼續契約審閱」——`start_contract_review()` 只在 `review_contract_version is null` 時寫入，重新進入不會重新計算 3 日審閱期
  - 已登入、已同意契約、具購買資格 → 不另顯示契約入口，沿用既有「已完成契約同意，前往我的帳號購買」
  - 已登入、目前有有效 Paid Service Period（不具購買資格）→「查看完整會員服務契約」
  - 登入狀態／會員資料／契約同意狀態尚在載入 → 暫不顯示契約入口；契約同意狀態讀取失敗 →「查看完整會員服務契約」（不導向審閱）
- **`VITE_ENABLE_PURCHASE` 未設定（Production）**：所有人一律顯示「查看完整會員服務契約」，保留 Pricing 頁唯一的公開契約入口；其餘行為不變
- **驗證**：`npm run lint`、`npm run build` 通過；以實際 `canOfferPurchase()`（Vite SSR 載入）對 10 種狀態測試 `getContractEntry()`，開關開啟／關閉兩種結果皆符合規則；開關開啟／關閉各 build 一次比對 bundle（關閉時含「付費方案即將開放」、不含「已完成契約同意，前往我的帳號購買」）
- **Git／Preview**：commit **`53df3cf`**（"Show one state-based contract entry on the pricing page"，接在 `dee932c` 之後），push 到 Preview branch **`preview/contract-review-ui`**；Preview `https://joti-4npp6xiru-jotiyoga.vercel.app`（branch alias `joti-git-preview-contract-review-ui-jotiyoga.vercel.app`），TEST Supabase、`VITE_ENABLE_PURCHASE=true`；`main` 未變更（仍為 `8ac0bcd`），未 merge、未影響 Production
- **Preview 驗證通過**（使用者以瀏覽器實測）：
  - 訪客 → 只顯示「查看完整會員服務契約」
  - 已登入、尚未審閱 → 只顯示「準備好了，開始契約審閱」
  - 審閱中的會員 → 只顯示「繼續契約審閱」
- **未進行瀏覽器實測（不視為失敗）**：「已同意契約、目前沒有方案」與「有有效付費方案」——目前沒有對應的測試帳號；兩種狀態已由上述 `getContractEntry()` 邏輯測試涵蓋
- **觀察備註**：第一次以原有瀏覽器開啟時看到舊版畫面，改開新的瀏覽器後確認新版 Preview 正常——判定為瀏覽器舊狀態／快取造成的觀察差異，非程式問題
- **Git 狀態**：`53df3cf`／`8592900` 已於 2026-10-16 隨 A1 合併並 push 到 `main`，Production 已自動部署（購買流程關閉時所有人皆顯示「查看完整會員服務契約」）
- **補測**：「已同意、目前沒有方案」與「有有效付費方案」兩種狀態已於 A3（`+trial2`）瀏覽器實測通過（見「Production Readiness Checkpoint A1–A3」）


### Step 11 — Production Readiness Checkpoint A1–A3（2026-10-16，A1／A2／A3 完成；PlanPurchase 修正已 push `main`，待 Preview 實測）
- **環境現況（2026-10-16）**：

  | 環境 | 位置 | 程式版本 | Supabase | 用途／設定 |
  |---|---|---|---|---|
  | Production | `https://joti-jotiyoga.vercel.app`（另有別名 `frontend-ebon-seven-40`、`joti-git-main-jotiyoga`），部署 `joti-shb2fuby7` | `main` `8592900`（Git integration，push `main` 即自動部署） | Production `qhyfpabyqksuwjzshjtu` | 對外網站；`VITE_ENABLE_PURCHASE` 未設定（購買流程關閉）；Production Edge Functions／secrets 皆 0、`contract_versions` 0、Admin 0、Auth users 1 |
  | Preview（穩定網址） | `https://joti-git-preview-contract-review-ui-jotiyoga.vercel.app`（branch `preview/contract-review-ui`，目前 `8592900`） | 與 `main` 相同 | TEST `ngznngqmbhxejkjbqomh` | TEST 購買／契約流程驗證；Preview 環境 `VITE_ENABLE_PURCHASE=true`、`VITE_ENABLE_SUBSCRIBE=true`（舊 Oen「訂閱 JOTI」入口仍會顯示） |
  | TEST Supabase | `ngznngqmbhxejkjbqomh` | — | — | `ACTIVE_PAYMENT_PROVIDER=ecpay`；`SITE_URL`=上述穩定 Preview 網址（A2） |

  - 另有暫時 branch `preview/purchase-flag-test`（`8ac0bcd`，保留中，未刪除）
- **A1 Preview → `main` 合併（完成）**：`main` 由 `8ac0bcd` fast-forward 至 `8592900`（`dee932c` Contract Review UI／`53df3cf` Pricing 契約入口／`8592900` 文件），內容與已驗證的 Preview branch 完全一致；未納入工作樹其他既有修改。push 後 Vercel 自動部署 Production（`joti-shb2fuby7`，READY）；線上 bundle 確認指向 Production Supabase、購買流程仍關閉（含「付費方案即將開放」、無 `/contract-review`）、保留「查看完整會員服務契約」
- **A2 TEST `SITE_URL`（完成）**：由 `https://joti-3e82xtu9i-jotiyoga.vercel.app`（Step 11.1 舊 Preview）改為 `https://joti-git-preview-contract-review-ui-jotiyoga.vercel.app`（2026-10-16 06:52 UTC，以 secret digest 比對確認生效）；`ACTIVE_PAYMENT_PROVIDER` 已為 `ecpay`，未重設；Production secrets 未變更（仍為空）
- **A3 TEST 續購與異常情境（完成，`+trial2`，穩定 Preview）**：
  - **前置**：`+trial2`（`luckster.ai.workspace+trial2@gmail.com`，`8919af6a-f3cd-4d5e-9adb-408ae884e8ac`）密碼未知，由使用者以正常「忘記密碼」流程重設後登入（僅變更 `auth.users`，契約同意 4 筆與其他狀態未動）
  - **Scenario 1 已同意、無方案 — PASS**：Pricing 只顯示「已完成契約同意，前往我的帳號購買」；Account 顯示「購買方案」；月方案成功建立 Session 並轉至綠界
  - **Scenario 2 已有進行中 Session、另一分頁再購買 — 後端 PASS／畫面 FAIL**：`create-order-checkout` 回 **409**（依可能的 409 原因推定為 `checkout_session_in_progress`），未建立第二筆 Session；畫面卻顯示英文「Edge Function returned a non-2xx status code」，未切換為「付款進行中」（見下方 PlanPurchase 409 UI 問題）
  - **Scenario 3 TEST 月方案付款 — PASS**：Session `f1de6dc9-5a15-4790-b5e7-87639d9ac612`（MerchantTradeNo `J2610161524035F37LMC`）`fulfilled`；Order `af02d029-6964-4d87-9aa7-7c9a5de8422f` `paid`（333、ecpay、monthly、`v1.0`、沿用契約同意 `8494c887-…`、TradeNo `2610161524046047`）；Service Period `f46f6d7d-9d5b-457f-8b86-61c7b21baf73`（2026-10-16 07:28:48 → 2026-11-16 07:28:48 UTC）；payment_event `2610161524046047:1` `verified`（webhook 開通）；全庫僅各新增 1 筆、有效期間重疊 0；JOTI 返回頁未檢視（停在綠界「付款成功」頁）
  - **Scenario 4 已有有效方案再購買 — PASS**：TEST DB 直接呼叫 `create_checkout_session()` → `active_service_period_exists`，未寫入；Account「付費會員」、到期日 2026/11/16、無「購買方案」、僅「提前終止目前方案並退款」；`/contract-review` 顯示「你目前已有有效的方案」；Pricing 只顯示「前往我的帳號」＋「查看完整會員服務契約」
  - **Scenario 5 rejected 競態 — 未於 TEST 實測**（使用者同意）：以既有 PGlite SQL 測試結果為驗證依據；同一會員同時僅能有一個 open Session，雙分頁實際結果為 409（Scenario 2）
  - **測試資料（TEST）**：上述 Session／Order／Service Period／payment_event 各 1 筆；Scenario 2、4 的被拒嘗試未寫入資料
- **`+trial2` 目前狀態**：（2026-10-16 時）TEST 有效月方案至 2026-11-16；**2026-10-19 更新**：該期間已於 TEST 回歸中提前終止，並重新購買新月方案至 2026-11-19 08:02:36 UTC（見「Step 11 — ECPay LIVE mode Implementation」）
- **PlanPurchase 409 UI 問題（A3 發現）與修正**：
  - **原因**：`PlanPurchase.jsx` 只讀 `data?.error`；non-2xx 時 supabase-js `data` 為 null、錯誤內容在 `error.context`，因此 `CHECKOUT_ERROR_TEXT` 對不到、「付款進行中」切換從未觸發
  - **修正（已完成，僅 `frontend/src/components/PlanPurchase.jsx`）**：沿用 Step 11.2 的 `readTerminationBody(data, error)` 取得錯誤碼，沿用既有 `CHECKOUT_ERROR_TEXT` 與「付款進行中」狀態；未知錯誤／網路錯誤一律顯示「無法建立訂單，請稍後再試。」；成功路徑（`startProviderCheckout`）、後端購買規則、付款流程未變更；未重構或更名 `readTerminationBody`
  - **驗證**：`npm run lint`、`npm run build` 通過；以實際 `readTerminationBody`／`CHECKOUT_ERROR_TEXT` 與 supabase-js `FunctionsHttpError`／`FunctionsFetchError`／`FunctionsRelayError` 測 9 種情境全部符合（200 ECPay formPost 照常進入付款；409 `checkout_session_in_progress` → 中文＋切換「付款進行中」；409 `active_service_period_exists` → 中文；其餘 → 通用中文訊息）
  - **Git**：2026-10-16 與本文件一併 commit 並 push 到 `main`（commit 訊息 "Show Chinese checkout errors when purchase is blocked"），push 觸發 Vercel 自動部署 Production；Production 購買流程關閉（`VITE_ENABLE_PURCHASE` 未設定），無可見影響
  - **尚未進行**：Preview 瀏覽器實測（`+trial2` 目前有有效方案，雙分頁情境需待無方案帳號，例如 10/19 首購帳號）
- **已知問題（未修改）**：`ContractReviewPage.jsx` `handleAgree`（`agree-to-contract`／`reaccept-contract`）同樣只讀 `data?.error`，後端 409 `no_eligible_pending_review` 時無法顯示「尚未滿最低審閱天數…」而會顯示英文錯誤；正常情況前端倒數會先停用按鈕，使用者時鐘不準時才會遇到（2026-10-20 更新：Discovery 確認實際情況為**同意失敗時畫面完全不顯示訊息**（失敗後回到 `ready`，但 `message` 只在 `error` 狀態顯示），`start-contract-review` 失敗則顯示英文錯誤；已修正、未 commit，見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」）
- **工作樹中與本階段無關的既有修改（非本次成果，維持不動）**：已修改 `frontend/package.json`、`frontend/package-lock.json`（`supabase` devDependency）、`frontend/src/content/modules/warmup04-self-authority-3min.md`、`supabase/functions/_shared/oen.ts`、`supabase/functions/create-subscription-checkout/index.ts`（Legacy Oen subscription）；未追蹤 `docs/business/future-product-direction.md`、`docs/development/website-refinement.md`、`warmup05`／`warmup06`／`warmup07` Module `.md`
- **下一步與依賴**：
  1. PlanPurchase 修正：已 push `main`；待 Preview 瀏覽器實測雙分頁「付款進行中」畫面（依賴無方案的測試帳號；穩定 Preview branch 需同步到最新 `main` 才會包含此修正）
  2. **2026-10-19 12:18（台灣時間）後**：以審閱中的測試會員於穩定 Preview 進行 (a) Contract Review 到期後同意按鈕自動啟用、(b) **首購 E2E**（同意 → 購買 → ECPay 測試卡 → 開通）、(c) Pricing 依狀態切換；可於該帳號付款前一併重測雙分頁 409 的「付款進行中」畫面——**2026-10-19 已完成首購 E2E，資料驗證 PASS**（見「Step 11 — 首購 E2E（2026-10-19）」）
  3. ~~是否修正 `ContractReviewPage` 同類 409 錯誤解析（待決定）~~——2026-10-20 已修正（未 commit）；瀏覽器實際觸發 409 仍為 Pending（驗證），見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」
  4. Production 開放付款前（見「Next Steps」）：綠界正式特店審核與回覆（ReturnURL 網域、一般賣家、履約保證；**ECPay 已於 2026-10-19 確定採用**）、**ECPay live mode 程式修改**（見 Next Steps 第 4 點）、正式上線時間 → `contract_versions` v1.0、契約網站欄位（付款方式文字已於 2026-10-19 改為 ECPay）、Production Edge Functions／secrets、升級 Pro（2026-10-20：是否升級改列 Future Decision）、`joti.yoga` 綁定、Production 開啟 `VITE_ENABLE_PURCHASE` 與真實小額付款／退款驗證、退款例外作業規則（>90／>360 天、`refund_failed`、`rejected`）；另：~~隱私權政策加入 Resend 並修正第 18 行~~（2026-10-20 已修正、未 commit）、Production Admin 設定、Auth 後續（驗證信 `redirect_to` 原因待確認、首頁 `#error` 無提示、Resend Click Tracking 仍為 ON——見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」之 External / Pending）

### Step 11 — 首購 E2E（2026-10-19，TEST — 資料驗證 PASS）
- **環境**：穩定 Preview `https://joti-git-preview-contract-review-ui-jotiyoga.vercel.app`；同日先將 branch `preview/contract-review-ui` 由 `8592900` fast-forward 至 `e0b081f`（與 `main` 相同，含 PlanPurchase 409 修正；未 force、未動 `main`／Production），Vercel 自動部署 Preview `joti-8spisjirn-jotiyoga.vercel.app`（`dpl_EB9LttwZe1nh1yFEtz1u4W7xu87h`，READY），穩定網址已指向此部署；TEST Supabase、`VITE_ENABLE_PURCHASE=true`、TEST `ACTIVE_PAYMENT_PROVIDER=ecpay`、`SITE_URL`=穩定 Preview
- **測試會員**：10/16 開始審閱的 TEST 會員（user `8b9d7f17-bd57-4b15-835e-c5d48380ae76`，`member`、無 Legacy subscription），從未同意契約 → 走完整首購流程（審閱 3 日 → 同意 → 月方案 → ECPay 測試卡付款）
- **時間序（UTC）**：審閱開始 10/16 04:18:48 → 可同意 10/19 04:18:48（剛好 3 日）→ 同意 04:49:23 → Checkout Session 建立 04:50:58（期限 05:20:58）→ ECPay webhook 收到 04:51:58.586 → 開通 04:51:59（Session fulfilled、Order 與 Service Period 同時建立）
- **資料驗證（read-only，全部 PASS）**：
  - **Contract acceptance** `3ab913c5-d02f-4564-b834-b916a91ff3b8`：`v1.0`，`contract_presented_at` 10/16 04:18:48、`contract_review_available_at` 10/19 04:18:48、`contract_acceptance_at` 10/19 04:49:23（晚於可同意時間，3 日 server-side 規則成立）；該會員僅此 1 筆；`profiles.review_contract_version`／`review_presented_at` 已清空
  - **Checkout Session** `766d472f-3fc4-4824-891b-ed209f627a24`（MerchantTradeNo `J261019125057A9AI8AC`）：`fulfilled`、monthly、333 TWD、`v1.0`、`contract_acceptance_id`=上述同意紀錄、`order_id`=下列 Order、`provider_ref` `2610191250589502`、`payment_method` card、`reject_reason` null；於 30 分鐘期限內完成；該會員僅此 1 筆
  - **Order** `3903d177-193c-4453-914e-b0b7d4f73715`：`paid`、`ecpay`、monthly、333 TWD、`v1.0`、`contract_acceptance_id`=上述同意紀錄、`provider_checkout_ref`=MerchantTradeNo、`provider_ref`=TradeNo、`payment_attempt` 1、`scheduled_service_start` null、退款欄位皆空；於付款確認時（04:51:59）才建立；該會員僅此 1 筆、同 TradeNo 全庫僅 1 筆
  - **Service Period** `02112fac-6763-4460-9ba9-1c32b7884ddf`：monthly、`active`、未終止，2026-10-19 04:51:59 → 2026-11-19 04:51:59 UTC（付款確認起算 1 個月），`order_id`=上述 Order；該會員僅此 1 筆
  - **Payment event** `2610191250589502:1`：`payment.Credit_CreditCard.1`、`ecpay`、mode `test`、`verified`、對應上述 Order、無 note；RtnCode 1、TradeAmt 333、CustomField1=Session ID、SimulatePaid 0、MerchantTradeNo 一致；收到 → 處理約 0.7 秒；同 TradeNo 僅 1 筆（綠界未重送），由 webhook 開通（無 `confirm:*` event）
  - **無重複／overlap**：全庫 Checkout Session／Order／Service Period／payment_event 相較 A3 結束時（4／12／5／12）各恰增加 1 筆（5／13／6／13）；有效 Service Period 重疊 0
- **結論**：**首購 E2E（資料面）PASS**——審閱 3 日 → 同意 → Checkout Session → ECPay 付款 → webhook 驗證 → Order＋Service Period 開通全鏈路正確
- **本次未記錄（未由資料驗證涵蓋）**：Contract Review 到期後同意按鈕自動啟用（不需重新整理）、JOTI 付款返回頁顯示、付款前後 Pricing／Account 狀態切換的瀏覽器觀察結果；PlanPurchase「付款進行中」（雙分頁 409）畫面仍未於 Preview 實測
- **測試資料（TEST）**：上述 Contract acceptance／Session／Order／Service Period／payment_event 各 1 筆；該測試會員目前為有效月方案付費會員至 **2026-11-19 04:51:59 UTC**（與 `+trial2` 至 11-16 相同，皆不再處於「已同意、無方案」狀態）

### Step 11 — 付款模式與方案變更規則落實（2026-10-19，文件／網站文字修改 — 未 commit）
- **正式決策（2026-10-19）**：
  1. **JOTI 正式採用綠界科技 ECPay**；**購買當下於 ECPay 付款流程完成付款，付款成功（經伺服器端驗證）後才建立已付款 Order 並開始付費服務期間**；**不採**先綁卡、待日後條件成就（例如免費試用屆滿）始扣款之模式
  2. **JOTI 目前不提供方案變更**：不再承諾「立即變更」或「到期後開始」；有效付費服務期間存續中不得另行購買其他服務期間（與 ECPay Checkout Session 流程之 `active_service_period_exists`／`plan_change_not_supported`／`after_expiry_not_supported` 一致）
  - 付款方式措辭保持彈性：依 ECPay 付款頁所提供之方式完成付款，**未**限制或預先決定年方案是否開放信用卡分期
- **修改檔案**：
  - **契約**（`docs/legal/versions/v1.0.md` 與 `docs/legal/joti-online-teaching-contract.md`，**逐字一致**）：第五條第四項、第六條第三項的「付款授權」措辭；**第八條**標題改為「服務期間之購買、付款與訂單」、購買流程改為「選擇方案 → 確認購買 → ECPay 付款頁付款 → 伺服器端驗證 → 建立已付款訂單 → 啟用服務期間（自付款驗證完成時起算）」、第二項措辭、**第三項由「先行綁定付款方式、待條件成就後再行扣款」改為「購買當下完成付款」**（未完成付款或未經驗證者購買不成立）、第四項交叉引用改為「依第一項完成之付款」；第九條第二項第三款、第四項的「付款授權」措辭；**第九條之一改為「甲方目前不提供方案變更」**（保留不重疊原則與「提前終止後再購買／屆滿後再購買」說明）；第十九條、附件一付款方式由 Oen 改為綠界科技 ECPay
  - **Pricing**（`frontend/src/data/pricing.js`）：`trial.noImmediateCharge` 改為「免費試用不會自動轉為付費…於 ECPay 付款頁完成付款，付款成功後付費服務期間隨即開始」（key 名稱不變，`PricingPage.jsx` 未修改）
  - **付款規格**：`docs/business/payment/payment-legal-spec.md`（§1 概念表、§5／§7 流程、§7A 改為「目前不提供」、§9 改為 ECPay 使用範圍、§10 改為購買當下付款流程）；`docs/business/payment/payment-integration-rules.md`（付款流程、Webhook 驗證改為 ECPay CheckMacValue＋QueryTradeInfo、ECPay 使用邊界、測試要求與禁止模式措辭；「已知衝突」標註為歷史紀錄、原文保留）
- **未修改（歷史／相容性）**：Plan Change 程式與資料庫（`create-plan-change-checkout`、`schema_plan_change.sql`、相關 RPC 與前端註解）、舊 Oen 訂閱／`oenAdapter` 程式、`CHECKOUT_ERROR_TEXT`、`order-schema-proposal.md`、本文件既有歷史紀錄；Production 部署時不部署 `create-plan-change-checkout`
- **待後續（非本次範圍）**：隱私權政策中的 Oen（第 34、35、77 行；2026-10-20 已改為綠界科技 ECPay、未 commit，見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」）、契約網站欄位 `[待填寫]`；第七條第三項「單次給付之總價」措辭是否與日後可能開放之信用卡分期相容，待決定是否調整
- **影響**：TEST `contract_versions` v1.0 指向的 `v1.0.md` 文字已更新（TEST 既有 acceptance 為測試資料）；Production 尚無 `contract_versions`／acceptance，上線前修改 v1.0 不違反「不建立 v1.1」決策；合併 `main` 後 `/legal/terms` 與 Pricing 新文字將隨 Production 自動部署公開

### Step 11 — ECPay LIVE mode Implementation（2026-10-19，程式修改＋本機檢查通過＋已部署 TEST＋TEST 回歸 PASS — 程式未 commit；Production 未部署）
- **範圍**：只改 5 個 Edge Function 檔案；前端、資料庫 schema、`config.toml`、付款架構未修改
  - `_shared/ecpayAdapter.ts`：移除建立付款（`buildSignedCheckout`）與退款（`refundEcpayOrder`）的 `ECPAY_MODE !== "test"` 硬性限制，改由既有 `ecpayConfigError()` 把關（mode／主機一致：test ↔ `payment-stage.ecpay.com.tw`、live ↔ `payment.ecpay.com.tw`，並檢查 MerchantID／HashKey／HashIV／ReturnURL）
  - `ecpay-webhook/index.ts`：移除非 test 即略過的限制；**設定錯誤時改回 `0|config`（500）並 `console.error`**（原為 `1|OK`，正式環境設定錯誤時付款通知會被吞掉）；`payment_events.mode` 改為實際 `ECPAY_MODE`（含 anomaly 紀錄）
  - `confirm-checkout-session/index.ts`：改為只檢查 `ecpayConfigError()`；`payment_events.mode` 改為實際 `ECPAY_MODE`
  - `terminate-service-period/index.ts`：ECPay 退款金額 ≤ 0 時不呼叫 DoAction，直接 `mark_refund_processed(…, 'no_refund_due')`，回傳 `{ status: 'refunded', note: 'no_refund_due' }`
  - `_shared/ecpay.ts`：僅更新「TEST only」檔頭註解
  - 保留：CheckMacValue 驗章、MerchantID 比對、QueryTradeInfo 回查與 TradeNo／金額比對、`SimulatePaid=1` 略過、`payment_events` 冪等、`fulfill_checkout_session()`、`ChoosePayment=Credit`
- **本機檢查（通過）**：`deno check`／`deno lint`（以 `npx deno@2.5.6`）；scratchpad harness 直接載入實際模組並 stub `Deno.serve`／`fetch`（綠界公開測試商店金鑰）——test＋stage 與 live＋正式主機皆可建立付款；mode／主機不一致與無效 mode 一律擋下且無任何外部呼叫；webhook 付款成功（test／live）分別向對應主機 QueryTradeInfo 回查並呼叫 `fulfill_checkout_session`、`mode` 寫入實際值；`SimulatePaid=1` 不回查、不開通；驗章失敗回 400 並記 anomaly（`mode=live`）；設定不一致回 `0|config` 且不寫資料；退款 live 送往正式 DoAction、不一致時擋下；提前終止退款 0 不呼叫 DoAction
- **TEST 部署（2026-10-19 07:38 UTC）**：以 `git -c core.autocrlf=false archive HEAD`（`2a1a499`）建立乾淨副本、僅覆蓋本輪 5 個檔案（工作樹中無關的未提交 `oen.ts`／`create-subscription-checkout` 未帶入），`supabase functions deploy … --project-ref ngznngqmbhxejkjbqomh --use-api` 部署至 TEST：`ecpay-webhook` **v8**、`confirm-checkout-session` **v6**、`create-order-checkout` **v12**、`terminate-service-period` **v9**；`verify_jwt` 不變（webhook false、其餘 true）；其他 Functions 未重新部署；Production Functions 仍為 0
- **TEST 回歸（2026-10-19，`+trial2`，穩定 Preview）— PASS**：
  - **提前終止**（使用者於 Preview 操作，`terminate-service-period` v9）：Service Period `f46f6d7d-…` `terminated_at` 07:48:58 UTC、無有效／未來 Service Period、無 open Checkout Session、契約同意 4 筆保留、符合重新購買條件；Order `af02d029-…` `refund_failed`、`refund_amount` 300（3 日 × NT$11，公式正確）、`provider_refund_error` 為 ECPay stage `RtnCode=10000002 error_amount_R`（與 10/12 相同，TEST 預期結果）；未產生多餘資料
  - **月方案重新購買**：MerchantTradeNo `J261019155613HG939Y2`、NT$333、ECPay stage 付款成功 → Checkout Session `b63cf5cd-9e22-4e2c-9889-c0e47b9376ae` `fulfilled`（07:56:14 建立、08:02:36 完成）→ payment_event `2610191556140412:1` `verified`、**`mode=test`**、`SimulatePaid=0`、RtnCode 1、TradeAmt 333（webhook 收到至處理約 1.1 秒）→ Order `59a1fb11-b601-4ffa-ab8a-25cd78b8c742` `paid`（付款確認時才建立、沿用契約同意 `8494c887-…`）→ Service Period `38083c41-0863-4ecb-aef6-8f5ab48bfb07` 2026-10-19 08:02:36 → 2026-11-19 08:02:36 UTC（付款驗證完成時起算 1 個月）；同 TradeNo 僅 1 筆 Order／payment_event、無重複、全庫有效期間重疊 0、近 2 小時無 anomaly／驗證失敗紀錄
  - **畫面**（使用者確認）：`/checkout/return` 顯示「付款已確認，你的帳號狀態已更新。」；Account 已反映新的有效月方案
  - **結論**：正常購買 E2E「JOTI → Checkout Session → ECPay TEST → webhook → 驗章／回查 → Order paid → Service Period → checkout return」**TEST PASS**（非 Production 驗證）
- **`+trial2` 目前狀態**：TEST 有效月方案至 **2026-11-19 08:02:36 UTC**（不再處於「已同意、無方案」）；不為測試刻意變更此帳號
- **追蹤事項**：
  - **TODO**：本輪 5 個 Edge Function 檔案（與本文件更新）**尚未 commit／push**——TEST 目前執行的 v6／v8／v9／v12 來自乾淨副本，尚未進入 Git，應先 commit 並經 Preview branch 合併 `main`（push `main` 只觸發前端 Production 部署，Edge Functions 不會自動部署至 Production）；另含前端 `frontend/src/utils/terminationResult.js`（0 元退款提示，2026-10-19 修正）亦尚未 commit
  - **Pending（驗證）**：`confirm-checkout-session` 的 webhook 晚到／由 checkout return 路徑完成開通——本輪付款由 webhook 先開通，未產生 `confirm:*` 事件，尚未實測（非遺留問題）
  - **Pending（驗證）**：同一會員雙分頁／同時購買時的 in-progress Checkout Session 保護與 PlanPurchase「付款進行中」畫面——後端 409 已於 A3 驗證、畫面修正已上 `main`，本輪未做 UI 情境實測
  - **Pending（驗證）**：退款金額 0 元路徑（不呼叫 DoAction、`no_refund_due`）——本機情境測試通過，TEST 尚無自然產生 0 元退款的實際 E2E；不為測試刻意變更現有測試帳號；前端 0 元提示文案已修正，亦待同一次 0 元 E2E 一併確認畫面
  - ~~**TODO**：退款金額為 0 時的前端文案~~——**2026-10-19 已修正（未 commit）**：`frontend/src/utils/terminationResult.js` 的 `classifyTerminationResult()` 在 `status === 'refunded'` 且 `note === 'no_refund_due'` 時改顯示「已提前終止目前方案。依契約第十一條計算，本次沒有可退還的金額，因此不會產生退款。」；`kind: 'refunded'`、`refresh: true` 不變，其餘情境文案與行為不變（scratchpad 比對修改前後 11 種情境僅此 1 種改變；`npm run lint`／`npm run build` 通過）；AccountPage、後端、Oen 路徑未修改。0 元退款實際 E2E 仍為下方 Pending（驗證）
  - **Future Decision**：ECPay 付款超過 90 天的退款處理方式——本輪未實作、未自行定規則，正式上線前決定（見 Open Questions「退款期限對既定退款規則的處理方式」）
  - **External / Pending**：Production LIVE——Production secrets（`ECPAY_MODE=live`、`ECPAY_PAYMENT_BASE=https://payment.ecpay.com.tw`、正式 `ECPAY_MERCHANT_ID`／`HASH_KEY`／`HASH_IV`、`ECPAY_RETURN_URL`、`SITE_URL`、`ACTIVE_PAYMENT_PROVIDER=ecpay`）、Production Edge Functions 部署、綠界正式特店核准與 Q1／Q2 回覆、Production 小額真實付款＋DoAction 退款 E2E 皆未完成（見 Next Steps 第 4 點）；**本輪 PASS 僅限 TEST**


### Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理（2026-10-20，Discovery＋Implementation — 未 commit／未部署）
- **Privacy Policy**（`docs/legal/joti-privacy-policy.md`）：Discovery 完成；依目前實際架構完成文字更新——§2.1「以 Email 與密碼註冊時取得」（取代「Email 驗證登入」）；§2.2「會員資格與付費服務期間狀態」（取代「會員／訂閱狀態」）；§2.4「訂單、付款與退款狀態紀錄」（含退款金額、狀態與時間）、交易識別資訊改為綠界科技 ECPay（特店交易編號、綠界交易編號、付款方式類別）、卡號由綠界科技 ECPay 直接處理；§2 新增「7. 契約審閱與同意紀錄」（契約版本、提供審閱時間、最早可同意時間、同意時間）；§3 新增「寄送帳號驗證、密碼重設等服務通知」；§5 Oen 改為「綠界科技 ECPay｜付款與退款處理…」並新增「Resend｜寄送帳號驗證、密碼重設等系統通知信」。全文已無 Oen／訂閱／Email 驗證登入字樣；§1、§4、§6–§9、§2.6 Cookie、契約第十八／十九條引用未修改。`npm run lint`／`npm run build` 通過，打包內容含新文字；**原「隱私權政策加入 Resend、修正第 18 行、Oen 改 ECPay」TODO 已完成（未 commit）**
- **ContractReviewPage**（`frontend/src/pages/ContractReviewPage.jsx`）：Discovery 完成；`start-contract-review` 與 `handleAgree`（`agree-to-contract`／`reaccept-contract`）改以既有 `readTerminationBody(data, error)` 解析非 2xx 錯誤碼（與 PlanPurchase 相同），新增本頁中文對照 `CONTRACT_ERROR_TEXT`（`no_eligible_pending_review`、`no_reacceptance_required`、`already_accepted`、`no_current_contract_version`、`unauthorized`），未知錯誤顯示通用中文訊息、不再顯示英文原始錯誤；同意失敗（回到 `ready`）時於按鈕下方顯示訊息；重新同意模式讀取失敗改為通用中文訊息。後端、3 日審閱規則、倒數、reacceptance 流程、PlanPurchase 未修改。`npm run lint`／`npm run build` 通過；以實際 `FunctionsHttpError`／`FunctionsFetchError` 模擬 12 種情境（同意 409×3、401、500、網路錯誤、200；載入 503、401、500、非 JSON、200）全部符合
- **追蹤事項**：
  - **TODO**：上述兩個檔案尚未 commit／push（合併 `main` 後 `/legal/privacy` 新文字將隨 Production 自動部署公開；`/contract-review` 在 Production 仍由 `VITE_ENABLE_PURCHASE` 關閉）
  - **Pending（驗證）**：ContractReviewPage 於瀏覽器實際觸發 409／401／503 的畫面驗證——Preview 不易自然觸發，待自然情境出現時確認，不為測試刻意修改資料
  - **Future Decision**：Privacy Policy 是否需揭露 Supabase、Resend、Vercel、Bunny 等服務之資料儲存國家／地區（見 Open Questions）；決定前不寫入政策
  - **External / Pending**：Resend Support 確認 `auth.joti.yoga` Click Tracking 是否關閉（Dashboard 顯示 ON 且設定無法保存；先前已確認驗證信連結未被改寫）；確認前 Privacy Policy 不對信件追蹤作額外承諾

### Step 11 — Production Hosting／$0 平台費用評估（2026-10-20，Discovery；2026-10-22 已定案，見「Step 11 — Production Hosting 最終選型（ADR 0004）」）
- **目標**：在不降低 Production reliability／security／legal compliance 的前提下，評估維持 $0 固定平台月費的可行性；完整決策狀態見 ADR `docs/development/adr/0004-production-hosting-platform.md`
- **Hosting**：Vercel Hobby 依 Vercel Fair Use Guidelines 不得用於商業（含向訪客收款）用途，正式開放付款後不可作為 Production
  - **Cloudflare Pages Free**：~~Candidate／External Confirmation Pending（未採用）~~（2026-10-22 選定，見「Step 11 — Production Hosting 最終選型（ADR 0004）」）——Cloudflare Self-Serve Subscription Agreement §2.2.1(h)（禁止於接受 Free Services 之 web property 處理或收集信用卡資料）對 JOTI 架構（卡片資料由 ECPay hosted payment page 處理，JOTI 前端不接收或儲存卡片資料，webhook 直達 Supabase）存在解釋疑義（「web property」「process」「credit card information」未定義）；`joti.yoga` DNS 已使用 Cloudflare Free，此疑義亦涉及現有 DNS
  - **Vercel Pro**：Production fallback（Production-ready，未選定）；~~Cloudflare 確認前不得移除~~（2026-10-22：Cloudflare Pages 通過 Production validation 前保留 Vercel 專案）
  - 若採 Cloudflare 屬 hosting layer migration（前端／Supabase／ECPay／Edge Functions／DB 原則上不需重做）；最終決策前不進行正式 Production migration，僅允許可逆 PoC
- **Supabase Free**：keep-alive（`.github/workflows/supabase-keepalive.yml`，約每 6 小時）已存在並正常運作（2026-10-14 起排程執行全部成功）；Free 方案無平台 backup／PITR（Supabase 官方文件確認），需自建加密 off-site backup
- **追蹤事項**：
  - **External / Pending**（2026-10-22：**不再為上線條件**——§2.2.1(h) 已依 Platform Selection Gate 以低風險例外接受；詢問信仍建議送出，見「Step 11 — Production Hosting 最終選型（ADR 0004）」）：Cloudflare 對 §2.2.1(h) 之書面確認（涵蓋 Pages Free 與 DNS Free 上的 JOTI 付款架構）
    - **2026-10-20**：英文詢問信**已擬定、尚未送出**（全文未存入 repo）。內容：說明 JOTI 架構（靜態 SPA、ECPay hosted payment page、ReturnURL 直達 Supabase 不經 Cloudflare、payload 無卡片資料）、引用 §2.2.1 lead-in／§2.2.1(h)（2025-09-12）與 Developer Platform Service-Specific Terms（2026-09-28），提出 6 題：(1) Free 方案（DNS＋Pages）可否用於商業付費會員網站；(2) 導向第三方 hosted payment page 是否屬「process or collect credit card information」；(3)「web property」是否指整個 zone、僅使用 DNS Free 是否即適用；(4) 付款狀態／交易編號／付款方式類別是否屬「credit card information」；(5) 若不允許需何種方案；(6) 回覆可否視為 §2.2.1 之「expressly permitted in writing」
    - **TODO（使用者）**：補上帳號 Email、署名與聯絡信箱；確認 `joti.yoga` apex／`www` 是否開啟 Cloudflare proxy 並於信中註明；送出管道建議以 Dashboard Support case（帳號／帳務類別）為主、Sales 聯絡表單為備用（實際受理管道未確認）；送出後保留 case 編號、回覆全文、回覆人身分與日期，寫入 ADR 0004
    - **此信無法解決之疑義**：一般 Support 回覆不一定等同正式書面允許（取得前 ADR 0004 維持 External Confirmation Pending）；確認僅對回覆當下條款有效（依 Platform Selection Gate 第 11 項定期複查）；未涵蓋 Pages Functions／Workers／proxy／WAF 等其他用法（改用時須重新確認）；正面回覆後仍需可逆 PoC 與 Production Validation 方可改為 Accepted
  - ~~**Future Decision**：Hosting 最終決策（Cloudflare Pages Free 或 Vercel Pro，見 ADR 0004）~~——2026-10-22 定案：Cloudflare Pages Free，見「Step 11 — Production Hosting 最終選型（ADR 0004）」
  - **Future Decision**：是否接受 Supabase Free 長期營運風險（不視「正式開放付款前升級 Pro」為既定決策），待 backup／restore 驗證與整體風險評估後決定；連帶決定備份頻率／RPO／保存期限／存放位置（及隱私權政策是否需提及）、升級付費方案觸發條件（2026-10-22：備份頻率、存放位置與加密已於 ADR `docs/development/adr/0005-production-backup-architecture.md` 定案；保存期限、隱私權政策揭露、升級觸發條件仍待決，見「Step 11 — Production Backup Architecture（ADR 0005）」）（契約審閱／同意紀錄之 RPO 缺口見「Step 11 — Supabase Free Backup／Restore Discovery」）
  - **TODO**（2026-10-22：架構已於 ADR 0005 定案；第一次 Production Backup 與 Restore Drill 已成功；2026-10-22 起每 6 小時備份、每週 drill、Healthchecks 監控與保存期限輪替已上線，見「Step 11 — Production Backup Phase 1：排程、監控與輪替」；DR runbook 與 hosted DR drill 尚未進行）：Supabase Free 加密 off-site backup（`public`＋`auth`）、每次備份之 restore verification、災難還原手冊與設定清單（Auth 設定、Edge Functions、secrets），上線前至少一次 DR drill（細項與正式開放付款前最低要求見「Step 11 — Supabase Free Backup／Restore Discovery」）
  - ~~**Pending（驗證）**：GitHub Actions 經 Session pooler（IPv4）執行 `pg_dump`（Supabase 官方僅列直連供 `pg_dump`，直連為 IPv6-only）；含 `auth` schema 之 restore 至一般 PostgreSQL 17~~——2026-10-20 更新：官方 backup/restore 指南已明示預設使用 Session pooler；還原目標須為 Supabase 環境而非一般 PostgreSQL，見「Step 11 — Supabase Free Backup／Restore Discovery」
  - **TODO（P1，正式開放付款前）**：Payment reconciliation——每日 QueryTradeInfo 回查找出「已付款未開通」、webhook 異常偵測、Order／Service Period／payment_event 交叉比對（與 Supabase 方案無關，Pro 亦需要）


### Step 11 — Production Hosting 最終選型（ADR 0004）（2026-10-22 定案；2026-10-24 Production 已切換至 Cloudflare Pages）
- **決策**：**Cloudflare Pages Free** 為 Production Hosting；Vercel Pro 為 fallback（Cloudflare Pages 通過 Production validation 前保留 Vercel 專案）；完整內容以 ADR `docs/development/adr/0004-production-hosting-platform.md`（Status：Accepted）為準
- **排除**：Vercel Hobby（僅限非商業）、GitHub Pages（明文禁止 online business／e-commerce）、**Netlify Free**（每月 300 credits 硬上限，用完時帳號內所有專案暫停至下個計費週期且不可加購；JOTI 每次 push `main` 皆 deploy Production，2026-10-22 單日即 90 credits）
- **Platform Selection Gate**：Cloudflare §2.2.1(h) 以**低風險例外**接受——JOTI 不在 Cloudflare 服務之網站處理或收集卡片資料；`joti.yoga` DNS 原本即在 Cloudflare Free，風險既存；切換成本低。Cloudflare 書面詢問仍建議送出，但不阻擋上線
- **升級原則**：目前成本最低 → 優先 Cloudflare；需升級時先評估留在 Cloudflare，若 Cloudflare 付費方案明顯比 Vercel Pro 貴且切換成本低則選較具成本效益者；每次升級重新比較成本與適配性
- **未來備案原則**（2026-10-23）：目前決策不變，繼續執行 Cloudflare Pages Free 計畫，不需要等 Cloudflare 回覆。日後如果確認 Cloudflare Free 不適用，再重新比較當時的 Cloudflare 付費方案與 Vercel Pro。屆時選哪一個不預先決定，依當時的實際價格、Cloudflare 的方案要求、JOTI 狀態及遷移／維護成本判斷。2026-10-23 已完成的比較可以直接作為基礎，不需要重做完整 Hosting Discovery。比較重點記在 ADR 0004「Upgrade policy」：
  - Cloudflare 沒有獨立的 Pages Pro，付費選項是 Workers Paid（$5 起）或網域 Pro（$20–25）
  - Vercel Pro 每個席位 $20，含 $20 用量
  - JOTI 在兩邊的用量費用都接近 0
  - Cloudflare Registrar 必須使用 Cloudflare nameserver，所以就算 Hosting 改到 Vercel，DNS 仍留在 Cloudflare
- **可移植性**（ADR 0004「Portability guardrails」）：現有 Git＋React/Vite＋Supabase＋ECPay＋Bunny 架構已足以支援 Cloudflare Free → Paid（僅方案變更）與 Cloudflare → Vercel Pro（重接 Vercel、同樣 `VITE_*`、改 DNS，Production 設定因網域不變而不需修改）；**不建立兩套 Production、現在不需額外準備**。守則：Production 只使用 `joti.yoga`（不用 `*.pages.dev`）、不使用 Pages Functions／Workers／`wrangler`、`vercel.json` 與 `_redirects` 並存、Node 版本以兩平台皆讀取之方式固定、Cloudflare 上線後斷開 Vercel Git 自動 deploy
- **追蹤事項**：
  - **PoC 結果（2026-10-23，通過）**：
    - 設定：Cloudflare Pages 專案 `joti-poc`，Git 連到 `luckster-ai/Luckster-core`；Root 為 `frontend`，Build 為 `npm run build`，Output 為 `dist`，Node 24；連 TEST Supabase
    - 在 `joti-poc.pages.dev` 確認正常：TEST Supabase 連線、Google 登入、帳號資料、會員內容、Bunny.net 影片播放、方案頁、帳號頁、登出、`/legal/privacy`、`/pricing`、`/contract-review`
    - SPA deep routes 與 F5 重新整理正常，**不需要 `_redirects`**（build 沒有 `404.html`，Pages 會自動做 SPA fallback）；`frontend/vercel.json` 保留給 Vercel fallback
    - 採用 **Pages**，不用 Workers static assets
  - **Preview 驗證（2026-10-23，通過）**：
    - 從與 `main` 相同的 commit 建立 branch `preview/cloudflare-poc`，Pages Preview deployment 成功；Preview 環境變數有 `VITE_ENABLE_PURCHASE=true`
    - 已刪除 `joti-poc` Production 環境的 `VITE_ENABLE_PURCHASE`，與計畫一致；購買開關差異已確認：Production `/pricing` 顯示「付費方案即將開放」，Preview 不顯示
    - TEST Supabase Redirect URLs 已加入 `https://*.joti-poc.pages.dev/**`，Preview 網址 Google 登入正常
    - 未完成：「一般會員 → ECPay 付款頁」。登入的是 Admin 帳號，`canOfferPurchase()` 依設計不對 Admin 提供購買，不是 Preview 設定問題
    - 附記：TEST Supabase 的 Site URL 目前是 `https://joti-poc.pages.dev`（PoC 期間設定）
  - **TODO（待指示）**：
    - ~~Cutover 前補確認 PoC 未涵蓋的項目：branch Preview deployment，以及只在 Preview 開啟的 `VITE_ENABLE_PURCHASE`~~（2026-10-23 已確認，見下方「Preview 驗證」）
    - **Pending（驗證）**：用一般 TEST 會員從 Preview 進入 ECPay 付款頁（不付款）。有符合條件的既有 TEST 帳號時再補測，不為此修改 TEST 資料；這不是 Cloudflare 設定問題。完整付款 E2E 留到 Production validation
      - 2026-10-24 唯讀檢查：今天沒有合適的帳號，不阻擋後續 Hosting 工作。有同意合約的兩個一般會員都有到 11/19 的有效服務期間；可以購買的兩個都沒同意合約，也沒開始審閱期
      - 最適合的是 `luckster.ai.workspace+trial2@gmail.com`，可在 11/19 之後使用；測試前先確認它那筆 `open` checkout session 的狀態
    - ~~Node 版本目前是在 Cloudflare dashboard 設定，尚未依守則改成兩個平台都會讀取的檔案（例如 `.nvmrc`）~~——2026-10-24 已在 repo 固定為 Node 24，需要兩個檔案，因為沒有兩個平台都讀的單一檔案：
      - `frontend/.nvmrc`（`24`）給 Cloudflare Pages：build image v3 讀 `.nvmrc`，不讀 `engines`
      - `frontend/package.json` 的 `engines.node`（`24.x`）給 Vercel：Vercel 讀這個欄位，不讀 `.nvmrc`
      - 兩個檔案要一起改；從乾淨的 checkout 執行 `npm ci` 加 `npm run build` 通過
    - ~~可逆 PoC~~（2026-10-23 通過）→ ~~Production validation~~（2026-10-24 通過，見下方「Production validation 與切換」）→ ~~斷開 Vercel Git 自動 deploy~~（2026-10-24 完成，見下方「Hosting 收尾」）
  - **Production validation 與切換（2026-10-24，通過；適用目前付款關閉的範圍）**：
    - 正式 Pages 專案 `joti`，與 `joti-poc` 分開：
      - Production branch 為 `main`，自動部署開啟
      - Production 變數只有 Production Supabase 的 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY`
      - Preview branch 為 **None**，避免 Preview 用 Production 變數 build
      - TEST／Preview 驗證繼續使用 `joti-poc`
    - `8bd89a6` 的 build 使用 Node 24.22.1；專案沒有設定 `NODE_VERSION`，而映像預設是 22.16.0，可推得 `.nvmrc` 生效
    - Bundle 含 Production Supabase ref、不含 TEST ref；把 Supabase URL 與 key 正規化後，和 `joti-poc` Production 的 bundle 完全相同，購買／訂閱開關都是關閉
    - `/pricing` 未登入時顯示價格卡片，這是原本的設計（價格卡片不受開關控制）
    - 在 `joti-3da.pages.dev` 確認：SPA 深層路由回傳 200、法律頁正常、可讀到 Production 公開資料（官方練習）
    - `joti.yoga` 已綁定為 `joti` 的 custom domain（Active、SSL），提供相同的 bundle
    - Production Supabase 的 Site URL 為 `https://joti.yoga`，Redirect URLs 已加入 `joti.yoga` 的 `/auth/callback` 與 `/auth/reset-password`（Vercel 的兩筆仍保留）
    - 使用者在 `joti.yoga` 手動驗證：Google 登入、帳號資料、會員內容、Bunny 影片播放、`/pricing`（付款仍關閉）都正常
    - `SITE_URL`：Production 目前沒有這個 secret，也沒有部署任何 Edge Function，這是合理的狀態。它只被付款相關的 Edge Functions 用來組付款後的導回網址；**付款上線、部署這些 functions 時，再新增 `SITE_URL=https://joti.yoga`**
    - ~~Vercel Production（`joti-jotiyoga.vercel.app`）仍保留，Git 自動部署尚未斷開~~（2026-10-24 已退場，見下方「Hosting 收尾」）
  - **TODO（待指示）**：
    - ~~斷開 Vercel Git 自動部署（保留專案），同時移除 Production Supabase 中 Vercel 的兩筆 Redirect URL~~（2026-10-24 完成）
    - ~~隱私權政策「網站託管」仍寫 Vercel，要改成 Cloudflare~~（2026-10-24 完成）
    - 刪除遠端 branch `preview/cloudflare-poc`
  - **Hosting 收尾（2026-10-24）**：
    - 隱私權政策「五、第三方服務」的網站託管已從 Vercel 改為 Cloudflare
    - ADR 0005 災難還原步驟中的 Vercel 已改為目前的 hosting（Cloudflare Pages `joti`）
    - Vercel 專案 `joti`：
      - 已斷開 Git，push 不再部署
      - Deployment Protection 開啟 Vercel Authentication，範圍是 All Deployments
      - 舊網址 `joti-jotiyoga.vercel.app`、`joti-git-main-jotiyoga.vercel.app`、`frontend-ebon-seven-40.vercel.app` 未登入時都回 302，導向 Vercel 登入，不再公開提供網站
      - 專案、設定與 deployment 都保留作為 fallback，沒有刪除任何東西
      - 要切回 Vercel 時：重新連 Git、關閉 Protection、升級 Pro
    - Production Supabase Redirect URLs 已移除 Vercel 的兩筆，現在只剩 `https://joti.yoga/auth/callback` 與 `/auth/reset-password`；Site URL 為 `https://joti.yoga`
    - Google OAuth：Production client「JOTI Production Supabase Auth」的 JavaScript 來源已從 `https://joti-jotiyoga.vercel.app` 改為 `https://joti.yoga`；Redirect URI 是 Production Supabase 的 `/auth/v1/callback`，不需要改
    - **Future Decision（重要，正式對外開放前）**：Google OAuth 應用程式仍是「測試」發布狀態，測試使用者只有 1 位（`luckster.ai.workspace@gmail.com`），所以**其他人目前無法在 Production 用 Google 登入**；Email＋密碼登入不受影響
      - 發布前要在 Branding 補上首頁 `https://joti.yoga`、隱私權政策 `/legal/privacy`、服務條款 `/legal/terms`，以及授權網域 `joti.yoga`；這些欄位目前都是空的
      - 發布時需不需要 Google 驗證（例如品牌驗證、網域擁有權）待確認
  - **Future Decision**：`www.joti.yoga` 目前沒有任何記錄或服務，是否要設定並轉址到 `joti.yoga`
  - **Pending（驗證）**：付款 E2E（付款上線時，與 `SITE_URL` 設定一起進行）
  - **External（非阻塞）**：Cloudflare §2.2.1(h) 書面詢問（2026-10-20 已擬定，尚未送出）

### Step 11 — Supabase Free Backup／Restore Discovery（2026-10-20，Discovery — 未實作、未實際 dump）
- **範圍**：Production 唯讀 catalog 盤點（僅 SELECT）、Supabase 官方文件（Backup and Restore using the CLI、Database Backups）、`supabase db dump --dry-run` 檢視實際 `pg_dump` 參數；**未連 Production 執行 `pg_dump`**（需 DB 密碼，屬使用者憑證），未修改任何設定、Production 或專案架構
- **Production 現況**：PostgreSQL 17.11、DB 12 MB；`public` 14 張表全部啟用 RLS、31 條 policy；資料 practices 4、profiles 1，其餘 0；Auth 1 user、2 identities（email、google），無 MFA，auth migration `20260831180000`；`auth.users` 上有自訂 trigger `on_auth_user_created` → `public.handle_new_user()`；extensions：`btree_gist`（`public`）、`pgcrypto`／`uuid-ossp`（`extensions`）；Storage／Vault／Realtime publication 皆 0；無自訂 LOGIN role；repo 無 `supabase/migrations`（schema 由 `supabase/schema*.sql` 手動套用；14 份 SQL 之實際套用順序記錄於「Step 11 — Production Environment Build」，但災難復原以 dump 為準）
- **已確認**：
  - 官方指南「Use the Session pooler connection string by default」；GitHub runner 無 IPv6，須走 Session pooler（port 5432）；官方流程為 `db dump --role-only`／schema／`--data-only` 三段，以 `psql --single-transaction` 搭配 `session_replication_role = replica` 還原
  - CLI 實際執行 `pg_dump`（dry-run 確認）；本機無 Docker／`pg_dump`，GitHub Actions 可用 runner 內建 Docker 執行 CLI，或安裝 PGDG `postgresql-client-17` 直接執行
  - Free 方案無平台 backup／PITR，官方建議 Free 專案定期以 CLI `db dump` 自行匯出並異地保存
  - **涵蓋範圍**：schema dump 含 `public` 表／function／RLS／grant；data dump 含 `public` 與 **Auth 資料（`auth.users`、`identities`、`sessions` 等，含 bcrypt 密碼雜湊）**，僅排除 `auth.schema_migrations`；**schema dump 排除整個 `auth` schema 與 `extensions`**（2026-10-21 TEST Drill 更正：schema dump **仍含** `CREATE EXTENSION`（含 `btree_gist`），見「Step 11 — Supabase Free Backup／Restore TEST Drill」）
  - **因此還原須另補**：~~`create extension btree_gist`~~（2026-10-21 實測不需要）；`on_auth_user_created` trigger（`supabase/schema.sql:117-120` 有定義，需確認與 Production 一致）——漏補時新註冊使用者不會建立 profile，且不會報錯
  - **還原目標須為已具 Auth schema 的 Supabase 環境**（新 Supabase project 或 Supabase CLI 本地 stack），一般 PostgreSQL 僅能檢查資料、無法驗證 Auth 可用性
  - **不在資料庫備份內**：Edge Function secrets（Supabase 只顯示 digest，無法取回原值）；Auth 設定（Site URL、Redirect URLs、密碼長度、SMTP、Google provider、信件範本、Rate limits）；新 project 的 URL／API key 必然改變。Edge Functions（11 個）原始碼與 `verify_jwt` 設定在 git，可重新 deploy（`config.toml` 的 `project_id` 為 TEST）
- **災難復原流程（Production 完全損壞，草案）**：建立新 Supabase project（Free 上限 2 個，需先刪除 TEST 或已損壞 project）→ 啟用 `btree_gist`、依序還原 roles／schema／data → 補 auth trigger → 依清單重設 Auth → 重新 deploy Functions 與 secrets → 更新 Vercel env 並重新 deploy、Google OAuth callback（`<ref>.supabase.co/auth/v1/callback`）、keepalive secret → 確認 ECPay 是否接受新 ReturnURL 網域 → 與 ECPay 對帳補回備份後付款之訂單
- **RPO／RTO（估算，未驗證）**：RPO 等於備份間隔（每日 ≤24 小時、每 6 小時 ≤6 小時；GitHub cron 可能延遲或跳過）；付款可透過 ECPay 對帳補回，**備份後產生之契約審閱／同意紀錄無法補回**（法律證據缺口）；RTO 有手冊並演練過約 2–4 小時，首次無手冊更久
- **Supabase Free 無法補足之風險**：無 PITR（RPO 下限為備份間隔）；無 SLA、支援有限；2 個 project 上限使緊急重建須先刪除 project；無自訂網域，還原後 URL 必然改變，牽動 ECPay ReturnURL（綠界 Q1／Q2 未回覆）與 Google OAuth；帳號層級問題（例如帳號停用）無法以備份解決
- **追蹤事項**：
  - **Pending（驗證）**（2026-10-21：除「使用者是否需重新登入」與「實際 RTO」外已由 TEST Drill 驗證，見「Step 11 — Supabase Free Backup／Restore TEST Drill」）：經 Session pooler 實際 dump 是否成功；還原至 Supabase stack 時 auth 欄位相容性（data dump 為附欄位名 INSERT，目標較新多欄位通常可行、較舊缺欄位會失敗）；補 trigger／extension 後 `public` 完整性；還原後實際登入與新註冊建立 profile；使用者是否需重新登入（新 JWT key）；實際 RTO
  - **TODO（正式開放付款前，最低要求）**：(1) 一次 Production dump＋還原至隔離 Supabase stack 之完整驗證（筆數、FK／constraint 含 `btree_gist` exclusion、RLS 與 31 條 policy、function 與 trigger 數量（function 比對須排除 extension 成員：盤點所得 209 個 public function 含 `btree_gist` 之 function，「Step 11 — Production Environment Build」建置時記錄之自建 function 為 21 個，是否仍準確待實測時重新計算；trigger 應為 2 個：`auth.users.on_auth_user_created`、`profiles.protect_profile_system_fields_trigger`）、`auth.users` 筆數與密碼雜湊、GoTrue password grant 登入、新註冊建立 profile）；(2) 加密異地自動備份並於 Production 實際執行一次；(3) 災難還原手冊、Auth 設定清單、secrets 存放於密碼管理器；(4) 至少一次依手冊之 DR drill 並記錄實際 RTO；(5) Payment reconciliation（已列 P1）
  - **TODO（文件修正）**：備份範圍與還原流程須明列 auth trigger、~~`btree_gist`~~、secrets 另行保存、還原後 URL 變更（2026-10-21：另須明列 function ACL 重設，見「Step 11 — Supabase Free Backup／Restore TEST Drill」）
  - ~~**Future Decision**：契約審閱／同意紀錄之 RPO 是否可接受，以及備份頻率（併入「Supabase Free 長期營運」決策）~~——2026-10-22 ADR 0005 定案：每 6 小時備份，RPO target ≤ 6h（非保證；最後一次成功備份後之契約紀錄仍可能遺失），見「Step 11 — Production Backup Architecture（ADR 0005）」
  - ~~**Future Decision**：備份存放位置與加密方式（決定前不建立正式 backup workflow）~~——2026-10-22 ADR 0005 定案：Private Ops Repo 之 private GitHub Release＋age 加密（master key 離線、CI drill key），另加手動 USB 離線副本，見「Step 11 — Production Backup Architecture（ADR 0005）」
  - **Future Decision**：是否建立最小權限之備份專用 role（目前只能以權限偏大之 `postgres` 角色 dump；專用 role 需能讀取 `auth` schema，作法待評估）（2026-10-22：ADR 0005 仍列為延後決定）
  - **TODO（使用者，正式自動備份前）**（2026-10-21：已由使用者設定 GitHub Secret `SUPABASE_PROD_DB_URL`，Production 唯讀驗證已使用並確認有效，見「Step 11 — Supabase Production Read-only Backup Validation」）：自動備份需將 Production DB 密碼（或日後之備份專用 role 憑證）設為 GitHub Secret——目前 Production DB 密碼僅由使用者自行保管（見「Step 11 — Production Environment Build」）；TEST 演練另需 TEST DB 密碼（見下方建議下一步）
  - **建議下一步（待核准）**（2026-10-21：(a) 已完成且通過；登入驗證改為僅在隔離環境內重設已還原使用者之密碼，未於 TEST 建立帳號，見「Step 11 — Supabase Free Backup／Restore TEST Drill」）：最小隔離驗證分兩階段——(a) TEST 演練：獨立 drill branch 上之手動觸發 GitHub Actions job（不進 `main`），經 Session pooler dump TEST → runner 上 `supabase start` → 還原並跑完整性檢查，log 只輸出筆數與檢查結果、dump 檔不上傳、runner 跑完即銷毀（需使用者將 TEST DB 密碼設為 GitHub Secret；登入驗證需於 TEST 建立一次性測試帳號，另經同意）；(b) TEST 通過後對 Production 唯讀 dump，同流程僅驗證筆數與結構、不驗證真實帳號密碼

### Step 11 — Supabase Free Backup／Restore TEST Drill（2026-10-21，TEST 驗證 — 完整通過）
- **環境**：drill branch `drill/backup-restore-test`（不進 `main`；本地 worktree `C:\Luckster-core-drill`）上之一次性 GitHub Actions workflow `.github/workflows/supabase-backup-restore-drill.yml`，僅 push 該 branch 該檔案時觸發；`permissions: {}`；來源 Guard 僅接受 TEST（`postgres.ngznngqmbhxejkjbqomh`、`*.pooler.supabase.com:5432`），偵測到 Production ref 即中止；GitHub Secret `SUPABASE_TEST_DB_URL`（TEST Session pooler 連線字串，使用者設定）。repo 為 public，log 僅輸出筆數／hash／名稱／PASS-FAIL，密碼、email、token 以 `::add-mask::` 遮蔽；dump 檔僅存 runner 暫存目錄，`shred` 刪除，不上傳 artifact、不進 repo。**Production 未接觸**
- **流程**：CLI v2.117.0 經 Session pooler 官方三段 dump（roles／schema／data）→ 來源唯讀 fingerprint 與 metadata 擷取 → runner 上 `supabase init`＋`supabase start`（隔離本地 stack）→ 還原 → 比對 → GoTrue 登入／新註冊／RLS 實測 → `supabase stop --no-backup`＋清除
- **最終結果（run `39565844414`）**：dump 127 秒（資料約 49 KB）；psql 還原 exit 0；**43 項 fingerprint 全部一致**（public 每表資料 hash、`auth.users` 含 bcrypt 密碼雜湊、`auth.identities`、function 定義、function ACL、`anon`／`authenticated`／`service_role` 可執行函式清單（8／8／22）、trigger、RLS、31 條 policy、constraint、index、欄位、table／sequence grant、`anon`／`authenticated`／`authenticator` 之 `statement_timeout`）；已還原使用者經 GoTrue password grant 登入並經 REST 僅見自己的 profile；新註冊自動建立 profile（role member）；RLS：新使用者 6 筆中僅見 1 筆、anon 見 0 筆；清理後無殘留 container／volume／工作目錄。整個 job 約 5 分鐘
- **已驗證之還原流程**（官方 CLI 還原＋僅以下經實測證明必要之修正）：
  1. `roles.sql` 僅跳過 `GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin";`（平台給 Realtime 角色之授權；本地非 superuser 之 `postgres` 無權執行，整個 `--single-transaction` 還原因此 rollback）；其餘（含 3 個角色之 `statement_timeout`）保留
  2. 本地 stack 之 GoTrue／Storage 映像固定為 hosted TEST 版本（v2.197.0／v1.80.2，經公開 `/auth/v1/health`、`/storage/v1/version` 查得，寫入 `supabase/.temp/gotrue-version`、`storage-version`）——CLI 內建 GoTrue 較舊時 data 還原因缺少 `auth.mfa_recovery_code_sets` 失敗
  3. 還原後從來源補回 **auth schema** 之自訂 trigger（`on_auth_user_created`；storage trigger 由 storage-api 自行建立，不補）
  4. 還原後**依來源重設全部 public function ACL**：22 個函式先 `REVOKE ALL … FROM PUBLIC, anon, authenticated, service_role`，再依來源 `aclexplode` 逐條 GRANT（46 條）
  - **未採用**（實測不需要）：`supabase_admin` OWNER 註解、`cli_login_postgres` 處理（TEST 無此角色）、預先建立 extension
- **重要發現**：
  - 🔴 **只照官方流程還原時，14 個原本僅 `service_role` 可執行之付款／契約函式會變成 `anon`／`authenticated` 也可執行**（`fulfill_checkout_session`、`apply_order_payment`、`mark_refund_processed`、`apply_service_period_early_termination`、`agree_to_contract`、`create_checkout_session` 等）。原因：`pg_dump` 僅記錄相對 PostgreSQL 內建預設值之權限差異，而 Supabase 之 default privileges 會自動授予新函式 `anon`／`authenticated` EXECUTE，dump 不會重現原本 SQL 中的 `revoke`。實測：未重設前 `functions.acl`／`exec.anon`／`exec.authenticated` 皆與來源不一致，重設後完全一致。新 hosted Supabase project 亦有相同 default privileges，推斷同樣會發生（未驗證）
  - Discovery 更正：schema dump **含** `btree_gist`（不需預建）；TEST 無 `cli_login_postgres`；只有 auth trigger 需另補
  - Free 專案資料量小：dump 主要耗時在 CLI 下載 Postgres 映像
- **正式 backup 設計之必要結論**：真正災難時來源已不存在，本次 drill 之補回步驟係從「仍存在的來源」即時擷取。**正式 backup 必須在備份當下一併保存 `pg_dump` 無法可靠重建之 metadata**——至少：auth schema 自訂 trigger 定義、全部 public function ACL（REVOKE／GRANT 語句）、以及用於還原後比對之 fingerprint（含 function ACL 與各角色可執行函式清單）——並納入每次 restore verification 之必過比對；function ACL 不一致即視為還原失敗
- **追蹤事項**：
  - **Pending（驗證）**：還原至**新 hosted Supabase project** 時，roles.sql 第 13 行與 function ACL 問題是否同樣發生；原密碼登入（本次僅證明密碼雜湊完全相同）與 Google 登入帳號；還原後使用者是否需重新登入；實際 RTO
  - ~~**Pending（驗證）**：Production 經 Session pooler 唯讀 dump 與 metadata 擷取（下一步，不還原）~~——2026-10-21 已完成並通過，見「Step 11 — Supabase Production Read-only Backup Validation」
  - **TODO（正式 backup 設計時）**：備份當下保存上述 metadata 與 fingerprint；每次演練前查 hosted GoTrue／Storage 版本並對齊本地 stack（drill workflow 目前寫死 v2.197.0／v1.80.2）
  - ~~**TODO（清理，待決定）**：drill branch、worktree `C:\Luckster-core-drill`、Secret `SUPABASE_TEST_DB_URL` 暫時保留；public repo 中 drill 之 workflow run 紀錄是否刪除~~——2026-10-21：drill branch（本地與遠端）與 worktree 已刪除；兩個已驗證之 workflow 檔案（`supabase-backup-restore-drill.yml`、`supabase-backup-prod-readonly-check.yml`）與 commit 清單已先保存於 repo 外 `C:\Luckster-core-archive\supabase-backup-drill\`，供正式 backup workflow 實作參考；~~**TODO（使用者）**：於 GitHub 刪除 Secret `SUPABASE_TEST_DB_URL`（`SUPABASE_PROD_DB_URL` 保留）~~——2026-10-22 使用者確認已刪除，Repository secrets 僅剩 `SUPABASE_PROD_ANON_KEY`、`SUPABASE_PROD_DB_URL`；public repo 中 drill 之 workflow run 紀錄是否刪除仍待決定

### Step 11 — Supabase Production Read-only Backup Validation（2026-10-21，Production 唯讀驗證 — 通過）
- **目的**：確認 Production 可被已驗證之 backup／verification 流程正確讀取，並取得正式 backup 設計所需之資料與 metadata；**不還原**
- **方式**：drill branch 上之一次性 workflow `.github/workflows/supabase-backup-prod-readonly-check.yml`（commit `e158282`；drill branch 已刪除，檔案保存於 repo 外 `C:\Luckster-core-archive\supabase-backup-drill\`），GitHub Secret `SUPABASE_PROD_DB_URL`（Production Session pooler 連線字串，使用者設定；**保留**供後續正式 backup workflow 使用）；Guard 僅接受 `postgres.qhyfpabyqksuwjzshjtu`、`*.pooler.supabase.com:5432`；所有 psql session 使用 `default_transaction_read_only=on`，`pg_dump` 本身於唯讀交易執行；log 僅輸出筆數／hash／名稱；dump 與 metadata 僅存 runner，`shred` 刪除，未保存
- **結果（run `39586533510`，全部步驟成功）**：
  - Session pooler 連線與 `SUPABASE_PROD_DB_URL` 憑證正常
  - 三段 dump 134 秒（roles 370 B、schema 135 KB、data 19 KB）
  - **完整性**：public／auth 每張表之 data.sql 筆數與 Production 即時筆數完全一致（public 14 張表＝14 個 COPY 區塊＝14 條建表語句；`auth.users` 1 筆；合計 15 筆；`auth.schema_migrations` 依設計排除）；schema.sql 含 31 條 policy、14 張表啟用 RLS、`btree_gist`；auth trigger 不在 schema.sql（預期，已另行擷取）
  - **還原所需 metadata 可取得**：auth trigger 1 個（`auth.users.on_auth_user_created`）、function ACL 63 條（REVOKE 21、GRANT 42）、fingerprint 43 項
  - **Production 未修改**：dump 前後 43 項 fingerprint 完全相同；未執行任何寫入、schema 或設定變更
- **與 TEST 之差異（皆符合預期）**：自建 function 21 個（TEST 22 個，差異為 TEST 專屬之 `rls_auto_enable`）；`anon`／`authenticated`／`service_role` 可執行函式 7／7／21；**僅 `service_role` 可執行之付款／契約函式 14 個**（與 TEST 相同，任何還原後均須維持不開放給 `anon`／`authenticated`）；`anon`／`authenticated` 可執行者為 `complete_practice_session`、`get_membership_status`、`handle_new_user`、`is_admin`、`protect_profile_system_fields`、`record_module_usage`、`save_practice_session_progress`
- **結論**：Production 可以已驗證之流程完整備份；roles.sql 同樣含 `GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin"`，TEST 驗證之還原修正（跳過該行、補 auth trigger、依備份時保存之 function ACL 重設）同樣適用於 Production
- **追蹤事項**：
  - **Pending（驗證）**：Production 備份之實際還原驗證（本輪依指示未進行）
  - **Future Decision**：正式 backup 之 storage、加密、retention、排程（沿用「Step 11 — Supabase Free Backup／Restore Discovery」之 Future Decision）（2026-10-22：storage、加密、排程已於 ADR 0005 定案；retention 仍待決，見「Step 11 — Production Backup Architecture（ADR 0005）」）

### Step 11 — Production Backup Architecture（ADR 0005）（2026-10-22，架構定案 — Phase 1 實作中）
- **文件**：ADR `docs/development/adr/0005-production-backup-architecture.md`（Status：Accepted — 架構定案、尚未實作）；本節只記錄狀態與追蹤事項，內容以 ADR 為準
- **已定案**：Production backup／DR 使用專用 **Private Ops Repo**（暫定 `luckster-ai/joti-ops`）；Phase 1 設計為維持在目前免費額度／$0 預算內——GitHub Actions＋age 加密＋private GitHub Release；**每 6 小時備份，RPO target ≤ 6h（非保證）**；每份備份含 roles／schema／data、auth trigger、function ACL、fingerprint、`manifest.json`（版本、筆數、SHA-256）；每次備份做完整性驗證；還原沿用已驗證流程（跳過 `log_min_messages` grant 行、對齊服務版本、補 auth trigger、依備份重設 function ACL，ACL 不一致即失敗）；**每週 local restore drill**（只用加密備份）；**Healthchecks.io** 監控未執行或失敗；**不新增 standalone keepalive**（現有 `supabase-keepalive.yml` 不變）；**採用手動 USB 離線副本**；database dump **不含** Supabase Storage 檔案內容；**RTO 待 hosted DR drill 實測**
- **架構建議（ADR 0005 §2）**：master key 離線＋CI drill key、key versioning（有實際理由才輪替，不設固定每年輪替）、Private Ops Repo 為高敏感度邊界之權限控管、DR 流程大綱、hosted DR drill（暫停 TEST、臨時 project）
- **追蹤事項**：
  - **Future Decision**：~~保存期限最終值（ADR 為提案）~~（2026-10-22 定案：7 天全部／35 天每日／12 個月每月，見「Step 11 — Production Backup Phase 1：排程、監控與輪替」）；USB 副本是否套用同一保存期限；USB 複製頻率與存放地點；最小權限備份 role；隱私權政策是否揭露備份存放與保存期限（併入資料儲存地區揭露）；DR runbook 存放位置；Auth 設定是否改為程式碼管理；Phase 2（Backblaze B2＋Object Lock）是否及何時導入；Supabase 升級
  - **Pending（驗證）**：還原至 hosted project（`log_min_messages`、function ACL、是否需重新登入、Google 帳號、原密碼登入）；RTO；每 6 小時 DB 連線是否足以避免 Free 暫停（確認前保留現有 keepalive）；~~每週 drill 只用保存檔案能否通過~~（已通過）；Actions 分鐘數是否在免費額度內（2026-10-22 依實際 run 時間估算每月約 495／2,000 分鐘，待排程運作後以實際用量確認）；~~Healthchecks.io 是否通過 Third-Party Platform Selection Gate~~（2026-10-22 以低風險例外接受，理由記於 ADR 0005）
  - **TODO（實作，待指示）**（2026-10-22：Private Ops Repo、age 金鑰、Secrets 與手動觸發之 backup workflow 已完成並以 Production 驗證成功，見「Step 11 — Production Backup Phase 1：第一次 Production Backup」；2026-10-22 只用加密備份之 Restore Drill 亦已通過，見「Step 11 — Production Backup Phase 1：第一次 Restore Drill」；2026-10-22 排程、Healthchecks 與輪替亦已上線，見「Step 11 — Production Backup Phase 1：排程、監控與輪替」）：~~建立 Private Ops Repo、age 金鑰、Secrets~~、~~Healthchecks~~ → ~~手動觸發之 backup workflow 以 Production 驗證~~ → ~~只用加密備份之 drill workflow~~ → ~~開啟排程與監控~~ → `SUPABASE_PROD_DB_URL` 自 public repo 移除 → DR runbook 與設定清單 → 正式開放付款前 hosted DR drill

### Step 11 — Production Backup Phase 1：第一次 Production Backup（2026-10-22，通過）
- **環境**：Private Ops Repo `luckster-ai/joti-ops`（private，僅 owner `luckster-ai`；本機 `C:\joti-ops`，remote 以 `luckster-ai` 帳號認證）；workflow `.github/workflows/supabase-backup.yml`，**僅手動觸發**（初始 checkpoint `dd1858a`）；Secrets `SUPABASE_PROD_DB_URL`、`SUPABASE_PROD_ANON_KEY`；`recipients.txt` 含 `master-v1`（私鑰僅由使用者離線保存）與 `drill-v1` 公鑰
- **結果（run `39740822786`，13 個步驟全部成功，約 3 分 20 秒）**：
  - Production 經 Session pooler 唯讀 dump 與 completeness validation 成功；dump 前後 43 項 fingerprint 一致，確認 Production 未被修改
  - `manifest.json` 記錄 source versions（PostgreSQL 17.11、GoTrue v2.197.0、Storage 1.80.2、auth migration `20260831180000`）與 Supabase CLI 2.117.0
  - age 以 `master-v1`／`drill-v1` 加密成功：`joti-prod-backup-20261022-0732Z.tar.gz.age`（20,697 bytes）
  - Private Release `backup-20261022-0732Z` 建立；重新下載後 asset SHA-256 與加密當下一致（`89bb1e9e…1c84`）
  - runner cleanup 成功
- **前兩次失敗（已解決）**：Supabase CLI checksum 比對檔名錯誤（joti-ops commit `e9e61a3` 修正）；joti-ops 之 `SUPABASE_PROD_DB_URL` 結尾多一個換行（使用者重新設定）。兩次皆在讀取 Production 資料前失敗，未建立 Release
- **追蹤事項**：
  - ~~**Pending（驗證）**：encrypted backup 尚未實際解密；以 drill key 解密之 Restore Drill 尚未實作（Storage 版本於 manifest 記為 `1.80.2`，drill 對齊本地 stack 時需轉為 `v1.80.2`）~~——2026-10-22 已以 drill key 解密並還原通過（Storage 版本自動轉為 `v1.80.2`），見「Step 11 — Production Backup Phase 1：第一次 Restore Drill」
  - **TODO（尚未開始）**：~~每 6 小時排程；Healthchecks.io；retention／rotation~~（2026-10-22 已上線，見「Step 11 — Production Backup Phase 1：排程、監控與輪替」）；USB 離線副本；~~`SUPABASE_PROD_DB_URL` 自 public repo 移除~~（2026-10-25 完成）；DR runbook

### Step 11 — Production Backup Phase 1：第一次 Restore Drill（2026-10-22，通過）
- **環境**：`luckster-ai/joti-ops` workflow `.github/workflows/supabase-restore-drill.yml`（commit `2a24321`，**僅手動觸發**；權限僅 `contents: read`）與共用 scripts `scripts/check-backup.py`、`scripts/restore-backup.sh`（還原流程亦可供正式 DR 使用）；Secret `BACKUP_DRILL_AGE_KEY`（`drill-v1` 私鑰）。**隔離**：job 不含任何 Production 憑證，Production 主機名稱於 `/etc/hosts` 封鎖並確認生效；還原目標為 runner 上之一次性本地 Supabase stack
- **結果（run `39743418421`，13 個步驟全部成功，約 2 分 35 秒）**：
  - 使用 backup `backup-20261022-0732Z`（`joti-prod-backup-20261022-0732Z.tar.gz.age`）；下載後 SHA-256 與 Release 說明及 GitHub asset digest 一致
  - **以 `drill-v1` 解密成功**；每個檔案與 `manifest.json` 之 SHA-256 一致
  - 本地 stack 依 manifest 固定 GoTrue v2.197.0、Storage v1.80.2；本地 auth migration 與來源相同（`20260831180000`）；本地 Postgres 17.6、來源 17.11，未影響比對
  - 還原沿用已驗證流程（僅跳過 `log_min_messages` grant 行、補 auth trigger、套用 function ACL）
  - **43 項 fingerprint 全部與備份一致**；`anon`／`authenticated`／`service_role` 可執行函式 7／7／21 與備份相同
  - 已還原使用者經 GoTrue 登入並僅見自己的 profile；新註冊自動建立 profile（role member）；RLS：新使用者 2 筆中僅見 1 筆、anon 見 0 筆
  - 清理後無殘留 container／volume／工作目錄；drill key 用後即刪除
- **結論**：加密之 Production 備份本身即足以還原，不需連回 Production；第一次備份已實際驗證可解密、可還原
- **追蹤事項**：
  - **Pending（驗證，待 hosted DR drill）**：還原至新 hosted project 時 `log_min_messages` 與 function ACL 之行為；使用者是否需重新登入；Google 帳號；原密碼登入；以 **master key** 解密（目前僅 drill key 實際解密過）；Auth 設定、Edge Functions、secrets 之重建；實際 RTO
  - ~~**TODO（尚未開始）**：每週 drill 排程與 backup freshness 檢查（ADR 0005；排程啟用前不加入）~~——2026-10-22 已上線，見「Step 11 — Production Backup Phase 1：排程、監控與輪替」

### Step 11 — Production Backup Phase 1：排程、監控與輪替（2026-10-22，上線）
- **決策（2026-10-22）**：Healthchecks.io 採用——以 Third-Party Platform Selection Gate 低風險例外接受（條款未限制亦未明文允許免費方案商業使用、無 SLA、帳號可不經通知終止；只送 start／success／fail ping、不傳任何 JOTI 資料，服務中止只少一層警報），理由記於 ADR 0005；保存期限採 ADR 0005 原提案（7 天全部、35 天每 UTC 日最新一份、12 個月每 UTC 月最新一份）
- **實作**（`luckster-ai/joti-ops` commit `d48cac0`）：
  - Production backup 排程 `47 */6 * * *`（UTC 00:47／06:47／12:47／18:47，與 keepalive 的 :17 錯開）
  - Restore Drill 排程 `23 3 * * 0`（每週日 03:23 UTC）；只選完整（已上傳 asset）之備份
  - Backup freshness：最新完整備份須 ~~≤ 8 小時~~ ≤ 12 小時（2026-10-23 調整，見下方「排程實際觀察」）（排程執行時強制，手動執行僅提示）
  - Healthchecks.io：兩個 check（Cron、UTC；backup grace ~~2 小時~~ 6 小時（2026-10-23 調整）、drill grace 6 小時），每次 run 送 `/start` 與成功或 `/fail`；Secrets `HC_BACKUP_PING_URL`、`HC_DRILL_PING_URL`
  - 保存期限輪替 `scripts/retention.py`，於每次 publish 後執行；安全規則：只處理 `backup-YYYYMMDD-HHMMZ`、不刪不完整 Release、最新完整備份必留、剩餘完整備份少於 4 份時拒絕刪除；離線模擬 400 天 1,601 份備份 → 保留 67 份，符合規則
- **最小驗證（手動觸發各一次）**：
  - Backup run `39748542541`：16 步驟全部成功；Healthchecks start／success 回報；新備份 `backup-20261022-0836Z` 建立並通過 SHA-256 驗證；retention 判斷 2 份皆保留、刪除 0 份；Production 前後 43 項 fingerprint 一致
  - Restore Drill run `39749042224`：15 步驟全部成功；選到最新備份 `backup-20261022-0836Z`；freshness 0.0 小時（手動執行未強制）；43 項 fingerprint 一致、function ACL 7／7／21 相同；登入／新註冊／RLS 正常；Healthchecks start／success 回報；清理完整
  - 兩個 workflow 排程狀態皆為 active
- **排程實際觀察（2026-10-22／23，已接受）**：
  - 前三次 scheduled backup 都成功，但都比排程晚啟動：
    - 12:47Z 時段：17:39Z 啟動，晚 4 小時 52 分，產生 `backup-20261022-1742Z`
    - 18:47Z 時段：21:56Z 啟動，晚 3 小時 9 分，產生 `backup-20261022-2159Z`
    - 00:47Z 時段：05:26Z 啟動，晚 4 小時 39 分，產生 `backup-20261023-0529Z`
  - 實際備份間隔最長約 7.5 小時，接近原本 8 小時的 freshness 上限
  - Healthchecks 原本的 grace 是 2 小時，三次都先誤判為 down，備份完成後才恢復 up（10 月共 3 次 downtime，合計 6 小時 51 分）
  - 期間 Restore Drill 沒有被觸發
  - **結論**：接受 GitHub Actions schedule 的延遲特性。「每 6 小時」是 RPO／備份間隔的**目標，不是保證**，實際間隔可能更長。調整後的門檻：
    - Healthchecks backup grace：2 小時 → 6 小時（直接在 Healthchecks 網頁上修改）
    - Restore Drill freshness：8 小時 → 12 小時（`joti-ops` commit `b341df7`）
- **第一次排程 Restore Drill（2026-10-25，成功）**：
  - `joti-ops` 的 GitHub Actions run #3 由排程觸發，耗時約 2 分 44 秒
  - 排程時間是 03:23 UTC，實際在 08:34 UTC 才啟動，晚了約 5 小時 11 分，原因是 GitHub schedule 延遲
  - Healthchecks `JOTI Restore Drill` 收到 Started → OK，沒有 downtime，也沒有警報；延遲仍在 6 小時 grace 內
  - 還原、43 項 fingerprint 比對、Login／Signup／RLS 測試都通過（workflow 只有在這些都通過後才送 success ping）
  - 這次確認了自動排程 Restore Drill 的完整流程。GitHub schedule 延遲視為既有的觀察結果，維持目前的 6 小時 grace 與 12 小時 freshness 門檻
  - 同一時期的 backup check：grace 改為 6 小時後沒有再發生 downtime
- **追蹤事項**：
  - **Pending（驗證）**：~~第一次排程執行~~（2026-10-23 已觀察，見上方「排程實際觀察」）；~~新門檻下 Healthchecks 是否不再誤報；第一次排程 Restore Drill（週日 03:23 UTC）能否通過 12 小時 freshness 檢查~~（2026-10-25 皆已確認，見上方「第一次排程 Restore Drill」）；Healthchecks 誤報信是否實際寄達；排程失敗時 GitHub 通知寄送之帳號（commit 作者 `joti-yoga`、push 帳號 `luckster-ai`）；實際 Actions 用量；retention 實際刪除（第一次將於第 8 天後發生）
  - **TODO（尚未開始）**：USB 離線副本（頻率與地點待決定）；~~`SUPABASE_PROD_DB_URL` 自 public repo 移除（ADR：ops repo 備份穩定運作後）~~（2026-10-25 完成，見下方）；DR runbook；正式開放付款前 hosted DR drill
  - **`SUPABASE_PROD_DB_URL` 與 Keepalive（2026-10-25）**：
    - 已從 `Luckster-core`（public）的 Repository Secrets 移除 `SUPABASE_PROD_DB_URL`。移除前確認所有 branch（`main`、三個 `preview/*`）的 workflow 都沒有參照它；現在 `Luckster-core` 只剩 `SUPABASE_PROD_ANON_KEY`
    - **更正**：Keepalive（`supabase-keepalive.yml`）只使用 `SUPABASE_PROD_ANON_KEY`，每 6 小時發一次唯讀 REST GET，和這個 DB secret **無關**（先前說「keepalive 依賴此 secret」是錯的）
    - **決定：保留 Keepalive**。Supabase 只寫「Free projects are paused after 1 week of inactivity」，沒有定義什麼算 activity。Keepalive 成本極低、只用 anon key，又和 backup 互相獨立，所以保留作為第二個活動來源，不做停用實驗
    - `joti-ops` 的 `SUPABASE_PROD_DB_URL` 是 backup 正在用的，**保留、不修改**
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
- **登入導向 localhost 問題（TEST Supabase 專案 `ngznngqmbhxejkjbqomh`）**：本問題屬於**現有 TEST 專案**的 Auth 設定，影響目前連到 TEST 的 Preview／本機登入；**Production 將使用獨立的新 Supabase 專案**（見「Step 11 — Production Readiness Discovery」），屆時 `Site URL`／`Redirect URLs` 需在新專案重新設定，不沿用 TEST 設定。另外 Production 已決定不保留 Magic Link，下方「Magic Link 連結本身 `redirect_to` 錯誤」的現象不會出現在 Production 的登入方式中（但 TEST 仍適用）。根因診斷已完成（用 `supabase config diff` 直接核對遠端 Supabase 專案設定確認，非猜測）——Supabase Auth 的 `site_url` 仍是本機開發殘留值 `http://localhost:4190`，`additional_redirect_urls` 只涵蓋 Vercel 改名前的舊網址格式，完全沒涵蓋改名後的新格式或目前實際的 Production 別名；已在 Preview 上實際重現（點擊登入後導向 `localhost:4190` 並出現 `ERR_CONNECTION_REFUSED`），確認不是程式碼問題（`AuthProvider.jsx` 的 `redirectTo` 動態計算正確）。**修正尚未執行**——需要到 Supabase Dashboard 手動更新 `Site URL`／`Redirect URLs`，不在 repo／CLI 範圍內。原記載「Production 很可能有同樣問題，尚未實際重現驗證」係指目前的 Vercel Production 部署（若連到同一 TEST 專案即受同一設定影響，未實際驗證）；未來 Production 改用獨立 Supabase 專案後，此 TEST 設定問題不適用，Production 的 URL 設定另列於 Blockers。
  - **2026-10-01 更新——已從推論提升為可重現、有第一手證據的問題**：Payment Rebuild Step 6 TEST Runtime Verification 過程中，用授權的 TEST 帳號（`luckster.ai.workspace+trial2@gmail.com`）實際完成 Magic Link 登入，**核對了兩封不同時間（下午 6:24、下午 6:30）由 `supabase.auth.signInWithOtp()` 寄出的信件**：即使呼叫時明確指定 `emailRedirectTo: http://localhost:5173/auth/callback`，**兩封信實際產生的 Magic Link，`redirect_to` 參數都是 `http://localhost:4190`**，不是只在 Preview 環境、也不是只在點擊後才出現的現象，而是連結本身在寄出當下就已經是錯的。驗證當下為了讓 session 能成功建立，**手動把 `redirect_to` 改成 `http://localhost:5173/auth/callback` 後直接呼叫 `/auth/v1/verify`**，確認可以取得有效 session（回傳的 `sb-auth-user-id` 與該帳號相符）——**這個手動替換只是為了驗證 Step 6，不是修正，Supabase Auth 設定本身完全未被更動**。
---

## Next Steps

1. **修正 TEST Supabase 專案（`ngznngqmbhxejkjbqomh`）Auth 的 `Site URL`**（2026-10-13 更新：Redirect URLs 已含 `https://joti-*-jotiyoga.vercel.app/**`，Preview 上 Email + Password／驗證信／重設密碼／Google 登入已實測成功，不再阻塞 Preview 登入；`Site URL` 仍為 `localhost:4190`，僅作為 fallback；本機開發若要測重設密碼，`http://localhost:5173/auth/reset-password` 尚未加入允許清單）：原記載如下——影響目前連到 TEST 的 Preview／本機登入；Production 將使用獨立新專案，其 URL 設定屬於 Production 建置工作（見第 3 項），不在本項範圍。需要到 Supabase Dashboard（Authentication → URL Configuration）手動更新，把過期的 `localhost:4190` 與 Vercel 改名前的舊網址格式，換成目前實際使用中的 Production 別名與 Preview 萬用字元（`joti-*-jotiyoga.vercel.app`）。這是外部服務設定，不在 repo／CLI 範圍內，需要使用者或有權限的人親自操作。
2. **Git checkpoint 現況**：先前「Payment Readiness Implementation Sprint 之後的累積工作（Legal/Contract Publication Refinement、Production Publication Polish、Mobile RWD Fix、Contract Terminology Cleanup 等）尚未 commit」的記載**已過時**——該批工作已於 `f22f412`（"refine legal publication readiness"）commit 並 push。`24755b6`（Step 11.1）、`0324c2d`（Step 11.2）、`8d9ec00`（project status）、`2acade2`（TEST Auth）**皆已 push 到 `origin/main`**（2026-10-13）。working tree 另有與上述無關的既有未提交變更（Legacy Oen subscription 修正、`frontend/package.json` 新增 `supabase` devDependency、Warm Up Module 內容、兩份 docs），維持不動。（2026-10-16 更新：`origin/main` 為 **`8592900`**——`8ac0bcd`（Purchase Entry 開關）與 A1 合併之 `dee932c`／`53df3cf`／`8592900` 皆已 push 並自動部署 Production；2026-10-16 PlanPurchase 409 修正亦已 push `main`）
3. **Production 建置（Step 11，依「Step 11 — Production Readiness Discovery」決策）**：已完成 Production Project（`qhyfpabyqksuwjzshjtu`）建立、schema 套用、4 個 official practices 匯入、health check（GitHub Actions keep-alive，`fb15510`）、Resend `auth.joti.yoga` 網域驗證（2026-10-14 Verified）、**Production Auth（Email + Password + Google、Resend SMTP、Google OAuth；2026-10-15 E2E 驗證通過）**（見「Step 11 — Production Environment Build」與「Step 11 — Production Auth 完成」）；`contract_versions` v1.0 待正式上線時間確定後建立；前端 Email + Password Auth 已完成並經 TEST 驗證（`2acade2`）；接續——Admin 設定、Production Edge Functions／secrets；Vercel Production 已為新版並指向 Production Supabase（2026-10-16 起由 push `main` 經 Git integration 自動部署），最後綁定 `joti.yoga`；正式開放付款前升級 Pro（2026-10-20：改列 Future Decision，見「Step 11 — Production Hosting／$0 平台費用評估」）。（2026-10-20：`contract_versions` v1.0 建立前置條件與順序見「Step 11 — Production Environment Build」之「`contract_versions` 尚未建立」；目前尚不可建立）
4. **ECPay 正式上線準備（2026-10-19 更新）**：**已確定正式採用綠界科技 ECPay**（取代原「ECPay／PAYUNi 候選、最終平台未決定」記載；PAYUNi 不採用，申請是否撤回待決定；Oen 已通過審核但不採用）。ECPay TEST 整合與 E2E 已完成。待辦：(a) 綠界正式特店審核、正式 MerchantID／HashKey／HashIV；(b) 綠界回覆 Q1／Q2（ReturnURL 可否用 `*.supabase.co`、是否須自有網域）、Q4（一般賣家）與履約保證；(c) **ECPay live mode 程式修改**（2026-10-19 程式修改、本機檢查、TEST 部署與 TEST 回歸 **PASS**；程式尚未 commit（TODO）；Production 未部署（External／Pending），見「Step 11 — ECPay LIVE mode Implementation」；原記載：）——目前 `_shared/ecpayAdapter.ts`（建立付款第 79 行、退款第 168 行）、`ecpay-webhook`（第 87 行，非 test 時只回應不處理）、`confirm-checkout-session`（第 119 行）在 `ECPAY_MODE !== "test"` 時一律拒絕或略過；需允許 `ECPAY_MODE=live`＋正式主機 `payment.ecpay.com.tw`，保留模式／主機一致檢查（`ecpayConfigError()`），並以 TEST 回歸驗證 test 模式行為不變；(d) Production 部署時必須明確設定 `ACTIVE_PAYMENT_PROVIDER=ecpay`（未設定時程式預設 `oen`）
5. Step 11（Production Readiness）已開始：11.1、11.2 已完成；Production 基礎設施 Discovery 已完成並確立決策；Production 建置進行中，見第 3 項（子步驟編號待排定）。
6. 補完 3 個新 Warm Up Module：上傳 Bunny 影片、填入 `.md` 的 `Primary Video URL`、加入 `modules.js`、跑 `validate:module-video` + `:audit`、commit。
7. 決定測試用訂閱 `S2026091055MVCVI8` 要不要現在取消，還是留著拿來測 T-3（續扣 / 取消 / 續扣失敗）。
8. 固定 IP proxy 技術驗證（PoC）：選定供應商（建議 QuotaGuard）、申請試用、驗證 Supabase Edge Function 可透過 `Deno.createHttpClient` 走固定 IP。
9. ~~Plan Change（Step 10）透過 Oen 真實 hosted checkout 的視覺化 E2E~~——**2026-10-19 結案（不再進行）**：JOTI 目前不提供方案變更、採用 ECPay（見「Step 11 — 付款模式與方案變更規則落實」）
10. **ECPay 後續**：依官方文件查核結果更新後的問題清單送綠界（見上方「ECPay 官方文件查核」小節）；由經營者／法律評估退款期限影響（年方案 90 天後人工退刷、超過 360 天無法退刷、到期後開始的提前購買時間）與履約保證；決定後再另行排程程式調整（例如超過 90 天標記人工退款）；決定 TEST 測試資料是否清理；正式環境開通後以真實小額交易驗證退款。
11. **ECPay Checkout Session Flow（2026-10-19 更新）**：(a) `b79151e` 已 commit／push；(b) 驗證現況——有效期間內購買 → `active_service_period_exists`（A3 PASS）；同一會員雙分頁 → 後端 409 `checkout_session_in_progress`、未建立第二筆 Session（A3 PASS），畫面「付款進行中」修正已上 `main`，**Pending（驗證）**：UI 情境未實測；JOTI 返回頁顯示「付款已確認，你的帳號狀態已更新。」（2026-10-19 TEST 回歸 PASS）；**Pending（驗證）**：webhook 晚到由 `confirm-checkout-session` 開通；雙方付款成功之 rejected 競態以 PGlite SQL 測試為依據；(c)(d) Step 11.1／11.2 已 push；(e) 向綠界確認 AIO 付款頁有效時間，決定 30 分鐘 Session 與「付款進行中」文案是否調整；(f) Preview 仍顯示舊「訂閱 JOTI」（`VITE_ENABLE_SUBSCRIBE=true`）待處理。TEST 目前 `ACTIVE_PAYMENT_PROVIDER=ecpay`、`SITE_URL`=穩定 Preview `joti-git-preview-contract-review-ui-jotiyoga.vercel.app`；`+trial2` 目前為有效月方案（至 2026-11-19）
12. **Production Readiness Checkpoint 後續**：見「Step 11 — Production Readiness Checkpoint A1–A3」的「下一步與依賴」（PlanPurchase 修正 Preview 實測與 commit、2026-10-19 首購 E2E、ContractReviewPage 同類錯誤、Production 開放付款前工作）；**2026-10-19 首購 E2E 資料驗證 PASS**（見「Step 11 — 首購 E2E（2026-10-19）」）；剩餘 TEST 項目：PlanPurchase「付款進行中」畫面 Preview 實測（需「已同意、無方案」帳號；目前兩個測試會員皆有有效方案）、webhook 晚到由 `confirm-checkout-session` 開通、JOTI 返回頁顯示；**2026-10-19 ECPay LIVE mode：TEST 部署與回歸 PASS**，剩餘追蹤見「Step 11 — ECPay LIVE mode Implementation」（TODO：commit 本輪程式（含已修正的 0 元退款前端文案 `terminationResult.js`）；Pending（驗證）：`confirm-checkout-session` 晚到路徑、雙分頁 UI、0 元退款 E2E；Future Decision：>90 天退款；External／Pending：Production LIVE）；**2026-10-20**：Privacy Policy 文字更新、ContractReviewPage 錯誤處理修正已完成（未 commit），追蹤見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」；**2026-10-20 Hosting／$0 評估**：Cloudflare 書面確認（External）、Hosting 最終決策與 Supabase Free 長期營運（Future Decision）、Supabase backup／restore（TODO／Pending）、Payment reconciliation（P1）、Vercel Pro 為 fallback，見「Step 11 — Production Hosting／$0 平台費用評估」與 ADR 0004；Supabase backup／restore 之 Discovery 結果與最低驗證要求見「Step 11 — Supabase Free Backup／Restore Discovery」

---

## Blockers

- **TEST Supabase 專案 Auth `Site URL` 過期**（2026-10-13 更新：**已不阻塞 Preview 登入**——Redirect URLs 已含 Preview 萬用字元，Email + Password／Google 登入已於 Preview 實測成功；`Site URL` 仍為 `localhost:4190`，只在 redirect 不在允許清單時作為 fallback，仍建議修正）。原記載：目前會導致連到 TEST 專案的環境點擊登入都被導向 `localhost:4190` 並失敗。需要使用者本人到 Supabase Dashboard 手動更新，AI 無法代為修改外部服務設定。這是目前唯一會直接阻塞「會員實際完成登入」的問題，詳見上方「登入導向 localhost 問題」小節。**2026-10-01 已有第一手重現證據**（見同小節）：即使 `emailRedirectTo` 明確指定正確網址，TEST 專案實際寄出的 Magic Link，`redirect_to` 仍是 `localhost:4190`，不再只是根因推論。此項僅針對 TEST 專案；Production 改用獨立專案後不沿用此設定。
- **Production Supabase 尚未完成建置**：Production 專案（`qhyfpabyqksuwjzshjtu`）、Database Schema、4 個官方 Practices 與 health check（2026-10-14 上線）已完成，**Production Auth（Email + Password + Google、Resend SMTP）已於 2026-10-15 完成並經 E2E 驗證**；Production Edge Functions／secrets 尚未建置（購買流程目前以 `VITE_ENABLE_PURCHASE` 關閉）；`joti.yoga` 依決策延後綁定。
- **固定 IP proxy PoC** 需要建立第三方服務帳號（含免費試用），此步驟需使用者本人操作，AI 無法代為建立帳號或輸入付款資訊。
- **新 Warm Up Module** 需要先把來源影片上傳到 Bunny 才能繼續（非程式碼工作，需人工操作 Bunny Dashboard）。
- Production Vercel 部署與目前 `main` 分支程式碼是否同步：**根因已找到**（見上方「Vercel Deployment Architecture」小節，過去 CLI 部署方式不會帶到 `docs/`），但實際 Production 尚未用正確方式重新部署，目前 Production 內容仍是落後版本；依 Production Readiness 決策，正式重新部署排在 Production Supabase 建置之後。2026-10-13 確認：Production 正式別名為 `https://joti-jotiyoga.vercel.app`，線上仍為舊版（Magic Link）且連到 TEST Supabase。**2026-10-16 更新（已解決）**：Vercel 已連結 GitHub（Production Branch `main`），push `8ac0bcd` 自動部署 Production（`joti-cr7nu23h4`）；線上為新版、指向 Production Supabase，Vercel Production 環境變數為 Production 值；其他別名 `frontend-ebon-seven-40.vercel.app`、`joti-git-main-jotiyoga.vercel.app` 亦指向同一部署。

## Open Questions（法律／商業模型，待決）

- ~~**Production Hosting 最終決策（Future Decision，2026-10-20 新增）**：Cloudflare Pages Free（Candidate，待 Cloudflare 書面確認）或 Vercel Pro（fallback）~~——2026-10-22 定案：Cloudflare Pages Free（Vercel Pro 為 fallback），見 ADR `docs/development/adr/0004-production-hosting-platform.md`與「Step 11 — Production Hosting 最終選型（ADR 0004）」
- **Supabase Free 長期營運（Future Decision，2026-10-20 新增）**：是否接受 Free 方案（無平台 backup／PITR、無 SLA、2 個 Free 專案上限）之營運風險，或升級 Pro；待自建 backup／restore 驗證與整體風險評估後決定（取代原「正式開放付款前升級 Pro」之既定記載），見「Step 11 — Production Hosting／$0 平台費用評估」；2026-10-20 Backup／Restore Discovery 另確認 Free 無法補足之風險（無 PITR、備份後之契約審閱／同意紀錄無法補回、還原後 Supabase URL 必然改變、2 個 project 上限使緊急重建須先刪除 project），見「Step 11 — Supabase Free Backup／Restore Discovery」；2026-10-22 Production backup 架構已定案（ADR 0005，不以付費服務為前提），是否升級仍待 hosted DR drill 之 RPO／RTO 結果
- **Production 契約類 Functions 部署時機（Future Decision，2026-10-20 新增）**：契約類 Functions 部署且 `contract_versions` 為 current 後，已登入帳號可繞過前端 `VITE_ENABLE_PURCHASE` 直接呼叫 `start-contract-review`／`agree-to-contract`，於正式上線前即產生 Production 正式契約同意紀錄；風險有限（需登入、仍受 3 日審閱限制），但部署時機需配合上線與 Production E2E 計畫決定
- **Privacy Policy 資料儲存國家／地區揭露（Future Decision，2026-10-20 新增）**：是否需於隱私權政策揭露 Supabase（Production：Singapore）、Resend（Tokyo）、Vercel、Bunny 等服務之資料儲存國家／地區——屬法律判斷，決定前不寫入政策（見「Step 11 — Privacy Policy 與 ContractReviewPage 錯誤處理」）
- 契約條款發生重大變更時，審閱／通知程序具體如何處理（是否需要新的審閱期、期間多長）——待法律顧問或經營者確認。
- ~~Payment Authorization 具體採用哪一個 Oen API 端點／參數組合實現「先綁卡、僅扣款一次」~~——**2026-10-19 結案**：JOTI 採 ECPay 購買當下付款，不採先綁卡後扣款模式（見「Step 11 — 付款模式與方案變更規則落實」）
- **會員如何實際觸發提前終止已解決**：Step 10 已在 `AccountPage.jsx` 新增「提前終止目前方案並退款」按鈕作為前端入口，呼叫既有 `terminate-service-period`（Step 9），見上方「Payment Rebuild — Step 10」小節。
- **退款金流實際執行方式已解決**：Step 9 已實作並實測，呼叫 Oen 退款 API 原路退回（非人工處理），見上方「Payment Rebuild — Step 9」小節。
- `refund_failed` 之後是否允許重新發起退款——Step 9 刻意維持 `refund_failed` 為 resting terminal state，未實作重試機制，仍待裁示。
- **ECPay 待綠界確認**（已依官方文件查核更新，見「ECPay 官方文件查核」小節）：(1) 正式環境是否接受 `*.supabase.co`（前有 Cloudflare 代理）作為 ReturnURL；(2) ReturnURL 是否須與登記網站同網域、`payment.joti.yoga` 是否符合；(3)「主機 IP 鎖定」是否僅為選用；(4) 預收制線上課程可否以一般賣家申請、一般賣家可否使用 DoAction、收款額度、年方案是否適用遞延性服務履約保證；(5) 90／360 天起算點、超過 360 天有無其他退款管道、`Action=R` 的 `TotalAmount` 語意、關帳前可否部分退刷、自動關帳時間。
- **ECPay Checkout Session Flow 仍待決策**（其餘已於 2026-10-12 裁示並實作，見同名小節）：(1) 契約與 `payment-legal-spec.md` 是否提及付款期限／待付款訂單（未逐條核對）；(2) 被 rejected 的付款如何通知會員、人工退款作業流程；(3) 退款後 rejected Session 是否需要記錄退款完成狀態；(4) 已完成契約同意、無有效方案會員的購買入口——已於 Step 11.1 實作並 TEST E2E 通過（已解決）；(5) TEST `ACTIVE_PAYMENT_PROVIDER`／`SITE_URL` 測試完是否還原；(6) ECPay 付款頁有效時間（10300025「訂單已過期」）確認後，JOTI 30 分鐘 Session 規則與文案是否調整。
- **退款期限對既定退款規則的處理方式（經營／法律決策，待裁示）**：年方案超過 90 天的人工退刷流程、超過 360 天（主要為到期後開始）的退款方式、是否限制到期後開始的提前購買時間、契約是否需載明退款方式。**Future Decision（2026-10-19 更新）**：正式上線前決定；ECPay LIVE mode Implementation 未實作 90 天規則（程式目前不區分 90 天內外，超過 90 天時 API 退款預期失敗並停在 `refund_failed`）。「到期後開始」已於 2026-10-19 決定不提供，相關情形不再發生，剩年方案服務開始超過 90 天之退款

---

## Last Updated

2026-10-26（ADR 0005 Phase 1：第一次排程 Restore Drill 於 2026-10-25 成功（`joti-ops` run #3，約 2 分 44 秒，因 GitHub schedule 延遲晚約 5 小時 11 分）；Healthchecks Started → OK、沒有 downtime；維持 6 小時 grace 與 12 小時 freshness）

2026-10-25（`Luckster-core` 的 `SUPABASE_PROD_DB_URL` 已移除，沒有任何 workflow 使用；更正 Keepalive 只用 anon key、和此 secret 無關；決定保留 Keepalive；`joti-ops` 同名 secret 保留）

2026-10-24（Hosting 收尾：隱私權政策網站託管改為 Cloudflare；Vercel 已斷開 Git，並以 Vercel Authentication（All Deployments）停止公開提供，專案保留作為 fallback；Production Supabase 已移除 Vercel Redirect URL；Google OAuth JavaScript 來源改為 `joti.yoga`；發現 OAuth 應用程式仍是「測試」狀態、只有 1 位測試使用者，列為正式開放前的 Future Decision）

2026-10-24（Production Hosting 切換：`joti.yoga` 由 Cloudflare Pages 專案 `joti` 提供，Production validation 通過（目前付款關閉）；Production Supabase 的 Site URL／Redirect URLs 已改為 `joti.yoga`；`SITE_URL` 付款上線時再設定；Vercel 保留、尚未斷開；`joti-poc` 維持 TEST／Preview 用途）

2026-10-24（Node 版本固定為 24：Cloudflare 讀 `frontend/.nvmrc`，Vercel 讀 `frontend/package.json` 的 `engines.node`；Preview → ECPay 付款頁的 TEST 帳號唯讀檢查：今天沒有合適的帳號，`+trial2` 可在 11/19 之後使用，不阻擋後續工作）

2026-10-23（Cloudflare Pages Preview 驗證：`preview/cloudflare-poc` deployment 成功；Preview `VITE_ENABLE_PURCHASE=true`；`joti-poc` Production 已移除此變數，購買開關差異已確認；TEST 已加入 Redirect URL `*.joti-poc.pages.dev`，Google 登入正常；一般會員 → ECPay 付款頁因帳號是 Admin 未驗證，列 Pending）

2026-10-23（Cloudflare Pages PoC 收尾：`joti-poc` 通過；採用 Pages；SPA 不需要 `_redirects`；Production validation 與 cutover 尚未進行）

2026-10-23（ADR 0005 Phase 1 排程實際觀察：前三次 scheduled backup 都成功，但晚 3–5 小時啟動；接受 GitHub schedule 延遲，6 小時改明確記為目標、不是保證；Healthchecks backup grace 2 → 6 小時、Restore Drill freshness 8 → 12 小時（`joti-ops` `b341df7`））

2026-10-23（ADR 0004 與 Production Hosting 最終選型補充未來備案原則：日後如果 Cloudflare Free 不適用，再重新比較 Cloudflare 付費方案與 Vercel Pro，不預先決定；目前決策不變）

2026-10-22（Production Hosting 最終選型：Cloudflare Pages Free（ADR 0004 Accepted），Vercel Pro 為 fallback；排除 Vercel Hobby／GitHub Pages／Netlify Free；§2.2.1(h) 以 Platform Selection Gate 低風險例外接受；記錄升級原則與可移植性守則；尚未進行 PoC／migration）

2026-10-22（ADR 0005 Phase 1：Production backup 每 6 小時排程、每週 Restore Drill、backup freshness（≤ 8 小時）、Healthchecks.io 監控（Gate 低風險例外）與保存期限輪替（7 天／35 天每日／12 個月每月）上線；手動驗證 backup run `39748542541`、drill run `39749042224` 皆通過）

2026-10-22（ADR 0005 Phase 1：第一次 Restore Drill 通過（run `39743418421`，13 步驟、約 2 分 35 秒）：只用加密備份 `backup-20261022-0732Z` 與 `drill-v1`、不連 Production，43 項 fingerprint 一致，function ACL 7／7／21 相同，登入／新註冊／RLS 正常，清理完整；hosted DR 行為、master key 解密與 RTO 仍待 hosted DR drill）

2026-10-22（ADR 0005 Phase 1 checkpoint：Private Ops Repo `luckster-ai/joti-ops` 之第一次 Production Backup 成功（run `39740822786`，13 步驟全部通過，約 3 分 20 秒）：唯讀 dump、completeness、前後 43 項 fingerprint 一致、manifest 記錄版本、age 雙金鑰加密、Private Release `backup-20261022-0732Z` 與 SHA-256 驗證、cleanup；尚未完成：解密／Restore Drill、6 小時排程、Healthchecks、retention／rotation）

2026-10-22（同步 ADR 0005 Production Backup Architecture 定案：Private Ops Repo、GitHub Actions＋age＋private Release、每 6 小時備份（RPO target ≤ 6h）、每週 local restore drill、Healthchecks.io、手動 USB 離線副本；相關 Future Decision 標記為已定案；保存期限、USB 頻率／地點、最小權限 role 等仍待決；尚未實作）

2026-10-21（Supabase Production Read-only Backup Validation 通過（run `39586533510`）：經 Session pooler 唯讀 dump，筆數與即時資料一致、auth trigger／function ACL／fingerprint 可取得、前後 fingerprint 相同證實 Production 未修改；`SUPABASE_PROD_DB_URL` 保留）

2026-10-21（Supabase Free Backup／Restore TEST Drill 完整通過：經 Session pooler dump TEST、還原至隔離本地 stack，43 項 fingerprint 一致，登入／新註冊建立 profile／RLS 正常，清理完整；發現官方流程還原會使 14 個付款／契約函式開放給 `anon`／`authenticated`，已以依來源重設 function ACL 修正並納入必過比對；正式 backup 須於備份當下保存 auth trigger、function ACL 等 metadata；更正 Discovery 之 `btree_gist` 判斷）

2026-10-20（Production Hosting／$0 評估：新增 ADR 0004（Cloudflare Pages Candidate／Vercel Pro fallback）與 Engineering Guide「Third-Party Platform Selection Gate」；「正式開放付款前升級 Pro」改列 Future Decision；新增 Cloudflare §2.2.1(h) 書面確認（External）、Supabase backup／restore（TODO／Pending）、Payment reconciliation（P1）；Cloudflare 英文詢問信已擬定、尚未送出；Supabase Free Backup／Restore Discovery：確認 Session pooler 為官方預設、data dump 含 Auth 資料、schema dump 不含 auth trigger 與 `btree_gist`、還原目標須為 Supabase 環境，新增 Pending（驗證）／TODO／Future Decision 與兩階段隔離驗證建議）

2026-10-20（記錄 Production `contract_versions` v1.0 建立前置條件：上線時間（Future Decision）、v1.0 定稿（網站欄位依 `joti.yoga`、第七條分期措辭）、建立／部署順序、`effective_at` 不影響生效、3 日審閱排程；Open Questions 新增契約類 Functions 部署時機）

2026-10-20（Privacy Policy 依實際架構更新（ECPay、Resend、Email＋密碼、契約審閱與同意紀錄、退款紀錄）；ContractReviewPage 非 2xx 錯誤解析與同意失敗訊息顯示修正；皆未 commit；新增 Future Decision（資料儲存國家揭露）、External／Pending（Resend Click Tracking）；ContractReviewPage 瀏覽器 409 驗證為 Pending（驗證））

2026-10-19（0 元退款前端提示修正：`terminationResult.js` 依 `note === 'no_refund_due'` 顯示「本次沒有可退還的金額，因此不會產生退款」；原 TODO 標記已修正、未 commit；0 元退款實際 E2E 仍為 Pending（驗證））

2026-10-19（ECPay LIVE mode：TEST 部署（webhook v8／confirm v6／create-order-checkout v12／terminate v9）與 TEST 回歸 PASS（提前終止 `refund_failed` 符合預期；月方案 `J261019155613HG939Y2` 開通、`mode=test`、返回頁「付款已確認」）；追蹤規則整合為 9 點固定流程；+trial2 現為有效月方案至 11-19）

2026-10-19（ECPay LIVE mode Implementation：5 個 Edge Function 修改、本機檢查通過、未 commit；記錄 Pending（TEST 回歸含 `confirm-checkout-session`）、TODO（退款 0 元前端文案）、Future Decision（超過 90 天退款）、External（Production secrets／綠界）；新增「未處理事項記錄原則」為固定流程）

2026-10-19（P0 基線整理：修正 Current Phase／Next Steps／Checkpoint 中「ECPay／PAYUNi 候選、最終平台未決定」的過時記載為已確定採用 ECPay；新增 ECPay live mode 程式修改為正式待辦）

2026-10-19（正式決策：採用 ECPay、購買當下付款（不先綁卡）、目前不提供方案變更；同步修改契約 v1.0／主契約（逐字一致）、Pricing 文字、payment-legal-spec、payment-integration-rules；結案 Oen 先綁卡 API 問題與 Plan Change Oen E2E 待辦；未 commit）

2026-10-19（首購 E2E：Preview branch 同步至 `e0b081f`；審閱 3 日 → 同意 → 月方案 → ECPay 測試付款 → webhook 開通，資料驗證 PASS（Session `766d472f-…`／Order `3903d177-…`／Service Period `02112fac-…`，無重複、無 overlap）；瀏覽器端觀察項目未記錄）

2026-10-16（Production Readiness Checkpoint A1–A3：A1 合併 `main` `8592900` 並自動部署 Production；A2 TEST `SITE_URL` 改為穩定 Preview；A3 TEST 續購／異常情境完成（Scenario 1／3／4 PASS、2 後端 PASS 畫面 FAIL、5 以 SQL 測試為依據）；`+trial2` 為有效月方案至 2026-11-16；PlanPurchase 409 修正已 commit／push `main`（待 Preview 實測）；ContractReviewPage 同類問題列為已知）

2026-10-16（Pricing 契約入口狀態化：Preview 驗證通過（`53df3cf`，branch `preview/contract-review-ui`）；依會員狀態只顯示一個契約入口；`VITE_ENABLE_PURCHASE` 關閉時保留公開契約入口；未合併 `main`）

2026-10-16（Contract Review UI／RWD Refinement：Preview 驗證通過（`dee932c`，branch `preview/contract-review-ui`）；到期自動啟用待 2026-10-19 實測）

2026-10-16（Contract Review Preview 測試 Passed（`8ac0bcd`、TEST）；記錄 2 項 Contract Review UI／RWD 後續事項；更新 Vercel Production 現況：Git integration 自動部署、指向 Production Supabase）

2026-10-16（Production Purchase Entry 開關 `VITE_ENABLE_PURCHASE`：預設關閉，Preview 需設為 `true`；未 commit／未部署）

2026-10-15（Production Auth 完成：Email + Password + Google、Resend SMTP／`auth.joti.yoga`、Production Google OAuth；E2E 驗證通過，Users 僅單一正式帳號）

2026-10-14（Resend `auth.joti.yoga` 網域 Verified：SPF CNAME Host 由 `resend.auth` 修正為 `rsend.auth`；API Key／SMTP 待 2026-10-15 繼續）

2026-10-14（Production Supabase Health Check 上線：GitHub Actions keep-alive workflow `fb15510`）

2026-10-14（Production Auth Email（Resend／`auth.joti.yoga`）Discovery；記錄 Production Auth 已決定事項）

2026-10-13（記錄 Step 11 Production Readiness Discovery 決策；整理 Step 11 狀態、TEST／Production Auth blocker、正式網域與過時的 Next Steps；TEST DB 遷移資料核對結果與遷移資料決策；Production Project 建立、Database Schema 建立與驗證、4 個官方 Practices 匯入；TEST Auth Email + Password 完成（`2acade2`）、TEST 最低密碼長度 8、Auth Email 採 Resend／`auth.joti.yoga`；Production Auth Discovery）
