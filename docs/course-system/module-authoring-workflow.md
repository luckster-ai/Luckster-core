# Module Authoring Workflow

## Purpose

本文件是「新增一個 Module」的簡化標準流程（Checklist），供人工或 AI 協作時依序執行。

它不重新定義任何欄位規則——欄位的權威定義仍在 `content-schema.md`（共用欄位）、`module-metadata.md`（Module 專屬欄位）、`naming-convention.md`（命名規則）、`frontend/src/content/template.md`（撰寫格式範例）。本文件只回答「照順序做什麼」。

---

## 前提：兩個檔案，一個工具

新增一個 Module，永遠是這兩個檔案：

1. `frontend/src/content/modules/<slug>.md` —— 人工維護的唯一內容來源。
2. `frontend/src/data/modules.js` —— 陣列裡新增一個物件，供網站實際讀取渲染。

以及一個必用的工具：

```
npm run validate:module-video          # 離線，快，預設要跑
npm run validate:module-video:audit    # 連網，對照 Bunny 實際影片
```

（皆在 `frontend/` 目錄下執行；程式碼見 `frontend/scripts/validate-module-video-sync.mjs`）

---

## Step by Step

### 1. 決定 Slug / ID / Type / Category

- Slug＝檔名（不含 `.md`），格式 `[type][編號]-[內容]-[variant]`，一經建立不再更改（`naming-convention.md`）。
- ID 用該 type 目前已有的前綴＋下一個流水號，跟既有同 type 的 Module 對齊即可，不用另外發明規則：

  | Type | ID 前綴 | 目前最後一個 |
  |---|---|---|
  | `tuning` | `MT` | MT001 |
  | `warmup` | `MW` | MW004 |
  | `asana` | `MA` | MA005 |
  | `relax` | `MR` | MR001 |
  | `med` | `MM` | MM010 |
  | `end` | `ME` | ME001 |

- Category 選六大 Category 之一（`module-library.md`）；同時屬於多個 Category 時用清單格式（見下）。

### 2. 上傳影片到 Bunny，取得 HLS URL

先有影片，才有後面的一切。取得 `videoId`（完整 HLS playlist URL，形如 `https://vz-xxxx.b-cdn.net/{guid}/playlist.m3u8`）。

### 3. 建立 `.md`（照 `template.md` 的 Basic Information 起）

**必要欄位：** `ID`、`Title`、`Chinese Title`、`Type`、`Category`、`Difficulty`、`Summary`、`Description`、`Learning Outcomes`、`Prerequisites`（清單或 `none`）、`Tags`、`Sources / Video / Primary Video`（`Provider: Bunny` + 上一步的 URL）。

**選填欄位（不確定就省略，不要寫「無」）：** `Subcategory`、`Capabilities`。

**不要填：**
- `Slug` —— 由檔名決定，內容裡不重複維護。
- **`Duration`** —— **Module 不再使用此欄位**（2026-09 起）。這是本文件唯一要特別提醒的例外：`template.md` 的 `Duration:` 欄位是給 Foundation 用的，Module 的 `.md` 裡完全不寫這一行。原因與取代方式見下方「Duration 專門說明」。

### 4. 在 `modules.js` 新增物件

```js
{
  id, slug, title, chineseTitle, type,
  categories: [...],        // 陣列，即使只有一個值
  subcategory,               // 選填字串，沒有就整行省略（不要寫 ''）
  capabilities: [...],       // 選填陣列，沒有就整行省略
  difficulty,
  duration: 0,                // 先填一個佔位值即可，Step 6 會換成 Bunny 真實值
  summary,
  videoReference: { provider: 'bunny', videoId: '<Step 2 的 HLS URL>' },
  tags: [...],
  prerequisites: [...]        // ID 陣列
}
```

### 5. 跑離線檢查

```
npm run validate:module-video
```

確認 `.md` 的 `Primary Video`（Provider + URL）跟 `modules.js` 的 `videoReference` 完全一致。這一步不連網，不驗證 Duration 是否正確（Duration 已經不在 `.md`，沒有東西可比）。

### 6. 跑 Bunny audit，把佔位的 duration 換成真實值

```
npm run validate:module-video:audit
```

這一步會連到 Bunny，讀取真實 HLS 影片長度，跟 `modules.js` 目前的 `duration`（此刻還是 Step 4 填的佔位值）比對，一定會顯示 mismatch，並在錯誤訊息裡印出 **Bunny 實際秒數**（例如 `Bunny actual: 1090s (18:10)`）。

**把這個秒數手動填回 `modules.js` 的 `duration`。** 這個工具只回報，不會自動寫入——複製貼上永遠是人工（或 AI 協作）這一步做的。

再跑一次 `npm run validate:module-video:audit` 確認變成全綠。

### 7. 補完敘述性內容

回頭把 `.md` 的 `Description`、`Learning Outcomes`、`Prerequisites`、`Tags`、`Summary` 寫完整（Step 3 可能只是先建好骨架）。這些內容只存在於 `.md`，不複製進 `modules.js`。

### 8. 收尾檢查

```
npm run lint
npm run build
npm run validate:module-video:audit   # 最後再跑一次確認
```

---

## Duration 專門說明（最容易搞混的一點）

- **`.md` 完全沒有 Duration 欄位。** 不要新增，也不要留空的 `Duration:` 標籤。
- **`modules.js` 的 `duration`（秒數）是 Module duration 唯一存在的地方**，也是網站真正讀取、顯示「影片時長」、計算 Practice 總時長與 entitlement 試看上限的值。
- **權威來源是 Bunny 影片本身的實際長度**，用 `npm run validate:module-video:audit` 對照確認（見 Step 6）。這個工具**只讀取、只回報，不會自動寫入** `modules.js`——正確數字永遠要人工複製貼上。
- 上述規則**只適用於 Module**。Foundation 的 `.md` 仍然維持原本的 `Duration:` 欄位，未受影響。

---

## 不需要處理的事

新增 Module **不需要**：
- 改 routing（`/modules/:slug` 已是通用路由）
- 改 `ModuleLibrary.jsx`（自動列出 `modules` 陣列全部項目）
- 改 Practice Builder 的 Picker（依 `categories` 自動分類分組）

---

## 相關文件

- `content-schema.md` —— Foundation / Module 共用欄位權威定義
- `module-metadata.md` —— Module 專屬欄位（type、Category、Subcategory、Capabilities、Contraindications、Status）
- `naming-convention.md` —— Slug / ID 命名規則
- `frontend/src/content/template.md` —— 撰寫格式範例（含欄位層級的詳細規則與例外）
- `frontend/scripts/validate-module-video-sync.mjs` —— 本文件 Step 5/6 用到的驗證工具原始碼
