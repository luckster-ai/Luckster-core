// Official Practice categories (public.practices.category, see
// supabase/schema_practice_category.sql). The Admin picks one per
// Practice; /practice lists them in this order. `value` is what the
// database stores.
export const PRACTICE_CATEGORIES = [
  {
    value: 'standard',
    label: '標準昆達里尼瑜伽課',
    description: '包含完整的體式序列（奎亞）、呼吸或唱誦冥想。'
  },
  {
    value: 'breath_meditation',
    label: '呼吸與冥想課',
    description: '著重於呼吸練習或唱誦冥想。'
  },
  {
    value: 'short_meditation',
    label: '短時間冥想課',
    description: '適合時間有限時使用的呼吸或唱誦冥想，例如午間冥想、睡前冥想等。'
  }
]
