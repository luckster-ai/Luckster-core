# Website Sitemap

**Project:** JOTI – Kundalini ABC Yoga

**Status:** Current Product Specification

This document defines the current information architecture and navigation structure of the JOTI platform.

It serves as the canonical reference for website structure and should be kept consistent with:

- product-design-principles.md
- navigation.md
- user-journey.md

---

# Purpose

This document defines the website structure from the learner's perspective.

Its purpose is to describe:

- the major entry points of the website
- the learning journey
- the relationship between Foundation, Practice and Module
- which features belong to the core learning experience
- which features are future expansions

This document describes the user experience rather than the technical implementation.

---

# Design Principles

## 1. Simplicity First

A learner should never feel overwhelmed.

The website should present only the options that are relevant to the current step.

Advanced functionality should remain hidden until it is needed.

---

## 2. Learn Before Customize

Most learners want to start practicing immediately.

The website should guide them through a natural learning path before exposing advanced customization features.

---

## 3. Practice-Centered Experience

The website is built around practicing, not browsing content.

Learners come to:

- begin a practice
- build consistency
- improve their awareness

rather than searching for individual videos.

---

## 4. Modules Are Building Blocks

Modules are not the primary learning destination.

They are reusable building blocks that create a complete Practice.

Most learners will never need to browse the Module Library directly.

---

# Homepage

The homepage acts as the main entrance to the JOTI platform.

Main entry points:

- Enter Courses
- Practice Calendar (Future)
- Community (Future)
- About
- External Links

---

# Homepage Structure

Home

├── Enter Courses
├── Practice Calendar (Future)
├── Community (Future)
├── About
└── External Links

External Links

- YouTube
- Facebook
- Other future platforms

---

# Enter Courses

This is the primary learning entrance.

It is designed for both beginners and experienced practitioners.

Structure:

Enter Courses

├── Foundation
└── Start Practice

---

# Foundation

Purpose:

Build the essential knowledge required before regular practice.

Examples:

- Long Deep Breath
- Fire Breath
- Body Lock
- Tune In

Foundation lessons are intended to be freely accessible whenever possible.

---

# Start Practice

This is the primary destination for returning learners.

Structure:

Start Practice

├── Recommended Practices
└── Build Your Own Practice

---

# Recommended Practices

Ready-made practices designed by JOTI.

Practice categories may include:

- Kundalini Yoga
- Breath & Meditation

Categories are intended as a visual organization (for example, different card colors), rather than separate pages.

Each Practice may be:

- Free
- Member Only

Access level is a property of the Practice, not a separate content category.

---

# Build Your Own Practice

Advanced feature.

Allows learners to assemble their own practice using individual Modules.

Flow:

Build Your Own Practice

↓

Module Library

↓

Create Personal Practice

The Module Library should only appear when learners intentionally choose this feature.

It is not a primary navigation destination.

---

# Module Library

Purpose:

Provide reusable practice building blocks.

Typical users:

- experienced learners
- teachers
- learners creating custom practices

Most learners should reach the Module Library through "Build Your Own Practice", rather than from the homepage.

---

# About

Purpose:

Introduce the teacher and the philosophy behind JOTI.

Suggested content:

- Personal story
- Teaching background
- Why JOTI was created
- Teaching philosophy
- Vision

This page builds trust before learners decide to join.

---

# Practice Calendar (Future)

Future feature.

Possible functions:

- Daily practice history
- Practice streak
- 40-day challenge
- 90-day challenge
- 120-day challenge
- 1000-day journey

---

# Community (Future)

Future feature.

Possible functions:

- Discussion
- Practice sharing
- Challenges
- Announcements

---

# External Links

External platforms remain part of the learning ecosystem.

Examples:

- YouTube
- Facebook
- Future podcast
- Newsletter

---

# User Journey

New visitor

↓

Homepage

↓

Enter Courses

↓

Foundation

↓

Start Practice

↓

Recommended Practice

↓

Become Member (Future)

↓

Build Your Own Practice

↓

Module Library

---

# Information Architecture

The learner experiences the website in this order:

Foundation

↓

Practice

↓

Module (only when needed)

Internally, the platform is organized as:

Foundation

↓

Module

↓

Practice

The technical architecture remains unchanged.

Only the user experience differs.

---

# Future Expansion

Future features include:

- Membership
- User Profile
- AI Practice Builder
- AI Recommendations
- Practice Calendar
- Community
- Mobile App
- PWA

These features should extend the existing architecture rather than replacing it.