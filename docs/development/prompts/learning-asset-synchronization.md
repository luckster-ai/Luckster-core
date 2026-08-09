# JOTI Standard Runtime Synchronization

The Learning Assets have already been updated manually.

Do NOT modify any Learning Asset Markdown.

Your task is only to synchronize the Runtime Data and validate the website.

---

Project Workflow

Remember the project architecture:

Learning Assets (.md)
↓

Derived Runtime Data (.js)
↓

Website

The Markdown files are the single source of truth.

Runtime Data must always be regenerated from the current Learning Assets.

Never synchronize from memory or from previous conversation context.

Always re-read every modified Learning Asset from disk in this turn before updating any Runtime Data.

---

Task 1 — Review Modified Learning Assets

Read every modified Learning Asset from disk.

This includes any changed files under:

frontend/src/content/

including:

- Foundations
- Foundation Lessons
- Modules

Do not assume unchanged values from previous turns.

Always extract the current values directly from the Markdown.

---

Task 2 — Synchronize Runtime Data

Update the corresponding Runtime Data.

Synchronize only fields that are derived from the modified Learning Assets.

Do NOT rewrite fields that have not changed.

Do NOT introduce new Runtime Data fields.

Do NOT redesign the Runtime Data architecture.

Preserve the existing Runtime Data structure.

---

Task 3 — Validate Synchronization

Verify that every synchronized Runtime Data entry matches the current Learning Asset exactly.

Pay particular attention to:

- titles
- chinese titles
- summaries
- descriptions (if applicable)
- category
- difficulty
- duration
- video reference
- tags
- prerequisites (if represented)
- lesson information
- any other derived metadata

If any mismatch exists, correct it.

---

Task 4 — Website Validation

Confirm that the website now reflects the updated Learning Assets through the synchronized Runtime Data.

No learner-facing content should still display outdated information.

---

Task 5 — Validation

Run:

cd frontend && npm run lint

Run:

cd frontend && npm run build

Confirm both pass.

---

Deliverables

1.

List every Runtime Data file that was synchronized.

2.

Summarize which Learning Assets were synchronized.

Do not repeat unchanged values.

Only summarize the fields that actually changed.

3.

Confirm that the Runtime Data now matches the current Learning Assets.

4.

Confirm that the website now reflects the latest Learning Assets.

5.

Report only genuine remaining inconsistencies.

Do not propose unrelated improvements.