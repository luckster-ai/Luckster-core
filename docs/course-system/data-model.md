# JOTI Data Model

本文件定義 JOTI Kundalini ABC Yoga 的核心內容架構。

JOTI 採用三層內容模型：

Foundation
        ↓
Module
        ↓
Practice

其中：

- Foundation：建立學員所需的基礎能力。
- Module 是組成 Practice 的標準組件。

每個 Module 對應 Practice 的其中一個練習階段。

網站提供 Module 頁面供學員了解內容，

但 Module 的主要用途是組成不同的 Practice，而非單獨完成一次完整練習。
- Practice：一次完整的瑜伽練習，是平台最主要的內容單位。

---

# Content Relationship

```
Foundation
        │
        ├── Prerequisite For
        ▼
Module
        │
        ├── Composed Into
        ▼
Practice
```

---

# Foundation

Foundation 是所有 Practice 的基礎能力。

例如：

- Long Deep Breathing
- Breath of Fire
- Body Locks
- Suspend Breath
- Mudras
- Mantras
- Sitting Posture

Foundation 不直接組成 Practice。

而是作為 Module 的先備能力（Prerequisites）。

---

# Module

Module 是一個可重複使用的課程組件。

每個 Module 只負責一個練習階段。

例如：

- Tuning In
- Warm Up
- Asana / Kriya
- Relaxation
- Meditation
- Ending

一個 Module 可以：

- 單獨練習
- 被多個 Practice 重複使用

---

# Practice

Practice 是一次完整的瑜伽練習。

典型的學習流程如下（僅為概念性說明，非驗證規則）：

```
Tuning In
    ↓
Warm Up
    ↓
Asana
    ↓
Relaxation
    ↓
Meditation
    ↓
Ending
```

實際的組課規則（必要 / 可選 Module、Asana 數量限制等）請參考 `practice-library.md`。

Practice 是 JOTI 平台最主要的內容單位。

學員每天進行一次 Practice。

不同 Practice 可以：

- 長度不同
- 難度不同
- 主題不同
- Module 組合不同

---

# Video（Learning Asset 的媒體形式）

Video 並非獨立的內容層級，而是 Learning Asset 的一種媒體形式。

Foundation 與 Module 皆為 Learning Asset，共用相同的欄位結構，詳見 `content-schema.md`。

目前每個 Foundation 與 Module 對應一支主要影片。

未來可擴充為：

- 不同語言
- 不同時長
- 不同版本
- 更新版本

同一個 Foundation 或 Module 皆可對應多個 Video Variant。

---

# Design Principles

JOTI 採用：

Foundation
→ Module
→ Practice

而非傳統線上課程：

Course
→ Lesson

原因在於：

昆達里尼瑜伽的核心是每日 Practice（Sadhana）。

Practice 可以每日重複進行，

Module 可以重複組合，

Foundation 則提供完成 Practice 所需的能力。

因此，

Practice 是 JOTI 的核心內容單位。

---

# Future Extensions

未來可在此模型上加入：

- Membership
- Progress Tracking
- Practice History
- AI Recommendation (Luckster)
- Personal Practice Builder
- Calendar
- Favorites
- Playlists