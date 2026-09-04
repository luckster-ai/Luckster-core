const modules = [
  {
    id: 'MT001',
    slug: 'tuning01-standard',
    title: 'Tuning In (Standard)',
    chineseTitle: '調頻（標準版）',
    type: 'tuning',
    categories: ['Tuning In'],
    difficulty: 'Beginner',
    duration: 195,
    summary: '完整的昆達里尼瑜伽練習的開頭必備程序：黃金鏈接調頻；本影片還包含保護咒。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/00f9e1e3-6d0d-4a78-8770-e550d4239546/playlist.m3u8' },
    tags: ['Mantra', '唱誦', '阿迪梵音', '調頻'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD006', 'FD008-L05']
  },

  {
    id: 'MW001',
    slug: 'warmup01-surya-namaskar',
    title: 'Surya Namaskar Warm-Up (3 Rounds)',
    chineseTitle: '拜日式熱身 (3遍)',
    type: 'warmup',
    categories: ['Warm Up'],
    subcategory: 'Asana',
    difficulty: 'Beginner',
    duration: 267,
    summary: '拜日式熱身，是昆達里尼瑜伽常用的熱身方式。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/ca1b09dd-36e1-4c17-aff0-697cd23b159d/playlist.m3u8' },
    tags: ['熱身', '拜日式', 'Asana'],
    prerequisites: ['FD001']
  },

  {
    id: 'MW002',
    slug: 'warmup02-calm-heart-3min',
    title: 'Meditation Kriya for a Calm Heart (3-Minute Detailed)',
    chineseTitle: '平靜內心冥想 (3分鐘詳解版)',
    type: 'warmup',
    categories: ['Warm Up', 'Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 321,
    summary: '透過深長呼吸配合內、外屏息，帶來清晰感知與內心平靜，適合初學者練習呼吸覺知，也可作為加強專注力與活力的高階練習。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/d1a64ddd-1efc-4099-8812-604ace1b1dd8/playlist.m3u8' },
    tags: ['冥想', '呼吸法', '智慧手印', '心輪', '屏息', '初學者', '平靜'],
    prerequisites: ['FD001', 'FD004', 'FD005-L01', 'FD008', 'FD008-L01']
  },

  {
    id: 'MW003',
    slug: 'warmup03-alternate-nostril-3min',
    title: 'Alternate Nostril Breathing (3-Minute Detailed)',
    chineseTitle: '交替鼻孔呼吸冥想（3分鐘詳解版）',
    type: 'warmup',
    categories: ['Warm Up', 'Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 264,
    summary: '以交替鼻孔呼吸建立情緒平衡與新的洞察力，是昆達里尼與哈他瑜伽的基本技巧，也是睡前排除白天憂慮的極佳練習，練習時長依目的可從 3 分鐘延伸至 31 分鐘。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/3b26a786-bd91-45ef-ad95-6b924a5f54bf/playlist.m3u8' },
    tags: ['呼吸法', '交替鼻孔呼吸', '情緒平衡', '洞察力', '初學者', '睡前'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD008', 'FD008-L01', 'FD008-L04']
  },

  {
    id: 'MW004',
    slug: 'warmup04-self-authority-3min',
    title: 'Caliber for Constant Self-Authority Meditation Kriya（3-Minute Detailed）',
    chineseTitle: '恆常自主的冥想（3分鐘詳解版）',
    type: 'warmup',
    categories: ['Warm Up', 'Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 382,
    summary: '提升自控能力，幫助練習者保持並履行自我的權威。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/94c4bd4a-3b30-427d-a5b9-5da75c552dd9/playlist.m3u8' },
    tags: ['冥想', '呼吸法', '自我權威', '自控力', '心輪'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01']
  },

  {
    id: 'MA001',
    slug: 'asana01-surya-kriya',
    title: 'Surya Kriya',
    chineseTitle: '太陽奎亞',
    type: 'asana',
    categories: ['Asana'],
    difficulty: 'Beginner',
    duration: 2280,
    summary: '以太陽能量（Surya）命名，透過一系列體式與呼吸的結合，系統性地刺激陽性的普拉那能量與昆達里尼能量。這套奎亞有助於提升活力、淨化身心，並為日常薩達那練習注入穩定而充沛的能量。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/c5139a12-ecaa-4470-97e5-2ffcbe0f809c/playlist.m3u8' },
    tags: ['身體奎亞', '太陽能量', '減肥', '有活力'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD005-L04', 'FD006', 'FD008', 'FD008-L01', 'FD008-L07', 'FD009']
  },

  {
    id: 'MA002',
    slug: 'asana02-elevation-kriya',
    title: 'Kriya for Elevation',
    chineseTitle: '提升的奎亞',
    type: 'asana',
    categories: ['Asana'],
    capabilities: ['Warm Up'],
    difficulty: 'Beginner',
    duration: 2674,
    summary: '一套簡單的暖身身體奎亞，能系統地鍛鍊脊柱，開展普拉納（prana）的循環，以平衡脈輪（chakras）。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/8f51bfc4-0600-480c-89be-be5ce4f88c8b/playlist.m3u8' },
    tags: ['身體奎亞', '暖身', '脊柱', '脈輪平衡', '普拉納能量'],
    prerequisites: ['FD001', 'FD002', 'FD003', 'FD004', 'FD005-L01', 'FD005-L04', 'FD006', 'FD008-L07', 'FD009']
  },

  {
    id: 'MA003',
    slug: 'asana03-sat-kriya',
    title: 'Praticing Sat Kriya',
    chineseTitle: '薩特奎亞練習',
    type: 'asana',
    categories: ['Asana'],
    difficulty: 'Beginner',
    duration: 1198,
    summary: '薩特奎亞是少數可單獨完整練習的奎亞，透過岩石坐姿、交扣手印與節奏唱誦「Sat Naam」帶動丹田與身體鎖自動收縮，能協調神經系統、平息情緒、疏導性與創造能量，是昆達里尼練習的核心必修動作。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/d7e02b91-e8d7-4341-808a-a5ef2b5cc323/playlist.m3u8' },
    tags: ['身體奎亞', '身體鎖', '神經系統', '性能量'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L04', 'FD006', 'FD008-L07', 'FD009']
  },

  {
    id: 'MA004',
    slug: 'asnan04-morning-sadhana',
    title: 'Kriya for Morning Sadhana（Standard）',
    chineseTitle: '晨間薩達那奎亞（能量鍛鍊版）',
    type: 'asana',
    categories: ['Asana'],
    difficulty: 'Intermidiate',
    duration: 3702,
    summary: '包含23個動作的全套昆達里尼練習，能鬆開全身緊繃處、強化神經與腺體系統，據說能解決所有問題；為晨間冥想做好準備。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/f4803142-3837-4ae8-8aff-34c75528c484/playlist.m3u8' },
    tags: ['身體奎亞', '晨間練習', '薩達那', '神經系統', '解決所有問題'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD005-L04', 'FD006', 'FD008', 'FD008-L01', 'FD008-L07']
  },

  {
    id: 'MA005',
    slug: 'asnan05-morning-sadhana-short',
    title: 'Kriya for Morning Sadhana（Short）',
    chineseTitle: '晨間薩達那奎亞（新手舒適版）',
    type: 'asana',
    categories: ['Asana'],
    difficulty: 'Beginner',
    duration: 2869,
    summary: '包含23個動作的全套昆達里尼練習，能鬆開全身緊繃處、強化神經與腺體系統，據說能解決所有問題；為晨間冥想做好準備。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/b5d77494-fa25-435d-a55c-fd26f38b5314/playlist.m3u8' },
    tags: ['身體奎亞', '晨間練習', '薩達那', '神經系統', '解決所有問題'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD005-L04', 'FD006', 'FD008', 'FD008-L01', 'FD008-L07']
  },

  {
    id: 'MR001',
    slug: 'relax01-savasana-guided',
    title: 'Guided Savasana Relaxation',
    chineseTitle: '引導式攤屍式深度放鬆',
    type: 'relax',
    categories: ['Relaxation'],
    subcategory: 'Savasana',
    difficulty: 'Beginner',
    duration: 655,
    summary: '在整個奎亞或冥想結束後，要做一次8-15分鐘的深度放鬆，或瑜伽睡眠。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/af964bfa-514b-48d4-a920-9b4b2da306ef/playlist.m3u8' },
    tags: ['深度放鬆', '神經系統調節', '攤屍式'],
    prerequisites: ['FD001']
  },

  {
    id: 'MM001',
    slug: 'med01-kirtan-kriya-18min',
    title: 'Kirtan Kriya (18-Minute Detailed)',
    chineseTitle: '克爾坦奎亞（18分鐘詳解版）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Chant',
    difficulty: 'Beginner',
    duration: 1128,
    summary: 'Sa Ta Na Ma 唱誦冥想 + 詳細解說。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/78fb82b1-d8cc-4da3-be37-6d1ed002da24/playlist.m3u8' },
    tags: ['唱誦', '手印', '冥想', '專注力', '基礎'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04']
  },

  {
    id: 'MM002',
    slug: 'med02-kirtan-kriya-31min',
    title: 'Kirtan Kriya (31-Minute)',
    chineseTitle: '克爾坦奎亞（31分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Chant',
    difficulty: 'Intermediate',
    duration: 1978,
    summary: 'Sa Ta Na Ma 唱誦冥想。31分鐘版本（無解說）。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/6bfebb54-a69f-4421-b238-16dfa4eeb6ba/playlist.m3u8' },
    tags: ['唱誦', '手印', '冥想', '專注力'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04', 'MM001']
  },

  {
    id: 'MM003',
    slug: 'med03-kirtan-kriya-150min',
    title: 'Kirtan Kriya (150-Minute)',
    chineseTitle: '克爾坦奎亞（150分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Chant',
    difficulty: 'Advanced',
    duration: 9260,
    summary: 'Sa Ta Na Ma 唱誦冥想。2.5小時版本（無解說）。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/2c6e37a0-4356-49a8-bbbc-f72ff097f943/playlist.m3u8' },
    tags: ['唱誦', '手印', '冥想', '專注力'],
    prerequisites: ['FD004', 'FD005-L01', 'FD008', 'FD008-L01', 'FD008-L02', 'FD008-L03', 'FD008-L04', 'MM001', 'MM002']
  },

  {
    id: 'MM004',
    slug: 'med04-life-caliber-3min',
    title: 'Caliber of Life Meditation Kriya (3-Minute Detailed)',
    chineseTitle: '生命力冥想奎亞 (3分鐘詳解版)',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Intermediate',
    duration: 329,
    summary: '透過拳頭與拇指構成準心般的手印，配合精確計時的吸氣、呼氣與屏息循環，強化呼吸的投射力與掌控力，是需逐步培養的進階冥想練習。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/f7398564-9490-429c-810b-60e660604d21/playlist.m3u8' },
    tags: ['冥想', '呼吸法', '屏息', '神經系統'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01']
  },

  {
    id: 'MM005',
    slug: 'med05-life-caliber-11min',
    title: 'Caliber of Life Meditation Kriya (11-Minute Guided)',
    chineseTitle: '生命力冥想奎亞 (11分鐘引導版)',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Advanced',
    duration: 668,
    summary: '透過拳頭與拇指構成準心般的手印，配合精確計時的吸氣、呼氣與屏息循環，強化呼吸的投射力與掌控力，是需逐步培養的進階冥想練習。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/7425a7bc-82b0-41e5-9dbf-b952546bd103/playlist.m3u8' },
    tags: ['冥想', '呼吸法', '屏息', '神經系統'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'MM004']
  },

  {
    id: 'MM006',
    slug: 'med06-aerobic-capacity-11min',
    title: 'Aerobic Capacity and Efficiency Kriya (11-Minute)',
    chineseTitle: '提高攝氧量和效率冥想（11分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Intermediate',
    duration: 855,
    summary: '透過屏息配合前後彎曲脊椎的單步驟奎亞，能增強肺部向血液輸送氧氣的效率、促進心肌協調並有益腎臟與生殖系統，需逐步培養耐力才能獲得全部功效。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/4ed295aa-3867-49e6-9d7a-eee0f542b428/playlist.m3u8' },
    tags: ['呼吸法', '神經系統', '屏息', '心肺功能', '耐力', '排毒'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01']
  },

  {
    id: 'MM007',
    slug: 'med07-fire-breath',
    title: 'Beginning a Practice of Breath of Fire',
    chineseTitle: '火呼吸練習冥想',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 867,
    summary: '火呼吸能排毒、增強肺活量與神經系統韌性、強化臍輪並提升專注與免疫力；初學者可從祈禱式坐姿開始，搭配短時間火呼吸與屏息的組合逐步練習。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/1e365711-b557-4378-95ee-f9a2f331e3d9/playlist.m3u8' },
    tags: ['呼吸法', '火呼吸', '初學者', '排毒', '神經系統'],
    prerequisites: ['FD001', 'FD002', 'FD003', 'FD004', 'FD005-L01']
  },

  {
    id: 'MM008',
    slug: 'med08-bahuta-karam-31min',
    title: 'Bahuta Karam Meditation - 25th Pauri of Japji Sahib (31-Minute)',
    chineseTitle: '富足品德財富房產冥想（31分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Chant',
    difficulty: 'Advanced',
    duration: 2548,
    summary: '以簡易坐姿搭配智慧手印，唱誦 Japji Sahib 第25節（Bahuta Karam）31分鐘，接著靜心聆聽內在的梵音餘韻，是一套據稱能將匱乏轉化為豐盛的冥想練習。',
    videoReference: { provider: 'youtube', videoId: 'yEYFwtmMVLg' },
    tags: ['Mantra', '豐盛', 'Japji Sahib', '財富'],
    prerequisites: ['FD005-L01', 'FD008', 'FD008-L01']
  },

  {
    id: 'MM009',
    slug: 'med09-alternate-nostril-15min',
    title: 'Alternate Nostril Breathing (15-Minute)',
    chineseTitle: '交替鼻孔呼吸冥想（15分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 958,
    summary: '以交替鼻孔呼吸建立情緒平衡與新的洞察力，是昆達里尼與哈他瑜伽的基本技巧，也是睡前排除白天憂慮的極佳練習，練習時長依目的可從 3 分鐘延伸至 31 分鐘。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/8fa1ac69-399c-4175-8a47-c80f6f853dda/playlist.m3u8' },
    tags: ['呼吸法', '交替鼻孔呼吸', '情緒平衡', '洞察力', '初學者', '睡前'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01', 'FD008', 'FD008-L01', 'FD008-L04']
  },

  {
    id: 'MM010',
    slug: 'med10-self-authority-11min',
    title: 'Caliber for Constant Self-Authority Meditation Kriya（11-Minute）',
    chineseTitle: '恆常自主的冥想（11分鐘）',
    type: 'med',
    categories: ['Meditation'],
    subcategory: 'Breath',
    difficulty: 'Beginner',
    duration: 806,
    summary: '提升自控能力，幫助練習者保持並履行自我的權威。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/00dd5534-cf99-4fcd-89ee-809ff5faf421/playlist.m3u8' },
    tags: ['冥想', '呼吸法', '自我權威', '自控力', '心輪'],
    prerequisites: ['FD001', 'FD002', 'FD004', 'FD005-L01']
  },

  {
    id: 'ME001',
    slug: 'end01-long-time-sun-en',
    title: 'Long Time Sun Closing (English)',
    chineseTitle: '永恆的陽光結束儀式（英文版）',
    type: 'end',
    categories: ['Ending'],
    difficulty: 'Beginner',
    duration: 148,
    summary: '包含《Long Time Sun》英文版本歌曲、融入其中的三次 Sat Nam 唱誦作爲結尾。',
    videoReference: { provider: 'bunny', videoId: 'https://vz-c3c60b7e-4d4.b-cdn.net/a1fddad2-9e34-44f2-9f27-4838e56ccd48/playlist.m3u8' },
    tags: ['唱誦', '結尾儀式', '基礎'],
    prerequisites: ['FD005-L01', 'FD006', 'FD008-L05']
  }
]

export default modules
