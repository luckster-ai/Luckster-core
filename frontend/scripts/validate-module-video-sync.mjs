// Module Video Sync validation.
//
// Two layers, run from frontend/:
//
//   npm run validate:module-video          offline checks only (default)
//   npm run validate:module-video:audit    offline checks + live Bunny audit
//
// ---------------------------------------------------------------------------
// Offline checks (always run, no network, safe as a pre-commit / CI gate)
// ---------------------------------------------------------------------------
//
//   1. Primary Video sync -- each Module's data/modules.js videoReference
//      (provider + videoId) must match its .md file's Primary Video
//      Provider/URL. The two are kept in sync manually (see docs/
//      course-system/content-schema.md) and this is the safety net that
//      catches drift. Previous Source is historical and never compared.
//
// Duration is deliberately NOT part of this layer. Module .md files no
// longer carry a "Duration:" field at all (removed 2026-09) -- duration
// is authored exactly once, as data/modules.js's `duration` (seconds),
// and its correctness against the real video is the Bunny audit's job
// below, not an offline text-vs-text comparison. See
// docs/course-system/content-schema.md and frontend/src/content/
// template.md for the current authoring contract.
//
// ---------------------------------------------------------------------------
// Bunny audit (opt-in via --audit, needs network)
// ---------------------------------------------------------------------------
//
//   2. Availability -- fetch each bunny videoReference's HLS playlist and
//      confirm it still exists. A definitive 404/410 fails the run (catches
//      "videoReference points at a video that was deleted / re-uploaded
//      under a new GUID"). A network error / timeout / 5xx is reported as
//      UNVERIFIED, never as missing, and does not fail the offline checks
//      -- a flaky connection must not look like a broken video.
//
//   3. Duration drift -- sum the media playlist's #EXTINF values (the real
//      encoded length) and compare with module.duration. Anything beyond
//      DURATION_TOLERANCE_SECONDS is flagged so the recorded value can be
//      re-synced from Bunny (still a manual copy-in -- this script only
//      reports the drift, it never writes to data/modules.js).
//
// Bunny's "Block direct url file access" rejects requests with no Referer,
// so every request here sends one (any https Referer satisfies it; see the
// 2026-08-21 Bunny pilot progress note). No Bunny AccessKey / API is
// needed -- the public HLS manifest already carries the duration.
//
// Deliberately not a general Markdown parser: it only locates the text
// between "Primary Video" and whichever comes first of "Previous Source"
// or the next "### " heading, then reads the first Provider:/URL: pair.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import modules from '../src/data/modules.js'
import { formatVideoDuration } from '../src/utils/formatDuration.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(__dirname, '../src/content/modules')

const AUDIT = process.argv.includes('--audit')

// Any https Referer unblocks Bunny's direct-URL protection; this is just a
// stable, real value to send. Not a secret, not deploy-specific behaviour.
const BUNNY_REFERER = 'https://frontend-joti2.vercel.app/'
const REQUEST_TIMEOUT_MS = 10000
const FETCH_ATTEMPTS = 3
const DURATION_TOLERANCE_SECONDS = 2

function extractLabeledValue(block, label) {
  const labelIndex = block.indexOf(label)
  if (labelIndex === -1) return null

  const after = block.slice(labelIndex + label.length)
  const line = after
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0)

  return line || null
}

// YouTube's videoReference.videoId is the bare video ID (see
// content-schema.md's own example: { provider: 'youtube', videoId:
// 'abc123XYZ' }), while the .md URL is the full watch URL a human
// actually clicks -- both are correct, just different representations
// of the same video, so YouTube needs its ID extracted before
// comparing. Bunny's videoId is already the full HLS URL (matches the
// .md URL verbatim), so it needs no extraction.
function extractYouTubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : url
}

function parsePrimaryVideo(markdown) {
  const primaryIndex = markdown.indexOf('Primary Video')
  if (primaryIndex === -1) return null

  const afterPrimary = markdown.slice(primaryIndex)
  const previousSourceIndex = afterPrimary.indexOf('Previous Source')
  const headingMatch = afterPrimary.slice(1).match(/\n### /)
  const headingIndex = headingMatch ? headingMatch.index + 1 : -1

  const boundaries = [previousSourceIndex, headingIndex].filter((index) => index !== -1)
  const end = boundaries.length > 0 ? Math.min(...boundaries) : afterPrimary.length
  const block = afterPrimary.slice(0, end)

  const provider = extractLabeledValue(block, 'Provider:')
  const url = extractLabeledValue(block, 'URL:')

  if (!provider || !url) return null

  return { provider: provider.toLowerCase(), url }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Returns one of:
//   { ok: true, body }            -- HTTP 200, body is the text
//   { missing: true, status }     -- definitive 404 / 410
//   { unverified: true, reason }  -- network error / timeout / other status
//                                    after all attempts (never "missing")
async function fetchManifest(url) {
  let reason = 'unknown error'

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Referer: BUNNY_REFERER },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })

      if (response.status === 404 || response.status === 410) {
        return { missing: true, status: response.status }
      }

      if (response.ok) {
        return { ok: true, body: await response.text() }
      }

      reason = `HTTP ${response.status}`
    } catch (error) {
      reason = error.name === 'TimeoutError' ? `timeout after ${REQUEST_TIMEOUT_MS}ms` : error.message
    }

    if (attempt < FETCH_ATTEMPTS) await sleep(500 * attempt)
  }

  return { unverified: true, reason }
}

