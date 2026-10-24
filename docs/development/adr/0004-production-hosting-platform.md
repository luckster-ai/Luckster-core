# ADR 0004: Production Hosting Platform

**Status:** Accepted — Cloudflare Pages Free selected as the Production hosting platform (2026-10-22). **Implemented 2026-10-24**: `joti.yoga` is served by the Cloudflare Pages project `joti` after the PoC (2026-10-23) and the Production validation passed. The Vercel project is kept and has not been disconnected yet. Vercel Pro remains the fallback.

**Last reviewed:** 2026-10-24

---

## Context

The JOTI frontend is a static React / Vite SPA (`frontend/`), built with `npm run build` into `dist/`, with one rewrite rule (`frontend/vercel.json`, all paths to `index.html`). It has no serverless functions and no `@vercel/*` dependency. All backend logic lives in Supabase (Database, Auth, Edge Functions); payments go through ECPay; course video is delivered by Bunny.net. The `joti.yoga` domain is registered with Cloudflare and its DNS zone is on Cloudflare Free.

It is currently deployed on Vercel. Once JOTI accepts payments it is commercial usage:

- Vercel Fair Use Guidelines (last updated 2026-09-14): Hobby is "restricted to non-commercial personal use only"; commercial usage, including "any method of requesting or processing payment from visitors of the site", requires Pro or Enterprise. Vercel Hobby is therefore not an option for Production once payments open.

The project goal is to keep fixed platform cost at $0 where this does not lower Production reliability, security or legal compliance.

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

### Cloudflare Pages Free limits (checked 2026-10-22)

500 builds per month, 1 concurrent build, 20-minute build timeout, 20,000 files per site, 25 MiB per file, 100 custom domains per project. Requests to static assets are "free and unlimited" (Workers static assets billing); JOTI uses no Pages Functions, so there is no request quota that could take the site offline.

### Other candidates evaluated (2026-10-22)

| Candidate | Result |
|---|---|
| **Vercel Hobby** | Excluded — non-commercial only (above). |
| **GitHub Pages** | Excluded — "not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions". |
| **Netlify Free** | Excluded. Commercial projects are allowed according to Netlify's Free plan announcement, but the Self-Serve Subscription Agreement (October 2025) limits use to internal business purposes and lets Netlify change the Free Usage Tier or disable / remove a project on it without notice. Decisive: the Free plan is a hard cap of 300 credits per month (a Production deploy costs 15, bandwidth 20 per GB, 2 per 10k requests); when it is reached **all projects on the account are paused** — no web requests, no deploys — until the next billing cycle, and Free plans cannot buy more credits. JOTI deploys Production on every push to `main` (six pushes on 2026-10-22 alone, 90 credits), so the site would go offline within days; a paid membership site cannot accept that. |

No other $0 option previously considered fits free commercial Production use. Cloudflare's Workers static assets (same vendor and terms, same "free and unlimited" static requests) is an implementation alternative to Pages, chosen during the PoC.

## Decision

| Option | Status |
|---|---|
| **Cloudflare Pages Free** | **Selected** for Production hosting (2026-10-22). Not implemented; subject to the PoC and Production validation below. |
| **Vercel Pro** | **Fallback.** Production-ready; used if a fallback condition below occurs. Keep the Vercel project until Cloudflare Pages has passed Production validation. |
| Vercel Hobby, GitHub Pages, Netlify Free | Excluded (see "Other candidates evaluated"). |

### Platform Selection Gate — §2.2.1(h) accepted as a low-risk exception

The Gate requires an ambiguous clause to be confirmed in writing by the vendor. For §2.2.1(h) this is replaced by a documented risk acceptance (2026-10-22), on these grounds:

- JOTI does not process or collect card data on any Cloudflare-served property: card data is entered on ECPay's hosted page and processed by ECPay; the payment notification goes from ECPay to Supabase without passing through Cloudflare and contains no card data.
- The interpretation risk already exists today: `joti.yoga` DNS is on Cloudflare Free, so choosing Vercel Pro would not remove it unless DNS were also moved. Hosting on Pages adds little new exposure.
- Exit is cheap: a git-deployed static SPA that can move to Vercel Pro (or another host) by rebuilding and changing DNS, with no code changes.

The written inquiry to Cloudflare (drafted 2026-10-20) should still be sent; it is **not** a blocker. Revisit this exception if Cloudflare's answer is negative or unclear, if JOTI starts handling any card data in the frontend, or if JOTI adds Pages Functions / Workers to the payment flow.

### Conditions before Production

