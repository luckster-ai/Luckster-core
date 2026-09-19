# JOTI Payment Rebuild — Step 2: Order Schema / DB Migration Proposal

## 文件狀態

| 項目 | 內容 |
|---|---|
| Status | **Proposal（Design）— 尚未實作，等待最後一次人工 Review** |
| Stage | Payment Rebuild — Step 2（Step 1 = Payment Provider Architecture，於先前對話 session 中討論，未落地成檔案） |
| Depends on | [`payment-legal-spec.md`](./payment-legal-spec.md)（最新版）、[`payment-integration-rules.md`](./payment-integration-rules.md) |
| Precedes | Step 3 Implementation — **需要人工 Review 並明確授權後才可開始**，本文件不構成授權 |
| 本次更新 | Step 2 最終整理階段：依 12 項已確認決策全面修訂，並清理已解決的 open questions；本次再依 **Decision A**（`payment_failed` 後同一 Order 重試）補上最後的技術設計細節 |

**CURRENT / FUTURE 邊界提醒**（依 [`future-product-direction.md`](../future-product-direction.md)，本文件不修改該檔案）：本文件涵蓋的是 **CURRENT** 範圍——JOTI Learning 的 One-time Order 模型（Basic Agreement + Service Period + 主動購買 + 不自動續訂）。`future-product-direction.md` 中列出的 Community / Practice Tools / AI Coach / Digital Membership，以及「未來是否採 Subscription / Automatic Renewal / Automatic Payment」的研究方向，**不在本文件討論範圍內，也不影響本文件的任何 schema 設計**（Decision 12）。本文件中出現的 `subscriptions` / `subscription_checkouts` 僅指目前程式碼中已存在的**舊 Oen recurring 測試架構（Legacy）**，與未來可能的正式 Subscription 產品是兩件不相關的事（見第 11 節）。

---

## 1. Executive Summary

本次是 Step 2 Proposal 的最終整理，依 12 項已確認決策全面修訂前一版內容，主要變化：

1. **Order status 從 6 值擴充為 7 值**，新增 `refund_failed`——原本「退款失敗時 Order 該停在哪」的缺口已被明確填補，不再是 open question。
2. **Refund 不再是獨立 status／獨立狀態機**：Refund lifecycle 直接由 `orders.status` 表示（`paid → refund_processing → refunded` 或 `refund_failed`），因此**移除前一版的獨立 `refunds` 表提案**，改為把必要的退款稽核欄位直接併入 `orders`。
3. **Payment Expiration 從 30 分鐘改為 3 天**：`payment_expires_at` 由 trusted server-side logic 在 Order 建立時依 `created_at + 3 days` 計算後寫入（非 DB column default），並明確與 Contract Review 的 3 日審閱期區分（兩者數字相同純屬巧合，語意完全不同）。
4. **新增 Basic Agreement Termination 的獨立紀錄需求**（Decision 10）：不屬於 Order，也不屬於 Service Period，至少需要 `requested_at` / `effective_at` 兩個時間點，完整的 lifecycle/status enum 仍列為 open question。
5. **Oen Integration 邊界正式落定**（Decision 11）：Webhook 是 Oen → JOTI 的通知、目前無簽章、payload 本身不可信；正式環境 JOTI → Oen API 需要固定來源 IP；這些全部屬於 Provider Adapter / infrastructure 層的事，不進入 provider-independent 的 Core Order model。
6. **Function Naming / Provider Independence 的邊界爭議已解決**：Core 命名不得含 `subscription`／`oen`，但 Provider Adapter（含 Oen webhook 接收端點）可以合理保留 `oen` 名稱——前一版列為待決的問題，本次已由 Decision 5 直接確認。
7. Contract Acceptance（歷史紀錄模式）、Currency（CURRENT=TWD）、Payment Method（nullable 無 enum）、Legacy Subscription（保留不 DROP）、Existing Paid Members Migration（N/A pre-launch）等前版決策維持不變，僅同步措辭與欄位命名。
8. **新增 `payment_failed` 同一 Order 重試機制**（Decision A，本次確認）：只要 `payment_expires_at` 尚未到期，`payment_failed` 後允許對同一 `orders.id` 再次付款，使用者不需要建立新 Order。新增 `orders.payment_attempt` 欄位標示目前合法的嘗試編號；trusted payment application function 必須同時比對 order id、`status='pending_payment'`、`payment_attempt` 三者才能轉為 `paid`，避免舊嘗試晚到的 provider 事件誤把新嘗試標記為已付款。沒有新增 Order status、沒有新增 attempts 表。

---

## 2. Updated Architecture Context

```
Payment Provider Adapter（Oen 是目前第一個實作，Core 不綁死其特性）
      │  checkout / verify / notify / refund，各自依 provider 實際能力實作
      │  Oen-specific 細節全部留在這一層：
      │    - webhook 接收與解析（無簽章，只能當作「提示」）
      │    - 回查 Oen API 驗證交易結果
      │    - 正式環境固定來源 IP / outbound proxy 設定（Decision 11）
      │    - provider payment method → JOTI canonical value 的正規化
      ▼
JOTI Core（provider-agnostic，function 命名不得含 subscription / oen —— 見第 10 節）
      │
      ├── contract_acceptances   （§9.1；歷史紀錄模式，每次同意契約各一筆）
      │
      ├── orders                （一次購買交易；Purchase Confirmation + Payment Authorization 之後才建立；
      │     │                     退款欄位併入本表，見 §3）
      │     │
      │     └── service_periods（1 個 paid order → 1 個 service period；active/expired 生命週期）
      │
      └── payment_events（provider webhook / event idempotency，沿用現有表）

（獨立、與上圖無 FK 關聯）Basic Agreement Termination Record —— 見 §9.2（Decision 10）

（保留、不使用）subscriptions / subscription_checkouts —— 舊 Oen recurring 測試架構（Legacy），見第 11 節
```

