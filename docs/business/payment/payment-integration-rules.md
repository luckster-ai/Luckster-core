# JOTI Payment — Integration Rules（給工程 / AI Agent）

## Purpose

本文件是給 Claude Code、Luckster AI Agent 及任何工程人員在實作 JOTI Payment / Membership / Oen 串接時，必須遵守的具體規則。

本文件的規則衍生自 [`payment-legal-spec.md`](./payment-legal-spec.md)（商業／法律規格），而該文件又衍生自 [`docs/legal/joti-online-teaching-contract.md`](../../legal/joti-online-teaching-contract.md)（正式契約）。三者若有衝突，以上層文件為準（見下方「文件優先順序」）。

---

## 文件優先順序

```
Applicable Law（現行法令 / 主管機關公告之定型化契約規範）
      ↓
JOTI Contract（docs/legal/joti-online-teaching-contract.md）
      ↓
Payment Legal / Business Specification（payment-legal-spec.md）
      ↓
Payment Integration Rules（本文件）
      ↓
Code
```

**工程程式不得反過來決定商業規則。** 例如：如果 Oen API 提供 recurring subscription，不代表 JOTI 就應該使用 recurring subscription——是否使用，由上層文件決定。

---

## 核心架構提醒

JOTI 採 **Membership Service Basic Agreement（基本契約）＋ Service Period（付費服務期間）** 兩層模型，不是「每次付款各自是一份獨立固定期限契約」。實作時：

- **Order** 代表一次 Service Period 的購買，不代表整個會員關係。
- **Membership／基本契約** 是持續性的，其終止（見 `payment-legal-spec.md` 第 6 節）與 Order／Service Period 的屆滿是兩件不同的事，程式邏輯不應把兩者合併判斷。

---

## 固定規則（Fixed Rules — 不可違反）

以下規則直接來自 `payment-legal-spec.md`，逐條列為工程上的硬性約束：

1. **不可因 `review_completed`（契約審閱期屆滿）自動扣款、自動建立訂單或自動同意契約。** 審閱期屆滿只代表「具備資格」，不是「已同意」或「已購買」。
2. **不可因 `trial_start`（試用開始）自動扣款或自動建立任何付款相關紀錄。**
3. **不可因 `service_period_expired`（服務期間到期）自動續約、自動建立下一個 Order、自動扣款。**
4. **不可僅依瀏覽器 `successUrl` 返回或前端顯示的付款成功畫面，逕行授予 Membership／啟用 Service Period。**
5. **Payment success 必須由 server-side verification（webhook + 向 Oen 回查驗證）確認後，才能將 Order 標記為已付款並啟用對應 Service Period。**
6. **Webhook 必須 idempotent**：同一筆交易的 webhook 重送，不得重複啟用 Service Period 或重複建立紀錄。
7. **Order 與 Oen transaction 必須可以追蹤**：每個 Order 應保存足以回查對應 Oen 交易（如 transaction 識別碼）的欄位。
8. **Contract version 必須可追溯**：每個 Order 應能回溯乙方購買當下所同意/適用的 `contract_version`。
9. **Purchase confirmation 與 payment authorization 必須可以區分**：系統中不得把「乙方選擇方案／表示要買」跟「乙方明確授權付款方式」合併成同一個事件或同一個時間戳記。
10. **Trial、Order、Payment、Membership、Service Period 不可混成單一狀態**：這五個是不同的概念（定義見 `payment-legal-spec.md` 第 1 節），各自應有獨立可推導/查詢的狀態，不應該用同一個欄位或同一個狀態機硬塞。
11. **【已確認】同一份仍然有效存續的基本契約下，會員主動續購（購買下一個 Service Period），不得要求會員重新等待完整的 3 日契約審閱期。** 只有在（a）基本契約已依終止規則終止、需重新成立新基本契約，或（b）契約條款本身發生重大變更（見 `payment-legal-spec.md` 第 8 節）這兩種情形，才需要另外處理審閱/通知程序；一般續購不屬於這兩種情形，不應在續購流程中插入審閱期等待邏輯。

其餘技術實作細節（function naming、DB schema 細節、error handling、logging、transaction handling 等）由工程階段自行決定，本文件不過度限制。

---

## 付款流程（規格層級，非資料庫 schema）

```
基本契約已成立（見 payment-legal-spec.md 第 4-5 節）
↓
Purchase Intent（會員選擇方案）
↓
Purchase Confirmation（會員明確確認購買）
↓
Payment Authorization（會員明確授權付款方式，可能是先綁卡、待條件成就後扣款）
↓
建立 Order
↓
Oen 執行扣款（One-time Checkout，或依已授權條件於試用屆滿後執行之一次性扣款）
↓
Oen Webhook（server-to-server）
↓
Server-side Verification（回查 Oen API 確認交易真實）
↓
Order = 已付款
↓
對應 Service Period 啟用，Membership 具備付費存取權限
```

## Webhook / Server-side Verification / Idempotency

- Webhook 必須完全在 server-side 處理，不得信任 webhook payload 本身的內容作為啟用 Service Period 的唯一依據——必須另外回查 Oen API（如 `GET /transactions/:id`）驗證交易狀態。
- Webhook 沒有簽章機制（Oen 官方確認），authenticity 完全依賴這一層 server-side 回查驗證，**這一步不得省略**。
- 冪等性：以交易的唯一識別（如 `transactionHid`）作為冪等鍵，重送不得重複處理。
- Order 的識別（如 `orderId`）才是解析「這筆付款對應哪個會員／哪個 Order」的唯一可信來源，webhook payload 裡的 `customId`／`userId` 等欄位不得作為身分依據的唯一來源。

## 安全要求

- 金額（amount）永遠由 server-side（依會員選擇的方案）決定，不得信任前端傳來的金額欄位。
- 建立 Order／付款相關 API 必須驗證呼叫者的 Supabase JWT。
- Webhook 端點因 Oen 無法送出 JWT，允許不驗證 JWT，但**必須**透過 server-side 回查驗證彌補這個缺口。
- 任何寫入 Membership／Order／Service Period 狀態的資料庫操作，應限制為單一受信任的寫入路徑，不得讓一般使用者角色具有直接寫入權限。

## 不自動續約 / 沒有前端付款權限

- 程式碼中不得存在任何會在沒有會員本次明確主動操作的情況下觸發扣款的邏輯（排程任務、cron job、到期自動建單等一律禁止）。
- 前端不得自行決定金額、方案、是否啟用 Service Period；所有商業判斷（金額、資格、審閱期是否屆滿、是否已完成 Payment Authorization）必須在 server-side 完成。

## Oen 技術能力與使用邊界

- **已確認**：Oen 支援「先綁定信用卡、不立即扣款、待特定條件成就後執行一次性扣款」的技術流程，可用於支援「Trial → 主動購買 → 試用屆滿後扣款」的產品流程（見 `payment-legal-spec.md` 第 9-10 節）。
- 具體要用哪一個 Oen API 端點與參數組合來實現「先綁卡、之後只扣款一次、不會意外變成持續扣款」，屬於工程實作決定；**但不論選用哪個端點，最終行為必須符合**：對同一次 Payment Authorization，Oen 只會執行**一次**扣款，不會在未經會員針對下一個 Service Period 重新確認的情況下繼續扣款。實作時應特別驗證這一點（例如透過相關參數明確限制扣款次數），不能只憑端點名稱推定行為正確。
- 除此之外，任何形式的持續性/週期性自動扣款設定，一律不得用於正式的續購機制。

## 測試要求（Testing Requirements）

- Oen TEST 環境與正式（Production）環境必須透過明確的 mode 旗標區隔，任何測試流程不得誤觸正式 Oen 環境。
- 任何會實際觸發扣款的測試，應使用官方提供之測試卡號，並在 TEST 模式下進行。
- 新增或修改付款相關程式碼後，至少應驗證：
  1. `review_completed` 是否確實不會觸發任何扣款或購買行為；
  2. Membership／Service Period 是否只在 webhook 驗證通過後才被啟用；
  3. 重複 webhook 是否被正確視為重複，不重複啟用；
  4. 「先綁卡、待條件成就後扣款」的流程，扣款是否確實只執行一次。

## 禁止的實作模式（Forbidden Implementation Patterns）

以下模式**一律禁止**，即使技術上可行：

- 用 `review_completed`、`trial_start` 或任何非「明確付款授權」的事件直接觸發扣款。
- 依瀏覽器返回 `successUrl` 或前端狀態直接啟用 Service Period，不經 webhook + server-side 驗證。
- 任何形式的到期自動扣款、自動建單、自動延長 Service Period 或基本契約。
- 用單一 checkbox 或任何 UX 手法讓會員略過或縮短 3 日契約審閱期。
- 把 Trial 到期判斷、契約審閱期判斷、Service Period 到期判斷合併成同一個 timer 或同一個條件式。
- 讓前端決定付款金額，或讓一般使用者角色的資料庫權限可以直接寫入 Membership／Order／Service Period 狀態。
- 把 Purchase Confirmation 與 Payment Authorization 合併成單一事件記錄。

---

## 已知衝突（Discovery 發現，本文件不負責修正）

以下是比對現行程式碼與本規則後發現的**現存衝突**，記錄於此以供後續處理，**本次文件整理工作不修正這些衝突**：

1. **`supabase/functions/create-subscription-checkout/index.ts` 目前呼叫 Oen 的 `/checkout-schedule`**，搭配 `paymentInterval: 1`（且未設定 `numberOfPeriods` 上限）建立**無限期、每月持續自動扣款**的排程訂閱——這不是本文件所述「先綁卡、待條件成就後執行一次性扣款」的模式，而是真正的持續性自動續約，與「不自動續約」的規則直接衝突。此函式與對應的 `oen-webhook`、`schema_subscriptions.sql`（`subscriptions` 表含 `current_period_end`、`cancel_at_period_end` 等 recurring 訂閱概念的欄位）目前已部署於 Supabase 專案 `ngznngqmbhxejkjbqomh`，屬於舊架構（T-2 Discovery/T-4 Step 4A）遺留下來、尚未依本文件規則調整的既有實作。
2. **目前前端（`SubscribePage.jsx`／`AccountPage.jsx`）完全沒有基本契約審閱、Purchase Intent、Purchase Confirmation、Payment Authorization 等任何區分步驟的 UI 或邏輯**——按鈕按下去就直接呼叫 checkout，沒有顯示契約內容、沒有記錄任何契約審閱相關時間戳記，也沒有「審閱期是否屆滿」的資格檢查。
3. 現行 `schema_subscriptions.sql` 資料庫結構完全沒有任何欄位對應 `contract_version` / `contract_presented_at` / `contract_review_available_at` / `contract_acceptance_at`，也沒有 Order（本文件定義的概念）或 Service Period 對應的資料表——目前的 `subscription_checkouts` / `subscriptions` 是為持續性 recurring 訂閱模型設計，與本文件「基本契約 + Service Period」的模型不對應。
4. 目前完全沒有「基本契約終止」（含連續 12 個月無有效 Service Period 之通知與 15 日處理程序）相關的任何程式碼或排程機制。

以上皆為**架構層級的落差**，涉及是否要調整現行已部署之 Edge Functions 與資料庫結構，應先與經營者確認方向後再行處理，不在本次文件整理工作範圍內。
