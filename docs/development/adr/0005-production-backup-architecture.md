# ADR 0005: Production Backup and Disaster Recovery Architecture

**Status:** Accepted — architecture decided 2026-10-22; not implemented. Items under "Deferred / future phases" and "Pending verification" remain open. Builds on the TEST backup / restore drill and the Production read-only validation (both passed, 2026-10-21).

**Last reviewed:** 2026-10-22

---

## Context

JOTI Production runs on Supabase **Free** (`qhyfpabyqksuwjzshjtu`, PostgreSQL 17, Singapore). The Free plan has no platform backups and no PITR; Supabase recommends that Free projects export their data themselves with the CLI. Production holds the data JOTI cannot rebuild: accounts (including password hashes), membership and service periods, orders and payment events, and contract review / acceptance records. Payments can be reconciled from ECPay after a loss; contract review / acceptance records cannot.

The fixed platform cost target is $0, without lowering Production reliability, security or legal compliance (see `project-status.md`).

### Verified so far (no need to re-run)

- **TEST restore drill — passed** (GitHub Actions run `39565844414`): a TEST dump taken through the Session pooler was restored into an isolated local Supabase stack; all 43 fingerprint keys matched the source (data, `auth.users` including password hashes, `auth.identities`, function definitions, function ACLs, per-role EXECUTE, triggers, RLS, policies, constraints, indexes, columns, grants, role `statement_timeout`); restored-user login, new-signup profile creation and RLS behaved correctly; cleanup was complete.
- **Production read-only validation — passed** (run `39586533510`): the same procedure dumped Production through the Session pooler in 134 s; every `public` / `auth` table row count in the dump matched live Production; the restore metadata (1 auth trigger, 63 function ACL statements, 43 fingerprint keys) could be captured; the fingerprint was identical before and after the run, so Production was not modified.
- The workflow code from both runs is archived outside the repository at `C:\Luckster-core-archive\supabase-backup-drill\` (the drill branch was deleted).

### Restore findings this architecture must preserve

These were found and fixed during the drill. They are requirements, not open questions:

1. **Function ACLs.** Restoring with the official CLI procedure alone makes the 14 payment / contract functions that are `service_role`-only in Production (`fulfill_checkout_session`, `apply_order_payment`, `mark_refund_processed`, `apply_service_period_early_termination`, `agree_to_contract`, `create_checkout_session`, …) executable by `anon` and `authenticated`. `pg_dump` records ACLs relative to PostgreSQL's built-in defaults, and Supabase's default privileges grant EXECUTE on new functions to `anon` / `authenticated`. Every restore must re-apply the function ACLs saved with the backup; any function-ACL mismatch fails the restore.
2. **Auth trigger.** The schema dump excludes the `auth` schema, so `auth.users.on_auth_user_created` (creates the profile on signup) must be saved separately and re-created. Without it, signup silently stops creating profiles.
3. **`log_min_messages`.** `roles.sql` contains `GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin";` (a platform grant). A non-superuser `postgres` cannot run it and the whole single-transaction restore rolls back, so restore skips exactly that line and keeps the rest, including the `statement_timeout` settings.
4. **Service versions.** A local restore target must run the same GoTrue / Storage versions as the hosted source; an older local GoTrue fails on missing `auth` tables.
5. **Not needed** (verified): `supabase_admin` OWNER workaround, `cli_login_postgres` handling, pre-creating extensions (`btree_gist` is in the schema dump).

The drill re-captured items 1–2 from a live source. In a real disaster the source no longer exists, so this metadata must be captured **at backup time**.

## Decision

### 1. Decided / verified

