// Content source: docs/website/about.md (the seven narrative Sections,
// verbatim -- the "撰寫備註" authoring notes at the end of that file are
// internal planning notes, not site copy, so they're deliberately not
// represented here). Visual/structural reference: docs/design/about-page/
// about-mockup.html -- see AboutPage.jsx for how each section maps to it.
const about = [
  {
    id: 'opening',
    kicker: null,
    lines: ['十三年，金融業。', '台北、上海、江蘇。'],
    note: '數字起伏之間，身體先崩潰，心才知道。'
  },
  {
    id: 'turning-point',
    kicker: null,
    years: [
      { year: '2012', headline: '瑜伽走進生活。' },
      { year: '2018', headline: '遇見昆達里尼。' }
    ],
    note: '那是一個從未認識過的自己。'
  },
  {
    id: 'becoming-a-teacher',
    kicker: null,
    lines: [
      '離開上海，也離開了熟悉的老師與教室。',
      '於是決定，成為自己最好的老師。',
      '2023 年，完成 KRI 國際昆達里尼瑜伽一級教師培訓。'
    ],
    photoPlaceholder: '照片預留 — Joti 練習／授課影像'
  },
  {
    id: 'why-abc',
    kicker: '為什麼是 ABC',
    abc: [
      { letter: 'A', label: '體式' },
      { letter: 'B', label: '呼吸' },
      { letter: 'C', label: '唱誦' }
    ],
    intro: '很多人好奇昆達里尼瑜伽，卻不知從何開始。於是拆解成三個字——',
    note: '不需要柔軟。不需要經驗。只需要開始。'
  },
  {
    id: 'she-believes',
    kicker: null,
    quote: ['改變不是瞬間發生的事。', '是呼吸與呼吸之間，日復一日，累積出來的。']
  },
  {
    id: 'the-name',
    kicker: null,
    intro: 'Joti Livdeep Kaur，是昆達里尼瑜伽給她的名字。',
    name: 'Joti Livdeep Kaur',
    meaning: ['JOTI — 意思是光', 'Livdeep — 意思是專注於光的心']
  },
  {
    id: 'closing',
    kicker: null,
    headline: '從呼吸開始，回到自己。'
  }
]

export default about
