// Official Practice Architecture — Phase 1.
//
// Checks every entry in data/practices.js against the same Section
// rules the Practice Builder already enforces interactively (see
// src/utils/validateOfficialPractice.js — no new rule engine lives
// here), plus Module-existence and Bunny-readiness. Run this before
// flipping a Practice's `status` from 'draft' to 'published' (or before
// adding a new one straight to 'published').
//
// Exit code is non-zero only when a *published* Practice fails a
// blocking check: missing Module, invalid Section structure,
// builderSections/modules order mismatch, OR not Bunny-ready (Phase 1
// close-out: a Published Official Practice promises the full continuous
// / immersive playback experience already verified for P001, so every
// Module it uses must actually be on Bunny). A `draft` Practice is
// allowed to fail any of this -- that's the point of drafting -- so its
// failures are reported but don't fail the run.
//
// This Bunny-ready requirement is scoped to Published Official Practices
// only. It has no effect on: a Custom Practice (never validated by this
// script -- Builder/customPracticeStore are untouched), or a single
// Module page (ModulePage/VideoPlayer don't import anything from this
// file). Both keep working with any provider mix, same as before.
//
// Usage: npm run validate:practices  (from frontend/)
import practices from '../src/data/practices.js'
import modules from '../src/data/modules.js'
import { isPublished } from '../src/utils/practiceLifecycle.js'
import { validateOfficialPracticeStructure } from '../src/utils/validateOfficialPractice.js'

let hasBlockingFailure = false

if (practices.length === 0) {
  console.log('No Practices found in data/practices.js.')
}

for (const practice of practices) {
  const published = isPublished(practice)
  const result = validateOfficialPracticeStructure(practice, modules)

  const heading = `${practice.id} (${practice.slug}) — ${published ? 'published' : 'draft'}`
  console.log(`\n${heading}`)
  console.log('-'.repeat(heading.length))

  if (result.missingModuleSlugs.length > 0) {
    console.log(`  ✗ Missing Module slug(s): ${result.missingModuleSlugs.join(', ')}`)
  }

  if (result.missingBuilderSectionIds.length > 0) {
    console.log(`  ✗ builderSections references missing Module ID(s): ${result.missingBuilderSectionIds.join(', ')}`)
  }

  if (!result.isStructurallyValid) {
    result.sectionErrors.forEach((error) => console.log(`  ✗ ${error}`))
  }

  if (result.orderCheck === 'not-applicable') {
    console.log('  · No builderSections on this Practice — modules order not checked against a composition (see practices.js header comment).')
  } else if (result.orderCheck === 'mismatch') {
    console.log('  ✗ modules order does not match builderSections/relaxationPosition:')
    console.log(`      modules:        [${practice.modules.join(', ')}]`)
    console.log(`      expected order: [${result.assembledOrder.join(', ')}]`)
  } else {
    console.log('  ✓ modules order matches builderSections/relaxationPosition.')
  }

  console.log(`  ${result.isBunnyReady ? '✓' : '✗'} Bunny-ready: ${result.isBunnyReady} (all resolved Modules use provider: 'bunny' — required to Publish)`)

  if (result.canPublish) {
    console.log('  ✓ Passes all structural checks.')
  } else {
    console.log('  ✗ Does NOT pass all structural checks.')
  }

  if (published && !result.canPublish) {
    hasBlockingFailure = true
  }
}

console.log()

if (hasBlockingFailure) {
  console.error('validate:practices FAILED — a published Practice has blocking issues (see ✗ above).')
  process.exit(1)
}

console.log('validate:practices OK — no published Practice has blocking issues.')
process.exit(0)