**Fixed IP 不是 Core 的概念**：Decision 11 明確要求「Fixed IP 屬於 Provider / infrastructure integration concern，不應進入 provider-independent Core domain」——因此本文件的 `orders` / `service_periods` schema **不會**出現任何 IP 相關欄位，固定 IP 的實作（例如 outbound proxy）完全是 Oen Adapter 層的基礎設施設定，Core 的 `apply-order-payment` 不需要知道、也不應該知道這件事。

---

## 3. Final Order Schema Proposal

### `orders`

| field | type | nullable | default | meaning | source of truth | notes |
|---|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK | — | |
| `user_id` | uuid | NOT NULL | — | 購買者 | `auth.users.id` | on delete 建議 `restrict`（見 C 清單） |
| `contract_acceptance_id` | uuid | NOT NULL | — | 這筆交易所使用／接受的 Contract Acceptance 歷史紀錄 | `contract_acceptances`（見 §9.1，**Decision 1**） | |
| `contract_version` | text | NOT NULL | — | 冗餘自 `contract_acceptances`，方便不 join 直接查 | 由 `contract_acceptance_id` 對應紀錄複製 | |
| `plan_code` | text | NOT NULL | — | `'monthly'` / `'annual'` | server-side 價格表 | check constraint |
| `amount` | integer | NOT NULL | — | 下單當下鎖定的金額（整數） | server-side 決定，絕不可信任前端 | |
| `currency` | text | NOT NULL | `'TWD'` | ISO 4217 | — | **CURRENT＝僅允許 `'TWD'`（check constraint）；FUTURE POSSIBILITY＝欄位存在是為未來可擴充其他幣別留餘地，目前不代表 JOTI 支援多幣別（Decision 2）** |
| `status` | text | NOT NULL | `'pending_payment'` | 訂單生命週期 | 本表自身 | **7 值**，見 §7（**Decision 3 + Decision 9** 修訂） |
| `payment_expires_at` | timestamptz | NOT NULL | — （不使用 DB column default，見 notes） | pending_payment 的付款期限 | 由 trusted server-side logic 在 Order 建立時計算並寫入 | **Decision 8**：由 30 分鐘改為 3 天。由 Order 建立流程（provider-independent Core function，如 `create-order-checkout`）依 `created_at + 3 days` 計算後於 INSERT 當下一併寫入，**不使用 column DEFAULT**——`created_at + interval '3 days'` 這種寫法在 Postgres 的 DEFAULT 表達式裡不成立（DEFAULT 無法參照同一列的另一欄位）。若 Step 3 Implementation 階段想要 DB 層額外保險，「用 trigger 在 insert 前自動計算」可以列為一個 implementation option，但非本次必要設計。與 Contract Review 的 3 日審閱期無關，見 §8 |
| `payment_attempt` | integer | NOT NULL | `1` | 目前合法的付款 attempt 編號 | Order 建立流程／重試流程（trusted server-side logic）維護 | **Decision A 新增**：每次對同一 Order 重新付款（`payment_failed → pending_payment`）時遞增。**不代表** provider transaction ID，**不保存**完整 attempt history——它只回答「現在正在等待的是第幾次嘗試」，供 trusted payment application function 做原子比對用（見 §7、§13） |
| `provider` | text | NOT NULL | `'oen'` | 這筆交易由哪個 Payment Provider Adapter 處理 | — | *誰處理付款*（Decision 4） |
| `provider_checkout_ref` | text | NULLABLE | — | provider 端 checkout/session 識別碼 | provider adapter | **代表目前／最新一次 provider attempt 的 reference**，每次重試由 Provider Adapter 覆寫——**不是** attempt history 的容器（Decision A）；完整的每次嘗試歷史交給 `payment_events` 保存（見 §11、§13） |
| `provider_ref` | text | NULLABLE | — | provider 端可回查驗證的交易識別碼 | provider adapter | 同上：**代表目前／最新一次 provider attempt**，每次重試覆寫，不是 attempt history（Decision A） |
| `payment_method` | text | **NULLABLE，建立時預設 NULL** | — | 會員實際使用的付款方式（canonical 值，如 `credit_card`） | 付款經 provider 驗證成功後，由 Provider Adapter 正規化寫入 | **不設 DB enum / check constraint**（Decision 4）：`provider`＝誰處理付款，`payment_method`＝用什麼方式付款，兩者不得合併 |
| `refund_requested_at` | timestamptz | NULLABLE | — | 會員申請 Early Service Period Termination（進入 refund 流程）的時間 | 見下方【Refund 併入 orders 的說明】 | 與 `service_periods.termination_requested_at` 是同一事件在兩張表上的記錄，見 §4 |
| `refund_amount` | integer | NULLABLE | — | 依 legal-spec §11 公式計算之退款金額 | 不重新設計公式 | |
| `refund_calculated_at` | timestamptz | NULLABLE | — | 退款金額計算時間 | | |
| `provider_refund_ref` | text | NULLABLE | — | provider 端退款交易識別碼（若走 provider API） | provider adapter；人工退款時可為 NULL | |
| `provider_refund_error` | text | NULLABLE | — | 退款失敗原因（`status='refund_failed'` 時使用） | **不假設退款一定成功**（Decision 9 延續 Decision 3 的精神） | |
| `refund_processed_at` | timestamptz | NULLABLE | — | 退款實際完成（或最終失敗）時間 | | |
| `created_at` | timestamptz | NOT NULL | `now()` | | |
| `updated_at` | timestamptz | NOT NULL | `now()` | trigger 維護 | |

