# JOTI Payment — Business & Engineering Rules

## Purpose

本資料夾存放 JOTI Payment 的商業規則及工程實作規則。

**Claude Code、Luckster AI Agent 或未來任何工程人員，在修改 Payment / Oen / Membership 相關程式碼之前，必須先閱讀本資料夾內對應的文件。**

## 文件清單

| 文件 | 讀者 | 內容 |
|---|---|---|
| [`payment-legal-spec.md`](./payment-legal-spec.md) | 商業／產品／工程 | JOTI Payment 的商業與法律規格——不是給會員看的契約全文，而是把契約中與系統設計相關的規則，整理成明確、可對照實作的規格。 |
| [`payment-integration-rules.md`](./payment-integration-rules.md) | 工程（含 Claude Code / AI Agent） | 給工程實作用的具體規則：Oen 串接方式、Webhook、Order/Membership 生命週期、安全要求、禁止的實作模式。 |

## 文件優先順序

```
Applicable Law（現行法令 / 主管機關公告之定型化契約規範）
      ↓
JOTI Contract（docs/legal/joti-online-teaching-contract.md）
      ↓
Payment Legal / Business Specification（payment-legal-spec.md）
      ↓
Payment Integration Rules（payment-integration-rules.md）
      ↓
Code
```

## 與 `docs/legal/` 的關係

這裡的規則**衍生自**、且**必須一致於** [`docs/legal/joti-online-teaching-contract.md`](../../legal/joti-online-teaching-contract.md)。契約是規則的源頭；本資料夾是把契約規則轉譯成可執行規格與工程規則的中間層。

## 重要提醒

- 這兩份文件裡的商業規則（價格、試用規則、3 日審閱期、退款公式、固定期間模式、不自動續約等）**已經確認，不應自行重新設計**。
- 工程實作細節（function naming、DB query、error handling 等）由工程人員／AI Agent 自行決定即可，不受本文件限制。
- 如果發現目前技術架構與這裡的規則衝突，**先提出問題與建議，不要自行改變規則**。