- **Private Ops Repo.** Production backup and disaster recovery run in a dedicated **private** GitHub repository (working name `luckster-ai/joti-ops`), separate from the public `Luckster-core`. Reasons: private logs and storage; scheduled workflows in private repositories are not disabled after 60 days without activity (that rule applies to public repositories).
- **Phase 1 is designed to remain within the current free-tier / $0 budget:** GitHub Actions (GitHub Free private-repo minutes) + **age** encryption + **private GitHub Release assets** as the off-site copy. The design does not depend on any paid service; staying within the free allowances is part of "Pending verification".
- **Schedule:** a backup every **6 hours**. This is an **RPO target of ≤ 6 h**, not a guarantee: GitHub may delay or skip scheduled runs, and data written after the last successful backup is lost.
- **Backup procedure:** the procedure verified in both runs above — Supabase CLI (pinned version, currently `2.117.0`) three-part dump through the Session pooler, read-only sessions (`default_transaction_read_only=on`; `pg_dump` runs in a read-only transaction).
- **Backup contents:** each backup set is encrypted and contains:

  | File | Purpose |
  |---|---|
  | `roles.sql`, `schema.sql`, `data.sql` | Official CLI dump |
  | `auth_triggers.sql` | Custom triggers on the `auth` schema (finding 2) |
  | `function_acl.sql` | REVOKE / GRANT statements reproducing every `public` function ACL (finding 1) |
  | `fingerprint.txt` | The 43-key fingerprint used as the restore pass criterion, including function ACLs and per-role EXECUTE lists |
  | `manifest.json` | Timestamp, project ref, PostgreSQL / GoTrue / Storage / auth-migration versions, CLI version, key versions used, per-table row counts, SHA-256 of every file |

- **Per-backup verification:** a backup succeeds only if (a) every `public` / `auth` row count in `data.sql` matches live Production, (b) all metadata files are produced, and (c) the fingerprint is unchanged before and after the run.
- **Restore procedure:** the official CLI restore plus only the fixes in "Restore findings" (skip the `log_min_messages` grant line, pin local service versions, re-create auth triggers, re-apply function ACLs), followed by the fingerprint comparison. Function-ACL or per-role EXECUTE differences are failures.
- **Weekly local restore drill:** an automated workflow restores the **latest encrypted backup only** (no Production access) into an ephemeral local Supabase stack, pinned to the versions in `manifest.json`, and requires all fingerprint keys to match plus login, new-signup profile creation and RLS checks. It also fails if the newest backup is older than the expected interval.
- **Monitoring:** **Healthchecks.io** — one check for the 6-hourly backup, one for the weekly drill. Each successful run pings its check, so a missed, skipped, disabled or failing run raises an alert. GitHub's own failure notifications remain as a second signal.
  - *Platform Selection Gate — accepted as a low-risk exception (2026-10-22).* Healthchecks.io's Terms (last updated 2018-05-09) neither restrict nor explicitly allow commercial use on the free Hobbyist plan (20 checks, 100 log entries per check); there is no SLA, and accounts may be terminated without notice. Accepted without written confirmation because only start / success / fail pings are sent — no JOTI or member data — and losing the service removes one alerting layer, not a backup: GitHub failure notifications and the drill's freshness check remain. Revisit if JOTI starts sending any data to it or relies on it as the only alert.
- **Retention (decided 2026-10-22):** every backup from the last 7 days, the newest backup of each UTC day for 35 days, the newest backup of each UTC month for 12 months; older Releases are deleted by the backup workflow after each successful publish. Safety rules: only `backup-YYYYMMDD-HHMMZ` Releases with one uploaded asset are considered, the newest complete backup is always kept, and nothing is deleted if fewer than 4 complete backups would remain. Shorter retention limits how long deleted members' data persists in backups. How this applies to USB copies is still deferred.
- **No new standalone keepalive.** The backup connects to Production every 6 hours; no additional keepalive is added unless real observation shows it is needed (see "Pending verification"). The existing `supabase-keepalive.yml` in `Luckster-core` is not changed by this ADR.
- **USB offline copy:** the encrypted backup sets (with their manifests) are copied **manually and periodically** to a USB drive kept offline, as an extra line of defence. Adopting the USB offline copy is decided; how often it is made and where the drive is kept are deferred (see "Deferred / future phases").
- **Supabase Storage objects are out of scope of the database dump.** The dump contains Storage metadata rows (`storage.buckets`, `storage.objects`) but **not file contents**. Production currently has 0 buckets and 0 objects (course video is on Bunny.net). Any future use of Supabase Storage needs its own backup design before Production use.
- **RTO is not yet known.** It will be measured in the first hosted DR drill; no RTO figure in project documents counts as verified until then.

