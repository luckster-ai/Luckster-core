# Module Metadata

## Purpose

本文件定義 JOTI Module **專屬**的資料結構（Schema）。

Foundation 與 Module 共用的欄位由 `content-schema.md` 定義；本文件是 Module 專屬欄位的唯一權威來源（Single Source of Truth）。

它回答以下問題：

* Module 專屬有哪些額外資訊？
* 哪些欄位為必要，哪些為選填？
* 每個欄位存在的目的是什麼？
* 哪些未來系統會依賴這些欄位？

---

## Why Module Metadata Exists

Module 是 JOTI 課程系統中最基本的可重複使用單位（詳見 `data-model.md`）。

隨著 Practice Builder、AI 推薦、搜尋與安全提醒等功能逐步發展，Module 需要一致且可預期的資料結構，才能被不同系統正確讀取與驗證。

Module Metadata 的目的，是讓所有依賴 Module 資料的系統（網站、Practice Builder、Luckster AI、未來的搜尋與安全提醒功能）都能依照同一份定義運作，避免規則分散於多份文件而產生衝突。

---

## Relationship to Other Documents

本文件僅定義 Module **專屬**的資料結構。

以下概念由其他文件擁有，本文件僅引用，不重複定義：

* Foundation 與 Module 共用欄位（id、slug、title、chineseTitle、summary、difficulty、duration、videoReference、tags）→ `content-schema.md`
* Slug 命名規則 → `naming-convention.md`
* Module 六大 Category 的用途與規則 → `module-library.md`
* Video 作為 Learning Asset 的概念 → `data-model.md`
* Practice 組課與驗證規則（含 Capability Validation）→ `practice-library.md`、`practice-builder.md`
* Chinese-first 顯示規則 → `product-design-principles.md`

---

## Module Schema

Module 的共用欄位（id、slug、title、chineseTitle、summary、difficulty、duration、videoReference、tags）由 `content-schema.md` 定義，本文件不重複列出，僅定義以下 Module 專屬欄位。

### Module-Specific Fields

* **type**（必要）— Module 類型代碼（`tuning` / `warmup` / `asana` / `relax` / `med` / `end`）。定義於 `naming-convention.md`，本文件不重複列出列舉值。
* **category**（必要）— 對應六大 Module Category 的顯示名稱，用途與規則定義於 `module-library.md`。

  **Category 是描述性中繼資料（Metadata），不是身份識別（Identity）。** Module 的身份識別完全由 ID 決定（見 `naming-convention.md`、`content-schema.md`）：

  > 一個 Module = 一個 Learning Asset = 一個唯一 ID = 一份 Markdown 檔案。

  多數 Module 僅屬於一個 Category；少數天然同時服務多種目的的 Module（例如同時具備 Warm-up 與 Meditation 性質的短版呼吸冥想）可合法對應多個 Category。無論對應幾個 Category：

  - Module 仍只有一個 ID。
  - Module 仍只有一份 Markdown 檔案。
  - 新增或調整 Category 從不建立新的 Module，也不需要為了「放進」另一個 Category 而重複建立內容。
  - 同一支影片絕不因為適合多個 Category，而被複製為多份 Module 檔案。

  詳見 `docs/development/adr/0003-learning-asset-identity-and-prerequisite-validation.md`（Decision 5）。

  **多重 Category 撰寫格式（Authoring Format，Sprint 8.3 Pre-Implementation 確認）**：

  單一 Category（沿用現有格式，既有內容不須改寫）：

  ```text
  Category:

  Tuning In
  ```

  多個 Category（新格式，僅在 Module 確實同時屬於多個 Category 時使用）：

  ```text
  Category:

  - Warm Up
  - Meditation
  ```

  規則：

  - 單一值維持現有的純文字寫法（不加 `-`），完全相容既有內容。
  - 兩個以上的值時，改用清單格式，每行一個 Category，開頭為 `- `（與 `content-schema.md` 的 Prerequisites 清單格式一致）。
  - Category 名稱須為 `module-library.md` 所定義六大 Category 之一，不得使用自訂名稱。
  - 同一 Module 不得重複列出同一個 Category。
  - 清單順序不影響驗證邏輯；建議將最主要的 Category 列在第一項，供未來僅能顯示單一 Category 的介面作為預設值。
  - 清單各行前後不得有多餘空白，行與行之間不得有空行。

  **Runtime Data 對應格式（尚未實作）**：

  ```js
  categories: ['Warm Up', 'Meditation']
  ```

  `data/modules.js` 的欄位名稱將由單數 `category`（字串）改為複數 `categories`（陣列），即使只有一個 Category 也一律使用陣列，避免程式碼需同時處理字串與陣列兩種型別。這是一項**破壞性欄位變更**，需同時更新所有讀取 `category` 的程式碼（例如 `ModuleCard.jsx` 目前顯示「類別：{module.category}」）。

  **實作現況（Implementation Status）**：本節定義的撰寫格式與 Runtime Data 結構為**已確認的目標架構（Canonical Architecture）**，尚未實作。目前所有既有 Module 內容與 `data/modules.js` 皆仍為單一 Category（字串）。在實際撰寫並同步第一個多重 Category 的 Module 之前，不需要進行任何程式碼或 Runtime Data 遷移；本節內容作為該次遷移的依據。另外，`ModulePage.jsx` 目前會將 Module 的原始 Markdown（含 Basic Information 區塊）直接渲染給學員（不同於 Foundation／Lesson 頁面的 `stripMarkdownSection` 處理方式），因此第一個採用多重 Category 清單格式的 Module，其 `- ` 清單將會直接顯示在頁面上，直到有進一步的實作調整此渲染行為。
