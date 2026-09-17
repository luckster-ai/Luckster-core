# JOTI Legal Documents

## Purpose

本資料夾存放 JOTI 的法律、契約及會員服務相關文件。

這裡的文件是 JOTI Membership / Payment / Contract 相關規則的**最上層來源**——任何人（包含 Claude Code、Luckster AI Agent、其他管理者或工程人員）在處理以下任一主題之前，都必須先閱讀本資料夾內對應的文件：

- Membership（會員資格、免費試用）
- Contract（契約、契約審閱期）
- Payment（付款、方案與價格）
- Refund（退款）
- Renewal（續約 / 續訂）
- Termination（契約終止）

## 文件清單

| 文件 | 給誰看 | 內容 |
|---|---|---|
| [`joti-online-teaching-contract.md`](./joti-online-teaching-contract.md) | 準備成為正式付費會員的使用者 | JOTI 會員服務基本契約（Membership Service Basic Agreement）草案——**會員準備成為正式付費會員時會看到的完整正式契約**，需經至少 3 日審閱期。 |
| [`joti-trial-and-usage-notice.md`](./joti-trial-and-usage-notice.md) | 剛註冊、開始免費試用的使用者 | 白話版試用與使用須知——說明試用規則、有效使用時間定義、帳號使用、安全提醒等，**不是**完整法律契約。 |
| [`joti-privacy-policy.md`](./joti-privacy-policy.md) | 所有使用者 | 隱私權政策——說明 JOTI 實際蒐集、處理個人資料的方式。 |

## 文件優先順序

未來任何人（含 Claude Code / Luckster AI Agent）處理 Membership / Contract / Payment / Refund 相關工作前，應依以下順序閱讀與遵循：

```
Applicable Law（現行法令 / 主管機關公告之定型化契約規範）
      ↓
JOTI Contract（本資料夾文件）
      ↓
Payment Legal / Business Specification（docs/business/payment/payment-legal-spec.md）
      ↓
Payment Integration Rules（docs/business/payment/payment-integration-rules.md）
      ↓
Code
```

## 與其他文件的關係

本資料夾的文件是規則的**源頭**，其他文件（例如 `docs/business/payment/` 底下的商業／工程規格）都必須與這裡的內容一致，不得互相矛盾。

## 重要提醒

- 本資料夾內的契約草案是**依目前已確認的商業規則整理而成**，尚未經過執業律師審閱確認符合台灣現行法規（包含但不限於《消費者保護法》及主管機關公告之《網際網路教學服務定型化契約應記載及不得記載事項》）。**正式對外使用前，應由具資格之法律專業人士審閱。**
- 修改本資料夾內任何文件，等同於修改 JOTI 對會員的法律承諾，**不應在未與經營者（甲方）確認的情況下自行變更**。
- 工程實作如果與這裡的規則衝突，應先提出問題，不應自行決定改變規則本身（見 `payment-integration-rules.md` 「不得自行改變的規則」章節）。
