# CLAUDE.md

# JOTI Platform - Claude Code Guide

This document provides a quick overview for AI-assisted development.

For complete engineering standards, always refer to:

> `docs/development/engineering-guide.md`

---

# Project Summary

JOTI is a responsive web application designed to make Kundalini Yoga simple, accessible, and enjoyable.

The current goal is to build a stable MVP before expanding to additional features.

Current priorities include:

- Responsive Web App
- Foundation modules
- Module Library
- Membership system
- PWA-ready architecture

Always prioritize stability, simplicity, and maintainability.

---

# Repository Structure

Main directories:

```text
docs/
frontend/

README.md
CLAUDE.md
```

Documentation:

```text
docs/

├── ai/
├── brand/
├── course-content/
├── course-system/
├── development/
└── website/
```

Implementation:

```text
frontend/

components/
pages/
router/
data/
assets/
```

For repository organization, refer to the Engineering Guide.

---

# AI Workflow

Before making changes:

1. Understand the task.
2. Review the existing implementation.
3. Follow the existing architecture.
4. Reuse existing components whenever possible.

Development workflow:

```text
Understand

↓

Plan

↓

Implement

↓

Review

↓

Document

↓

Commit
```

Avoid making unrelated changes.

Keep each task focused.

---

# Coding Principles

Always write code that is:

- Readable
- Consistent
- Maintainable
- Simple

Prefer:

- Small components
- Reusable code
- Clear naming
- Incremental improvements

Avoid:

- Over-engineering
- Unnecessary abstractions
- Large unrelated refactors

For complete coding standards, refer to the Engineering Guide.

---

# Git Workflow

Each commit should represent one logical improvement.

Typical workflow:

```bash
git status

git add .

git commit -m "Describe the primary change"

git push origin main
```

Commit frequently.

Keep commit messages clear and concise.

---

# Documentation

Documentation is part of the project.

Whenever architecture or important behavior changes:

- Update related documentation.
- Keep documentation consistent with implementation.

Engineering Guide is the primary engineering reference.

README provides the project overview.

CLAUDE.md is the quick reference for AI development.

---

# Working Principles

When solving problems:

- Prefer the simplest solution.
- Respect the existing architecture.
- Keep changes focused.
- Preserve project consistency.
- Do not introduce unnecessary complexity.

If multiple solutions are possible, choose the one that best fits the existing project.

---

# Final Reminder

Before implementing new features:

- Read the relevant documentation.
- Understand the existing code.
- Follow the Engineering Guide.
- Make one logical improvement at a time.

The goal is to build a stable, maintainable, and consistent platform.