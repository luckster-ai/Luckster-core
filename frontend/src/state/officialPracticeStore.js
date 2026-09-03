import { supabase } from '../lib/supabaseClient'
import modules from '../data/modules.js'
import { validateOfficialPracticeStructure } from '../utils/validateOfficialPractice.js'

// Official Practice CRUD / Store (Phase 6B). Same thin-wrapper shape as
// practiceActivityStore.js / practiceNotesStore.js -- data layer only.
// Since Phase 6D this is the sole runtime source of truth for Official
// Practices (the static data/practices.js is gone). Every write goes
// through here; it never bypasses RLS (always the normal anon-key client
// -- see lib/supabaseClient.js, no service-role key here or ever) and
// never re-implements structural validation -- it reuses
// validateOfficialPracticeStructure exactly as the Builder UI does.
//
// Row <-> Practice shape mapping: Supabase columns are snake_case
// (chinese_title), matching every other table in this schema; the rest
// of the app uses camelCase (chineseTitle) for a Practice object (see
// PracticeCard.jsx etc.). fromPracticeRow/toPracticeRow are the one
// place that boundary is crossed, so nothing else in the app (including
// the validation functions above) needs to know Supabase's column names.
//
// modules stores Module ID (Phase 6A/6B decision), not slug -- every
// Custom Practice still uses slugs. resolvePracticeModules.js /
// validatePracticeBuilder.js / validateOfficialPractice.js all do a
// minimal ID-first-slug-fallback lookup, so validateOfficialPracticeStructure
// below works correctly against an ID-based Practice from this table.
//
// Lifecycle validation rule: a draft (or archived) row only needs its
// Module references to actually exist -- structural
// completeness (Section composition, Bunny-ready) is explicitly allowed
// to be incomplete while drafting. Only a `published` row must pass the
// full canPublish check. This is enforced on every create/update/status
// transition below (publish/unpublish/archive all funnel through
// updateOfficialPractice), not just at creation time -- an update that
// would corrupt an already-valid row is rejected the same way a bad
// create is.
function fromPracticeRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    chineseTitle: row.chinese_title,
    description: row.description,
    difficulty: row.difficulty,
    modules: row.modules,
    tags: row.tags,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Only maps fields actually present on the input, so this works for
// both a full create payload and a partial update patch -- the caller
// never has to spread in fields it isn't actually changing.
function toPracticeRow(practice) {
  const row = {}

  if ('id' in practice) row.id = practice.id
  if ('slug' in practice) row.slug = practice.slug
  if ('title' in practice) row.title = practice.title
  if ('chineseTitle' in practice) row.chinese_title = practice.chineseTitle
  if ('description' in practice) row.description = practice.description
  if ('difficulty' in practice) row.difficulty = practice.difficulty
  if ('modules' in practice) row.modules = practice.modules
  if ('tags' in practice) row.tags = practice.tags
  if ('status' in practice) row.status = practice.status

  return row
}

function buildPublishErrorMessage(result) {
  const reasons = []

  if (!result.isStructurallyValid) reasons.push(...result.sectionErrors)
  if (result.orderCheck === 'mismatch') reasons.push('Module 順序與組成不一致')
  if (!result.isBunnyReady) reasons.push('尚未所有 Module 都使用 Bunny，無法發布')

  return `無法發布：${reasons.join('；')}`
}

// The one validation gate every create/update/status-change passes
// through. `practice` here is the full, already-merged Practice this
// row would become (see updateOfficialPractice's fetch-then-merge
// below) -- never just the changed fields in isolation, since e.g.
// publishing checks the WHOLE Practice, not just the `status` field
// itself.
function validateForSave(practice) {
  if (!practice.modules || practice.modules.length === 0) {
    return { ok: false, error: { code: 'invalid_data', message: 'Practice 至少需要包含一個 Module。' } }
  }

  const result = validateOfficialPracticeStructure(practice, modules)

  if (result.missingModuleSlugs.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_modules',
        message: `以下 Module 不存在，無法儲存：${result.missingModuleSlugs.join(', ')}`
      }
    }
  }

  if (practice.status === 'published' && !result.canPublish) {
    return { ok: false, error: { code: 'not_publishable', message: buildPublishErrorMessage(result) } }
  }

  return { ok: true, error: null }
}

// Translates a raw Postgres/PostgREST error into one clear, UI-safe
// message. Not exhaustive by design -- only the failure modes this
// table's own schema (supabase/schema_practices.sql) can actually
// produce: unique violations on id/slug, RLS rejection (non-admin, or
// admin write attempted through a stale/signed-out session), and the
// `modules` non-empty / `status` enum CHECK constraints as a last-resort
// safety net behind the client-side validateForSave check above.
function mapSupabaseError(error) {
  if (!error) return null

  if (error.code === '23505') {
    if (error.message?.includes('practices_pkey')) {
      return { code: 'duplicate_id', message: '這個 Practice ID 已經存在，請換一個。' }
    }
    if (error.message?.includes('slug')) {
      return { code: 'duplicate_slug', message: '這個 slug 已經被使用，請換一個。' }
    }
    return { code: 'duplicate', message: '違反唯一性限制。' }
  }

  if (error.code === '42501') {
    return { code: 'forbidden', message: '沒有權限執行這個操作（需要 Admin 身份）。' }
  }

  if (error.code === '23514') {
    return {
      code: 'invalid_data',
      message: '資料不符合基本欄位限制（例如 modules 不能為空、status 必須是 draft/published/archived 其中之一）。'
    }
  }

  return { code: 'unknown', message: error.message || '發生未知錯誤。' }
}

