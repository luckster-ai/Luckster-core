// Payment Readiness Implementation Sprint (2026-09).
//
// Plan / Trial / Renewal / Refund copy for the public /pricing page.
// Every value and rule here is transcribed from already-confirmed
// product decisions -- not invented for this page. Sources:
//   - docs/business/payment/payment-legal-spec.md (§2 Plans, §3 Trial,
//     §5 Service Period lifecycle, §11 Refund)
//   - docs/legal/joti-online-teaching-contract.md (第七條/第九條/第十一條)
//   - docs/legal/joti-trial-and-usage-notice.md (Trial 白話說明，多處直接沿用原文)
// If any of these rules change, update the source document first, then
// this file -- never the other way around.
const pricing = {
  plans: [
    {
      code: 'monthly',
      name: '月方案',
      nameEn: 'Monthly',
      price: 'NT$333',
      period: '每一付費服務期間 1 個月'
    },
    {
      code: 'annual',
      name: '年方案',
      nameEn: 'Annual',
      price: 'NT$3,333',
      period: '每一付費服務期間 1 年'
    }
  ],

  trial: {
    title: '免費試用',
    limits: [
      '註冊即自動開始，不需申請，不需先綁定信用卡，不產生任何付款義務。',
      '最長 30 個日曆日，或累計 30 小時「有效使用時間」，以先達到者為準。'
    ],
    usageNote:
      '「有效使用時間」只計入你正在實際觀看 Module 影片，且頁面在前景、瀏覽器分頁未切到背景、視窗未縮到最小、裝置未進入睡眠、螢幕未關閉的時間；暫停、緩衝、播放結束後的時間都不計入。',
    noImmediateCharge:
      '試用期間即使先選擇方案並完成付款方式授權，也不會立即扣款；只有在你完成購買確認、付款授權，且試用條件成就（30 天或 30 小時先到者）之後，才會依你當下已明確同意之條件與金額執行一次扣款。'
  },

  renewal: {
    title: '不自動續約，無需取消訂閱',
    summary:
      'JOTI 不採用自動續約機制：服務期間到期不會自動扣款、不會自動建立下一個服務期間。你不需要執行任何「取消」操作——不購買下一個服務期間即可，基本契約仍然有效，之後仍可隨時主動購買新的服務期間。'
  },

  refund: {
    title: '退款',
    summary:
      '在目前服務期間內，你可以隨時申請提前終止，我們會依已提供服務之比例，退還尚未使用部分的費用；提前終止不會影響你的基本契約，該契約仍然有效。'
  }
}

export default pricing
