# JOTI Project Status

## Purpose

本文件是 Luckster / JOTI 專案進度的**單一真實來源（Single Source of Truth）**。內容依實際 repo 檔案、Git 狀態與既有文件整理，不包含尚未開始或推測性的工作。每次重大進度變化後應更新本文件。

---

## Current Phase

**核心學習系統（Foundation / Module / Practice / Auth / Membership）已完成並上線。**

**JOTI Legal / Business Model v1（Membership Service Basic Agreement + Service Period）已確立並整理成文件。**

目前重心：

1. **Oen Payment Implementation Discovery** —— 對照新的法律／商業模型，唯讀盤點現有 Oen integration code、Supabase schema 與前端流程的落差，**尚未進入 coding 階段**
2. 內容擴充（新增 Module）
3. 網站體驗細節打磨（Module Library/Detail、Practice Builder）

> 注意：下方「Payment（Oen）—— Test 環境」小節記錄的 T-1/T-2 成果，是**舊付款模型（recurring subscription）**下的測試紀錄，與新確立的 Legal/Business Model v1（不採自動續約）存在已知架構落差，將由上述 Discovery 正式盤點，尚未調整。

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

1. **Oen Payment Implementation Discovery**（目前最優先，唯讀盤點，尚未進入 coding）：
   - 現有 `/checkout-schedule` 舊模型（recurring subscription）與新模型的落差
   - 現有 Oen integration code（`_shared/oen.ts`、`create-subscription-checkout`、`oen-webhook`）
   - 之前已驗證之「先綁卡 → 條件成就 → 一次性扣款」流程，如何對應到新模型的 Payment Authorization
   - Order / Service Period / Payment / Membership 的資料流設計
   - Trial / Contract Review / Purchase Confirmation / Payment Authorization 於 implementation 上的對應關係
   - 現有 Supabase schema（`schema_subscriptions.sql`）與新模型的差異
   - 前端（`SubscribePage.jsx`/`AccountPage.jsx`）需要新增的流程與 UI
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

2026-09-17
