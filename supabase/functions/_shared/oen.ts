// Oen Payment API client -- TEST environment only for Payment Phase 1.
//
// The base URL and mode come from env so the eventual production switch is
// a config change, never a code edit:
//   OEN_API_BASE      https://payment-api.testing.oen.tw  ->  https://payment-api.oen.tw
//   OEN_CHECKOUT_BASE https://<merchantId>.testing.oen.tw ->  https://<merchantId>.oen.tw
//   OEN_MODE          test (default)                      ->  live
//
// OEN_MODE defaults to "test" and BOTH callers refuse to do anything real
// unless OEN_MODE === "test" AND the API base is the testing host. Going
// live requires explicitly setting OEN_MODE=live together with a matching
// OEN_API_BASE -- oenConfigError() rejects any mismatch.

const API_BASE = Deno.env.get("OEN_API_BASE") ?? "https://payment-api.testing.oen.tw";
const CHECKOUT_BASE = (Deno.env.get("OEN_CHECKOUT_BASE") ?? "").replace(/\/+$/, "");
const MERCHANT_ID = Deno.env.get("OEN_MERCHANT_ID") ?? "";
const TOKEN = Deno.env.get("OEN_TEST_API_TOKEN") ?? "";

export const OEN_MODE = Deno.env.get("OEN_MODE") ?? "test";
export { API_BASE, CHECKOUT_BASE, MERCHANT_ID };

export function oenConfigError(): string | null {
  if (OEN_MODE !== "test" && OEN_MODE !== "live") {
    return "OEN_MODE must be 'test' or 'live'";
  }
  if (OEN_MODE === "test" && !API_BASE.includes("testing.oen.tw")) {
    return "OEN_MODE=test but OEN_API_BASE is not the testing host";
  }
  if (OEN_MODE === "live" && !API_BASE.includes("payment-api.oen.tw")) {
    return "OEN_MODE=live but OEN_API_BASE is not the production host";
  }
  if (!TOKEN) return "OEN_TEST_API_TOKEN is not set";
  if (!MERCHANT_ID) return "OEN_MERCHANT_ID is not set";
  if (!CHECKOUT_BASE) return "OEN_CHECKOUT_BASE is not set";
  return null;
}

export type OenResponse<T> = { code: string; message: string; data: T };

export type OenResult<T> = {
  ok: boolean;
  status: number;
  json: OenResponse<T> | null;
  raw: string;
};

const OEN_TIMEOUT_MS = 10_000;

async function oenFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<OenResult<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OEN_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text();
  let json: OenResponse<T> | null = null;
  try {
    json = raw ? JSON.parse(raw) as OenResponse<T> : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, raw };
}

// POST /checkout-subscription -- monthly subscription, first charge
// immediate. productDetails is sent because the Postman doc marks it
// required for this endpoint.
export function createSubscriptionCheckout(params: {
  amount: number;
  orderId: string;
  successUrl: string;
  failureUrl: string;
  planId: string;
  planName: string;
  userId: string;
}): Promise<OenResult<{ id: string; transactionHid?: string }>> {
  return oenFetch("POST", "/checkout-subscription", {
    merchantId: MERCHANT_ID,
    amount: params.amount,
    currency: "TWD",
    orderId: params.orderId,
    successUrl: params.successUrl,
    failureUrl: params.failureUrl,
    productDetails: [{
      productionCode: params.planId,
      description: params.planName,
      quantity: 1,
      unit: "份",
      unitPrice: params.amount,
    }],
    customId: params.userId,
    userId: params.userId,
    note: `JOTI subscription (${OEN_MODE})`,
  });
}

