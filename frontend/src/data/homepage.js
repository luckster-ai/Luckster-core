// Homepage Hero copy (2026-09). Order in the rendered Hero is: title /
// titleEn → mission → encouragement → CTAs → image → hook → what, so the
// CTAs sit in the first viewport on both desktop and mobile (see
// HeroSection.jsx). `mission` is JOTI's brand / mission statement, kept
// verbatim and given its own visual step above body copy. `hook` (the
// visitor's own situation), `what` (what JOTI is) and `encouragement`
// (the low-barrier line before the CTAs) are product-direction copy, not
// new marketing claims: no medical, therapeutic, or outcome guarantees,
// and the "顯化…" line is phrased as a question about the visitor's own
// intention, not a promise.
const homepage = {
  brand: {
    name: "JOTI",
    subtitleEn: "KUNDALINI ABC YOGA"
  },

  hero: {
    title: "喚醒內在力量",
    titleEn: "Awaken Your Inner Power",
    mission: "從回到自己開始，連結本自具足的神性力量，走向靈性覺醒。",
    hook: [
      "你有煩惱嗎？",
      "你想改善身體狀態，或正在面對身體上的困擾嗎？",
      "你想顯化自己想要的結果嗎？——財富、健康、人際關係……"
    ],
    what: [
      "JOTI 是傳遞實用工具的管道：昆達里尼瑜伽技術。",
      "用清楚、完整的練習，陪你從第一次接觸開始。"
    ],
    encouragement: "你不需要柔軟，也不需要經驗。只需要開始。"
  },

  practiceFlow: {
    title: "完整課程流程"
  },

  youtube: {
    title: "YouTube 精選內容",
    channelUrl:
      "https://www.youtube.com/@Joti_KundaliniABCYoga"
  }
}

export default homepage
