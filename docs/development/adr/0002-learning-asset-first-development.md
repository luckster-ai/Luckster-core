# ADR 0002: Learning Asset First Development

**Status:** Accepted — implemented during Sprint 7.3A–7.3C

---

## Context

Prior to this decision, Foundation and Module content existed across three locations:

- `docs/course-content/` — documented as the Single Source of Truth for narrative content, and the only location updated by the Sprint 7.2B documentation cleanup.
- `frontend/src/content/` — the folder actually read at runtime via `import.meta.glob()` in `FoundationPage.jsx`, `ModulePage.jsx`, and `PracticePage.jsx`, but never updated by that same cleanup.
- `frontend/src/data/foundations.js` / `modules.js` — structured field values (id, title, chineseTitle, category, difficulty, duration, videoReference), hand-maintained independently of both Markdown locations.

A repository review (Sprint 7.3A) found these had already diverged: a direct diff of `body-locks.md` in both Markdown locations showed different structures for the same conceptual content, and `med01-kirtan-kriya-18min-guided.md` (docs) vs. `med01-kirtan-kriya-18min.md` (frontend) showed the two locations didn't even agree on the Module's filename. `docs/course-content/` was never read by any running code, meaning the "documented" Single Source of Truth was not the actual source the website rendered from. At the same time, every structured field in `frontend/src/data/*.js` was found to duplicate a value already present in `frontend/src/content/*.md`'s "Basic Information" block, with no field that was ever purely computed at runtime.

## Decision

`frontend/src/content/{foundations,modules}/*.md` becomes the single human-maintained source for each Learning Asset (Foundation or Module). One Markdown file now contains both the structured fields (ID, Title, Chinese Title, Type, Category, Difficulty, Duration, Video Provider/URL, Tags) and the narrative content (Summary, Description, Learning Outcomes, Prerequisites, Resources, Transcript) — the two are no longer split across separate locations.

`frontend/src/data/foundations.js` and `frontend/src/data/modules.js` become Derived Runtime Data: a mirror of the Learning Asset, existing only to support routing, rendering, and calculations that React needs (slug-based lookup, card display, duration math, video playback). They are never hand-authored independently going forward.

Synchronization between the two is performed deliberately by Claude on request, not by an automatic parser or build-time script — a human or AI reads the Learning Asset and updates the Runtime Data to match, reporting the change for review. This preserves a review checkpoint on every content change rather than trusting an unattended parser against loosely-formatted Markdown.

Three schema refinements were finalized alongside this:

- **Summary** replaces the Runtime Data `description` field. It is a distinct, short field for card/search/recommendation display, populated only from a Learning Asset's own Summary section — the long-form Description is never copied into Runtime Data.
- **Tags** becomes a shared Learning Asset field (previously Module-only in `module-metadata.md`), now defined once in `content-schema.md`.
- **Duration display** is standardized as `影片時長：m:ss` (e.g. `影片時長：5:01`) for Foundation and Module video duration, matching the format the Learning Asset itself stores duration in. Practice's total duration display is unaffected, since Practice is not a Learning Asset and its duration is a sum across multiple videos, not one video's length.
- **Slug** continues to equal the Markdown filename with no conversion layer; Foundation slugs may now optionally carry a numeric prefix (e.g. `1-deep-long-breath`), at the content author's discretion.

`docs/course-content/` is retained for historical reference only and is no longer updated.

## Rationale

- The divergence found in Sprint 7.3A was not a hypothetical risk — it had already happened at fewer than 15 files. A model with two authored copies of the same content cannot hold at the hundreds-of-Modules scale the platform is aiming for.
- Every field previously duplicated between `frontend/src/content/*.md` and `frontend/src/data/*.js` was authored text, not a runtime computation — there was no technical reason for two owners to exist.
- A Claude-mediated sync (rather than an automatic frontmatter parser) matches how this project already worked in practice (e.g. Sprint 7.0's manual `videoReference` population) and avoids brittleness against the current loosely-formatted "## Basic Information" convention, while still leaving room for real automation later if content volume ever makes manual sync a bottleneck.
- Separating long Description from a new short Summary removes an ambiguity that existed since `content-schema.md` was first written: the JS `description` field was always documented as "short," but nothing enforced that distinction until Summary was named as its own field.

## Consequences

**Positive:**

- Exactly one authored copy per Learning Asset exists going forward; the SSOT violation identified in Sprint 7.3A is closed at the architecture level.
- `frontend/src/content/template.md` gives content authors a single, accurate template co-located with the files they maintain.
- The Runtime Data / Learning Asset boundary is now explicit in both code (Derived Runtime Data) and documentation (`content-schema.md`, `engineering-guide.md` Principle 8).

**Trade-offs / known risks:**

- Not every existing Learning Asset has been through this synchronization yet. Only Foundation FD001 (`1-deep-long-breath.md`) has a fully reconciled Markdown file; FD002, FD003, and all six Modules still carry pre-existing `summary` values that were never sourced from a Learning Asset Summary section (none of those content files have one yet). These are flagged, not fabricated, but they remain a known gap until each file is updated by the content author.
- `docs/course-content/`'s Foundation/Module/Practice content files themselves were not deleted or reconciled in this decision — only its `README.md` and `template.md` were updated to redirect readers. Full retirement of that folder's content files is future cleanup, not part of this ADR.
- Tags is now a documented shared field, but no `tags` array has been added to `data/foundations.js` or `data/modules.js` yet — this ADR establishes the schema position only; populating Runtime Data with real tag values is separate, future work.

## Future Considerations

- **Populate remaining Learning Assets** — reconcile FD002, FD003, and all Modules into the new single-file structure, adding real Summary sections so their Runtime Data no longer carries pre-Learning-Asset-First placeholder text.
- **Tags data population** — once tag values are authored in each Learning Asset, add a `tags` array to the corresponding Runtime Data entries.
- **`docs/course-content/` retirement** — remove its Foundation/Module/Practice content files once every Learning Asset has been reconciled into `frontend/src/content/`, per the migration strategy already described in Sprint 7.3A.
- **Automation** — if manual sync becomes a bottleneck at higher content volume, a build-time parser could be introduced without changing the Learning Asset / Runtime Data boundary this ADR establishes.

---

## Related Documents

- `docs/course-system/content-schema.md` — Shared Learning Asset field definitions
- `docs/course-system/naming-convention.md` — Slug convention
- `docs/development/engineering-guide.md` — Principle 8, Learning Asset First Development
- `frontend/src/content/template.md` — Learning Asset authoring template
