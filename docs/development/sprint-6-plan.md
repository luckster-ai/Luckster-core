# Sprint 6 Plan

**Project:** JOTI – Kundalini ABC Yoga

**Sprint:** 6

**Status:** Planning

---

# Sprint Goal

Implement the first production-ready learning entry experience based on the approved product specification.

Sprint 6 focuses on transforming the website into a learner-centered platform by aligning the implementation with:

- Product Design Principles
- Website Sitemap
- User Journey

The goal is not to introduce new functionality, but to establish a clear and intuitive learning entry point for every learner.

---

# Sprint Objective

By the end of Sprint 6, a first-time visitor should naturally understand:

- what JOTI is
- where to begin
- how to start learning
- how to begin practicing

without needing additional explanation.

---

# Scope

Sprint 6 includes the implementation of the new navigation and learning entry architecture.

The implementation should remain consistent with the approved product documents.

---

# Deliverables

## Homepage

The homepage becomes the primary entry point into JOTI.

It should contain:

- Hero
- Courses section
- About
- External Links

The homepage should no longer function as a long content page.

Instead, it guides learners toward the next meaningful action.

---

## Hero Section

The Hero introduces JOTI and provides one primary call-to-action.

Primary CTA:

Enter Courses

Selecting this CTA should smoothly scroll the learner to the Courses section on the same page.

It is **not** a separate route.

> **Amendment (2026-08-25):** The Hero's primary CTA described above has
> since been removed as a formal product decision, independent of this
> Sprint's original scope. The Courses section itself is unaffected and
> remains reachable further down the homepage (see `CoursesSection.jsx`,
> `id="courses"`) — only the Hero-level entry point into it no longer
> exists. This note preserves the original Sprint 6 decision as historical
> context rather than rewriting it; see the Acceptance Criteria section
> below for the corresponding update.

---

## Courses Section

The Courses section becomes the primary learning gateway.

It contains two learning paths:

- Foundation
- Start Practice

Each path should clearly explain its purpose before navigation.

---

## Foundation

The Foundation section should connect to the existing Foundation experience.

No content changes are included in this sprint.

Only the entry experience is updated.

---

## Start Practice

Create a dedicated Start Practice page.

The page becomes the primary destination for returning learners.

Recommended Practices should appear first.

Additional Practice sections may include:

- Beginner
- Energy
- Relaxation
- Breath & Meditation

These sections exist on the same page.

No additional navigation layer should be introduced.

---

## Build Your Own Practice

The Start Practice page includes a single entry into:

Build Your Own Practice

This page leads learners into the existing Module Library.

The Module Library remains an advanced tool and should not appear within the primary navigation.

---

## Header

Implement the website header based on the new information architecture.

The navigation should remain simple and learner-focused.

The Module Library should not appear as a primary navigation item.

---

## Footer

Implement the website footer.

The footer may include:

- About
- YouTube
- Facebook
- Contact

---

## Router

Update React Router to match the approved sitemap.

The homepage remains:

/

Foundation and Practice become dedicated destinations.

Existing detail pages remain unchanged.

---

## Documentation

Update the Website Structure section within:

docs/development/engineering-guide.md

to match the current product specification.

---

# Out of Scope

Sprint 6 does **not** include:

- Membership
- Login
- User Profile
- Pricing
- Payment
- Firebase
- Backend
- AI Coach
- Community
- Practice Calendar
- Progress Tracking
- Achievements
- Mobile App
- PWA

These features belong to future sprints.

---

# Existing Functionality

The following functionality should continue working without modification:

- Foundation detail pages
- Module Library
- Module detail pages
- Practice detail pages
- Existing data model
- Existing Markdown content

Sprint 6 changes the entry experience, not the learning content.

---

# Files Likely to be Modified

Examples include:

- frontend/src/pages/HomePage.jsx
- frontend/src/router/AppRouter.jsx
- frontend/src/components/Header.jsx
- frontend/src/components/Footer.jsx

Additional page components may be added where necessary.

---

# Files That Should Not Change

Sprint 6 should avoid modifying:

- data/
- content/
- markdown/
- course definitions
- Foundation content
- Practice content
- Module content

The learning resources remain unchanged.

---

# Risks

Potential risks include:

- Expanding the sprint beyond navigation
- Introducing unnecessary routes
- Exposing advanced functionality too early
- Breaking existing routes
- Creating inconsistencies with the approved product documents

Any implementation should prioritize simplicity over additional features.

---

# Acceptance Criteria

Sprint 6 is complete when:

✓ The homepage clearly introduces JOTI.

~~✓ Hero provides a clear entry into Courses.~~

~~✓ Enter Courses scrolls to the Courses section.~~

> **Amendment (2026-08-25):** The two criteria above are superseded — the
> Hero CTA was formally removed after this Sprint. Struck through rather
> than deleted, to preserve what was originally decided and accepted. The
> Courses section itself still satisfies the next criterion below; the
> homepage simply no longer offers a Hero-level shortcut into it.

✓ Courses provides Foundation and Start Practice as the two primary learning paths.

✓ Start Practice becomes the main destination for practice.

✓ Recommended Practices appear first.

✓ Practice categories remain on the same page.

✓ Build Your Own Practice becomes the only learner-facing entry into Module Library.

✓ Module Library is removed from the primary navigation.

✓ Header and Footer are fully functional.

✓ Existing Foundation, Module and Practice pages continue to function.

✓ Engineering Guide reflects the new website architecture.

---

# Success Metrics

Sprint 6 succeeds when a first-time visitor can understand the learning journey within a few seconds.

The platform should feel:

- simple
- welcoming
- structured
- learner-centered

rather than content-centered.

---

# Guiding Principle

Sprint 6 is the transition from a prototype website into a true learning platform.

Every implementation decision should support one objective:

Help learners begin practicing Kundalini Yoga as naturally as possible.