### 2. Architectural recommendations

**Layers and their roles**

| Layer | Protects against | Does not protect against / risks |
|---|---|---|
| 6-hourly encrypted backup in the Private Ops Repo | Supabase project loss, corruption, accidental deletion (to the last backup), Free-plan pause beyond recovery | Loss of the GitHub account or compromise of the Ops Repo (an attacker can delete Releases); data written since the last backup |
| Weekly local restore drill | Backups that exist but cannot be restored; silent dump / restore regressions | Hosted-only differences (service versions, platform grants, config) |
| Manual USB offline copy | GitHub account loss or compromise, deletion of Releases | Staleness: only as recent as the last manual copy; relies on discipline; physical loss or damage |
| Phase 2: Backblaze B2 + Object Lock (not now) | Deletion or tampering even with Ops Repo credentials, a second vendor | New account and key to manage; cost after the free tier; not in Phase 1 |

**Encryption and keys**

- Every backup is encrypted with age to **two recipients**:
  - **Master key** — generated offline by the owner and stored only in a password manager, with an offline copy. Never placed in CI. Used for real disaster recovery and USB restores.
  - **CI drill key** — stored as an Ops Repo secret, used only by the weekly drill. This adds little new exposure: the same CI already holds a Production database credential.
- **Key versioning:** keys carry a version label (for example `master-v1`, `drill-v1`); the public recipients file in the Ops Repo lists the active versions, and `manifest.json` records which versions encrypted each backup. A retired private key must be kept for as long as any backup encrypted to it is retained — including USB copies. Rotation happens when there is a reason (suspected exposure, loss of a copy, a change of custody), not on a fixed yearly schedule.
- age provides authenticated encryption; the SHA-256 values in `manifest.json` additionally verify each file after decryption and after copying to USB.

**Retention:** decided — see "Decided / verified".

**Private Ops Repo as a high-sensitivity boundary**

- It holds a Production database credential (`SUPABASE_PROD_DB_URL` uses the `postgres` role, which has read **and write** privileges; the workflows only enforce read-only sessions), the CI drill key, and all backups.
- Compromise of the repository or the `luckster-ai` account would allow reading Production, decrypting retained backups with the drill key, and deleting Releases. The USB copy (and later B2 Object Lock) is the defence against deletion.
- Controls: owner as the only member; strong 2FA (passkey / security key) on the account; no collaborators, forks, self-hosted runners or `pull_request_target` workflows; workflows with `permissions: {}` and `contents: write` only for the job that publishes Releases; minimal, pinned third-party actions (prefer none); no secrets or data in logs.
- Once the Ops Repo backup runs reliably, `SUPABASE_PROD_DB_URL` is removed from the public `Luckster-core` repository.

**Disaster recovery outline** (to become the DR runbook):

1. Download the latest Release (or use the USB copy), decrypt with the master key, verify SHA-256.
2. Create a new hosted Supabase project (Free limit is 2 projects; paused projects do not count, so pause TEST or delete the broken project).
3. Restore with the verified procedure; re-create auth triggers; re-apply function ACLs; compare the fingerprint until it passes.
4. Re-apply project configuration from the configuration checklist (Auth: Site URL, Redirect URLs, password length, SMTP, Google provider, templates, rate limits).
5. Redeploy Edge Functions from git; restore Edge Function secrets from the password manager.
6. Update Vercel environment variables and redeploy, the Google OAuth callback, any monitoring / keepalive configuration, and the ECPay ReturnURL domain (the Supabase URL always changes on Free).
7. Reconcile with ECPay to recover payments made after the backup.

**Hosted DR drill:** before payments open, and periodically afterwards, pause TEST, create a temporary hosted project, run the DR runbook end to end and record the RTO.

### 3. Deferred / future phases

