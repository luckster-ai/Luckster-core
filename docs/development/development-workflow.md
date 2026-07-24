# Development Workflow

Version: 1.0

Status: Active

---

# Purpose

This document defines the standard development workflow for the Luckster-core project.

Its purpose is to ensure that every contributor—human or AI—follows the same engineering process, minimizes unnecessary changes, and keeps the repository stable and maintainable.

This workflow applies to:

- Human developers
- Claude Code
- ChatGPT
- Codex
- Gemini
- Cursor
- Future AI agents

---

# Core Principles

Development should always prioritize:

- Understanding before implementation
- Small and focused changes
- Evidence-based decisions
- Human approval before significant modifications
- Verification before committing
- Consistent documentation

Every change should improve the project without introducing unnecessary complexity.

---

# Standard Workflow

Every development task should follow this sequence.

```
Review

↓

Audit

↓

Plan

↓

Approval

↓

Implementation

↓

Verification

↓

Commit

↓

Push

↓

Backup

↓

Verify
```

No step should be skipped unless explicitly approved.

---

# Step 1 — Review

Before making changes:

- Read relevant documentation.
- Understand the current architecture.
- Understand the project goals.
- Identify affected components.

Never begin coding immediately.

If the implementation is unclear, ask questions first.

---

# Step 2 — Audit

Analyze the current implementation.

Examples:

- Existing code
- Existing documentation
- Repository structure
- Data model
- Routing
- Dependencies

The goal is understanding—not modification.

---

# Step 3 — Plan

Prepare an implementation plan before changing anything.

The plan should include:

- Objective
- Scope
- Files to modify
- Expected outcome
- Risks (if any)

Do not modify files during this stage.

---

# Step 4 — Approval

Wait for approval before implementation.

Approval is required for:

- Code changes
- Documentation changes
- File deletion
- Repository restructuring
- Git history modification

Never assume approval.

---

# Step 5 — Implementation

Implement only the approved scope.

Do not:

- expand the task
- perform unrelated cleanup
- refactor without approval
- introduce new architecture

Keep each Sprint focused.

---

# Scope Control

One Sprint should solve one problem.

Good examples:

- Fix duration formatting
- Update documentation
- Remove unused assets

Poor examples:

- Refactor multiple systems
- Rewrite architecture
- Clean unrelated files

Small changes are easier to review, verify, and maintain.

---

# Step 6 — Verification

Every implementation must be verified.

Typical verification includes:

- npm run lint
- npm run dev
- git diff
- git status

Additional verification may be required depending on the task.

Do not commit code that has not been verified.

---

# Step 7 — Commit

Commit only after successful verification.

Commit messages should be:

- concise
- descriptive
- action-oriented

Examples:

```
Fix Foundation data consistency

Align documentation with Engineering Guide

Remove unused assets and stray artifact
```

Avoid vague messages such as:

```
Update

Cleanup

Fix stuff
```

---

# Step 8 — Push

Push changes only after:

- successful verification
- successful commit

Normally:

```
git push origin main
```

Force push should never be used without investigation and approval.

---

# Step 9 — Backup

After pushing to origin:

Synchronize the backup repository.

Normally:

```
git push backup main
```

If history diverges:

1. Investigate
2. Compare histories
3. Explain findings
4. Obtain approval
5. Use:

```
git push --force-with-lease
```

only when confirmed safe.

Never force-push without evidence.

---

# Step 10 — Verify

Confirm synchronization after backup.

Typical verification:

```
git fetch backup main

git rev-parse main

git rev-parse backup/main
```

Both branches should reference the same commit.

---

# Documentation Workflow

Documentation should evolve together with implementation.

When architecture changes:

- Engineering Guide
- related documentation
- implementation

should remain consistent.

Avoid outdated documentation.

---

# AI Collaboration

AI should act as an engineering collaborator rather than an autonomous developer.

AI should:

- review first
- explain reasoning
- propose plans
- respect approved scope
- avoid assumptions

AI should never perform broad repository changes without approval.

---

# Sprint Philosophy

Each Sprint should have:

- one objective
- limited scope
- clear verification
- complete completion

A Sprint is finished only after:

- verification
- commit
- push
- backup synchronization
- final verification

---

# Engineering Mindset

Prefer:

- clarity over cleverness
- consistency over novelty
- evidence over assumptions
- incremental improvement over large rewrites

The goal is sustainable long-term development.

---

# Related Documents

- README.md
- CLAUDE.md
- Engineering Guide

---

# Version History

## v1.0

- Initial development workflow
- Standard AI collaboration workflow
- Git verification workflow
- Repository synchronization workflow