* **subcategory**（選填）— 部分 Module 可能沒有 Subcategory，屬於正常情況，非資料缺漏（此決策已於 Course System Specification v1.0 確認）。
* **prerequisites**（選填；目前僅存在於內容中，尚未結構化）— 建議先具備的 Foundation 能力，對應 `data-model.md` 中 Foundation → Module 的先備關係。目前僅以文字形式存在於 Markdown 內容（見 `docs/course-content/template.md` 的 Prerequisites 章節），尚未成為 `data/modules.js` 中的結構化欄位；`practice-builder.md` 的 Foundation 檢查未來若需自動化，將依賴此欄位被結構化。

Learning Outcomes、Transcript、Resources 屬於 Module 的敘述性內容，由 `docs/course-content/template.md` 定義與擁有，非結構化資料欄位，故不列入本 Schema。

### Metadata

* **tags** — 現為 Foundation 與 Module 共用欄位，定義移至 `content-schema.md`，本文件不再重複列出。不影響 Practice 組課驗證，純粹作為探索與推薦用途。
* **capabilities**（選填，供未來 Practice Builder 使用）— 描述 Module 在 Practice 中可扮演的**結構角色**，而非練習的效益或描述。範例：一個 Asana Module 可能具備 `Warm Up`、`Main Practice` 兩種 Capability；一個 Meditation Module 可能具備 `Meditation`、`Closing`。Capabilities 使 Practice Builder 得以驗證某個 Module 是否可用於省略 Warm Up 或 Relaxation（詳見 `practice-builder.md` 的 Capability Validation）。此欄位延續先前文件審查中提出的 Future Consideration，目前尚未實作於程式碼中。完整 Capability 列舉值與規則，待實際內容確立後，將由未來的 Capability Dictionary 文件定義；本文件僅定義欄位本身的存在與用途。
* **contraindications**（選填）— 輕量級安全提醒清單，非教學說明。範例：`經期`、`懷孕`、`高血壓`。用於練習前顯示簡短提醒，不應重複影片中已包含的教學內容。
* **status**（選填，預設為已發布）— 標示 Module 目前是否可供學員使用（例如 `draft` / `published`）。目前所有既有 Module 皆視為 `published`，供未來內容管理與 Practice Builder 篩選未發布內容使用。

---

## Future Systems Dependent on Module Metadata

* Practice Builder — 依賴 Capabilities 進行 Composition／Capability Validation（詳見 `practice-builder.md`）。
* Luckster AI 推薦系統 — 依賴 Tags、Prerequisites 與 Difficulty。
* 網站搜尋與篩選 — 依賴 Tags、Category、Difficulty。
* 安全提醒 UI（尚未建立）— 依賴 Contraindications。
* 內容管理（尚未建立）— 依賴 Status。

---

## Design Principle

Module Metadata 應保持最小但可擴充。

新增欄位前，應先確認：

* 是否已有其他文件擁有此概念？
* 是否有明確的未來系統會使用此欄位？

避免新增沒有明確用途的欄位。
