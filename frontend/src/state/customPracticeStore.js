import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

// Custom Practices (Practice Builder → Save), keyed by slug. The slug is
// also the Practice id written to practice_sessions.
//
// Website Refinement M8b: a signed-in member's Custom Practices live in
// Supabase (public.custom_practices, supabase/schema_custom_practices.sql)
// so they follow the member across devices. Visitors keep the original
// single-device localStorage store. On sign-in, syncCustomPractices():
//   1. migrates every localStorage Practice to the database with
//      insert-on-conflict-do-nothing (an existing row wins, so a stale
//      local copy never overwrites a newer cross-device edit), and removes
//      a local copy ONLY after its insert succeeded -- a failed or
//      interrupted migration leaves the local copy in place, so running
//      it again is always safe;
//   2. loads the member's rows into an in-memory cache.
// Reads stay synchronous (getCustomPractice / getAllCustomPractices read
// the cache plus any not-yet-migrated local copies); components re-render
// through useCustomPractices() when the cache changes.
const STORAGE_KEY = 'joti:custom-practices'
const TABLE = 'custom_practices'
const DESCRIPTION = '由學員自由組課建立的練習。'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable (e.g. private browsing) -- a visitor's
    // built Practice simply won't persist.
  }
}

function removeLocal(slug) {
  const all = readAll()
  if (!(slug in all)) return
  delete all[slug]
  writeAll(all)
}

function rowToPractice(row) {
  return {
    id: row.id,
    slug: row.id,
    title: row.title,
    chineseTitle: row.title,
    difficulty: 'Beginner',
    description: DESCRIPTION,
    isCustom: true,
    modules: row.modules,
    builderSections: row.builder_sections ?? undefined,
    relaxationPosition: row.relaxation_position ?? undefined
  }
}

function practiceToRow(practice, userId) {
  return {
    user_id: userId,
    id: practice.slug,
    title: practice.chineseTitle || practice.title,
    modules: practice.modules,
    builder_sections: practice.builderSections ?? null,
    relaxation_position: practice.relaxationPosition ?? null
  }
}

// ---- in-memory server cache -------------------------------------------
let cacheUserId = null
let cache = new Map()
let cacheReady = false
let syncPromise = null
let version = 0
const listeners = new Set()

function notify() {
  version += 1
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getVersion() {
  return version
}

export function syncCustomPractices(userId) {
  if (!supabase || !userId) {
    if (cacheUserId !== null || cache.size > 0) {
      cacheUserId = null
      cache = new Map()
      cacheReady = false
      notify()
    }
    return Promise.resolve()
  }

  if (cacheUserId === userId && (cacheReady || syncPromise)) {
    return syncPromise || Promise.resolve()
  }

  cacheUserId = userId
  cache = new Map()
  cacheReady = false
  notify()

  const run = (async () => {
    for (const practice of Object.values(readAll())) {
      const { error } = await supabase
        .from(TABLE)
        .upsert(practiceToRow(practice, userId), { onConflict: 'user_id,id', ignoreDuplicates: true })
      if (!error) removeLocal(practice.slug)
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select('id, title, modules, builder_sections, relaxation_position, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (cacheUserId !== userId) return
    if (!error && Array.isArray(data)) {
      cache = new Map(data.map((row) => [row.id, rowToPractice(row)]))
    }
    cacheReady = true
    syncPromise = null
    notify()
  })()

  syncPromise = run
  return run
}

// Saves (creates or overwrites by slug). Signed-in: database first, and
// the local copy (if any) is only removed once that write succeeded.
// Returns { error } -- null on success.
export async function saveCustomPractice(practice, userId) {
  if (supabase && userId) {
    const { error } = await supabase.from(TABLE).upsert(practiceToRow(practice, userId), { onConflict: 'user_id,id' })
    if (error) return { error }
    removeLocal(practice.slug)
    if (cacheUserId === userId) {
      cache = new Map(cache)
      cache.set(practice.slug, { ...practice, description: DESCRIPTION, isCustom: true })
      notify()
    }
    return { error: null }
  }

  const all = readAll()
  all[practice.slug] = practice
  writeAll(all)
  notify()
  return { error: null }
}

export function getCustomPractice(slug) {
  return cache.get(slug) || readAll()[slug] || null
}

export function getAllCustomPractices() {
  const merged = new Map(cache)
  for (const practice of Object.values(readAll())) {
    if (!merged.has(practice.slug)) merged.set(practice.slug, practice)
  }
  return [...merged.values()]
}

export function isCustomPracticeSlug(slug) {
  return typeof slug === 'string' && slug.startsWith('custom-')
}

// Re-renders the caller whenever the cache changes and starts the sync
// for the current member. `ready` is false while auth is still resolving
// or a signed-in member's cache has not loaded yet -- callers use it to
// avoid showing "not found" for a Practice that is about to arrive.
export function useCustomPractices() {
  const { user, loading } = useAuth()
  const userId = user?.id || null
  useSyncExternalStore(subscribe, getVersion)

  useEffect(() => {
    if (loading) return
    syncCustomPractices(userId)
  }, [userId, loading])

  const ready = !loading && (!userId || (cacheUserId === userId && cacheReady))
  return { practices: getAllCustomPractices(), ready, signedIn: Boolean(userId) }
}

export function generateCustomPracticeSlug() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
