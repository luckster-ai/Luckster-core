# ADR 0003: Learning Asset Identity and Prerequisite Validation Model

**Status:** Accepted — finalized following Sprint 8.0A–8.2; implementation partially predates this decision (see Consequences)

---

## Context

Sprint 8.0A–8.2 designed and implemented a Practice Prerequisite Engine (`frontend/src/utils/prerequisiteEngine.js`) that collects, recursively resolves, and deduplicates prerequisites across Foundation Lessons and Modules. That implementation used **slugs** as the reference and lookup key throughout — `data/modules.js` and `data/foundations.js`'s `prerequisites` arrays store slugs (e.g. `'1-deep-long-breath'`, `'easy-pose'`), and the engine resolves slug-to-slug.

Separately, real content review during Sprint 8.1–8.2 surfaced two unresolved ambiguities in actual Learning Asset Markdown:

1. Several Modules (`asana01-surya-kriya.md`, `med01`/`med02`/`med03-kirtan-kriya-*.md`) listed a bare `FD008 Mudras` reference *alongside* specific `FD008-L0X` Lesson references in the same Prerequisites list — redundant or ambiguous.
2. Several individual mudra Lessons (`knowledge-seal.md`, `patience-seal.md`, `sun-life-seal.md`, `buddhi-mudra.md`) listed their own parent `FD008 Basic Mudras` as their sole prerequisite — read as circular (a Lesson requiring its own container) under the model assumed at the time.

This ADR resolves both: it establishes ID as the canonical identity going forward, and clarifies that a bare multi-lesson Foundation ID refers to that Foundation's own **Introduction Lesson** (which shares the Foundation's ID), not "all Lessons in the Foundation." This retroactively explains why `8-mudras.md` (unlike `5-sit-pose.md` and `7-prepare.md`) has always carried its own Duration, Video, and Learning Outcomes at the container level — it was never an inconsistency; `FD008` names a real Introduction Lesson that simply hadn't been modeled as such in Runtime Data yet.

## Decision

**1. Learning Asset Identity.** ID (e.g. `FD001`, `FD005-L02`, `MM001`, `P001`) is the canonical, authoritative identity for every Learning Asset and Practice. IDs are the reference used by Prerequisites, Runtime Data internal relationships, future Learner Status, and internal architecture logic generally. Slugs are explicitly **not** identity — their role is limited to routing, URLs, and Markdown filenames. Titles are for display only.

**2. Prerequisite Authoring Format.** Prerequisites are always authored as `<ID> <English Title>` — the ID is canonical; the title exists only for content-author readability and is never used to resolve the reference.

**3. Multi-Lesson Foundations and Introduction Lessons.** A multi-lesson Foundation may have its own Introduction Lesson, sharing the Foundation's own ID (e.g. `FD008` for Basic Mudras' introduction). That Introduction Lesson is itself a valid, directly-referenceable Learning Asset. A bare Foundation ID **never** means "all Lessons inside the Foundation" — specific Lessons must always be referenced by their own Lesson ID (e.g. `FD008-L03`).

**4. Module Identity.** One video equals one Module equals one canonical ID. The same video is never duplicated into a second Module merely because it could also be categorized differently.

**5. Module Categories.** Most Modules belong to exactly one Category. A small number of Modules that genuinely serve multiple purposes (e.g. a short Breathing Meditation serving both Warm-up and Meditation) may legitimately carry multiple Categories. This never creates a second Module — Category is descriptive metadata, not part of Module identity.

Formally, combining this with Decision 1 and Decision 4: **one Module = one Learning Asset = one canonical ID = one Markdown file**, regardless of how many Categories it belongs to. Multi-category support requires no change to how a Module is identified, referenced, or resolved anywhere else in the system, precisely because identity was already separated from every descriptive attribute (including Category) by Decision 1:

- **Prerequisites** (Decision 2) reference Modules by ID. A multi-category Module is referenced exactly the same way as a single-category one — Category plays no role in resolving a Prerequisite.
- **Learner Status** is keyed by canonical ID (see `frontend/src/utils/learnerStatus.js`). A multi-category Module has exactly one completion state, not one per Category it belongs to — completing it once satisfies it wherever it's shown, consistent with it being one Learning Asset.
- **Category** is purely a display/browsing concern — e.g. a future Module Library may list the same Module under both its Warm-up and Meditation views, but every such view points at the same ID, the same Markdown file, and the same Learner Status entry.

The canonical multi-value authoring format and Runtime Data shape are now defined in `module-metadata.md` (Sprint 8.3 Pre-Implementation): a single Category keeps the existing bare-line format unchanged; multiple Categories use a `- ` bullet list, one per line, mirroring the Prerequisites list convention; the Runtime Data target shape is `categories: string[]` (plural, always an array), replacing the singular `category: string` field. Defining this format is a documentation decision only — no Learning Asset content or Runtime Data has been migrated to it yet (see Consequences).

See `practice-builder.md`'s Composition Validation for how the existing "no duplicate Module" Practice rule already resolves the case of a multi-category Module being discoverable from more than one Practice Builder section — it does not require a new rule, since Module identity (not Category) is what that validation was already keyed on.

**6. Practice Ordering.** If a Practice already contains a prerequisite Learning Asset, that occurrence satisfies the dependency only if it appears **earlier** in the Practice sequence than the Module that depends on it. Prerequisite validation is therefore two stages: **Presence Validation** (is it satisfied at all, per Learner Status or by appearing in this Practice) and **Sequence Validation** (if satisfied by appearing in this Practice, does it appear before the dependent Module).

**7. Content Authoring Documentation.** These rules are recorded in `frontend/src/content/template.md` (the Learning Asset authoring guide) so future content authors apply them without ambiguity, in addition to their formal definition in `content-schema.md`.

## Rationale

- IDs already existed as a parallel identifier alongside slugs (`naming-convention.md`), but nothing previously stated which one governs when a logical decision must be made about "which Learning Asset is this." Leaving that implicit is exactly the kind of ambiguity this project has repeatedly had to clean up after the fact (e.g. the `docs/course-content` vs `frontend/src/content` divergence, ADR 0002).
- The Introduction Lesson clarification (Decision 3) isn't a new concept invented for this ADR — it matches content that already exists (`8-mudras.md`'s own Duration/Video/Learning Outcomes) and resolves a real ambiguity found in real Prerequisites text, rather than requiring content authors to restructure anything.
- Decision 6 (Practice Ordering) extends `practice-builder.md`'s already-existing "Sequence Validation" category (previously scoped only to Relaxation-after-Asana) rather than introducing a new validation concept — consistent with this project's standing "one document owns one concept" principle.

## Consequences

**Positive:**

- Resolves two genuine, previously-flagged content ambiguities (the redundant bare-Foundation-plus-specific-Lesson references, and the seemingly-circular mudra Lesson self-references) without requiring any Learning Asset to be rewritten.
- Gives Sprint 8.3 and beyond an unambiguous rule for what a bare multi-lesson Foundation ID means, closing a gap the Sprint 8.2 prerequisite engine had to guess around.

**Trade-offs / known conflicts with existing implementation (not resolved by this ADR):**

- **Sprint 8.2's prerequisite engine and Runtime Data use slugs, not IDs**, directly at odds with Decision 1. `data/foundations.js` and `data/modules.js`'s `prerequisites` arrays, and `prerequisiteEngine.js`'s resolution logic, all key on slug. This ADR does not migrate them — that is future implementation work, tracked here so it isn't lost.
- **Sprint 8.2's engine treated bare `FD008`-style references as non-resolving and silently dropped them**, since at the time no Runtime Data Lesson existed with a bare `FD008` slug. Under Decision 3, this was incorrect — `FD008 Basic Mudras` is a valid Introduction Lesson reference. Every Module that referenced it (`asana01-surya-kriya`, `med01`, `med02`, `med03`) has therefore had that prerequisite silently omitted from prerequisite collection results since Sprint 8.2. This needs correcting once the Introduction Lesson is modeled in Runtime Data.
- **No Introduction Lesson entry exists in Runtime Data for `FD008`** — `data/foundations.js`'s `FD008` object has a `lessons[]` array containing only the 8 named mudras; the Introduction Lesson's own data (Duration `0:49`, video `e70HdrXW7bs`) has never been synced as its own lesson entry.
- **Decision 6 (Sequence Validation) is not implemented.** The Sprint 8.2 engine performs Presence-style collection only; it has no concept of Practice-internal ordering yet.
- **`module-library.md`, referenced by both `content-schema.md` and `module-metadata.md` as the canonical home for Module Category rules, does not exist.** This predates this ADR but is newly relevant given Decision 5's multi-category rule now needs a documented home for its full enumeration.
- **The canonical multi-Category authoring format and Runtime Data shape are now defined (`module-metadata.md`), but not yet implemented.** No existing Module Markdown or `data/modules.js` entry uses the multi-value format yet — every current Module remains single-Category. `ModulePage.jsx` also currently renders each Module's raw Markdown Basic Information block unstripped (unlike Foundation/Lesson pages, which use `stripMarkdownSection`), so the first multi-Category Module's `- ` list will render as-authored on the public Module page until that is addressed — implementation work, not covered by this ADR.

## Future Considerations

- Migrate `prerequisites` arrays and the prerequisite engine from slug-based to ID-based resolution (Decision 1).
- Model each multi-lesson Foundation's Introduction Lesson explicitly in Runtime Data, starting with `FD008`.
- Re-run prerequisite collection for `asana01-surya-kriya`, `med01`, `med02`, and `med03` once the Introduction Lesson exists, to confirm it's no longer silently dropped.
- Implement Sequence Validation (Decision 6) in the prerequisite engine.
- Decide whether `module-library.md` should finally be created, or whether its referenced content should be folded into `module-metadata.md` directly.
- Migrate `data/modules.js`'s `category` field to the canonical `categories: string[]` shape (and update all consumers, e.g. `ModuleCard.jsx`'s `類別：{module.category}` display), and author the first genuinely multi-category Module's Markdown using the new list format — the format itself is already defined (`module-metadata.md`); this is the remaining implementation step, no longer blocked on a future design decision.

---

## Related Documents

- `docs/course-system/naming-convention.md` — ID vs. Slug definitions
- `docs/course-system/content-schema.md` — Shared Fields, Prerequisites authoring format
- `docs/course-system/module-metadata.md` — Category field
- `docs/course-system/practice-builder.md` — Sequence Validation
- `frontend/src/content/template.md` — Content Authoring Guide
