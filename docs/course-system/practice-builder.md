# Practice Builder

## Purpose

Practice Builder 定義 JOTI 如何建立一堂完整的 Practice。

本規格同時適用於：

* 官方建立課程
* Luckster AI 自動組課
* 學員自由組課

所有 Practice 均應遵循相同的組課原則。

---

# Builder Workflow

建立一堂 Practice 時，依照以下流程：

1. 確認練習目標
2. 選擇 Practice Structure
3. 檢查 Foundation
4. 選擇 Module
5. 驗證課程規則
6. 完成 Practice

---

# Step 1

確認練習目的。

例如：

* 晨間能量
* 睡前放鬆
* 壓力釋放
* 專注提升
* 呼吸練習

---

# Step 2

選擇 Practice Structure。

目前支援：

* Full Practice
* Meditation Practice

---

# Step 3

檢查 Foundation。

確認學員是否具備：

* Required Foundations
* Recommended Foundations

若尚未完成，

系統可：

* 提醒先完成 Foundation
* 或由學員自行確認已具備能力。

此步驟即 Step 5「Sequence Validation」章節所稱之 Presence Validation 的概念來源；完整的 Presence／Sequence 兩階段驗證規則定義於該章節，本步驟不重複列出。

---

# Step 4

依照 Step 2 選定的 Practice Structure，組裝 Practice 所需的 Module。

實際應包含之 Module 與組課規則，統一定義於 `practice-library.md`「Practice Structure」章節，此處不重複列出。

---

# Step 5

Rule Validation。

驗證依據為 `practice-library.md`「Practice Structure」章節所定義的組課規則，分為以下四類：

## Composition Validation

驗證 Practice 是否包含所有必要 Module：

* 是否缺少 Tuning In？
* Tuning In 是否恰好 1 個，且位於 Practice 開頭？（數量限制詳見 `practice-library.md`）
* 是否缺少 Ending？
* Ending 是否恰好 1 個，且位於 Practice 結尾？（數量限制詳見 `practice-library.md`）
* Full Practice：是否包含恰好一個 Asana Module？
* Meditation Practice：是否至少包含一個 Meditation Module？
* 若包含 Warm Up，數量是否為 1–3 個？（詳見 `practice-library.md`）
* 若包含 Relaxation，數量是否恰好 1 個？（詳見 `practice-library.md`）
* 是否有重複 Module？Module 即使具備多個 Category（見 `module-metadata.md`），仍為單一 Module；即使可從多個 Category 對應的區塊加入，同一 Practice 中仍不可重複加入同一 Module，適用同一條「是否有重複 Module」規則。

## Capability Validation

驗證 Warm Up / Relaxation 等可省略項目，是否已由所選 Asana 或 Meditation Module 本身涵蓋對應功能：

* 若省略 Warm Up，所選 Module 是否已包含熱身功能？
* 若省略 Relaxation，所選 Module 是否已包含放鬆功能？

## Sequence Validation

驗證 Module 之間的相對順序：

* Full Practice：Relaxation 是否發生在 Asana Module 之後？
* **Prerequisite Sequence**：若 Practice 本身已包含某個 Prerequisite Learning Asset（Lesson 或 Module），該 Prerequisite 只有在 Practice 序列中**先於**依賴它的 Module 出現時，才視為滿足。Prerequisite 驗證因此分為兩個階段：（1）Presence Validation——確認 Prerequisite 是否已被學員完成或存在於本次 Practice 中；（2）Sequence Validation——確認該 Prerequisite 於 Practice 中出現的位置早於依賴它的 Module。詳見 `docs/development/adr/0003-learning-asset-identity-and-prerequisite-validation.md`。

## Structure Validation

驗證 Practice 是否符合其所屬結構（Full Practice / Meditation Practice）的定義與規則：

* 是否符合 Practice Structure 的判斷依據（是否包含 Asana Module）？
* 是否符合 Module Prerequisites？

完整規則定義請參考 `practice-library.md`，此處不重複維護規則內容。

---

# Step 6

產生完整 Practice。

包含：

* Module 順序
* 課程時間
* Foundation Requirements
* Practice Metadata

完成後即可提供給：

* 官方課程
* AI 推薦
* 學員自由組課

---

# Design Principles

Practice Builder 的目標，

並非自動產生越多 Practice 越好，

而是依照 JOTI 的課程理念，

建立安全、

流暢、

具有完整練習體驗的 Practice。

Luckster AI 在組課時，

應優先遵循課程規則，

其次才考量學員時間、

程度、

偏好與練習紀錄。