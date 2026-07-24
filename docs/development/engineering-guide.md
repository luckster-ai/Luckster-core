# Engineering Guide

Version: 1.0  
Status: Active

## Contents

1. Purpose & Project Overview
2. Engineering Principles & Repository Structure
3. Website & Course Architecture
4. Development Workflow & Coding Standards
5. Project Maintenance & Future Development

---

# Part 1 — Purpose & Project Overview

## Purpose

This Engineering Guide defines the engineering principles, development workflow, and project structure of the JOTI platform.

Its purpose is to help maintain a consistent development process as the project grows, ensuring that both human developers and AI assistants follow the same engineering standards.

This document serves as the primary engineering reference for the repository.

---

## Project Overview

JOTI is a digital yoga platform focused on making Kundalini Yoga simple, accessible, and enjoyable.

The platform is built around guided video experiences, allowing members to practice from desktop, tablet, or mobile devices through a single responsive website.

The current goal is to build a stable and maintainable platform before expanding into additional services.

---

## Current Focus

The current development focuses on delivering a working MVP.

Current priorities include:

- Responsive website
- Foundation modules
- Module Library
- Membership system
- PWA-ready architecture
- Stable development workflow

Advanced features such as AI services, books, music, and community features will be developed after the core platform is complete.

---

## Project Scope

The repository contains everything required to build and maintain the JOTI platform.

This includes:

- Source code
- Documentation
- Website architecture
- Course structure
- Development workflow

The repository should remain the single source of truth for the project.

---

# Product Philosophy

JOTI is designed to help people experience Kundalini Yoga through a modern and easy-to-use web platform.

The platform should remain simple, intuitive, and focused on practice.

Technology exists to support the yoga experience, not to become the center of attention.

Whenever making engineering decisions, prefer solutions that are:

- Simple
- Clear
- Maintainable
- Consistent

Long-term maintainability is more important than adding features quickly.

---

## Development Philosophy

Development should progress through small, continuous improvements.

Each feature should:

- Solve a clear problem.
- Keep the codebase understandable.
- Fit naturally into the existing architecture.
- Improve the overall quality of the project.

Avoid unnecessary complexity.

When uncertain, choose the simpler solution.

---

## Repository Principles

The repository should remain:

- Easy to navigate
- Well documented
- Consistent
- Maintainable

Documentation and implementation should evolve together.

Whenever significant changes are made, update the related documentation.

---

## Audience

This guide is intended for:

- Project maintainers
- Future contributors
- AI development assistants
- Anyone participating in the engineering of the JOTI platform

It provides a shared understanding of how the project is organized and developed.

---

## Summary

JOTI is being developed as a responsive web platform for Kundalini Yoga.

The current priority is to build a stable, maintainable MVP with a clear engineering structure.

As the platform grows, this Engineering Guide will continue to evolve while maintaining consistent engineering principles across the project.

# Part 2 — Engineering Principles & Repository Structure

## Engineering Principles

The engineering principles of this project are intended to keep the codebase simple, maintainable, and easy to understand.

When making technical decisions, follow these principles:

### 1. Understand Before Building

Take time to understand the problem before writing code.

Avoid implementing features before their purpose and requirements are clear.

---

### 2. Architecture Before Implementation

Follow the existing project architecture whenever possible.

New features should fit naturally into the current structure instead of introducing unnecessary complexity.

---

### 3. Simplicity

Prefer simple solutions.

Simple code is easier to understand, maintain, and improve.

Avoid unnecessary abstractions or over-engineering.

---

### 4. Consistency

Keep naming, file organization, coding style, and project structure consistent throughout the repository.

Consistency improves readability for both humans and AI assistants.

---

### 5. Reusability

Reuse existing components whenever appropriate.

Before creating something new, consider whether an existing solution can be extended or shared.

---

### 6. Incremental Development

Develop the project through small, manageable improvements.

Each completed step should leave the project in a stable and working state.

---

### 7. Continuous Improvement

Engineering is an ongoing process.

Continue improving the project through review, refactoring, and documentation as the platform evolves.

---

## Repository Structure

The repository is organized to separate documentation, source code, and engineering resources.

Current structure:

