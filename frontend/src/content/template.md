# JOTI Learning Asset Template

## Purpose

本文件定義 Learning Asset（Foundation、Module）的 Markdown 撰寫格式。

Learning Asset 是該內容的唯一人工維護來源（Single Source of Truth），同時包含結構化欄位與敘述性內容，兩者不再分離維護。

結構化欄位的權威定義見 `docs/course-system/content-schema.md`、`module-metadata.md`、`foundation-library.md`；本文件僅提供撰寫格式範例。

本檔案位於 `frontend/src/content/`，不會被網站當作 Foundation 或 Module 內容讀取（不在 `foundations/`、`modules/` 子資料夾內）。

---

# Standard Structure

## Basic Information

ID:

Title:

Chinese Title:

Type:

Category:

（單一 Category 範例：）

Tuning In

（多個 Category 範例，僅在 Module 確實同時屬於多個 Category 時使用：）

- Warm Up
- Meditation

（Category 為描述性中繼資料，非身份識別；一個 Module 永遠只有一個 ID、一份 Markdown 檔案，絕不因為適合多個 Category 而複製影片或建立第二個 Module。完整規則與撰寫格式定義見 `docs/course-system/module-metadata.md`。）

Difficulty:

Duration:

（格式範例：5:01）

---

## Summary

簡短摘要，用於 Foundation Card、Module Card、搜尋結果與推薦列表。

保持簡短（建議一句話），與下方 Description 為不同用途，不重複維護相同內容。

---

## Description

完整敘述本內容，回答：這是一堂什麼課？

---

## Learning Outcomes

完成本內容後，學員應能：

* …
* …

---

## Prerequisites

## Prerequisites

Describe the recommended knowledge learners should complete before starting this Learning Asset.

Use exactly one of the following formats.

### If prerequisites exist

```text
建議先完成：

- FD001 Long Deep Breathing
- FD004 Suspending the Breath 
- FD005-L01 Easy Pose
- FD008 Basic Mudras
- MM001 Kirtan Kriya (18-Minute Guided)
```

Rules:

- Always begin with `建議先完成：`
- Use one prerequisite per bullet.
- **The ID is the canonical identifier. The English Title exists only for readability** — it is never used to resolve the reference.
- Single-lesson Foundations (e.g. `FD001`) are referenced by their Foundation ID directly.
- Multi-lesson Foundations must reference a specific Lesson ID (e.g. `FD005-L01 Easy Pose`) — **except** when referencing that Foundation's own Introduction Lesson, which shares the Foundation's own ID (e.g. `FD008 Basic Mudras`). A bare multi-lesson Foundation ID never means "all Lessons in the Foundation."
- Modules may reference other Modules as prerequisites (e.g. `MM001 Kirtan Kriya (18-Minute Guided)`).
- Do not include Chinese titles.
- Keep the list ordered by learning priority.

### If there are no prerequisites

```text
none
```

Always use the lowercase keyword `none`.

Do not use:

- None
- 無
- 沒有
- N/A
- 無需前置知識

---

## Tags

* …

---

## Sources

### Video

Provider:

URL:

### Transcript

（未來 AI 自動建立）

### Resources

PDF：

Audio：

Downloads：