- **Phase 2: Backblaze B2 + Object Lock** as a second, deletion-resistant off-site copy — optional, not added now (Object Lock pricing still to be confirmed).
- **Upgrading Supabase** (Pro / PITR) or other paid services — possible later; the architecture does not assume them. Even with Pro, an off-site copy outside Supabase remains required.
- **Retention for USB copies** — whether and how the decided retention applies to the USB offline copies.
- **Least-privilege backup role** instead of `postgres` — the CLI dump switches to the `postgres` role; whether a read-only role (for example via `pg_read_all_data`) can produce a complete dump needs evaluation.
- **Privacy policy disclosure** of backup storage location and retention — part of the existing data-residency Future Decision.
- **Supabase Storage file backup** — only if Supabase Storage is used in Production.
- **Where the DR runbook lives** (public `docs/` or the Ops Repo) and whether Auth configuration becomes code (`supabase/config.toml` + `supabase config push`).
- **USB copy cadence and storage location** — to be decided by the owner; until then the USB layer's protection depends on how recently a copy was made.

### 4. Pending verification

- **Hosted restore:** whether the `log_min_messages` grant and the function-ACL widening behave the same when restoring into a new **hosted** project (only a local stack was tested); whether members must sign in again after a restore; Google-linked accounts; login with original passwords (the drill proved password hashes are identical, not an original-password login).
- **RTO** — measured only by the first hosted DR drill.
- **Pause prevention:** whether a database connection every 6 hours counts as activity for Supabase's Free-plan pause; until confirmed, the existing keepalive stays as it is.
- **Weekly drill from an encrypted backup only** (the TEST drill re-captured metadata from a live source; the new drill must work from the saved files alone).
- **GitHub Actions budget** — estimated from the first runs (backup 202 s → 4 billed minutes, drill 155 s → 3 minutes): about 495 of the 2,000 free minutes per month; confirm against actual usage once the schedules run.

## Rationale

- A private repository keeps logs, backups and credentials off the public `Luckster-core` repository and avoids the public-repository 60-day schedule rule.
- GitHub Releases are private, individually deletable (retention and member-deletion requests are manageable) and free; Actions artifacts are capped at 90 days and 500 MB on GitHub Free and are not suitable.
- age public-key encryption lets CI encrypt without holding the master key; the drill key makes automated restore verification possible.
- The weekly drill turns "a backup exists" into "a backup restores", which caught the function-ACL problem that a dump-only check would have missed.
- A 6-hour interval narrows the loss window for contract records, which are the data ECPay reconciliation cannot recover; the database is small enough that the cost is negligible.

## Consequences

**Positive:**

- Phase 1 is designed to stay within the current free-tier / $0 budget, with off-site encrypted backups, automated restore verification and missed-run alerting.
- Restore correctness (function ACLs, auth trigger) is checked automatically rather than remembered.
- The procedure is already proven against both TEST and Production.

**Trade-offs:**

- The GitHub account is a single point of failure for Phase 1 automation; the USB copy is manual.
- RPO is bounded by the schedule and GitHub's scheduler; contract records written after the last backup cannot be recovered.
- Supabase Free limits remain: no PITR, the project URL changes on restore (ECPay ReturnURL, Google OAuth, Vercel), the 2-project limit, no SLA.
- More components to keep consistent: CLI version, service-version pinning, keys, recipients file, Healthchecks.

## Future Considerations

- Add Phase 2 (B2 + Object Lock) if the GitHub-only risk becomes unacceptable or before the data grows significantly.
- Revisit the Supabase plan decision using real RTO / RPO results from the hosted DR drill.
- Revisit Supabase Storage if file uploads are introduced.

---

## Related Documents

- `docs/development/project-status.md` — "Step 11 — Supabase Free Backup／Restore Discovery", "TEST Drill", "Production Read-only Backup Validation"
- `docs/development/engineering-guide.md` — Third-Party Platform Selection Gate
- `docs/development/adr/0004-production-hosting-platform.md` — hosting platform (Supabase URL changes affect hosting configuration)
- `.github/workflows/supabase-keepalive.yml` — existing Production keepalive
- Supabase — Backup and restore using the CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase — Database backups: https://supabase.com/docs/guides/platform/backups
- GitHub — Disabling and enabling a workflow (60-day rule): https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow
