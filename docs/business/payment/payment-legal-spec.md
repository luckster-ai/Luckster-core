# JOTI Payment — Legal / Business Specification

## Purpose

本文件是 JOTI Payment 的商業／法律規格，把 [`docs/legal/joti-online-teaching-contract.md`](../../legal/joti-online-teaching-contract.md) 裡與系統設計相關的規則，整理成明確、結構化、可對照實作的規格。

本文件**不是**給會員閱讀的契約全文——會員看到的正式契約文字，一律以 `joti-online-teaching-contract.md` 為準；試用期間給會員看的簡易說明，見 [`joti-trial-and-usage-notice.md`](../../legal/joti-trial-and-usage-notice.md)。若本文件與契約全文有出入，以契約全文為準，並應視為本文件需要更新。

本文件是 [`payment-integration-rules.md`](./payment-integration-rules.md) 的規則來源；工程實作規則不得與本文件矛盾。

---

## 0. 核心架構：Membership Service Basic Agreement + Service Period

JOTI 採**兩層契約架構**，這是理解以下所有規則的前提：

```
Membership Service Basic Agreement（會員服務基本契約）
  │  持續存在，直到依規則終止（見第 6 節），不因任何一次付費到期而結束
  │
  ├── Service Period #1（例如 2026-01 月方案）
  ├── Service Period #2（例如 2026-02 月方案，會員另行主動購買）
  └── Service Period #N …
```

- **基本契約**是會員與 JOTI 之間持續性的會員關係，一旦成立（審閱＋同意）就存在，直到終止。
- **每一個 Service Period**（月方案或年方案）是會員在既有基本契約下購買的一段有償服務期間，各自獨立、各自屆滿、互不自動延續。
- 這與本文件先前版本（每次付款＝獨立固定期限契約）不同，請不要沿用舊版「每次付款各自是一份新契約」的框架。

---

## 1. 概念定義與關係（Concept Model）

以下概念僅作**規格層級的關係說明**，刻意不涉及實際資料庫 schema 設計（schema 設計留待 implementation 階段決定）：

| 概念 | 定義 | 與其他概念的關係 |
|---|---|---|
| **Trial** | 註冊後自動開始的免費試用資格 | 與 Contract Review 是獨立計時、可重疊；不產生付款義務 |
| **Contract** | 會員服務基本契約（Basic Agreement）本身的內容與版本 | 每次修訂產生新的 `contract_version` |
| **Contract Review** | 乙方審閱 Contract 的至少 3 日期間 | 在乙方「準備成為正式會員」時觸發，與 Trial 平行、不互相取代；審閱期屆滿≠已同意契約 |
| **Purchase Intent** | 乙方選擇方案（Monthly/Annual）、表示想購買的意向 | 發生在 Contract 已同意（基本契約已成立）之後；本身不是付款動作 |
| **Payment Authorization** | 乙方明確同意的付款方式授權動作（含可能的先綁卡、待條件成就後扣款） | 由 Purchase Intent 觸發，但是獨立的意思表示，不可由 Purchase Intent 自動推定已發生 |
| **Order** | JOTI 對「一次 Service Period 購買」的紀錄與其生命週期 | 由 Payment Authorization 後建立；一個 Order 對應一個 Service Period |
| **Payment** | 實際的金流交易與其伺服器端驗證結果 | Order 是否轉為已付款，依 Payment 驗證結果決定 |
| **Membership** | 乙方在基本契約下的會員身份與其目前是否具備有效 Service Period | 由已驗證的 Payment/Order 推導出目前是否有生效中的 Service Period |
| **Service Period** | 一段具體、有起訖日期的付費服務期間（Monthly 或 Annual） | 由一個已付款的 Order 產生；屆滿後 Membership 的付費存取權限停止，但基本契約不受影響 |
| **Renewal** | 乙方在既有基本契約下，主動購買下一個 Service Period 的行為 | 產品用語，法律上是新的 Purchase Intent → Order 流程，不是自動延長 |

**關鍵原則（不得混淆的邊界）**：`trial_start`、`review_completed`、`contract_acceptance` 這三個事件，**都不等於** `purchase_confirmed`，`purchase_confirmed` 也**不等於** `payment_authorized`。這些狀態/事件彼此獨立，不得在系統中被合併成單一狀態或單一時間戳記。

