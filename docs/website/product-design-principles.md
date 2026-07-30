# Product Design Principles

**Project:** JOTI – Kundalini ABC Yoga

**Status:** Version 1.0

---

# Purpose

This document defines the core product design philosophy of JOTI.

It serves as the foundation for every future product decision, including:

- Website architecture
- Navigation
- User experience (UX)
- User interface (UI)
- Information architecture (IA)
- AI features
- Membership system
- Mobile applications

Whenever a new feature is proposed, it should be evaluated against these principles before implementation.

The product philosophy comes before technical implementation.

---

# Vision

JOTI is not simply a video website.

It is a guided Kundalini Yoga learning platform.

The goal is to help learners:

- start practicing with confidence
- build a consistent practice
- reconnect with themselves
- continue practicing for years

The product should always encourage practice, rather than content consumption.

---

# Language & Localization

JOTI is designed as a Chinese-first learning platform.

The primary audience is Chinese-speaking users beginning their Kundalini Yoga journey. Therefore, all user-facing interfaces should prioritize clarity and accessibility in Traditional Chinese.

## Principles

### Chinese First

Chinese is the primary language for all user-facing UI.

Examples include:

- Navigation
- Buttons
- Section titles
- Card titles
- Page titles
- Form labels
- System messages

### English as Secondary

English is used as supporting information where appropriate.

Typical examples include:

- Yoga terminology
- English subtitles
- Technical terminology
- International naming consistency

English should complement the Chinese interface rather than replace it.

### Internal Development Language

To maintain a clean and scalable codebase, all development assets remain in English.

This includes:

- Routes
- URLs
- Slugs
- Filenames
- Component names
- Variable names
- Data structures
- Markdown filenames

Example:

UI

新手必修

↓

Route

/foundations

↓

Component

FoundationPage.jsx

This separation keeps the product accessible to users while preserving a consistent engineering architecture.

### Consistency

Every new feature should follow the same language hierarchy:

Chinese

↓

English (optional)

↓

Internal English architecture

This principle applies across the entire product, ensuring a consistent learning experience as JOTI grows.

---

# Product Consistency

User-facing wording should remain consistent across the platform.

For example:

Navigation

開始練習

↓

Homepage CTA

開始練習

↓

Practice Hub

開始練習

↓

Practice Detail

開始練習

Avoid using multiple labels for the same action (such as "Start Practice", "Enter Course", or other variations) unless there is a clear product reason.

A consistent vocabulary creates a more intuitive learning experience.

---

# Core Philosophy

## Practice Before Content

Learners visit JOTI to practice.

They do not visit to browse videos.

The product should always guide learners toward beginning a practice.

Not toward searching for content.

---

## Continuous Practice

In Kundalini Yoga, a Practice — Tuning In, Warm Up, Kriya, Relaxation, Meditation, Ending — is designed as one complete energetic experience.

Interrupting a Practice breaks that continuity.

A Practice should be completed in one uninterrupted session whenever reasonably possible.

This reflects the integrity of a complete Practice.

It is a teaching philosophy, not merely a technical preference.

Real-life interruptions happen — a call, a lost connection, a closed browser.

The platform should acknowledge this reality without treating interruption as the intended usage pattern.

Completing a Practice continuously is the recommended learning experience.

Interruptions are exceptions, not the intended flow.

This principle should guide, without prescribing implementation today:

- Playback should encourage completing an entire Practice in one sitting.
- Progress tracking should not imply that resuming later is the preferred experience.
- If Resume is ever introduced, it should encourage restarting the Practice rather than immediately continuing from the interruption point — a convenience, not the recommended method.
- Future AI recommendations should encourage continuous Practice whenever appropriate.
- Completion experiences and reminders should reinforce the value of one continuous flow, not normalize stopping partway.

---

## Simplicity First

Every page should answer one question:

"What does the learner need right now?"

If a feature is unnecessary at the current step, it should remain hidden.

Reducing cognitive load is more valuable than exposing every available feature.

