const modules = [
  {
    id: 'MT001',
    slug: 'tuning01-standard',
    title: 'Tuning In (Standard)',
    chineseTitle: '調頻（標準版）',
    type: 'tuning',
    category: 'Tuning In',
    difficulty: 'Beginner',
    duration: 195,
    summary: '完整的昆達里尼瑜伽練習的開頭必備程序：黃金鏈接調頻；本影片還包含保護咒。',
    videoReference: { provider: 'youtube', videoId: 'tvkcOmfXQuE' },
    tags: ['Mantra', '唱誦', '阿迪梵音', '調頻'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD006', 'FD008-L05']
  },

  {
    id: 'MW001',
    slug: 'warmup01-surya-namaskar',
    title: 'Surya Namaskar Warm-Up (3 Rounds)',
    chineseTitle: '拜日式熱身 (3遍)',
    type: 'warmup',
    category: 'Warm Up',
    difficulty: 'Beginner',
    duration: 267,
    summary: '拜日式熱身，是昆達里尼瑜伽常用的熱身方式。',
    videoReference: { provider: 'youtube', videoId: 'e_esmWeX2Oc' },
    tags: ['熱身', '拜日式', 'Asana'],
    prerequisites: ['FD001']
  },

  {
    id: 'MA001',
    slug: 'asana01-surya-kriya',
    title: 'Surya Kriya',
    chineseTitle: '太陽奎亞',
    type: 'asana',
    category: 'Asana',
    difficulty: 'Beginner',
    duration: 2280,
    summary: '以太陽能量（Surya）命名，透過一系列體式與呼吸的結合，系統性地刺激陽性的普拉那能量與昆達里尼能量。這套奎亞有助於提升活力、淨化身心，並為日常薩達那練習注入穩定而充沛的能量。',
    videoReference: { provider: 'youtube', videoId: 'BvcoNwATUW4' },
    tags: ['太陽能量', '減肥', '有活力'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD005-L04', 'FD006', 'FD008-L01', 'FD008-L07']
  },

  {
    id: 'MR001',
    slug: 'relax01-savasana-guided',
    title: 'Guided Savasana Relaxation',
    chineseTitle: '引導式攤屍式深度放鬆',
    type: 'relax',
    category: 'Relaxation',
    difficulty: 'Beginner',
    duration: 655,
    summary: '在整個奎亞或冥想結束後，要做一次8-15分鐘的深度放鬆，或瑜伽睡眠。',
    videoReference: { provider: 'youtube', videoId: 'Gg5F3Py8un4' },
    tags: ['深度放鬆', '神經系統調節', '攤屍式'],
    prerequisites: ['FD001']
  },

  {
    id: 'MM001',
    slug: 'med01-kirtan-kriya-18min',
    title: 'Kirtan Kriya (18-Minute Guided)',
    chineseTitle: '克爾坦奎亞（18分鐘引導版）',
    type: 'med',
    category: 'Meditation',
    difficulty: 'Beginner',
    duration: 1128,
    summary: 'Sa Ta Na Ma 唱誦冥想 + 詳細解說。',
    videoReference: { provider: 'youtube', videoId: 'VDdVzux-7HY' },
    tags: ['唱誦', '手印', '冥想', '專注力', '基礎'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04']
  },

  {
    id: 'MM002',
    slug: 'med02-kirtan-kriya-31min',
    title: 'Kirtan Kriya (31-Minute)',
    chineseTitle: '克爾坦奎亞（31分鐘）',
    type: 'med',
    category: 'Meditation',
    difficulty: 'Intermediate',
    duration: 1978,
    summary: 'Sa Ta Na Ma 唱誦冥想。31分鐘版本（無解說）。',
    videoReference: { provider: 'youtube', videoId: 'KYwWSdNb3UA' },
    tags: ['唱誦', '手印', '冥想', '專注力'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04', 'MM001']
  },

  {
    id: 'MM003',
    slug: 'med03-kirtan-kriya-150min',
    title: 'Kirtan Kriya (150-Minute)',
    chineseTitle: '克爾坦奎亞（150分鐘）',
    type: 'med',
    category: 'Meditation',
    difficulty: 'Advanced',
    duration: 9260,
    summary: 'Sa Ta Na Ma 唱誦冥想。2.5小時版本（無解說）。',
    videoReference: { provider: 'youtube', videoId: '2GaicKj6jMg' },
    tags: ['唱誦', '手印', '冥想', '專注力'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04', 'MM001', 'MM002']
  },

  {
    id: 'ME001',
    slug: 'end01-long-time-sun-en',
    title: 'Long Time Sun Closing (English)',
    chineseTitle: '永恆的陽光結束儀式（英文版）',
    type: 'end',
    category: 'Ending',
    difficulty: 'Beginner',
    duration: 148,
    summary: '包含《Long Time Sun》英文版本歌曲、融入其中的三次 Sat Nam 唱誦作爲結尾。',
    videoReference: { provider: 'youtube', videoId: 'sQ6KQU2wQ_k' },
    tags: ['唱誦', '結尾儀式', '基礎'],
    prerequisites: ['FD005-L01', 'FD006', 'FD008-L05']
  }
]

export default modules