// RLS alone decides which rows come back -- published for anyone,
// draft/archived additionally for admin (supabase/schema_practices.sql).
// This function never checks who's asking; that's the point.
//
// Result form ({ data, error }) added for Phase 6D's public Practice Hub,
// which needs to tell "no published Practices yet" apart from "the fetch
// failed" (no offline cache). Admin's list page keeps calling the plain
// listOfficialPractices() below unchanged.
export async function listOfficialPracticesResult() {
  if (!supabase) return { data: [], error: null }

  const { data, error } = await supabase.from('practices').select('*').order('created_at', { ascending: false })

  if (error) return { data: [], error }

  return { data: (data || []).map(fromPracticeRow), error: null }
}

export async function listOfficialPractices() {
  const { data } = await listOfficialPracticesResult()
  return data
}

export async function getOfficialPractice(id) {
  if (!supabase || !id) return null

  const { data, error } = await supabase.from('practices').select('*').eq('id', id).single()

  return error || !data ? null : fromPracticeRow(data)
}

// Public Practice Detail / Player resolve by slug (the routing key), not
// id. Returns { data, error } rather than a bare value so the caller can
// tell "no such published Practice" (data: null, error: null) apart from
// a transport/RLS failure (error set) -- Phase 6D deliberately has no
// offline cache, so a failed fetch must surface as its own "try again"
// state, never a false "not found". RLS still scopes visibility: a
// signed-out visitor sees only status = 'published', so a draft/archived
// slug resolves to null here. maybeSingle() (not single()) treats "no
// row" as data: null rather than an error.
export async function getOfficialPracticeBySlug(slug) {
  if (!supabase || !slug) return { data: null, error: null }

  const { data, error } = await supabase.from('practices').select('*').eq('slug', slug).maybeSingle()

  if (error) return { data: null, error }

  return { data: data ? fromPracticeRow(data) : null, error: null }
}

// practice: { id, slug, title, chineseTitle, description, difficulty,
// modules, tags?, status? } -- status defaults to 'draft' at the DB
// level (schema_practices.sql) when omitted here.
export async function createOfficialPractice(practice) {
  if (!supabase) return { data: null, error: { code: 'no_client', message: 'Supabase 尚未設定。' } }

  const validation = validateForSave(practice)
  if (!validation.ok) return { data: null, error: validation.error }

  const { data, error } = await supabase.from('practices').insert(toPracticeRow(practice)).select().single()

  return { data: data ? fromPracticeRow(data) : null, error: mapSupabaseError(error) }
}

// changes: a partial patch, e.g. { title: '...' } or { status: 'published' }.
// Fetches the current row first so validateForSave always sees the full
// resulting Practice, not just the changed fields in isolation -- a
// status-only change (publish/unpublish/archive below) still gets the
// full canPublish check against the Practice as it actually stands.
export async function updateOfficialPractice(id, changes) {
  if (!supabase || !id) return { data: null, error: { code: 'invalid_data', message: '缺少 Practice id。' } }

  const { data: currentRow, error: fetchError } = await supabase.from('practices').select('*').eq('id', id).single()

  if (fetchError || !currentRow) {
    return { data: null, error: mapSupabaseError(fetchError) || { code: 'not_found', message: '找不到這個 Practice（或沒有讀取權限）。' } }
  }

  const merged = { ...fromPracticeRow(currentRow), ...changes }

  const validation = validateForSave(merged)
  if (!validation.ok) return { data: null, error: validation.error }

  const { data, error } = await supabase.from('practices').update(toPracticeRow(changes)).eq('id', id).select().single()

  return { data: data ? fromPracticeRow(data) : null, error: mapSupabaseError(error) }
}

// status transitions -- thin wrappers over updateOfficialPractice, so
// they get the exact same fetch-merge-validate behavior for free. No
// delete function exists here on purpose (see schema_practices.sql --
// there is no delete policy for anyone, including admin, via the normal
// client): archived is the only "down" state, nothing is ever removed.
export async function publishOfficialPractice(id) {
  return updateOfficialPractice(id, { status: 'published' })
}

export async function unpublishOfficialPractice(id) {
  return updateOfficialPractice(id, { status: 'draft' })
}

export async function archiveOfficialPractice(id) {
  return updateOfficialPractice(id, { status: 'archived' })
}
