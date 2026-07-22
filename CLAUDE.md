# CLAUDE.md

# Luckster Core Engineering Guide

This document defines how Claude Code should work within the Luckster Core repository.

---

# Project Overview

Project Name:

Luckster Core

Brand:

JOTI – Kundalini ABC Yoga

Purpose:

Luckster is a content-first learning platform for Kundalini Yoga.

The repository is designed to support:

- Website
- Course platform
- AI assistant (Luckster)
- Subscription service
- Knowledge base

The long-term goal is to build a scalable learning platform rather than a simple marketing website.

---

# Core Philosophy

Always remember:

Documentation comes first.

The documentation defines the product.

The frontend is a presentation layer.

AI assists development but should never replace documentation.

Every architectural decision should prioritize:

- maintainability
- readability
- scalability
- consistency

---

# Repository Structure

Repository:

Luckster-core/

Structure:

docs/
Project documentation

frontend/
React + Vite application

apps/
Future applications

README.md
Project overview

CLAUDE.md
Claude Code instructions

---

# Documentation

The docs folder is the project's knowledge base.

Examples:

docs/brand/

Brand identity

docs/course-system/

Course architecture

docs/course-content/

Markdown course content

docs/website/

Website planning

docs/agents/

AI documents

Claude should always read documentation before making assumptions.

Documentation has higher priority than code.

---

# Single Source of Truth

Avoid duplicated information.

If duplicate content exists:

Identify it.

Explain it.

Ask before removing it.

Never silently delete duplicated content.

---

# Frontend

Framework:

React 19

Build Tool:

Vite

Routing:

React Router

Goal:

Small reusable components.

Avoid large components.

Prefer composition over duplication.

---

# React Guidelines

Prefer functional components.

Keep components focused.

Avoid unnecessary abstraction.

Pass data through props.

Avoid hardcoded values whenever possible.

Prefer reusable UI.

---

# Routing

Keep routing simple.

Every page should have a clear responsibility.

Current pages include:

Home

Foundation

Module

Practice

Future routes should follow the same convention.

---

# Course System

Course hierarchy:

Foundation

↓

Module

↓

Practice

↓

Video

Definitions:

Foundation

Fundamental knowledge required before practice.

Module

Reusable learning units.

Practice

A complete practice built from multiple modules.

Video

The smallest learning resource.

Do not introduce alternative course models without discussion.

---

# Markdown

Markdown is the preferred content format.

Markdown should eventually become the content source for the frontend.

Avoid hardcoding educational content in React components.

---

# Naming Convention

Respect existing naming conventions.

Slugs should remain stable.

Never rename slugs unless explicitly requested.

Avoid breaking URLs.

---

# Components

Prefer:

Small

Reusable

Independent

Avoid:

Massive components

Duplicated UI

Business logic inside presentation components

---

# Styling

Maintain consistent spacing.

Keep layouts responsive.

Desktop

Tablet

Mobile

Avoid inline styles unless necessary.

---

# Git Workflow

Before making changes:

Understand the problem.

Read related files.

Explain the intended solution.

Only then modify code.

After modifications:

Review the changes.

Check for consistency.

Do not create unnecessary files.

---

# Safe Editing Rules

Never:

Delete documentation.

Delete markdown.

Rename folders.

Move files.

Rewrite large sections of the project.

Without confirmation.

Always ask before making structural changes.

---

# Existing Architecture

Current architecture should be respected.

Do not replace working systems with completely different approaches.

Prefer incremental improvements.

---

# AI Behavior

Claude should behave like a senior software engineer.

Responsibilities:

Analyze

Explain

Implement

Review

Do not rush into coding.

Think before editing.

Explain architectural impacts.

---

# Communication Style

Be concise.

Be technical.

Explain reasoning.

When multiple solutions exist:

Present pros and cons.

Recommend one.

---

# Long-Term Vision

Luckster is evolving toward:

Subscription platform

Learning management system

AI coaching

Knowledge management

Content automation

Community platform

Future code should support long-term scalability.

---

# Development Priority

Current priority:

1. Stable architecture

2. Documentation

3. Frontend

4. Content system

5. AI integration

6. Backend

7. Subscription

8. Community

---

# Working Principle

Before editing:

Analyze.

During editing:

Keep changes minimal.

After editing:

Review.

Summarize.

Verify nothing unrelated was changed.

---

# Final Rule

Always optimize for long-term maintainability rather than short-term convenience.

When uncertain:

Ask before changing.

Never assume.