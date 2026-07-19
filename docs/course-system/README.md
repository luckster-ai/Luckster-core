# JOTI Course System

## Purpose

JOTI Course System 是 JOTI Kundalini ABC Yoga 的核心教學架構。

它定義了內容如何建立、如何組成 Practice、如何陪伴學員建立長期練習習慣，以及 Luckster AI 如何協助學員進行個人化的練習。

本資料夾作為 JOTI Course System 的最高規格文件（System Specification）。

相關文件包含：

- data-model.md
- foundation-library.md
- module-library.md
- practice-library.md
- practice-builder.md

未來亦可擴充：

- content-schema.md
- id-system.md

---

# Mission

JOTI 希望透過清晰、有系統且容易開始的 Kundalini ABC Yoga 學習方式，陪伴更多人建立穩定的練習習慣，重新連結自己的身體、呼吸與內在力量。

平台的目的不是完成觀看影片，

而是透過持續而規律的 Practice，

讓瑜伽逐漸成為生活的一部分。

---

# Learning Philosophy

JOTI 並不是一個以「完成所有課程」為目標的線上學習平台。

昆達里尼瑜伽的核心並非累積知識，

而是透過持續而規律的 Practice，

逐漸建立新的身心習慣。

因此，

學員可能會反覆練習同一個 Practice、

同一組 Module，

甚至同一支影片，

而不是不斷追求新的內容。

JOTI 鼓勵的是：

Learn
→ Practice
→ Repeat
→ Build Habit
→ Transform

---

Full Practice 並不只是時間較長，

而是保留足夠的時間，

讓身體、呼吸、冥想與能量流動形成完整的一次練習。

JOTI 同時提供不同長度的 Practice，

讓不同生活節奏的學員，

都能建立穩定而持續的練習習慣。

---

昆達里尼瑜伽傳統中相信：

- 40 天建立新的習慣
- 90 天穩固新的習慣
- 120 天成為新的自己
- 1000 天完全掌握新的生命模式

JOTI 尊重這項傳統，

也尊重每位學員目前的練習狀態。

網站將鼓勵持續練習，

而不是要求所有學員一開始就完成長期挑戰。

---

# Content Architecture

JOTI 採用三層內容模型：

Foundation

↓

Module

↓

Practice

Practice 是 JOTI 平台最主要的內容單位。

學員每天完成一個 Practice，

逐漸形成自己的 Learning Journey。

---

# Foundation

Foundation 提供正式 Practice 前所需建立的知識、技能與練習準備。

例如：

- Breathing
- Body Locks
- Mudras
- Mantras
- Sitting Posture
- Suspend Breath

Foundation 不直接組成 Practice。

Foundation 的主要用途，

是提供 Module 所需的先備能力（Prerequisites）。

See：

foundation-library.md

---

# Module

Module 是組成 Practice 的標準組件（Building Block）。

每個 Module 對應一次完整 Practice 的其中一個練習階段。

例如：

- Tuning In
- Warm Up
- Asana
- Relaxation
- Meditation
- Ending

網站提供 Module 頁面，

讓學員了解每個 Module 的內容、目的與適合對象。

Module 的主要用途，

是組成不同的 Practice，

而不是鼓勵單獨完成一次完整練習。

同一個 Module 可以被多個 Practice 重複使用。

See：

module-library.md

---

# Practice

Practice 是 JOTI 平台最主要的內容單位。

每一個 Practice 都是由多個 Module 依照固定流程所組成。

標準流程如下：

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

不同的 Practice 可以：

- 使用不同 Module
- 使用不同 Variant
- 長度不同
- 難度不同
- 主題不同

Practice 可以每日重複練習，

也是 Luckster AI 最主要推薦的單位。

See：

practice-library.md

---

# AI Assisted Learning

Luckster AI 的角色，

並不是取代老師，

而是成為學員長期練習旅程中的陪伴者。

Luckster AI 將協助：

- 判斷完成某個 Practice 所需的 Foundation
- 檢查學員是否已具備必要的 Foundation
- 推薦適合目前能力的 Practice
- 根據需求協助建立個人化 Practice
- 提醒每日 Practice
- 建立長期練習習慣
- 管理練習紀錄
- 提供個人化建議
- 追蹤 Learning Journey
- 陪伴完成 40 / 90 / 120 / 1000 天練習

Luckster AI 的設計目標，

是依照每位學員的身心狀態、時間安排與練習歷程，

提供個人化且安全的陪伴，

協助建立穩定而長期的 Kundalini Yoga Practice。

---

# Future Vision

JOTI 希望成為一個陪伴長期 Practice 的平台，

而不只是提供影片內容。

未來將逐步加入：

- Foundation Library
- Module Library
- Practice Library
- Practice Builder
- AI Personal Assistant (Luckster)
- Membership System
- Progress Tracking
- Practice Calendar
- Practice History
- Practice Notes
- Favorites
- Personalized Recommendations
- Community
- 40 / 90 / 120 / 1000 Day Challenges

希望讓每位學員都能依照自己的步調，

建立屬於自己的 Kundalini ABC Yoga Practice，

並讓瑜伽真正融入生活。