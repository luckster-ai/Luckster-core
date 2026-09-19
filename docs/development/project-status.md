# JOTI Project Status

## Purpose

本文件是 Luckster / JOTI 專案進度的**單一真實來源（Single Source of Truth）**。內容依實際 repo 檔案、Git 狀態與既有文件整理，不包含尚未開始或推測性的工作。每次重大進度變化後應更新本文件。

---

## Current Phase

**核心學習系統（Foundation / Module / Practice / Auth / Membership）已完成並上線。**

**JOTI Legal / Business Model v1（Membership Service Basic Agreement + Service Period）已確立並整理成文件。**

目前重心：

1. **Payment Rebuild — Step 2（Order Schema / DB Migration Proposal）已完成撰寫並整理成 `docs/business/payment/order-schema-proposal.md`**，等待最後一次人工 Review、明確授權後才進入 Step 3 Implementation，**目前仍未進入 coding 階段**
2. 內容擴充（新增 Module）
3. 網站體驗細節打磨（Module Library/Detail、Practice Builder）

> 注意：下方「Payment（Oen）—— Test 環境」小節記錄的 T-1/T-2 成果，是**舊付款模型（recurring subscription）**下的測試紀錄，與新確立的 Legal/Business Model v1（不採自動續約）存在已知架構落差，已由 `docs/business/payment/order-schema-proposal.md` 正式盤點（見下方「Payment Rebuild — Step 2」小節），現行程式碼本身尚未調整。

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

---

## Next Steps

1. **Payment Rebuild — Step 2 人工 Review**（目前最優先，尚未進入 coding）：Review `docs/business/payment/order-schema-proposal.md`，確認 Proposal 與已確認決策一致後，明確授權進入 Step 3 Implementation。Step 3 範圍（待授權後才開始）：
   - `contract_acceptances` / `orders` / `service_periods` 核心表、RLS 與 trusted RPC 建置（provider-independent 命名，如 `create-order-checkout` / `apply-order-payment`）
   - Oen Adapter 重構（webhook 接收、回查驗證、固定 IP outbound 設定）
   - `get_membership_status()` 擴充、前端（`SubscribePage.jsx`/`AccountPage.jsx`）改走新模型
   - Proposal 中仍列為 Open Question 的事項（見上方「Payment Rebuild — Step 2」小節）待實作對應功能時再決定，不阻塞 Step 3 開始
2. 補完 3 個新 Warm Up Module：上傳 Bunny 影片、填入 `.md` 的 `Primary Video URL`、加入 `modules.js`、跑 `validate:module-video` + `:audit`、commit。
3. 決定測試用訂閱 `S2026091055MVCVI8` 要不要現在取消，還是留著拿來測 T-3（續扣 / 取消 / 續扣失敗）。
4. 固定 IP proxy 技術驗證（PoC）：選定供應商（建議 QuotaGuard）、申請試用、驗證 Supabase Edge Function 可透過 `Deno.createHttpClient` 走固定 IP。

---

## Blockers

- **固定 IP proxy PoC** 需要建立第三方服務帳號（含免費試用），此步驟需使用者本人操作，AI 無法代為建立帳號或輸入付款資訊。
- **新 Warm Up Module** 需要先把來源影片上傳到 Bunny 才能繼續（非程式碼工作，需人工操作 Bunny Dashboard）。
- Production Vercel 部署與目前 `main` 分支程式碼是否同步，本文件撰寫時**未重新驗證**（上次確認為 2026-09-10，當時發現落後數個 commit）。

## Open Questions（法律／商業模型，待決）

- 契約條款發生重大變更時，審閱／通知程序具體如何處理（是否需要新的審閱期、期間多長）——待法律顧問或經營者確認。
- Payment Authorization 具體採用哪一個 Oen API 端點／參數組合實現「先綁卡、僅扣款一次」，且如何技術上保證不會變成持續扣款——工程決策，未決定。
- 會員如何實際取消 Service Period（網站自助按鈕 vs 聯繫客服辦理）——未定義。
- 退款金流實際執行方式（呼叫 Oen 退款 API 原路退回 vs 人工處理）——未定義。
- 付款相關個資之法定保存期限——`docs/legal/joti-privacy-policy.md` 已標示待確認。
- Vercel／Supabase 底層是否設定任何技術性 Cookie——`docs/legal/joti-privacy-policy.md` 已標示待確認。

---

## Last Updated

2026-09-19