**【Refund 併入 orders 的說明】（本次更新的結構性變化）**：前一版把 Refund 設計成獨立的 `refunds` 表、有自己的 `status`（`processing/completed/failed`）。**Decision 9 明確要求「不再建立獨立 Refund status」、「Refund lifecycle 直接由 Order status 表示」**，因此本次把原本會放在 `refunds` 表的欄位（金額、計算時間、provider 退款識別碼、失敗原因、處理完成時間）直接併入 `orders`——因為狀態已經統一由 `orders.status` 承載，不再需要一張有自己狀態機的平行表。這是**因應 Decision 9 而做的結構調整**，不是新的商業決策；如果未來「退款重試」（Open Question）被確認需要支援多次嘗試紀錄，屆時可能需要重新拆出一張 attempt-log 表，但那是未來的事，本次不預先建立。

**明確不放進 `orders` 的東西**：Service Period 的 `active`/`expired`/`terminated_at`（屬於 §4）、provider raw payload（留在 `payment_events`）、任何 IP／基礎設施相關欄位（見 §2）。

---

## 4. Service Period Schema Proposal

**Decision 3 已明確確認**：`active` / `expired` 屬於 Service Period 的 domain，不放在 Order 上；Basic Agreement 才有 termination / cancelled 的概念（見 §9.2）。

### `service_periods`

| field | type | nullable | default | meaning | notes |
|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK | |
| `order_id` | uuid | NOT NULL, UNIQUE | — | 對應的 Order | 1 order → 1 service period |
| `user_id` | uuid | NOT NULL | — | 冗餘，方便 RLS／查詢 | |
| `plan_code` | text | NOT NULL | — | 冗餘 | |
| `service_period_start` | timestamptz | NOT NULL | — | 付款驗證成功當下寫入 | 非 order 建立當下 |
| `service_period_end` | timestamptz | NOT NULL | — | 原始應屆滿時間，**不因提前終止而回撥** | 退款公式需要用到原始長度 |
| `status` | text | NOT NULL | `'active'` | `active` / `expired` | 僅兩值：`terminated_at` 非空即代表已提前結束，entitlement 判斷用 `status='active' AND terminated_at IS NULL AND now() < service_period_end` 即可正確運作，不需要第三個 enum 值（仍是 B 建議，非定案） |
| `termination_requested_at` | timestamptz | NULLABLE | — | 會員申請提前終止時間 | 與 `orders.refund_requested_at` 記錄同一事件 |
| `terminated_at` | timestamptz | NULLABLE | — | 提前終止**實際生效**時間 | 建議在 `orders.status` 進入 `refund_processing` 的同一時刻寫入（付費存取立即停止），不等待退款款項實際處理完成——仍是 B 建議，非已確認 |
| `created_at` / `updated_at` | timestamptz | NOT NULL | `now()` | | |

**提前終止語意，尚待 Step 3 Implementation 前明確決定（未自行做商業決策）**：目前的設計是 `status` 只有 `active` / `expired` 兩值，提前終止不新增 enum 值，改用 `terminated_at` 是否為 NULL 來區分「自然到期」與「提前終止」。這是本文件的建議（見 §17 B 清單），**但「提前終止後 `status` 具體要落在哪個值、以及落值的確切時機」在進入 Step 3 Implementation 前必須明確拍板**，不能只停留在 Proposal 層級的建議就直接寫進 migration。是否維持兩值 + `terminated_at` 的設計，或改採第三個 enum 值，列為 §18 C 清單的 Open Question，待您決策。

---

## 5. Refund（不再是獨立 Schema——併入 Order，見 §3）

依 **Decision 9**，本節內容已整併進 §3 的 `orders` 表定義，不再單獨列出 `refunds` schema。保留以下原則性說明：

- Refund lifecycle 完全由 `orders.status` 表示：`paid → refund_processing → refunded`，或 `paid → refund_processing → refund_failed`。
- **不假設 Oen 會透過 webhook 通知 refund completion**（Decision 9 明確指出）：依上一輪 Oen Verification 的結論，Oen 的 `/refunds/:transactionHid` 是同步 API，退款結果直接包在該次 API call 的 response 裡，官方文件沒有記載退款有對應的 webhook 事件。Provider Adapter 必須依 Oen 實際 API 行為（同步回應）處理退款狀態，不能預設會有非同步通知。
- Refund 不等於 Basic Agreement termination，不會重新啟動 Contract Review（既有 `payment-legal-spec.md` 規則，本次設計與其一致，未新增或修改業務規則本身）。
- **Open Question（未解決，見 C 清單）**：Refund failed 後是否允許 retry、retry 的具體規則——目前 schema（`orders` 單一列）預設「一次退款嘗試對應一組欄位」，如果未來確認需要支援多次嘗試的完整紀錄，屆時需要重新評估是否拆出獨立表。