---

## 2. 方案（Plans / Service Periods）

| 方案代碼（建議） | 名稱 | 價格 | 服務期間 |
|---|---|---|---|
| Monthly | 月方案 | NT$333 | 每一 Service Period 1 個月 |
| Annual | 年方案 | NT$3,333 | 每一 Service Period 1 年 |

- 價格為新臺幣、單次給付總價，不得於同一 Service Period 內另行加收。
- 每個 Service Period 對應一個獨立的 Order；Service Period 之間不自動銜接（見第 5 節）。

---

## 3. 免費試用（Trial）

- 觸發時點：會員完成註冊時自動開始，不需另行申請，**不產生任何付款義務**。
- 結束條件：以下兩者「先」達成者，試用結束：
  - 自註冊起算滿 **30 個日曆日**（calendar days）；或
  - 累計「有效使用時間」達 **30 小時**。
- 「有效使用時間」定義（**已確認，不重新設計**，實作參考 `frontend/src/hooks/useModuleUsageTracking.js`、`frontend/src/utils/membershipStatus.js`）：
  - **計入**：Module 影片實際播放中，且 JOTI 頁面前景可見、分頁非 background、視窗非 minimized、裝置未 sleep、螢幕未關閉。
  - **不計入**：paused、buffering/stalled、影片播放結束後的任何時間。
- 試用結束**不自動觸發**契約審閱、購買或扣款——這些都是乙方另行主動觸發的行為。

---

## 4. 契約審閱期間（Contract Review Period）— 本規格最重要規則之一

- 法源依據：台灣《網際網路教學服務定型化契約應記載及不得記載事項》，**至少 3 日**契約審閱期間。
- **觸發時點**：乙方**準備成為正式會員**時（不一定是註冊當下），甲方提供完整契約並開始起算：
  ```
  contract_review_available_at = contract_presented_at + 3 calendar days
  ```
- **與 Trial 是兩個獨立的計時器，可以重疊，不得合併或互相取代。**
  - Trial 的起訖不受契約審閱期間影響；審閱期間屆滿與否，也不受 Trial 進度影響。
  - 範例：Day 0 註冊開始 Trial；Trial 進行中某天乙方表示要成為正式會員，此刻才 present 契約、起算 3 天；審閱期滿後，乙方仍可以繼續使用其原本 Trial 剩餘的部分，不強迫立刻購買。
- **`review_completed`（到達 `contract_review_available_at`）＝ 具備同意契約的資格，不等於已經同意契約，更不等於已經決定購買或已授權付款。**
- **禁止事項**：
  - 不得以單一 checkbox 或任何快速確認 UX，讓會員實質放棄或縮短審閱期間。
  - 不得讓 `review_completed` 或 `trial_start` 本身觸發任何扣款或自動建立訂單。
- 必要紀錄欄位：
  | 欄位 | 說明 |
  |---|---|
  | `contract_version` | 會員審閱之契約版本 |
  | `contract_presented_at` | 契約提供予會員之時間 |
  | `contract_review_available_at` | = `contract_presented_at` + 3 天，具備同意契約資格之時間 |
  | `contract_acceptance_at` | 會員明確同意契約、基本契約正式成立之時間 |

---

## 5. 基本契約與 Service Period 的生命週期

### 基本契約（Basic Agreement）
- 成立：審閱期滿 **且** 乙方明確同意契約（`contract_acceptance_at`）。
- 存續：持續存在，不因任何 Service Period 屆滿而終止。
- 終止：見第 6 節。

### Service Period（月方案／年方案）
- 建立前提：基本契約已成立（或於同一流程中同時成立）。
- 建立流程：Purchase Intent → Purchase Confirmation → Payment Authorization → Order 建立 → Payment 驗證成功 → Service Period 啟用。
- 屆滿：到期即結束，**不自動續約、不自動扣款、不自動建立下一個 Service Period**。
- 屆滿後：Membership 的付費存取權限停止，但基本契約不受影響；乙方可自行決定是否購買下一個 Service Period（即「續訂」，見第 7 節）。

---

## 6. 基本契約之終止（獨立於 Service Period 屆滿）