```text
Luckster-core/

├── docs/
│   ├── ai/
│   ├── brand/
│   ├── course-content/
│   ├── course-system/
│   ├── development/
│   └── website/
│
├── frontend/
│
├── README.md
└── CLAUDE.md
```

Each directory has a clear responsibility and should remain focused on its intended purpose.

Avoid mixing documentation with implementation files.

---

## Documentation Standards

Documentation is considered part of the project.

Whenever architecture, workflows, or important behavior changes, update the related documentation.

Documentation should be:

- Clear
- Concise
- Consistent
- Easy to maintain

Prefer Markdown for all project documentation.

---

## Naming Conventions

Use descriptive and consistent names.

General guidelines:

- Use lowercase filenames.
- Separate words with hyphens when appropriate.
- Use meaningful directory names.
- Avoid unnecessary abbreviations.

Choose names that remain understandable over time.

---

## File Organization

Each file should have a single, clear responsibility.

Avoid creating large files that contain unrelated functionality.

As the project grows, organize files into logical directories while keeping the overall structure simple.

---

## Single Source of Truth

Avoid duplicating the same information in multiple places.

Each piece of documentation should have one authoritative location.

When changes occur, update the original source instead of creating conflicting copies.

---

## Repository Growth

The repository should evolve gradually.

Add new directories, features, and documentation only when they provide clear value.

Prefer extending the existing structure over reorganizing the repository unnecessarily.

---

## Summary

A well-organized repository makes development easier for both human developers and AI assistants.

Keeping the repository simple, consistent, and well documented helps ensure that the project remains maintainable as it grows.

# Part 3 — Website & Course Architecture

## Website Architecture

JOTI is developed as a responsive web application.

The platform is designed to provide a consistent experience across desktop, tablet, and mobile devices using a single React codebase.

The current architecture focuses on building a stable MVP before expanding to additional features.

Future improvements should extend the existing architecture rather than replace it.

---

## Responsive Web Application

The website should work well on:

- Desktop
- Tablet
- Mobile

The platform is designed to be PWA-ready, allowing users to install the website on supported devices without requiring separate native applications.

A single codebase should support all supported devices.

---

## Website Structure

The website is organized into clear functional sections.

Current structure:

```text
Home

├── Foundation
├── Module Library
├── Membership
└── User Profile
```

Additional features may be added in the future while keeping the overall navigation simple.

---

## Course Architecture

The course system is built from reusable learning components.

Current structure:

```text
Foundation

↓

Module

↓

Practice
```

Each level has a different responsibility.

---

## Foundation

Foundation provides the essential practices for beginning Kundalini Yoga.

These modules introduce the basic skills needed before exploring more complete practices.

Examples include:

- Breathing
- Body Locks
- Basic Meditation

Foundation should remain simple and approachable.

---

## Module

A Module is an individual practice unit.

Each Module normally includes:

- Video
- Title
- Description
- Category
- Duration
- Difficulty

Modules are reusable and can appear in different practices.

---

## Practice

A Practice is a complete yoga session created by combining multiple Modules.

For example:

```text
Tuning In

↓

Warm Up

↓

Asana

↓

Relaxation

↓

Meditation

↓

Ending
```

Practices provide complete guided experiences for members.

---

## Future Expansion

The course architecture is designed to grow gradually.

Future features may include:

- Additional Foundation content
- More Modules
- More Practices

New content should follow the existing structure whenever possible.

---

## Architecture Principles

When expanding the platform:

- Keep the structure simple.
- Prefer reusing existing Modules.
- Avoid unnecessary complexity.
- Maintain a consistent user experience.

Architecture should support long-term maintainability.

---

## Summary

The website is built around a simple and reusable course structure.

By organizing content into Foundations, Modules, and Practices, the platform can continue to grow while remaining easy to understand and maintain.

# Part 4 — Development Workflow & Coding Standards

## Development Workflow

Development should progress through small, manageable steps.

Each stage should be completed before moving to the next.

Recommended workflow:

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

Avoid making large changes without first understanding the problem and the existing architecture.

Whenever possible, keep each change focused on a single purpose.

---

## Development Process

Before implementing a feature:

- Understand the requirements.
- Review the existing architecture.
- Identify reusable components.
- Plan the implementation.

During implementation:

