# Content Schema

## Purpose

本文件定義 Foundation 與 Module 共同使用的 Learning Asset 共用資料結構（Shared Schema）。

它是 Course System 中，Learning Asset 共用欄位的唯一權威來源（Single Source of Truth）。

---

## Scope

本文件僅定義 Foundation 與 Module **共同擁有** 的欄位。

Foundation 專屬欄位定義於 `foundation-library.md`。

Module 專屬欄位定義於 `module-metadata.md`。

Practice 不是 Learning Asset，不適用本文件（詳見下方 Relationship with Practice）。

---

## What Is a Learning Asset

Learning Asset 是 JOTI 課程系統中，任何對應一支影片、可供學員觀看與學習的內容單位。

目前 JOTI 有兩種 Learning Asset：

* Foundation
* Module

兩者皆代表「一支影片 + 描述該影片的結構化與敘述性資訊」，但在 Course System 中扮演不同角色（詳見下方各自的 Relationship 章節）。

---

## Shared Fields

* **id**（必要）— 系統內部識別碼。命名規則見 `naming-convention.md`。
* **slug**（必要）— 永久識別名稱，為 Markdown 檔名的唯一來源。命名規則見 `naming-convention.md`，本文件不重複列出。
* **title**（必要）— 英文名稱。
* **chineseTitle**（必要）— 中文名稱，作為 Chinese-first 原則下的主要顯示名稱（詳見 `product-design-principles.md`）。
* **summary**（必要）— 簡短摘要，用於 Foundation Card、Module Card、搜尋結果與推薦列表。對應 Learning Asset 中的 Summary 欄位，與 Markdown 內容中的長篇 Description 為不同用途，兩者不重複維護。
* **difficulty**（必要）— 適合程度（例如 `Beginner`）。
* **duration**（必要）— 影片時長（秒）。
* **videoReference**（結構上必要，內容可為空）— 對應的 Learning Asset 影片參照，格式為：

```
{ provider, videoId }
```

範例（僅為結構示意，非實際資料）：

```
{ provider: 'youtube', videoId: 'abc123XYZ' }
```

此格式為 Foundation 與 Module 共同採用的目標結構。Module（`data/modules.js`）已全數完成同步；Foundation（`data/foundations.js`）目前僅部分完成同步，其餘將隨 Learning Asset 逐一同步（詳見 `docs/development/adr/0002-learning-asset-first-development.md`）。

* **tags**（選填）— 描述性關鍵字，用於搜尋、篩選與 AI 推薦。Foundation 與 Module 皆可使用，定義統一於本文件，`module-metadata.md` 不再重複定義。

---

## Shared Metadata

除欄位本身外，以下規則適用於所有 Learning Asset：

* Slug 由 Markdown 檔名決定，內容不需另外維護 Slug 欄位，不設轉換層（詳見 `naming-convention.md`）。
* 顯示名稱以 `chineseTitle` 為主，`title` 為輔（詳見 `product-design-principles.md`）。
* `summary` 為簡短摘要，完整敘述內容（Description）僅存在於 Learning Asset 的 Markdown 內容中，不得複製進 Runtime Data（詳見 `frontend/src/content/template.md`）。

---

## Shared Relationships

所有 Learning Asset 皆對應一份 Markdown 內容檔案，儲存於 `frontend/src/content/{foundations,modules}/`，是該 Learning Asset 唯一的人工維護來源（Single Source of Truth）。此檔案同時包含結構化欄位（本文件與各自 Metadata 文件定義）與敘述性內容（Description、Learning Outcomes、Prerequisites 等），兩者不再分離維護。

`frontend/src/data/foundations.js`、`frontend/src/data/modules.js` 為 Derived Runtime Data，鏡射 Learning Asset 供網站路由、渲染與計算使用，透過 AI 協作同步維護，不另行人工維護內容（詳見 `docs/development/adr/0002-learning-asset-first-development.md`）。

`docs/course-content/` 為歷史文件，其角色已由本架構取代，保留供歷史參考，不再更新。

---

## Relationship with Foundation

Foundation 是一種 Learning Asset。

Foundation 專屬欄位（例如 Completion Status、Foundation Category）定義於 `foundation-library.md`，該文件引用本文件定義共用欄位，而非重複定義。

---

## Relationship with Module

Module 是一種 Learning Asset。

Module 專屬欄位（例如 type、Module Category、Subcategory、Capabilities、Prerequisites、Contraindications、Status）定義於 `module-metadata.md`，該文件引用本文件定義共用欄位，而非重複定義。Tags 為 Foundation 與 Module 共用欄位，定義於本文件。

---

## Relationship with Practice

Practice **不是** Learning Asset。

Practice 不直接對應單一影片，而是由多個 Module 組成的完整練習（詳見 `data-model.md`、`practice-library.md`）。

Practice 的組成規則、驗證規則與屬性，完全由 `practice-library.md` 與 `practice-builder.md` 定義，本文件不涉及。
