# JOTI Course Content

## Purpose

Course Content 是 JOTI 所有課程內容的唯一來源（Single Source of Truth）。

本資料夾保存所有 Foundation、Module 與 Practice 的正式內容。

這些內容將作為：

- Website
- AI Assistant
- Mobile App
- Course Builder
- Future Database

共同使用的課程資料來源。

---

## Relationship

Brand

↓

Course System

↓

Course Content

↓

Website

↓

AI

↓

App

Course System 定義規則。

Course Content 提供內容。

所有產品皆讀取相同的內容來源。

---

## Content Structure

Course Content 分為三個主要類型：

### Foundations

正式練習前所需具備的基礎能力。

例如：

- 深長呼吸
- 火呼吸
- 身體鎖
- 手印
- 坐姿

---

### Modules

組成 Practice 的課程元件。

例如：

- 調頻
- 熱身
- 身體動作序列
- 放鬆
- 冥想
- 結尾

---

### Practices

由多個 Module 組成的完整課程。

例如：

- 晨間能量
- 睡前放鬆
- 壓力釋放
- 午間冥想

---

## Design Principle

每一份內容代表一個 Learning Asset，而不是單一影片。

一個 Learning Asset 可以包含：

- YouTube
- App Video
- PDF
- Audio
- Practice Notes

未來可延伸至不同平台，而不需要重新建立內容。

---

## Structure vs. Content

Course Content 儲存 Learning Asset 的實際內容（敘述性內容與 Markdown 檔案）。

Learning Asset 的結構化欄位（ID、Title、Category、Difficulty、Duration、Video Reference 等）由 Course System 定義，詳見：

- `docs/course-system/content-schema.md`（Foundation 與 Module 共用欄位）
- `docs/course-system/module-metadata.md`（Module 專屬欄位）
- `docs/course-system/foundation-library.md`（Foundation 專屬欄位）

Course Content 不重複定義這些結構化欄位。
