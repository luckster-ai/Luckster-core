# Practice Library

## Purpose

Practice 是 JOTI 的主要練習形式。

每一堂 Practice 都是由多個 Module 組成，並依照課程設計原則安排順序，協助學員在安全、完整且有系統的方式下進行昆達里尼瑜伽練習。

Practice 可以由官方建立，也可以由 AI 或學員依照課程規則自由組成。

---

# Practice Principles

所有 Practice 都應遵循以下原則：

* 尊重昆達里尼瑜伽的核心精神。
* 保持完整且合理的課程流程。
* 避免 Module 重複或衝突。
* 可依不同練習目的調整內容與時間。
* 鼓勵長期且穩定的重複練習，而非追求大量新課程。

---

# Practice Types

目前 JOTI 提供三種 Practice：

## Official Practice

由 JOTI 官方預先建立並維護的標準 Practice。

例如：

* 晨間能量
* 睡前放鬆
* 壓力釋放
* 專注力提升

---

## AI Practice

由 Luckster AI 根據：

* 學員程度
* 練習目標
* 可用時間
* Foundation 完成狀態

自動建立適合的 Practice。

---

## Custom Practice

由學員自行選擇 Module，

依照課程規則建立自己的完整 Practice。

---

# Practice Structure

JOTI 目前支援兩種 Practice 結構：Full Practice 與 Meditation Practice。

兩種結構皆必須包含 Tuning In 與 Ending。是否包含 Asana Module 是判斷結構的依據：包含一個 Asana Module 即為 Full Practice；不包含 Asana Module 則為 Meditation Practice。

Practice 所包含的 Module 數量並無固定限制，各結構的完整規則如下。以下 Mandatory／Conditional Requirements 中標註的數量限制，為 Sprint 8.3 Pre-Implementation 新確認的內容，屬於既有規則的補充，不取代既有的必要／可省略判斷。

## Full Practice

完整 Practice 為 JOTI 最主要的課程形式。

Definition：

包含「恰好一個」Asana Module。

Mandatory：

* Tuning In（必要；恰好一個；固定位於 Practice 開頭 — 數量與位置限制為新確認規則）
* Asana Module（恰好一個）
* Meditation（至少一個，可包含多個）
* Ending（必要；恰好一個；固定位於 Practice 結尾 — 數量與位置限制為新確認規則）

Conditional Requirements：

* Warm Up：一般為必要，但若所選 Asana Module 本身已包含熱身功能，則可省略。若納入 Warm Up，數量為 1–3 個 Module（新確認規則；此上限為目前的產品規則，未來可能依內容量與學員使用狀況調整）。
* Relaxation：一般為必要，但若所選 Asana Module 本身已包含放鬆功能，則可省略。若納入 Relaxation，數量恰好為 1 個 Module（新確認規則）。

Sequence Rule：

Relaxation 必須發生在 Asana Module 之後。允許的順序範例：

```
Asana → Relaxation → Meditation
```

或

```
Asana → Meditation → Relaxation
```

Builder 應驗證 Relaxation 與 Asana 的相對順序，而非強制單一固定順序。

---

## Meditation Practice

Definition：

不包含 Asana Module。若納入 Asana Module，該 Practice 即成為 Full Practice。

Meditation Practice 可依情境對應不同使用場景，例如：

* Regular Meditation Practice（完整的呼吸／冥想課程）
* Short Meditation Practice（因可用時間有限而縮短的練習）

以上皆屬於同一種 Practice Structure；Short Meditation Practice 並非獨立的第三種 Practice Structure，而是 Meditation Practice 的一種使用情境。

Mandatory：

* Tuning In（必要；恰好一個；固定位於 Practice 開頭 — 數量與位置限制為新確認規則）
* Meditation Module（至少一個，可包含多個）
* Ending（必要；恰好一個；固定位於 Practice 結尾 — 數量與位置限制為新確認規則）

Conditional Requirements：

* Warm Up：一般為必要，但若第一個 Meditation Module 本身已包含熱身功能，則可省略。若納入 Warm Up，數量為 1–3 個 Module（新確認規則；同 Full Practice 之上限規則）。
* Relaxation：一般為必要，但可於以下情況省略：
  * 該 Practice 屬於 Short Meditation Practice 情境，或
  * 所選 Meditation Module 本身已包含放鬆功能。
  * 若納入 Relaxation，數量恰好為 1 個 Module（新確認規則）。

常見熱身包括：

* 脊椎彎曲（Spinal Flex）
* 頸部轉動（Neck Rolls）
* 消除小我（Ego Eradicator）
* 拜日式
* 貓牛式
* 脊椎扭轉
* 生命神經伸展
* 水瓶行軍
* 起身前屈

可依冥想內容與課程目的選擇適合的熱身 Module。

---

AI 建立 Practice 或學員自由組課時，皆應依照以上規則安排 Module，以維持課程完整性與安全性。

---

# Practice Attributes

每一堂 Practice 都應具備基本屬性，以便網站、AI 與學員搜尋及管理課程。

建議包含以下資訊：

* ID
* Title（課程名稱）
* Description（課程簡介）
* Duration（課程時間）
* Level（適合程度）
* Focus（練習目標）
* Energy Level（能量強度）
* Required Foundations（必要 Foundation）
* Recommended Foundations（建議 Foundation）
* Modules（包含的 Module）
* Tags（課程標籤）
* Varient

以上屬性將作為網站搜尋、課程篩選、AI 推薦、學員自由組課與學習分析的重要依據。

---

# Foundation Requirements

每一堂 Practice 都可以定義：

## Required Foundations

Practice 所需的 Foundation 由其包含的 Module 所決定。

例如：

* 深長呼吸
* 調頻
* 結尾唱誦
* 火呼吸
* 身體鎖
* 手印

網站與 AI 可依 Foundation 完成狀態提供提醒，但保留學員自行確認已具備能力的選項。

---

# Long-term Practice

JOTI 鼓勵學員反覆練習同一堂 Practice。

網站可提供：

* 練習紀錄
* 練習日曆
* 40 / 90 / 120 / 1000 天挑戰
* 練習心得與筆記

長期且穩定的 Practice，是 JOTI 最重要的學習方式。