1. **Reversible PoC** on `*.pages.dev` with no Production data or configuration: the build can read `../docs/legal`; SPA routing via `_redirects`; Production and Preview environment variables (including `VITE_ENABLE_PURCHASE`); Preview URLs work with the TEST Supabase Redirect URLs. Pages or Workers static assets is chosen here.
   - **Result (2026-10-23): passed.**
     - Setup: Cloudflare Pages project `joti-poc` with Git integration to `luckster-ai/Luckster-core`; root `frontend`, build `npm run build`, output `dist`, Node 24; TEST Supabase.
     - Verified on `joti-poc.pages.dev`: TEST Supabase connection; Google sign-in; account data; member content; Bunny.net video playback; the pricing and account pages; sign-out; `/legal/privacy`, `/pricing` and `/contract-review`.
     - SPA routing: deep routes and reloads work without a `_redirects` file. The build has no `404.html`, so Pages applies its automatic SPA fallback.
     - **Pages** is chosen over Workers static assets.
     - **Preview check (2026-10-23): passed.**
       - Branch `preview/cloudflare-poc` (same commit as `main`) deployed as a Pages Preview, using Preview variables with `VITE_ENABLE_PURCHASE=true`.
       - `VITE_ENABLE_PURCHASE` was removed from the `joti-poc` Production environment, matching the plan. The purchase switch now differs correctly: Production `/pricing` shows the "not open yet" note and Preview does not.
       - Google sign-in works on the Preview URL after adding `https://*.joti-poc.pages.dev/**` to the TEST Supabase Redirect URLs.
     - Not done: the step "ordinary member → ECPay payment page". The signed-in account is an Admin, and `canOfferPurchase()` deliberately offers no purchase to admins. This is not a Cloudflare Preview problem. Re-test later with an existing eligible TEST member if one is available. The full payment E2E remains part of Production validation.
2. **Production validation:** bind `joti.yoga`; update Supabase Site URL / Redirect URLs, Google OAuth branding URLs and the privacy policy hosting entry; run the Production E2E on Cloudflare. `SITE_URL` is **set** (`https://joti.yoga`) when the payment Edge Functions are first deployed to Production; Production has no Edge Functions and no `SITE_URL` yet.
   - **Result (2026-10-24): passed for the current Production scope (payments closed).**
     - Project `joti` (separate from `joti-poc`), created from `luckster-ai/Luckster-core`.
       - Build settings: Production branch `main`, root `frontend`, `npm run build`, output `dist`.
       - Production variables: only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, both for Production Supabase.
       - Preview branch: **None**, so no Preview builds use Production variables. Preview testing stays on `joti-poc` (TEST).
     - Build of `8bd89a6`: Node 24.22.1 with no `NODE_VERSION` set, so `.nvmrc` is in effect (the image default is 22.16.0).
     - The bundle contains the Production Supabase ref and no TEST ref. After normalising the Supabase URL and key, it is identical to the `joti-poc` Production bundle, so the purchase and subscribe switches are off.
     - Checked on `joti-3da.pages.dev`: SPA deep routes return 200; the legal pages render; public Production data (official practices) loads.
     - `joti.yoga` is bound as a custom domain (Active, SSL) and serves the same bundle. Production Supabase Site URL is `https://joti.yoga`, and the Redirect URLs include `https://joti.yoga/auth/callback` and `/auth/reset-password`.
     - Verified manually by the owner on `joti.yoga`: Google sign-in, account data, member content, Bunny.net playback and `/pricing` with payments still closed.
     - Not covered: the payment E2E, which needs the payment launch and `SITE_URL`.

### Fallback to Vercel Pro if

- Cloudflare declines §2.2.1(h) for JOTI, or its answer is not clear enough to keep the exception;
- the PoC or Production validation fails;
- Free-plan limits or reliability do not meet JOTI's Production requirements;
- Cloudflare suspends or restricts the Free Services used by JOTI.

### Upgrade policy (decided 2026-10-22)

Lowest cost now, so Cloudflare first; at every upgrade, compare again:

- If Cloudflare Free stops fitting (limits, reliability, terms), first evaluate upgrading **within Cloudflare** — same platform, best continuity with the registrar / DNS setup.
- If Cloudflare's paid option is clearly more expensive than Vercel Pro and switching is cheap, choose the more cost-effective option.
- The goal is neither "always Cloudflare" nor "always keep Vercel": prices and fit are re-checked at each upgrade decision, using current official pricing.
- **If Cloudflare Free is later confirmed not to fit JOTI** (added 2026-10-23): compare the Cloudflare paid options and Vercel Pro again at that time. Which one is chosen is not decided in advance. It depends on the prices, Cloudflare's plan requirements, JOTI's situation and the migration and maintenance cost at that time. The 2026-10-23 comparison is the starting point, so no full hosting discovery is needed. Its findings: Cloudflare has no separate "Pages Pro" plan, so the paid options are Workers Paid (from $5/month) or the Pro domain plan ($20–25/month). Vercel Pro costs $20 per seat and includes $20 of usage. JOTI's usage costs are close to zero on both. Cloudflare Registrar requires Cloudflare nameservers, so if `joti.yoga` stays with Cloudflare Registrar, its DNS remains on Cloudflare even when hosting moves to Vercel.

