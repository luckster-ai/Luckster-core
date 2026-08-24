# 2026-08-24 工作紀錄：About 頁面第一階段整合(內容 + 2012/2018 editorial 視覺)

本文件記錄 Mobile Practice Builder checkpoint(`5633df1`)完成之後、同一天接續進行的 About 頁面工作。這是一條獨立工作線,不屬於 Mobile Practice Builder,也不屬於 Bunny。

---

## 1. 今天完成了什麼

1. **About 頁面正式整合進網站**:新增 `/about` route,`Header.jsx`/`Footer.jsx` 的「關於 JOTI」連結從首頁錨點(`/#about`)改為導向這個新頁面。首頁既有的 `AboutSection`(`data/teacher.js`)維持原樣保留,沒有被取代。
2. **七個 Section 的文字內容**已依 `docs/website/about.md` 逐字實作(不含「撰寫備註」,那是企劃備註不是站上內容),CTA 依指示調整為「回到首頁」(→`/`)+「開始練習」(→`/practice`),移除了「看她的練習」。
3. **第一屏(開場)真實照片已上線**:`about-hero-triptych.png.png`(台北/上海/江蘇三聯畫,1774×887,2:1),取代原本的照片佔位區塊,滿版呈現,`object-fit: cover` 搭配容器精確 2:1 比例,確保不裁切。
4. **第二個 Section(2012 / 2018)完成 editorial 視覺整合**:兩張真實照片(`about-2012-yoga.png`、`about-2018-yoga.png`,皆 1536×1024)已上線,取代原本簡單的文字時間軸。年份數字做成大型 editorial 排版,2012/2018 左右方向相反、文字疊在各自照片實際的留白角落,同一套視覺語言但方向有變化,不是重複同一個 layout。
5. **品牌指南補充**:`docs/brand/brand-guide.md` 新增「品牌名稱由來」段落(Joti/Livdeep 字義),對應 About 頁「名字」Section 的內容來源。

---

## 2. About 頁面目前做到哪裡(精確狀態)

**已完成、已驗證**:
- Section 1(開場)、Section 2(2012/2018)——內容 + 真實照片 + editorial 視覺,Desktop 已用瀏覽器實測確認(含修正一個「數字被照片蓋住只剩一撇」的定位 bug)
- Section 3–7(成為老師、ABC、她相信、名字、結尾 CTA)——內容與基礎版面已實作,但**視覺上維持第一階段的樸素風格**(沒有做這次 2012/2018 那種 editorial 疊字處理),照片佔位區塊也還沒換成真圖(除了 Section 1)
- Header/Footer 連結、路由、CTA 目的地——已測試可正常運作

**目前 Desktop / Tablet / Mobile 的實作狀態**:
- 全頁(含 Section 1、2012/2018)的 CSS **一次寫了三個尺寸**(mobile-first,`768px`/`1024px` 兩個斷點),不是先做 Desktop 再回頭補
- **Desktop**:已用瀏覽器實際檢查(桌面寬度 + 修正 bug 後重新確認),看起來正確
- **Tablet / Mobile**:因為這個開發環境的瀏覽器視窗沒辦法可靠縮到真正窄寬度(`resize_window` 這個工具在這台機器上不穩定),是用「把對應斷點的真實 CSS 規則強制套用」的方式自我檢查過,畫面正常、沒有水平 overflow——**但這不是使用者在真實手機上的驗證**,只是我自己的把關,不能取代下一步

---

## 3. 下一步(明確排序,還沒做)

1. **先讓使用者在自己電腦的 `localhost:4190/about` 上看過 Desktop 結果**(2012/2018 那個 Section 使用者還沒有親眼看過,今天只做到我自己檢查)
2. Desktop 確認沒問題後,**用手機實機驗證 Responsive**——上一次嘗試用 Vercel Preview 部署失敗,回報 `Not authorized`,原因還沒查清楚,這件事還沒解決,是否需要重新 `vercel login` 需要使用者決定(這是先前對話就停在這裡的狀態,今天沒有再處理)

---

## 4. 今天沒有完成的事情(明確列出,避免被誤讀成已完成)

- Section 3–7 的 editorial 視覺升級——目前只有 Section 1、2 做了 mockup 那種高質感處理,其餘還是第一階段的樸素版面
- 「成為老師」Section 的照片佔位區塊——還沒有真實照片可以換
- 手機真機的 Responsive 驗證——完全還沒開始(見上方第 3 節)
- Vercel Preview 部署——上次失敗(Not authorized),還沒重新嘗試或排除原因
- 首頁 `AboutSection` 跟新 About 頁面之間的語意關係(要不要加一個「看完整故事」連結之類)——**這是先前就標記過的未決事項,今天沒有進一步討論或決定,不要誤讀成已經有結論**

---

## 5. Working tree 裡跟今天無關、刻意沒有動的東西

- `frontend/src/components/HeroSection.jsx`、`frontend/src/data/homepage.js`——首頁 Hero CTA 按鈕移除,這是更早之前就存在、跟 About 或 Bunny 都無關的獨立 WIP,今天沒有處理,也沒有納入任何 commit
- Bunny、Mobile Practice Builder 相關檔案——Mobile Practice Builder 已在更早的 commit(`5633df1`)完成 checkpoint 並推送,今天沒有再變動

---

## 6. 一個檔名小提醒

Section 1 的三聯畫檔案實際檔名是 `about-hero-triptych.png.png`(雙副檔名),不是原本說的 `about-hero-triptych.png`——程式碼裡是照實際檔名引用的,沒有自作主張重新命名,只是這裡記錄一下,如果之後要整理素材檔名可以留意。
