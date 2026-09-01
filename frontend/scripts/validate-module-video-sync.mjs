// Module Video Sync validation.
//
// Compares each Module's data/modules.js videoReference (provider +
// videoId) against its .md file's Primary Video Provider/URL -- the two
// are meant to be kept in sync manually (see docs/course-system/
// content-schema.md's Primary Video / Previous Source rules), and this
// is the safety net that catches drift instead of relying on someone
// noticing. Previous Source is historical and never compared.
//
// Deliberately not a general Markdown parser: only locates the text
// between "Primary Video" and whichever comes first of "Previous
// Source" or the next "### " heading, then reads the first Provider:/
// URL: pair inside that slice.
//
// Usage: npm run validate:module-video (from frontend/)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import modules from '../src/data/modules.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(__dirname, '../src/content/modules')

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

let hasMismatch = false

for (const module of modules) {
  const filePath = path.join(contentDir, `${module.slug}.md`)

  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${module.id} (${module.slug}) — .md file not found at ${filePath}`)
    hasMismatch = true
    continue
  }

  const markdown = fs.readFileSync(filePath, 'utf-8')
  const primaryVideo = parsePrimaryVideo(markdown)

  if (!primaryVideo) {
    console.log(`✗ ${module.id} (${module.slug}) — could not find a Primary Video Provider/URL in .md`)
    hasMismatch = true
    continue
  }

  const expectedProvider = module.videoReference.provider
  const expectedUrl = module.videoReference.videoId
  const actualUrl = expectedProvider === 'youtube' ? extractYouTubeId(primaryVideo.url) : primaryVideo.url

  const providerMatches = primaryVideo.provider === expectedProvider
  const urlMatches = actualUrl === expectedUrl

  if (providerMatches && urlMatches) {
    console.log(`✓ ${module.id} (${module.slug})`)
  } else {
    hasMismatch = true
    console.log(`✗ ${module.id} (${module.slug}) — .md Primary Video does not match data/modules.js videoReference`)
    console.log(`    .md Primary Video:     provider=${primaryVideo.provider}, url=${primaryVideo.url} (compared as ${actualUrl})`)
    console.log(`    data/modules.js value: provider=${expectedProvider}, url=${expectedUrl}`)
  }
}

console.log()

if (hasMismatch) {
  console.error('validate:module-video FAILED — see ✗ above.')
  process.exit(1)
}

console.log('validate:module-video OK — every Module .md Primary Video matches data/modules.js.')
process.exit(0)