### Portability guardrails

Keep the hosting replaceable without running two Productions:

- **Production is only ever addressed as `joti.yoga`**, never `*.pages.dev`: Supabase Site URL / Redirect URLs, `SITE_URL` (once set), ECPay return pages, Google OAuth and the privacy policy all point at the domain, so a host change does not touch them.
- No Pages Functions, Workers, `wrangler` configuration or Cloudflare-only runtime features (e.g. Access, Image Resizing); the site stays a plain static build.
- The frontend reads only JOTI's own `VITE_*` variables, never host-provided ones.
- Prefer Pages (git integration, no config file in the repo) over Workers static assets unless the PoC shows a problem.
- Keep `frontend/vercel.json`; Vercel needs it for SPA rewrites. Cloudflare Pages needs no `_redirects` file (PoC: automatic SPA fallback). Add one only if a `404.html` is ever introduced. Each host ignores the other's file.
- Pin the Node version in the repo (done 2026-10-24, Node 24). No single file is read by both hosts, so there are two:
  - `frontend/.nvmrc` (`24`) for Cloudflare Pages. Build image v3 reads `.nvmrc`, `.node-version` or `NODE_VERSION`, but not `package.json` `engines`.
  - `frontend/package.json` `engines.node` (`24.x`) for Vercel. Vercel reads this and it overrides the dashboard setting, but Vercel does not read `.nvmrc`.
  - Change both together. The `NODE_VERSION=24` dashboard variable on the Pages project and Vercel's 24.x project setting stay as they are and match the repo.
- After Cloudflare passes Production validation, **disconnect the Vercel project's Git integration** (keep the project): otherwise every push keeps publishing a second public copy on `*.vercel.app`, which would also be commercial use on Hobby.

## Consequences

- **Migration scope:** a hosting-layer migration only. React / Vite code, Supabase (Database, Auth, Edge Functions), ECPay integration, Bunny.net and the database schema do not change. Required changes: no routing file is needed on Pages (PoC 2026-10-23), and `frontend/vercel.json` stays for the fallback; configure build root `frontend`, command `npm run build`, output `dist`, and Production / Preview environment variables; bind `joti.yoga`; update Supabase Site URL / Redirect URLs (TEST wildcard moves from `*.vercel.app` to `*.pages.dev`), Production and TEST `SITE_URL`, Google OAuth branding URLs; update the privacy policy hosting entry and the deployment / Preview workflow documentation. The Production E2E must then run on the new hosting.
- **Cost:** $0 fixed hosting cost. Free Services have no SLA and no liability (§2.6).
- **Cloudflare Free → paid:** an account / plan change; site, DNS, domain and JOTI architecture stay the same.
- **Fallback cost:** switching to Vercel Pro only requires reconnecting and upgrading the existing Vercel project, setting the same `VITE_*` variables, adding `joti.yoga` and changing its DNS record (DNS only); Production Supabase / `SITE_URL` / ECPay / OAuth settings do not change because the domain does not; only the TEST Preview wildcard (`*.pages.dev` → `*.vercel.app`) and the privacy policy hosting entry change, followed by a Production E2E. No code change. Cost is the Pro seat fee. Netlify's paid Personal plan ($9 / month, 1,000 credits) is a possible cheaper paid option but has not been evaluated.
- **DNS:** registrar, DNS and hosting are on one Cloudflare account, which keeps domain binding simple but concentrates dependency on that account (protect it with strong 2FA).

## Related Documents

- `docs/development/engineering-guide.md` — Third-Party Platform Selection Gate
- `docs/development/project-status.md` — tracking items (External / Pending, Future Decision)
- Cloudflare Self-Serve Subscription Agreement: https://www.cloudflare.com/terms/
- Cloudflare Service-Specific Terms — Developer Platform: https://www.cloudflare.com/service-specific-terms-developer-platform/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Workers static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- Vercel Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Netlify pricing: https://www.netlify.com/pricing/
- Netlify — how credits work: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- Netlify — billing FAQ for credit-based plans: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/
- Netlify Self-Serve Subscription Agreement: https://www.netlify.com/pdf/self-serve-subscription-agreement.pdf
- Netlify Free plan announcement: https://www.netlify.com/blog/introducing-netlify-free-plan/