---

## 6. Order / Service Period Relationship Diagram

```
contract_acceptances (1) ──< orders (N)         ← Decision 1：歷史紀錄模式
                                  │
                                  │ 1:1（UNIQUE order_id）
                                  ▼
                            service_periods (1)
```

Refund 欄位已併入 `orders`（見 §3、§5），因此不再有獨立的 Refund 節點。

Basic Agreement Termination Record（見 §9.2）**與此圖無 FK 關聯**——Decision 10 明確指出它不屬於 Order、也不屬於 Service Period，是完全獨立的紀錄實體，故不畫入本圖。

---

## 7. Order State Transition Proposal（依 Decision 3 + Decision 9 全面修訂）

移除 `cancelled` / `active` / `expired`。最終 **7 值**：`pending_payment / paid / payment_failed / payment_expired / refund_processing / refund_failed / refunded`。

```
                      ┌──────────────────┐
        ┌────────────►│  pending_payment  │  (Order 建立時的初始狀態)
        │             └──────────────────┘
        │ 同一 Order 再次付款   │付款驗證成功   │付款失敗          │payment_expires_at 已過（3 天）
        │ （Decision A；須      ▼             ▼                  ▼
        │  payment_expires_at┌──────┐  ┌────────────────┐  ┌──────────────────┐
        │  > now()）         │ paid │  │ payment_failed │  │ payment_expired  │
        │                    └──────┘  └────────────────┘  └──────────────────┘
        │                       │             │  │                  ▲
        └───────────────────────┼─────────────┘  └──────────────────┘
                                 │              payment_expires_at 已過（3 天），未再次付款
                                 │ 會員申請 Early Service Period Termination（refund 流程啟動）
                                 ▼
                        ┌──────────────────┐
                        │ refund_processing │
                        └──────────────────┘
                                 │                          │
                                 │ 退款成功                  │ 退款失敗
                                 ▼                          ▼
                            ┌──────────┐            ┌───────────────┐
                            │ refunded │            │ refund_failed │
                            └──────────┘            └───────────────┘
```

**Decision A（本次確認）**：`payment_failed → pending_payment` 是正式加入的允許轉換，**必須受 `payment_expires_at > now()` 保護**——只有在原 Order 的 3 天付款視窗尚未到期時，才能發起新的付款 attempt；一旦視窗已過，不論當下是 `pending_payment`（從未成功過）還是 `payment_failed`（重試過但沒成功），都只能進入／維持 `payment_expired`，不再接受任何新的 payment attempt。這條新轉換**沒有**引入新的 Order status 值，也**沒有**建立新的 attempts 資料表——同一 Order 多次嘗試靠新增的 `orders.payment_attempt` 欄位（見 §3）與 `payment_events` 的既有事件紀錄（見 §11、§13）區分，細節見下方「Payment Attempt / Retry」。

**關鍵澄清**：
- Service Period **自然到期**、或會員**沒有購買下一期**，不會改變 `orders.status`：只要這筆 order **沒有進入退款流程**，`orders.status` 就維持 `paid`（它是一個已完成的付款事實），是否還有生效中的存取權限由 `service_periods.status` 單獨回答，不回頭改動已付款的 order。若之後**發生 Early Service Period Termination + Refund**，`orders.status` 才會依 refund lifecycle 從 `paid` 轉為 `refund_processing`，再依結果轉為 `refunded` 或 `refund_failed`（見上方 state diagram）。
- Order 沒有 `cancelled`：這個概念完全由 `refund_processing → refunded / refund_failed` 這條路徑承載。
- `payment_failed`＝有付款嘗試但付款失敗；`payment_expired`＝付款期限（3 天）到了仍未完成付款——兩者語意明確區分，不得混用（Decision 8）。
- **Refund ≠ Basic Agreement termination；Refund 不會重新啟動 Contract Review**——既有 `payment-legal-spec.md` 規則，本次設計與其一致。

**已解決（前版的缺口）**：前一版 Proposal 曾標記「退款失敗時 `orders.status` 該停在哪」為未決問題——**本次已由 Decision 3 的 7 值清單解決**：`refund_failed` 是正式的終態，不需要再猜測或臨時借用其他狀態。

**仍未解決（見 C 清單）**：`refund_failed` 之後是否允許重新發起退款（回到 `refund_processing`）、還是視為終態需要人工介入——這是 Decision 9 明確保留的 open question，本文件不自行假定答案，圖中也刻意不畫出 `refund_failed → refund_processing` 的箭頭。

**已解決（本次由 Decision A 補上）**：前一版 Proposal 曾標記「`payment_failed` 後是否允許同一 Order 重新付款」為未決問題（原 §18 C 清單第 4 項）——**本次已由 Decision A 解決**：允許，且使用者不需要建立新 Order。

### Payment Attempt / Retry（Decision A）