- **Service Period 屆滿 ≠ 基本契約終止**，兩者是不同層次的事件，不得混淆。
- 基本契約終止事由：
  1. 乙方主動申請終止；
  2. 甲方因乙方違約而終止；
  3. **長期未購買終止程序**：連續 **12 個月**無任何有效 Service Period → 甲方得通知乙方 → 給予至少 **15 日**處理／重新啟用機會 → 逾期未回應／未重新啟用 → 基本契約終止。
- 基本契約終止後，乙方日後如欲重新使用服務，**視為重新申請、重新成立新的基本契約**，須重新進入契約審閱程序（第 4 節），不得援用已終止之基本契約權益。

---

## 7. 續購／續訂（Renewal）

- **JOTI 絕對不採自動續約**，任何情況下都不得：
  - 自動扣款
  - 自動延長 Membership 的付費存取權限
  - 服務期間到期自動建立下一個 Service Period 或對應 Order
  - 使用會員已授權的付款方式，於未經會員針對該次扣款重新明確確認之情況下自動扣款
- 「續訂」＝**會員在既有基本契約下，另行主動購買一個新的 Service Period**，法律上不是新的基本契約，也不是對原基本契約的自動延展：
  ```
  會員主動選擇要續購 → 新的 Purchase Intent / Confirmation / Payment Authorization → 新的 Order → 新的 Payment → 新的 Service Period
  ```
- **【已確認】於同一份仍然有效存續的基本契約下，會員之後主動購買新的 Service Period（續購），不重新啟動完整的 3 日契約審閱期間。** 理由：基本契約並未因 Service Period 屆滿而終止或重新成立（見第 5、6 節），會員就基本契約之審閱與同意早已完成一次，續購僅是在同一份既有基本契約下另行購買一段新的付費服務期間。
- 前項規則的兩個例外，須另行處理，**不適用**免除審閱期的規則：
  1. **基本契約已依第 6 節終止**：會員日後重新加入，視為重新申請、重新成立新的基本契約，須重新進入完整的契約審閱程序。
  2. **契約條款發生第 8 節所定之重大變更**：此種情形不是單純續購，不得比照本節規則處理；其審閱、通知與同意程序依當時應適用法令及第 8 節之變更程序辦理，本文件對這種情形**不逕行宣稱**審閱期應予免除或應予重新起算，須個案判斷。
- Oen 或任何 payment provider 即使提供 recurring subscription 能力，**不代表 JOTI 就應該使用它**作為續購的自動化機制——是否使用，由本文件（商業規則）決定，不是由 API 能力決定。

---

## 8. 契約內容之變更

- **一般內容/產品更新**（新增課程影片、課程重新整理、UI 更新、教學內容優化等）：不構成契約重大變更，甲方得逕行為之。
- **契約條款重大變更**（付款義務、費用、退款規則、會員權利、服務範圍、續購規則、終止規則、重大責任配置等）：依當時應適用法令及主管機關規範處理，並依甲方公告之變更程序通知會員。**本文件不自行斷言所有重大修改都必然重新產生一次新的 3 日審閱期**——法律要求與產品設計分開描述，實際處理方式應個案判斷並可能需要法律諮詢確認。
- **本節所稱契約條款重大變更，與第 7 節所稱同一份有效基本契約下之續購並非同一件事**：續購不涉及契約條款變更，依第 7 節「已確認」之規則處理（不重新啟動審閱期）；唯有契約條款本身確實發生重大變更時，才適用本節規則。

---

## 9. Oen 使用範圍與能力邊界

- **T-1（One-time Checkout）**：已驗證可用，正式架構應以此為基礎付款方式。
- **先綁卡、待條件成就後一次性扣款**：**已確認 Oen 技術上可支援**此種流程（先綁定信用卡、不立即扣款、待特定條件—例如 Trial 屆滿—成就後再執行一次扣款）。這項技術能力**可以**用於支援第 10 節所述之「Trial → 主動購買 → 條件成就後扣款」產品流程，**但**僅限於乙方已完成購買確認與付款授權後，依乙方明確同意之條件執行**一次**扣款；不得利用此技術能力，於乙方未另行同意之情況下，對此後之任何後續 Service Period 反覆或自動執行扣款。
- **持續性自動扣款／訂閱式續約**：**JOTI 不使用**任何形式的 recurring/自動續約機制作為正式的續購方式（見第 7 節）。「Oen 能做到」與「JOTI 何種情況下允許執行扣款」是兩件事，JOTI 的商業規則優先。
- 具體採用哪一個 Oen API 端點、如何確保扣款僅執行一次而不會意外變成持續扣款，屬於工程實作決定，見 `payment-integration-rules.md`。

---

## 10. Trial → 主動購買 → 條件成就後扣款：完整產品流程

```
註冊
↓
免費試用開始（Trial，不產生付款義務）
↓
乙方準備成為正式會員 → 提供完整契約 → 開始契約審閱期間
↓
契約審閱期間屆滿（review_completed，僅代表具備同意資格）
↓
乙方明確同意契約（contract_acceptance_at，基本契約成立）
↓
乙方主動選擇 Monthly / Annual（Purchase Intent）
↓
乙方明確確認購買（Purchase Confirmation）
↓
乙方完成付款方式之授權／綁定（Payment Authorization，可能是先綁卡不立即扣款）
↓
乙方繼續使用其原本的免費試用
↓
試用條件達成（30 天或 30 小時，先到者）
↓
依乙方授權當下已明確揭露之條件與金額，執行一次性扣款
↓
建立／完成 Order
↓
伺服器端驗證扣款成功
↓
Service Period 啟用，Membership 具備付費存取權限
```

**嚴禁**的簡化版本（不得實作）：
```
註冊 → 3 日審閱期結束 → 自動扣款   ✗ 禁止
```

`trial_start` 與 `review_completed` 本身**都不構成** payment authorization，系統中必須存在明確、獨立的「購買確認 / 付款授權」事件，不得由前兩者推定已發生。

---

## 11. 退款（Refund）

- 原則：**按已提供服務比例結算**，以「已提供服務」之 Service Period 經過時間為基準。
- 「已提供服務」＝截至終止申請日，甲方已提供之 Service Period 時間。**不是** login days、video watch time、lesson completion，或任何實際使用程度的衡量。
- 月方案（NT$333／月）：
  ```
  每日服務價值 = 333 ÷ 30 = NT$11／日
  退款金額 = 已付款金額 − (已提供服務日數 × NT$11)
  ```
- 年方案（NT$3,333／年）：
  ```
  已提供服務費用 = (已提供完整月份數 × NT$333) + (不足完整月份天數 × NT$11)
  退款金額 = NT$3,333 − 已提供服務費用
  ```
- 30 日為固定計算基準，**不因實際月份天數（28/29/30/31）調整**。
- 提前終止一個 Service Period，**不當然使基本契約終止**。
- 若現行法令對特定情形另有強制規定，**以法令為準**。本文件不自行創造尚未確認的例外條件。

---

## 12. 必要紀錄（Required Records）

系統應能保存並回溯以下資訊（供爭議處理、稽核、退款計算使用），**僅列出概念性需求，不預設資料庫 schema**：

- 每一次基本契約成立：`contract_version`、`contract_presented_at`、`contract_review_available_at`、`contract_acceptance_at`
- 每一個 Order／Service Period：方案、金額、幣別、建立時間、付款驗證時間、服務期間起訖、對應之 `contract_version`
- 每筆退款：終止申請時間、已提供服務天數、計算出的退款金額
- 基本契約終止：終止事由、通知時間（如適用長期未購買程序）、實際終止時間

---

## 13. 法律約束（Legal Constraints）摘要

- 契約審閱期間：至少 3 日，且不得以 UX 手法規避。
- 不自動續約：無任何例外。
- 個人資料保護：依台灣《個人資料保護法》處理會員個資，詳見 `joti-privacy-policy.md`。
- 準據法：中華民國法律；消費爭議依《消費者保護法》處理。
- 若本文件與現行法令或主管機關公告之定型化契約規範不一致，**以法令與主管機關公告為準**，本文件應隨之更新。

---

## 14. 變更本文件

本文件所列規則（方案價格、試用規則、基本契約＋服務期間架構、3 日審閱期、退款公式、不自動續約、長期未購買終止程序）**已經確認**。如需變更，應先與經營者（甲方）確認，並同步更新 `docs/legal/joti-online-teaching-contract.md`，不得只改其中一份文件。
