# Naming Convention

## Purpose

本文件定義 JOTI 課程系統的命名規範（Naming Convention）。

所有 Foundation、Module、Practice、Markdown 檔案、Slug、網站路由與 AI 引用，皆應遵循相同規則，以保持整個系統的一致性與可維護性。

---

# General Principles

所有命名皆應：

- 使用英文。
- 使用小寫字母（lowercase）。
- 單字之間使用連字號（-）分隔。
- 避免空格、底線（_）及特殊符號。
- 名稱應簡潔且具有描述性。
- 一經建立，Slug 不應隨意修改，以避免影響網站網址與資料關聯。

---

# Slug

Slug 是每個 Foundation、Module 與 Practice 的永久識別名稱（Permanent Identifier）。

目前 JOTI 採用：

```
Markdown 檔名（不含 .md）
=
Slug
```

例如：

```
asana01-surya-kriya.md
```

其 Slug 為：

```
asana01-surya-kriya
```

Slug 將用於：

- 網站網址（URL）
- React Router
- Practice 組成
- AI Agent 引用
- 資料查詢
- 搜尋與推薦

---

# Foundation

Foundation 不使用流水號。

Slug 採用能力名稱。

例如：

```
deep-long-breath
fire-breath
breath-retention
mula-bandha
mudras
sitting-posture
```

---

# Module

Module 採用：

```
[type][number]-[content]-[variant]
```

格式。

例如：

```
tuning01-standard

warmup01-surya-namaskar

asana01-surya-kriya

relax01-savasana-guided

med01-kirtan-kriya-18min

end01-long-time-sun-en
```

其中：

type：

- tuning
- warmup
- asana
- relax
- med
- end

number：

同一類型內依建立順序編號。

content：

描述主要內容。

variant：

描述版本，例如：

- standard
- 18min
- 31min
- 150min
- en
- zh

若無需要，可省略 Variant。

---

# Practice

Practice 採用：

```
practice[number]-[main-focus]
```

例如：

```
practice01-surya-kirtan18

practice02-morning-energy

practice03-evening-relax
```

名稱應能反映 Practice 的主要內容或目的。

---

# IDs

ID 與 Slug 為不同用途。

例如：

```
ID：

MA001
```

```
Slug：

asana01-surya-kriya
```

ID 用於系統內部識別。

Slug 用於網站、AI 與資料引用。

---

# Future Compatibility

本命名規範適用於：

- Markdown
- Website
- React
- Mobile App
- Database
- AI Agent (Luckster)

所有新內容皆應遵循本規範，以維持 JOTI 課程系統的一致性。