- **UX 層 vs Provider 層的區分**：使用者體感上是「同一筆 Order 再付款一次」——`orders.id` 從頭到尾不變，`orders.status` 在 `pending_payment ⇄ payment_failed` 之間循環，直到 `paid` 或 `payment_expires_at` 到期為止。但在 Provider（Oen）端，**每一次 attempt 都是獨立的一次 checkout / transaction**，各自有自己的 provider 識別碼——Core 不假裝這些是同一筆 provider 交易，只是同一筆 JOTI Order。
- `orders.payment_attempt`（見 §3）記錄「目前合法的嘗試編號」，每次重新付款時遞增；`provider_checkout_ref` / `provider_ref` 只代表**目前／最新一次**的 provider 端 reference，重試時被覆寫——完整的每次嘗試歷史交給 `payment_events` 保存（見 §11），不在 `orders` 上疊加 attempt history，也不需要為此新增一張 attempts 表。
- **Idempotency 保護**（詳見 §13）：trusted payment application function 把 `status` 轉為 `paid` 前，必須同時確認 order id、`status='pending_payment'`、`payment_attempt` 與該 provider 事件所對應的目前 attempt 一致，且用單一原子條件達成，避免舊嘗試（已經 `payment_failed` 的那一次）晚到的 provider 事件，把後續新的嘗試誤標記為 `paid`。
- **Provider 端如何識別是哪一次 attempt**：屬於 Oen Adapter 的實作細節，非 Core schema 規則，見 §10。

---

## 8. Payment Expiration Proposal（Decision 8 修訂：30 分鐘 → 3 天）

`payment_expires_at` 由 trusted server-side logic 在 Order 建立當下依 `created_at + 3 days` 計算後寫入（不是 DB column default，理由見 §3 notes）。

1. **RPC 層強制（必要）**：驗證付款成功的 trusted RPC（如 `apply-order-payment`）在把 `status` 改成 `paid` 前，先檢查 `payment_expires_at > now()`；已過期則拒絕轉為 `paid`，改標記／維持 `payment_expired`。
2. **背景清理（建議）**：`pg_cron` 或排程 Edge Function 定期執行 `UPDATE orders SET status='payment_expired' WHERE status IN ('pending_payment', 'payment_failed') AND payment_expires_at < now()`。
3. `paid` **不會**因 `payment_expires_at` 到期而變回或變成 `payment_expired`——`payment_expires_at` 只約束 `pending_payment` / `payment_failed` 這兩個「還沒付款成功」的狀態的存續時間，一旦已經是 `paid`，這個欄位就不再有作用。
4. **Decision A**：同一 Order 的重試（`payment_failed → pending_payment`）**不會重新計算、也不會延長** `payment_expires_at`——它永遠錨定在最初的 `created_at`。因此發起新一次 attempt（重試）的動作本身，也必須先檢查 `payment_expires_at > now()` 才允許進行；超過期限後，即使先前是 `payment_failed`，也不再允許發起新的 attempt，只能進入／維持 `payment_expired`（使用者此時只能建立全新的 Order，這是完全不同、不受本次決策影響的既有規則）。

> **語意邊界提醒（Decision 8 明確要求）**：這個 3 天付款期限是 Order 自己的付款窗口，**與 Contract Review 的至少 3 日審閱期、Basic Agreement 或 Service Period 的任何期限完全無關**——兩者的「3」只是數字巧合。`payment_expires_at` 只回答「這筆 Order 還有多久可以完成付款」，不影響、也不被 `contract_review_available_at`、`service_period_end` 等其他時間欄位影響。

**未決邊界情況（延續前版，未被本次決策解決，未列入使用者核准的 Open Questions 清單，本次不重複列出，但技術上仍待釐清）**：webhook 在 `payment_expires_at` 之後才送達、但卡確實已扣款成功時，要嚴格拒絕（走人工退款）還是允許帶註記入帳？——因不在本次使用者提供的 Open Questions 範圍內，本文件不擅自新增為正式待決事項，僅在此處保留技術註記供未來參考。

---

## 9. Contract Acceptance & Basic Agreement Termination

### 9.1 Contract Acceptance Relationship（Decision 1，維持不變）

**確認方向：歷史紀錄模式**——每次會員明確同意 Contract / Contract Version，都新增一筆獨立紀錄，不覆寫、不只保存「目前最新一筆」。

#### `contract_acceptances`（append-only，不可 UPDATE）

| field | type | meaning |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | 會員 |
| `contract_version` | text | 本次同意之契約版本 |
| `contract_presented_at` | timestamptz | |
| `contract_review_available_at` | timestamptz | |
| `contract_acceptance_at` | timestamptz | 本次明確同意時間 |
| `created_at` | timestamptz | |

`orders.contract_acceptance_id` FK 到這張表——確保每筆訂單都能精確回溯「當次交易所使用／接受的 Contract Version 與相關 Acceptance 紀錄」。

### 9.2 Basic Agreement Termination Record（新增，依 Decision 10）

**確認方向**：Basic Agreement 的終止**不屬於 Order，也不屬於 Service Period**，需要一份獨立的 termination record / history，至少保存：

| field | type | meaning |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | 會員 |
| `requested_at` | timestamptz | 會員提出終止申請的時間 |
| `effective_at` | timestamptz | 終止**實際生效**時間（依 `payment-legal-spec.md` §6：若申請時存在有效 Service Period，此值＝該 Service Period 終止時間） |

**關鍵原則（Decision 10 明確要求）**：Basic Agreement **不因終止申請的提出而立即視為 terminated**，必須依 `effective_at` 判定目前是否已終止——`requested_at` 與 `effective_at` 必須分開保存，不得合併成單一時間戳記。

**本次刻意不做的事**：不自行發明完整的 termination status enum（例如 `active`/`terminated`/`pending_termination` 之類的完整生命週期狀態機）。這在前一版被列為 open question（「Basic Agreement 是否需要獨立 stateful 資料表」），本次 Decision 10 只確認了「需要一份記錄 requested_at / effective_at 的 termination record」，**沒有**確認完整的狀態欄位設計——這部分繼續保留為 open question（見 C 清單），不代為決定。

---

## 10. Function Naming / Provider Independence / Fixed IP Boundary

依 **Decision 5 + Decision 11**，Core 與 Provider Adapter 的命名與職責邊界：

| 層級 | 範例 | 規則 |
|---|---|---|
| **Core（provider-independent）** | `create-order-checkout`、`apply-order-payment` | 名稱不得包含 `subscription` 或 `oen`；不得包含任何 provider-specific 邏輯（webhook 解析、簽章驗證、IP 設定等）；未來加入第二個 provider 時，這一層完全不需要改名或改介面 |
| **Provider Adapter（provider-specific，可以保留 provider 名稱）** | Oen webhook 接收端點（如現行 `oen-webhook`）、`_shared/oen.ts` | **Decision 5 已明確確認**：Provider Adapter 可以是 provider-specific，因此 Oen-specific adapter／webhook endpoint 可以保留 Oen 名稱——這是前一版列為待決的邊界問題，本次已由使用者直接確認，不再是 open question |
| **Infrastructure（provider-specific，不進入 Core）** | 正式環境固定來源 IP／outbound proxy 設定 | **Decision 11 明確確認**：Fixed IP 屬於 Provider／infrastructure integration concern，不應進入 provider-independent Core domain；不把 Oen-specific webhook／fixed-IP 實作細節硬編進 Core Order model |

**Adapter 層的職責範圍（依 Decision 11，供 Step 3 Implementation 參考，非本次 schema 內容）**：
- Oen 有 Webhook Callback（Oen → JOTI 的通知機制）。
- Webhook payload 本身**不能**直接視為付款最終證據；收到後必須由 Provider Adapter 回查 Oen API 驗證（目前 `oen-webhook/index.ts` 已採此模式，見 §11）。
- Oen Webhook 目前**沒有**可用的 signature／HMAC 驗證機制。
- 正式環境 JOTI → Oen API 的來源需要固定來源 IP／IP whitelist——這件事完全在 Adapter／infrastructure 層處理，Core 的 `apply-order-payment` 等 function 不需要知道底層網路怎麼出去。

**Provider 端 attempt 識別（Decision A 相關）**：同一 Order 允許多次付款 attempt 後（見 §7、§3 `payment_attempt`），每一次 attempt 在 provider 端必須能被唯一識別，這樣 Provider Adapter 收到 webhook／回查結果時才能判斷它屬於哪一次 attempt。**這是 Oen Adapter 的 implementation example / possible approach，不是 Core schema 或跨 provider 的規則**：例如把送給 Oen 的 `orderId` 組成 `"{orders.id}#{payment_attempt}"`，讓 webhook 回傳的 `orderId` 可以同時解析出「哪個 Order」與「第幾次 attempt」。其他 provider 未必需要用同樣的字串格式——Core 只要求「Provider Adapter 必須能把收到的事件正確對應回目前的 `payment_attempt`」，具體怎麼做由該 provider 的 Adapter 自行決定。

---

## 11. Existing Schema Migration Mapping（依 Decision 6 / 7）

**Decision 6**：`subscriptions` / `subscription_checkouts` 屬於 **Legacy**。CURRENT 的 JOTI Learning 新付款流程**不再依賴或建立**它們；現階段**不 DROP**；舊 Oen TEST Subscription 資料**不自動 migration** 成新 Order。**未來若真的推出 Subscription 產品，再重新評估這些 legacy 架構是否可重用、改造或重新設計**——本次不預先假設會重用，也不預先假設會被淘汰，單純保留、不動它。

**Decision 7**：JOTI 尚未正式上線，目前沒有正式會員／付費會員／正式 Service Period／正式付款資料——**Existing Paid Members Migration = N/A（deferred until post-launch）**，本次不設計。

| Existing object | 與新模型的關係 | 本次行動 | 狀態 |
|---|---|---|---|
| `subscription_checkouts` | 概念上部分重疊於 `orders` 的 `pending_payment` 階段，但屬於 Legacy recurring 模型 | **不修改** | retain，新流程不使用 |
| `subscriptions` | 概念上部分重疊於 `orders` + `service_periods`，但屬於 Legacy recurring 模型 | **不修改** | retain，新流程不使用；是否未來重用／改造，留待「真的要推出 Subscription 產品」時再評估；舊 test 訂閱（`S2026091055MVCVI8`）之處理時機為獨立於本次 schema decision 的操作性問題（operational issue），不列入 §18 的 Step 2 Open Questions |
| `payment_events` | 可沿用（provider-agnostic 設計已符合需求） | **Step 3 應一併規劃**新增 nullable `order_id` 欄位（additive）——因應 Decision A：同一 Order 可能有多次 payment attempt，需要能依 Order 查詢／稽核／除錯每一次 attempt 各自的 provider event | retain，additive 擴充（優先順序由「未來可做」提升為「Step 3 建議一併規劃」） |
| `profiles.subscription_status` | Legacy 模型的 derived cache | **本次不改** `get_membership_status()` | retain，新舊並存方式留待 Step 3 Implementation 階段規劃 |
| **既有正式付費會員資料** | — | **N/A** | Decision 7：pre-launch，不存在需要遷移的正式資料，deferred until post-launch |

---

## 12. RLS / Security Proposal

- `orders` / `service_periods`：`enable row level security`；SELECT 僅限 `auth.uid() = user_id` 或 `is_admin()`；**無 INSERT / UPDATE / DELETE policy**——所有寫入與狀態轉換（含付款驗證、退款流程）一律透過 `service_role` 的 trusted RPC（比照現有 `apply_oen_subscription_charge()` 的權限收斂模式：`revoke ... from public, anon, authenticated` + `grant ... to service_role`）。
- `contract_acceptances`：同樣 SELECT 限本人/admin；**無 UPDATE / DELETE policy**（歷史紀錄表，本質上不可修改，只能新增）。
- Basic Agreement Termination Record（§9.2）：同樣模式，SELECT 限本人/admin，寫入僅限 trusted RPC；由於尚未定案完整 schema，RLS 細節待該表正式設計時一併規劃。

---

## 13. Idempotency Proposal

沿用前一版設計：`payment_events` 的 `(provider, event_key)` unique 作為 webhook 防重複的第一層；trusted RPC（如 `apply-order-payment`）本身需冪等（`service_periods.order_id UNIQUE` 是最後一道防線）；退款欄位已併入 `orders`（見 §5），冪等性由 `orders.status` 的狀態轉換本身保證（例如只有 `status='refund_processing'` 時才允許轉為 `refunded`/`refund_failed`，重複呼叫應是無害的 no-op）。

**Decision A 補充（同一 Order 多次 payment attempt 的冪等性）**：`apply-order-payment` 把 `status` 轉為 `paid` 時，除了原本的 `status='pending_payment'` 條件，**必須額外同時確認 `payment_attempt` 與該 provider 事件所對應的目前 attempt 一致**，並且用單一原子條件達成（例如 `UPDATE orders SET status='paid', ... WHERE id=:order_id AND status='pending_payment' AND payment_attempt=:event_attempt`）。這個複合條件同時防止兩種情況：(1) 舊嘗試（已經 `payment_failed`）晚到的 provider 事件，把後續新的嘗試誤標記為 `paid`；(2) 使用者連續觸發多次重試時的併發競爭——發起重試、遞增 `payment_attempt` 的動作也應該用同樣的原子 `UPDATE ... WHERE status='payment_failed' ...` 模式，讓同時發生的多個重試請求只有一個會真的成功推進。

---

## 14. Existing Data Migration Risks（依 Decision 6 / 7）

| 項目 | 風險等級 | 說明 |
|---|---|---|
| 正式付費會員資料遷移 | **無（N/A）** | Decision 7：目前不存在正式付款資料，不需要規劃 |
| 舊 test recurring subscription（`S2026091055MVCVI8`） | 低（獨立事項） | 與本次 schema 決策無關，其清理時機是操作性決定，非本次 Proposal 範圍；不列入 §18 的 Step 2 Open Questions |
| `subscription_checkouts` / `subscriptions` 既有資料 | 無 | 依 Decision 6，本次不修改、不搬移、不清理 |
| Legacy 是否重用於未來 Subscription 產品 | 待定，非本次範圍 | Decision 6：不預先假設，留待真的推出 Subscription 產品時再評估 |

---

## 15. Implementation Sequencing（建議順序，仍為 Proposal，非授權執行）

1. `contract_acceptances`
2. `orders`（含併入的 refund 欄位）
3. `service_periods`
4. RLS policies + trusted RPC（provider-independent 命名：`create-order-checkout` / `apply-order-payment` 等，見 §10）
5. `payment_expires_at`（3 天）背景清理機制
6. （Step 3 範圍）Oen Adapter 重構（webhook 接收、回查驗證、固定 IP outbound 設定）、`get_membership_status()` 擴充、前端改走新模型
7. Basic Agreement Termination Record 的正式 schema 設計——待 Open Question（完整 lifecycle/status enum）解決後才進入 schema 設計
8. Legacy `subscriptions`/`subscription_checkouts` 退場規劃——待新架構穩定後才開始討論，不在本次或緊接的 Step 3 範圍內

**在完成人工 Review 並取得明確授權前，不進入 Step 3 Implementation。**

---

## 16. A. 已確認事項

- One-time Order 模型，不自動續訂；Order 只在「使用者實際發起購買 + Contract Review Gate 通過」之後建立。
- Core／Payment Provider Adapter 分離；Oen 是目前第一個 Provider；核心 function 命名不得含 `subscription`／`oen`；**Provider Adapter（含 webhook 接收端點）可以保留 provider 名稱**（Decision 5）。
- **Contract Acceptance 採歷史紀錄模式**：每次同意契約都留獨立紀錄，`orders.contract_acceptance_id` FK 到此歷史紀錄（Decision 1）。
- Currency：CURRENT＝TWD，FUTURE POSSIBILITY＝schema 保留擴充空間，不做 multi-currency pricing（Decision 2）。
- **Order status 七值**：`pending_payment / paid / payment_failed / payment_expired / refund_processing / refund_failed / refunded`；**不含** `cancelled` / `active` / `expired`（Decision 3）。
- **Service Period 的 `active`/`expired` 是 Service Period 自己的 domain，不放在 Order 上；Basic Agreement 才有 termination/cancelled 概念**（Decision 3）。
- `orders.payment_method` 保留、nullable、無 DB enum，付款驗證後由 Provider Adapter 正規化寫入；與 `provider`（誰處理付款）語意分開（Decision 4）。
- **`payment_expires_at = created_at + 3 天`**；`paid` 不因到期變回 `payment_expired`；`payment_failed` 與 `payment_expired` 語意分開；3 天付款期限與 Contract Review／Basic Agreement／Service Period 的期限無關（Decision 8）。
- **Refund lifecycle 直接由 `orders.status` 表示，不建立獨立 Refund status**：`paid → refund_processing → refunded` 或 `refund_failed`；Refund ≠ Basic Agreement termination；Refund 不會重新啟動 Contract Review；不假設 Oen 會透過 webhook 通知退款完成（Decision 9）。
- **Basic Agreement Termination 需要獨立的 termination record**（不屬於 Order 或 Service Period），至少保存 `requested_at` / `effective_at`，且不因申請提出就立即視為終止，須依 `effective_at` 判定（Decision 10）。
- **Oen Integration 邊界**：Oen 有 Webhook Callback（Oen → JOTI）；webhook payload 不可直接當付款最終證據，須由 Provider Adapter 回查 Oen API 驗證；目前無 signature/HMAC 機制；正式環境 JOTI → Oen API 需要固定來源 IP；Fixed IP 屬於 Provider/infrastructure 層，不進入 Core domain（Decision 11）。
- `subscriptions` / `subscription_checkouts` 屬於 **Legacy**，CURRENT 新流程不依賴或建立它們，現階段不 DROP，舊 Oen TEST Subscription 不自動 migration；未來若推出 Subscription 產品再重新評估是否重用這些 legacy 架構，不預先假設（Decision 6）。
- **Existing Paid Members Migration = N/A（pre-launch，deferred until post-launch）**，本次不設計（Decision 7）。
- CURRENT＝JOTI Learning + One-time Order + Service Period + 不自動續訂；FUTURE Subscription/Automatic Renewal/Automatic Payment 屬於未來產品研究，不因此修改目前 CURRENT 模型（Decision 12）。
- **`payment_failed` 後允許同一 Order 重試**：只要 `payment_expires_at`（原始 `created_at + 3 天`，重試不重置不延長）尚未到期，允許 `payment_failed → pending_payment`，使用者不需要建立新 Order；新增 `orders.payment_attempt`（`integer not null default 1`）標示目前合法嘗試編號，不代表 provider transaction ID、不保存完整 attempt history；`provider_checkout_ref`/`provider_ref` 只代表目前／最新一次 attempt；trusted payment application function 轉為 `paid` 前必須同時比對 order id、`status='pending_payment'`、`payment_attempt` 三者；沒有新增 Order status，沒有新增 attempts 表（Decision A）。

## 17. B. Claude 建議但尚未確認事項

- `service_periods` 獨立成表（方案 B，前一版已提出，本次未變動）。
- Service Period 維持兩值狀態（`active`/`expired`），用 `terminated_at` 區分提前終止，不新增第三個 enum 值——**這只是 Claude 的建議，最終落值方式已移入 §18 C 清單，需要您在 Step 3 Implementation 前明確決策**，不視為本文件已定案的設計。
- `service_periods.terminated_at` 建議在 `orders.status` 進入 `refund_processing` 的同一時刻寫入，而非等退款完成。
- Refund 相關欄位併入 `orders`（不再是獨立表）——這是本次因應 Decision 9 所做的結構調整，如果未來需要支援多次退款嘗試的完整紀錄，可能需要重新拆表。
- `orders.user_id` 的 `on delete` 行為建議改為 `restrict`。

## 18. C. 仍需要您決策的 Open Questions

以下是與已確認架構方向不衝突、真正尚未決定的事項：

1. **Basic Agreement termination record 是否需要正式 lifecycle/status enum，以及完整狀態定義**（§9.2）——Decision 10 只確認了需要 `requested_at`/`effective_at`，沒有確認完整的狀態機設計。
2. **Refund failed 後是否允許 retry，以及 retry 的具體規則**（§5、§7）——目前 `orders` 的退款欄位設計是「一次嘗試對應一組欄位」，retry 政策一旦確認，可能影響是否需要改回獨立表。
3. **Oen refund 在特殊銀行處理延遲情況下是否可能出現非同步狀態**（§5）——官方文件顯示 `/refunds/:transactionHid` 是同步 API，但銀行端實際處理延遲時的行為未見文件明確說明。
4. **Service Period 提前終止後，`status` 的具體落值方式**（§4）——目前是 Claude 的建議（兩值 `active`/`expired` + `terminated_at` 區分），**在進入 Step 3 Implementation 前必須明確決策**是否採用此設計或改用第三個 enum 值。

> **`payment_failed` 後是否允許同一 Order 重新付款，已由 Decision A 解決，不再列於本清單**：確認方向見 §7「Payment Attempt / Retry」與 §3 `orders.payment_attempt`。

> **舊 Oen TEST Subscription（`S2026091055MVCVI8`）的清理時機不再列於本清單**：依本文件 §11／§14 的定義，這是一個獨立於本次 Order Schema 決策之外的操作性問題（operational issue），不是 Step 2 的 schema decision，因此移出正式 Open Questions；相關敘述仍保留在 §11／§14 原處，供追蹤。