function sumExtinfSeconds(mediaPlaylist) {
  let total = 0
  for (const line of mediaPlaylist.split('\n')) {
    const match = line.match(/^#EXTINF:([\d.]+)/)
    if (match) total += Number(match[1])
  }
  return total
}

// { seconds } | { missing: true } | { unverified: true, reason }
async function getBunnyDuration(playlistUrl) {
  const master = await fetchManifest(playlistUrl)
  if (master.missing) return { missing: true }
  if (master.unverified) return master

  const mediaLine = master.body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#') && line.endsWith('.m3u8'))

  if (!mediaLine) {
    return { unverified: true, reason: 'master playlist has no media playlist entry' }
  }

  const media = await fetchManifest(new URL(mediaLine, playlistUrl).toString())
  if (media.missing) return { missing: true }
  if (media.unverified) return media

  if (!media.body.includes('#EXT-X-ENDLIST')) {
    return { unverified: true, reason: 'media playlist not finalised (no #EXT-X-ENDLIST)' }
  }

  return { seconds: sumExtinfSeconds(media.body) }
}

async function run() {
  let hasError = false
  let hasUnverified = false

  for (const module of modules) {
    const label = `${module.id} (${module.slug})`
    const filePath = path.join(contentDir, `${module.slug}.md`)

    if (!fs.existsSync(filePath)) {
      console.log(`✗ ${label} — .md file not found at ${filePath}`)
      hasError = true
      continue
    }

    const markdown = fs.readFileSync(filePath, 'utf-8')
    const problems = []

    // --- Check 1: Primary Video sync ---
    const primaryVideo = parsePrimaryVideo(markdown)
    if (!primaryVideo) {
      problems.push('could not find a Primary Video Provider/URL in .md')
    } else {
      const expectedProvider = module.videoReference.provider
      const expectedUrl = module.videoReference.videoId
      const actualUrl =
        expectedProvider === 'youtube' ? extractYouTubeId(primaryVideo.url) : primaryVideo.url

      if (primaryVideo.provider !== expectedProvider || actualUrl !== expectedUrl) {
        problems.push(
          'Primary Video mismatch\n' +
            `      .md:             provider=${primaryVideo.provider}, url=${primaryVideo.url}\n` +
            `      data/modules.js: provider=${expectedProvider}, url=${expectedUrl}`
        )
      }
    }

    // --- Check 2 + 3: Bunny audit (opt-in) ---
    if (AUDIT && module.videoReference.provider === 'bunny') {
      const result = await getBunnyDuration(module.videoReference.videoId)

      if (result.missing) {
        problems.push(`Bunny video does not exist (HLS playlist returned 404)\n      ${module.videoReference.videoId}`)
      } else if (result.unverified) {
        console.log(`? ${label} — Bunny check UNVERIFIED: ${result.reason}`)
        hasUnverified = true
      } else {
        const actual = Math.round(result.seconds)
        const drift = actual - module.duration
        if (Math.abs(drift) > DURATION_TOLERANCE_SECONDS) {
          problems.push(
            'Bunny duration drift\n' +
              `      Bunny actual:    ${actual}s (${formatVideoDuration(actual)})\n` +
              `      recorded:        ${module.duration}s (${formatVideoDuration(module.duration)})\n` +
              `      difference:      ${drift > 0 ? '+' : ''}${drift}s`
          )
        }
      }
    }

    if (problems.length === 0) {
      console.log(`✓ ${label}`)
    } else {
      hasError = true
      for (const problem of problems) {
        console.log(`✗ ${label} — ${problem}`)
      }
    }
  }

  console.log()

  if (hasError) {
    console.error('validate:module-video FAILED — see ✗ above.')
    process.exit(1)
  }

  if (hasUnverified) {
    console.error(
      'validate:module-video: offline checks passed, but some Bunny checks were UNVERIFIED (network). Re-run the audit.'
    )
    process.exit(2)
  }

  console.log(
    AUDIT
      ? 'validate:module-video OK — .md Primary Video ↔ data/modules.js in sync, every Bunny video reachable and duration within tolerance.'
      : 'validate:module-video OK — every Module .md Primary Video matches data/modules.js.'
  )
  process.exit(0)
}

run()