// POST /checkout -- single one-time payment, no recurring behaviour
// whatsoever (no paymentInterval, no startDate -- this is a DIFFERENT Oen
// endpoint from /checkout-schedule above).
//
// Payment Rebuild -- Step 6: this is the function the Oen Provider Adapter
// (../_shared/oenAdapter.ts) calls on behalf of the new, provider-agnostic
// Payment Core (create-order-checkout / retry-order-payment). Do not call
// this from, or merge it with, the Legacy createSubscriptionCheckout()
// above -- the two are deliberately kept separate (see
// docs/development/project-status.md, "Payment Rebuild — Step 5").
//
// FIELD SHAPE EMPIRICALLY VERIFIED against Oen's TEST API (2026-10-02,
// Step 6 TEST Runtime Verification): the first attempt omitted
// productDetails (the documented "minimum request" example doesn't show
// it) and Oen's /checkout rejected it with
// `{"code":"V0001","data":{},"message":"must have required property
// 'productDetails'"}` -- confirming /checkout requires productDetails the
// same as /checkout-schedule, contrary to the documented minimal example.
// productDetails shape copied from createSubscriptionCheckout() above
// (already verified working for that endpoint), not invented here.
export function createOneTimeCheckout(params: {
  amount: number;
  currency: string;
  orderId: string;
  successUrl: string;
  failureUrl: string;
  customId: string;
  planId: string;
  planName: string;
}): Promise<OenResult<{ id: string }>> {
  return oenFetch("POST", "/checkout", {
    merchantId: MERCHANT_ID,
    amount: params.amount,
    currency: params.currency,
    orderId: params.orderId,
    successUrl: params.successUrl,
    failureUrl: params.failureUrl,
    productDetails: [{
      productionCode: params.planId,
      description: params.planName,
      quantity: 1,
      unit: "份",
      unitPrice: params.amount,
    }],
    customId: params.customId,
    note: `JOTI order (${OEN_MODE})`,
  });
}

// GET /subscriptions/:id  -- used by the webhook to re-verify.
export function getSubscription(
  subscriptionId: string,
): Promise<OenResult<Record<string, unknown>>> {
  return oenFetch("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

// GET /transactions/:idOrHid  -- used by the webhook to re-verify.
export function getTransaction(
  idOrHid: string,
): Promise<OenResult<Record<string, unknown>>> {
  return oenFetch("GET", `/transactions/${encodeURIComponent(idOrHid)}`);
}

// POST /refunds/:transactionHid -- Payment Rebuild -- Step 9.
//
// transactionHid (NOT transactionId) is the path parameter -- this is the
// same value already stored as orders.provider_ref (written by
// apply_order_payment() via oen-webhook's p_provider_ref, Step 7), so no
// new data needs to be captured anywhere to call this.
//
// Synchronous API: Oen's own response carries the final result directly
// (code/data.status/data.refundAmount/data.refundedAt) -- there is no
// webhook notification for refund completion (consistent with the
// existing project-status.md note on this). The caller only needs to
// re-query (getTransaction above, already exists, reused as-is) when the
// HTTP call itself is ambiguous (timeout / connection drop), not as a
// blanket "never trust the response" rule the way webhook payloads are
// treated -- this is a response WE requested over an authenticated
// connection, not an unauthenticated inbound notification.
//
// Each transaction can only be refunded once (Oen's own rule) and only
// credit-card transactions are refundable via this endpoint -- CVS/ATM
// require the Oen CRM dashboard. JOTI currently only ever charges by
// card, so that restriction does not block anything today, but the caller
// (oenAdapter.ts) still checks orders.payment_method before calling this.
export function createRefund(params: {
  transactionHid: string;
  amount: number;
  reason?: string;
}): Promise<
  OenResult<{ id: string; status: string; refundAmount: number; refundedAt?: string }>
> {
  return oenFetch("POST", `/refunds/${encodeURIComponent(params.transactionHid)}`, {
    merchantId: MERCHANT_ID,
    amount: params.amount,
    ...(params.reason ? { reason: params.reason } : {}),
  });
}

export function checkoutRedirectUrl(checkoutId: string): string {
  return `${CHECKOUT_BASE}/checkout/subscription/${checkoutId}`;
}

// One-time checkout's hosted page URL has no "schedule" segment -- a
// different path shape from checkoutRedirectUrl() above. Step 6 only.
export function oneTimeCheckoutRedirectUrl(checkoutId: string): string {
  return `${CHECKOUT_BASE}/checkout/${checkoutId}`;
}
