# ADR 0004: Production Hosting Platform

**Status:** Proposed — no final decision. Cloudflare Pages is a candidate pending external confirmation; Vercel Pro is the Production fallback.

**Last reviewed:** 2026-10-20

---

## Context

The JOTI frontend is a static React / Vite SPA (`frontend/`), built with `npm run build` into `dist/`, with one rewrite rule (`frontend/vercel.json`, all paths to `index.html`). It has no serverless functions and no `@vercel/*` dependency. All backend logic lives in Supabase (Database, Auth, Edge Functions); payments go through ECPay.

It is currently deployed on Vercel. Once JOTI accepts payments it is commercial usage:

- Vercel Fair Use Guidelines (last updated 2026-09-14): Hobby is "restricted to non-commercial personal use only"; commercial usage, including "any method of requesting or processing payment from visitors of the site", requires Pro or Enterprise. Vercel Hobby is therefore not an option for Production once payments open.

The project goal is to keep fixed platform cost at $0 where this does not lower Production reliability, security or legal compliance. Cloudflare Pages Free was evaluated as the $0 option.

### JOTI payment architecture (relevant to the terms)

- The frontend only auto-submits a signed order form (merchant, order number, amount, item, return URLs, signature) to ECPay. It has no card fields.
- Card data is entered on ECPay's hosted payment page (`payment.ecpay.com.tw`) and processed by ECPay.
- The payment result notification (ReturnURL) goes server-to-server from ECPay to a Supabase Edge Function, not through the hosting platform. Its payload (verified on TEST) contains no card number, last four digits or authorisation code.
- JOTI does not receive or store credit card data.

### Cloudflare terms reviewed

- Self-Serve Subscription Agreement (last updated 2025-09-12): no explicit restriction on commercial use of Free Services; reselling access is prohibited (§2.2.1(a)); no liability for Free Services (§2.6).
- §2.2.1 lead-in: "Unless otherwise expressly permitted in writing by Cloudflare, you will not and you have no right to:" and §2.2.1(h): "process or collect personal or business credit card information on any web property receiving Free Services".
- Service-Specific Terms — Developer Platform (last updated 2026-09-28): covers Cloudflare Pages; nothing on commercial use or payments; Cloudflare may temporarily limit requests that unduly burden the network.

Read literally, JOTI does not process or collect card information on its own web property. This is an interpretation, not a confirmation. Open ambiguities:

1. "web property" is not defined — a page, a site, or a whole domain. The `joti.yoga` DNS zone already uses Cloudflare Free, so this question applies to the current DNS setup regardless of the hosting choice.
2. "process" is not defined — whether initiating a redirect to a third-party hosted payment page counts.
3. "credit card information" is not defined — whether payment-method type and transaction identifiers count.

## Decision (current state)

| Option | Status |
|---|---|
| **Cloudflare Pages Free** | **Candidate — External Confirmation Pending.** Not approved. |
| **Vercel Pro** | **Production fallback.** Production-ready, not selected. Must not be removed before the Cloudflare question is closed. |

- The required External Confirmation is a **written answer from Cloudflare** on whether JOTI's architecture (above) on Pages Free and DNS Free is permitted under §2.2.1(h).
- No Production hosting migration happens before the final hosting decision. A reversible Pages PoC (no Production data or configuration, e.g. checking that the build can read `../docs/legal` and that SPA routing works) is allowed under the Platform Selection Gate.
- Vercel Pro is used instead if any of the following happens:
  - Cloudflare declines, or its answer is not clear enough to accept;
  - the PoC or Production validation fails;
  - Free-plan quota or reliability does not meet JOTI's Production requirements.

## Consequences

- **Migration scope (if Cloudflare is accepted):** a hosting-layer migration only. React / Vite code, Supabase (Database, Auth, Edge Functions), ECPay integration and the database schema do not change. Required changes: replace `frontend/vercel.json` with a `_redirects` file; configure build root `frontend`, command `npm run build`, output `dist`, and Production / Preview environment variables; bind `joti.yoga`; update Supabase Site URL / Redirect URLs (TEST wildcard moves from `*.vercel.app` to `*.pages.dev`), Production and TEST `SITE_URL`, Google OAuth branding URLs; update the privacy policy hosting entry and the deployment / Preview workflow documentation. The Production E2E must then run on the new hosting.
- **Fallback cost:** switching to Vercel Pro only requires upgrading the existing Vercel project; no code or configuration change. Cost is the Pro seat fee.
- **DNS:** the §2.2.1(h) ambiguity also concerns the existing Cloudflare Free DNS, so the written confirmation is needed even if Vercel Pro is chosen, unless DNS is moved or upgraded.

## Related Documents

- `docs/development/engineering-guide.md` — Third-Party Platform Selection Gate
- `docs/development/project-status.md` — tracking items (External / Pending, Future Decision)
- Cloudflare Self-Serve Subscription Agreement: https://www.cloudflare.com/terms/
- Cloudflare Service-Specific Terms — Developer Platform: https://www.cloudflare.com/service-specific-terms-developer-platform/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Vercel Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
