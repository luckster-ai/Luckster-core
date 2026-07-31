# ADR 0001: Persistent Video Player for Continuous Practice Playback

**Status:** Accepted — implemented and verified during Sprint 7.1

---

## Context

The JOTI Practice Player renders each Module in sequence via `PracticePlayer` → `ModuleRenderer` → `VideoModule` → `VideoPlayer`. Originally, `PracticePlayer` forced React to fully unmount and remount this entire chain on every Module transition, via a `key` prop tied to the current Module's slug.

This caused the underlying YouTube `Player` instance and its iframe to be destroyed and recreated for every Module. Browser testing during Sprint 7.1 confirmed this produced three concrete problems:

- Fullscreen exited on every Module transition, because the browser's Fullscreen API automatically exits fullscreen when the fullscreen element is removed from the document.
- Autoplay did not carry over between Modules — each new player instance loaded in a paused state, requiring the learner to manually press Play again for every Module.
- The Practice, while technically playable start to finish, did not deliver the continuous, uninterrupted session the product's Continuous Practice Principle (see `docs/website/product-design-principles.md`) calls for.

## Decision

`PracticePlayer` no longer forces a remount of the video playback chain between Modules. `VideoPlayer` now creates its underlying YouTube `Player` instance once per Practice session, and on subsequent Module changes calls the YouTube IFrame API's `loadVideoById()` on the existing instance instead of destroying and recreating it.

Responsibilities remain divided exactly as before this decision:

- `PracticePlayer` is responsible only for Practice-level flow — which Module is current, progress, and Practice Complete state. It has no knowledge of video playback mechanics or the video provider.
- `VideoPlayer` is responsible only for provider-specific playback — creating, reusing, and controlling the underlying player. It is the only component aware that YouTube is the current provider.

`ModuleRenderer` and `VideoModule` are unchanged in responsibility: `ModuleRenderer` still decides whether a Module has playable video, and `VideoModule` still exposes a generic `play()`/`pause()` control surface with no knowledge of the provider-specific method names underneath.

## Rationale

- Continuous, uninterrupted playback across an entire Practice is a core product requirement, not a nice-to-have (see the Continuous Practice Principle).
- The lifecycle of the video player should be tied to the Practice session, not to any individual Module — a Module ending is a content change, not a reason to tear down and rebuild the playback surface.
- Reusing a single player instance is what actually preserves fullscreen and autoplay continuity; recreating the player was the direct cause of both problems, not a browser or YouTube limitation.
- Provider-specific logic (`loadVideoById`, `YT.Player`, `PlayerState.ENDED`) stays entirely inside `VideoPlayer`. No other component needed to change to achieve this fix, which confirms the existing provider boundary was already correctly placed before this decision — it didn't need to be introduced by it.
- The same persist-and-swap pattern is not YouTube-specific — Vimeo, Cloudflare Stream, Bunny Stream, and Mux all support loading a new video on an existing player/element rather than requiring a fresh embed per video, so this lifecycle choice does not tie the architecture to YouTube specifically.

## Consequences

**Positive:**

- The Practice now plays uninterrupted from Module 1 through Practice Complete, matching the Continuous Practice Principle.
- Fullscreen, once entered, persists across Module transitions.
- Autoplay continues automatically from Module 2 onward without requiring the learner to press Play again.
- No new component or abstraction was introduced — the fix is contained entirely within `VideoPlayer.jsx`, preserving the existing separation of responsibilities.
- The pattern generalizes to the video providers evaluated for future migration, so this decision does not need to be revisited when the provider changes.

**Trade-offs / known risks:**

- The reason the player must not be destroyed and recreated (autoplay + fullscreen continuity) is not obvious from reading the code alone — it was discovered through browser testing, not derived from documentation. A future change to `VideoPlayer.jsx` made without awareness of this ADR could silently reintroduce both original problems.
- `ModuleRenderer` currently dispatches to `VideoModule` based only on whether a Module has a `videoId`, not on which `provider` is set. This is correct and sufficient while YouTube is the only provider, but provider-dispatch logic does not exist yet — it will need to be added, not merely extended, the first time a second provider is introduced.

## Future Considerations

Documented as anticipated future extensions only. None of the following are implemented today, and none require a redesign of this architecture when they are eventually needed:

- **Provider dispatch** — a mechanism (likely inside `ModuleRenderer` or a new thin layer) to choose between multiple provider-specific player implementations once a second provider exists alongside YouTube.
- **Additional providers** — Vimeo, Cloudflare Stream, Bunny Stream, or Mux, added as new provider-specific implementations analogous to the current `VideoPlayer`, without changing `PracticePlayer`, `ModuleRenderer`'s core structure, or `VideoModule`'s control contract.
- **Playback tokens / authenticated playback** — an additive field on `videoReference` (e.g. a signed token), read only by the relevant provider-specific player.
- **Analytics** — additional playback event callbacks (progress, play, pause) following the same pattern already established by the existing `onEnded` callback.
- **DRM-capable providers** — license negotiation would live entirely inside the relevant provider-specific player; the outer play/pause/onEnded contract would not need to change.

---

## Related Documents

- `docs/website/product-design-principles.md` — Continuous Practice Principle (the product requirement this decision satisfies)
- `docs/development/engineering-guide.md` — general engineering principles
