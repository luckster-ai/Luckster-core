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

export function checkoutRedirectUrl(checkoutId: string): string {
  return `${CHECKOUT_BASE}/checkout/subscription/${checkoutId}`;
}
