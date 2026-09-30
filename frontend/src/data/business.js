// Payment Readiness Implementation Sprint (2026-09), updated by the
// Business & Legal Information Synchronization pass (2026-09-22).
//
// Source of truth: docs/legal/joti-online-teaching-contract.md 第一條
// (契約當事人). Do not edit values here without updating that document
// first -- this file must stay in sync with the legal source, not the
// other way around.
//
// operatorAddress: synced from docs/legal/joti-business-legal-framework.md
// §2 ("目前規劃使用...作為 JOTI 對外網站／契約揭露的營業所／聯絡地址",
// Status: CURRENT). That document notes this is the currently-planned
// disclosure address, not a claim of government business registration --
// see §2's "重要區分" for the distinction. Do not add a website/domain
// value here -- no final JOTI domain is confirmed (see contract 第一條
// "網站：[待填寫]"); never fill it with a Vercel preview/production URL.
const business = {
  operatorName: '曹莘亞',
  operatorType: '個人經營者',
  operatorAddress: '臺北市松山區吉祥路55之1號7樓',
  supportEmail: 'luckster.ai.workspace@gmail.com',
  supportPhone: '0933930086'
}

export default business