---

## Progressive Disclosure

Advanced functionality should appear only when learners are ready.

New learners should see only the essentials.

Experienced learners may gradually discover more powerful tools.

The interface should grow with the learner.

---

# User-Centered Navigation

Navigation should represent the learner's goals.

Not the internal system architecture.

Navigation labels should describe what learners want to do,

rather than how the system is organized internally.

For example:

✔ 開始練習

✔ 建立自己的練習

Instead of:

✘ Practice Library

✘ Module Library (as a primary navigation item)

Users think in actions.

They rarely think in data structures.

---

# Hide Technical Concepts

Learners should never be required
to understand the internal system
before beginning practice.

---

# One Clear Next Step

Every page should naturally guide learners toward their next action.

A learner should never wonder:

"What should I do next?"

Each page should clearly suggest the next meaningful step.

Examples:

Homepage

↓

進入課程

↓

新手必修

↓

開始練習

↓

創建專屬課程

---

# Avoid Unnecessary Layers

Every page should have a clear purpose.

If an intermediate page does not provide additional value, it should not exist.

For example:

Avoid:

Home

↓

Start Practice

↓

Practice Library

↓

Recommended

Instead:

Home

↓

Start Practice

↓

Recommended

Additional navigation depth should only exist when it improves understanding or enables new functionality.

---

# Library Is a Tool

Within JOTI, a "Library" represents a collection of reusable resources.

Libraries are tools.

They are not the primary learning destination.

Examples:

✔ Module Library

Future examples:

- Meditation Library
- Breath Library

A learner should intentionally choose to enter a Library.

Libraries should not become the default homepage experience.

---

# Learning Before Customization

Most learners want guidance.

Only a small percentage want complete freedom.

Therefore:

The product should first provide structured learning.

Customization should become available later.

Recommended flow:

Foundation

↓

Start Practice

↓

Official Practices

↓

Build Your Own Practice

---

# Official Guidance First

JOTI provides professionally designed Practices.

These Practices represent the recommended learning path.

Custom practice building should complement this experience, not replace it.

The platform should encourage learners to trust the official learning journey before creating their own.

---

# Content Organization

Categories help learners discover Practices.

Categories are a visual organization method.

They should not become unnecessary navigation layers.

Examples:

- Kundalini Yoga
- Breath & Meditation
- Beginner
- Energy
- Relaxation

Categories may be represented using:

- card grouping
- section titles
- visual styling

They do not necessarily require separate pages.

---

# Membership Philosophy

Membership is not a separate product.

Membership expands the learner's existing journey.

Access level is a property of content.

Examples:

- Free
- Member Only

Membership should unlock more Practices and features without changing the overall navigation structure.

---

# AI Philosophy

AI should simplify learning.

It should never increase complexity.

The AI assistant should help learners:

- choose a suitable Practice
- answer questions
- recommend the next step
- build personalized practice plans

AI should guide.

Not overwhelm.

---

# Long-Term Product Direction

Future features should naturally extend these principles.

Examples include:

- Practice Calendar
- Community
- AI Coach
- Learning Progress
- Achievements
- Mobile App
- PWA

New features should integrate into the learner's journey rather than creating separate ecosystems.

---

# Decision Checklist

Before implementing any new feature, ask:

1. Does this help learners practice?

2. Is this the simplest possible experience?

3. Does this reduce cognitive load?

4. Does it guide the learner toward the next step?

5. Is it exposing technical concepts unnecessarily?

6. Can this feature appear later instead of immediately?

7. Does it support the existing learning journey?

If the answer to several of these questions is "No", the feature should be reconsidered before implementation.

---

# Guiding Principle

Every product decision should support one simple goal:

Help learners spend less time figuring out the platform,

and more time practicing Kundalini Yoga.

---

# Human Guidance Before Technology

Technology exists to support learning.

It should never become the center of the experience.

Learners should feel guided by JOTI,

not by software.

Every technical decision should strengthen the human learning journey,

rather than showcase technology itself.