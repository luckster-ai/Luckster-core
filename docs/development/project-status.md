# JOTI Project Status

## Purpose

本文件是 Luckster / JOTI 專案進度的**單一真實來源（Single Source of Truth）**。內容依實際 repo 檔案、Git 狀態與既有文件整理，不包含尚未開始或推測性的工作。每次重大進度變化後應更新本文件。

---

## Current Phase

**核心學習系統（Foundation / Module / Practice / Auth / Membership）已完成並上線。**

目前重心：

1. 內容擴充（新增 Module）
2. Oen Payment 整合 —— Subscription（訂閱）驗證中，正式環境部署（固定 outbound IP）仍在 Discovery 階段
3. 網站體驗細節打磨（Module Library/Detail、Practice Builder）

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

---

## In Progress

- **新增 3 個 Warm Up Module**（`MW005` 脊椎彎曲熱身、`MW006` 脊椎扭轉熱身、`MW007` 貓牛式熱身）：`.md` 內容（Summary / Description / Learning Outcomes / Tags / Prerequisites）已撰寫，**尚未上傳 Bunny 影片**（`.md` 的 `Primary Video URL` 是空的），**尚未加入 `data/modules.js`**，未 commit。
- **Payment Backend 固定 IP proxy 技術驗證**：Discovery 已完成並提出建議方案，**尚未開始實際驗證**（需先選定供應商、申請試用帳號）。

---

## Next Steps

1. 補完 3 個新 Warm Up Module：上傳 Bunny 影片、填入 `.md` 的 `Primary Video URL`、加入 `modules.js`、跑 `validate:module-video` + `:audit`、commit。
2. 決定測試用訂閱 `S2026091055MVCVI8` 要不要現在取消，還是留著拿來測 T-3（續扣 / 取消 / 續扣失敗）。
3. T-2 核心機制已驗證可行，開始規劃 Payment Backend 正式 implementation（含固定 IP proxy 接入）。
4. 固定 IP proxy 技術驗證（PoC）：選定供應商（建議 QuotaGuard）、申請試用、驗證 Supabase Edge Function 可透過 `Deno.createHttpClient` 走固定 IP。

---

## Blockers

- **固定 IP proxy PoC** 需要建立第三方服務帳號（含免費試用），此步驟需使用者本人操作，AI 無法代為建立帳號或輸入付款資訊。
- **新 Warm Up Module** 需要先把來源影片上傳到 Bunny 才能繼續（非程式碼工作，需人工操作 Bunny Dashboard）。
- Production Vercel 部署與目前 `main` 分支程式碼是否同步，本文件撰寫時**未重新驗證**（上次確認為 2026-09-10，當時發現落後數個 commit）。

---

## Last Updated

2026-09-14