- Keep changes small.
- Follow the project structure.
- Maintain consistent naming.
- Avoid unnecessary complexity.

After implementation:

- Review the result.
- Update documentation if needed.
- Verify that the project remains stable.
- Commit meaningful changes to version control.

---

## AI Collaboration

AI is a development assistant, not a replacement for engineering decisions.

AI can assist with:

- Writing code
- Refactoring
- Explaining concepts
- Reviewing code
- Improving documentation
- Generating project structure

Engineering decisions should remain consistent with the project's architecture and documentation.

When using AI, always prefer solutions that integrate naturally with the existing project.

---

## Working with AI

A typical AI-assisted workflow is:

```text
Understand

↓

Discuss

↓

Plan

↓

Implement

↓

Review

↓

Document
```

When asking AI for assistance:

- Clearly describe the goal.
- Provide relevant project context.
- Keep requests focused.
- Review generated code before accepting it.

AI-generated code should always be treated as a starting point for review.

---

## Coding Standards

Code should be:

- Readable
- Consistent
- Maintainable
- Easy to understand

Prefer clarity over cleverness.

Simple code is usually easier to maintain.

---

## Naming

Choose names that clearly describe their purpose.

General guidelines:

- Use descriptive component names.
- Use consistent naming conventions.
- Avoid unnecessary abbreviations.
- Keep filenames predictable.

Good naming reduces future maintenance costs.

---

## Components

Each component should have a single responsibility.

Prefer creating reusable components instead of duplicating code.

Keep components focused and easy to understand.

---

## Code Organization

Organize code into logical directories.

Separate:

- Components
- Pages
- Router
- Data
- Assets

Avoid placing unrelated functionality inside the same file.

---

## Refactoring

Refactor when it improves:

- Readability
- Maintainability
- Reusability

Avoid refactoring without a clear purpose.

The goal is continuous improvement, not unnecessary change.

---

## Version Control

Use Git to track meaningful progress.

Each commit should represent a clear improvement.

Commit messages should briefly describe the primary change.

Examples:

```
Add Foundation routing

Update homepage layout

Refactor Module components
```

Commit frequently, but keep each commit focused.

---

## Summary

A consistent development workflow helps keep the project stable as it grows.

By combining clear engineering practices, good documentation, version control, and AI assistance, the project remains understandable for both human developers and AI development tools.

# Part 5 — Project Maintenance & Future Development

## Definition of Done

A task is considered complete when:

- The implementation works as intended.
- The code follows the project structure.
- Naming is clear and consistent.
- Documentation has been updated if necessary.
- The project remains stable after the change.

Completing a feature means improving the project without introducing unnecessary complexity.

---

## Project Maintenance

The project should be maintained through continuous improvements.

When adding new features:

- Follow the existing architecture.
- Keep the repository organized.
- Avoid duplicate implementations.
- Update related documentation.

Small improvements made consistently are preferable to large redesigns.

---

## Long-term Development

The current priority is to build a stable and maintainable platform.

Future development may include:

- Additional Foundation modules
- Expanded Module Library
- More guided Practices
- Membership improvements
- PWA enhancements
- Additional website features

New features should extend the existing architecture rather than replace it.

---

## Repository Evolution

The repository should evolve gradually.

As the project grows, new documentation, components, and features may be added while keeping the overall structure simple and understandable.

Avoid unnecessary restructuring unless it clearly improves maintainability.

---

## Engineering Mindset

Good engineering is built through consistency.

When making decisions:

- Prefer simple solutions.
- Keep the code understandable.
- Improve the project step by step.
- Think about long-term maintainability.

The goal is to build software that remains easy to develop, maintain, and expand.

---

## Version History

### Version 1.0

Initial engineering guide.

Defines:

- Project purpose
- Engineering principles
- Repository structure
- Website architecture
- Course architecture
- Development workflow
- AI collaboration
- Coding standards
- Project maintenance

Future versions of this guide should continue to refine the documentation as the project evolves.

---

## Closing Statement

JOTI is being built as a modern digital yoga platform.

This Engineering Guide provides a shared engineering foundation for both human developers and AI development assistants.

As the platform evolves, this document should evolve with it while remaining clear, consistent, and easy to maintain.