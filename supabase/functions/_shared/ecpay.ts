// ECPay (綠界) 全方位金流 (AIO) client -- TEST (stage) environment only.
//
// Same env-driven shape as ./oen.ts, so the eventual production switch is a
// config change plus removing the test-only guards in ./ecpayAdapter.ts,
// never a rewrite of this client:
//   ECPAY_PAYMENT_BASE  https://payment-stage.ecpay.com.tw  ->  https://payment.ecpay.com.tw
//   ECPAY_MODE          test (default)                      ->  live
//   ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV       per-merchant secrets
//   ECPAY_RETURN_URL    server-to-server payment result endpoint (ecpay-webhook)
//
// ECPAY_RETURN_URL is deliberately a plain env value rather than derived
// from SUPABASE_URL: if ECPay ever requires ReturnURL to live on JOTI's own
// domain (e.g. payment.joti.yoga), switching is a secret update only.
//
// Authentication with ECPay is the CheckMacValue (SHA256 over the sorted,
// .NET-UrlEncoded parameters wrapped in HashKey/HashIV) -- no bearer token,
// no IP allowlist in ECPay's public AIO docs.

const PAYMENT_BASE = (Deno.env.get("ECPAY_PAYMENT_BASE") ?? "https://payment-stage.ecpay.com.tw")
  .replace(/\/+$/, "");
const MERCHANT_ID = Deno.env.get("ECPAY_MERCHANT_ID") ?? "";
const HASH_KEY = Deno.env.get("ECPAY_HASH_KEY") ?? "";
const HASH_IV = Deno.env.get("ECPAY_HASH_IV") ?? "";
const RETURN_URL = Deno.env.get("ECPAY_RETURN_URL") ?? "";

export const ECPAY_MODE = Deno.env.get("ECPAY_MODE") ?? "test";
export { MERCHANT_ID as ECPAY_MERCHANT_ID, RETURN_URL as ECPAY_RETURN_URL };

export const AIO_CHECKOUT_URL = `${PAYMENT_BASE}/Cashier/AioCheckOut/V5`;
const QUERY_TRADE_INFO_URL = `${PAYMENT_BASE}/Cashier/QueryTradeInfo/V5`;
const CREDIT_DO_ACTION_URL = `${PAYMENT_BASE}/CreditDetail/DoAction`;

export function ecpayConfigError(): string | null {
  if (ECPAY_MODE !== "test" && ECPAY_MODE !== "live") {
    return "ECPAY_MODE must be 'test' or 'live'";
  }
  if (ECPAY_MODE === "test" && PAYMENT_BASE !== "https://payment-stage.ecpay.com.tw") {
    return "ECPAY_MODE=test but ECPAY_PAYMENT_BASE is not the stage host";
  }
  if (ECPAY_MODE === "live" && PAYMENT_BASE !== "https://payment.ecpay.com.tw") {
    return "ECPAY_MODE=live but ECPAY_PAYMENT_BASE is not the production host";
  }
  if (!MERCHANT_ID) return "ECPAY_MERCHANT_ID is not set";
  if (!HASH_KEY) return "ECPAY_HASH_KEY is not set";
  if (!HASH_IV) return "ECPAY_HASH_IV is not set";
  if (!RETURN_URL.startsWith("https://")) return "ECPAY_RETURN_URL must be an https URL";
  return null;
}

// ---------------------------------------------------------------------
// CheckMacValue (全方位金流 附錄「檢查碼機制」)
// ---------------------------------------------------------------------

// .NET HttpUtility.UrlEncode equivalent. encodeURIComponent already leaves
// exactly the characters .NET leaves (- _ . ! * ( )) unencoded, except it
// also leaves ' and ~ alone and encodes space as %20 -- fix those three.
function dotNetUrlEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/'/g, "%27")
    .replace(/~/g, "%7E");
}

async function sha256HexUpper(s: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// Pure function (keys passed in) so it can be unit-tested against ECPay's
// published worked example without any env.
export function computeCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
): Promise<string> {
  const body = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => {
      const la = a.toLowerCase();
      const lb = b.toLowerCase();
      return la < lb ? -1 : la > lb ? 1 : 0;
    })
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${body}&HashIV=${hashIV}`;
  return sha256HexUpper(dotNetUrlEncode(raw).toLowerCase());
}

export function signParams(params: Record<string, string>): Promise<string> {
  return computeCheckMacValue(params, HASH_KEY, HASH_IV);
}

// Constant-time-ish comparison; both sides are fixed-length uppercase hex.
export async function verifyCheckMacValue(params: Record<string, string>): Promise<boolean> {
  const received = (params.CheckMacValue ?? "").toUpperCase();
  if (!received) return false;
  const expected = await signParams(params);
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------
// Server-to-server calls (form POST, form/querystring responses)
// ---------------------------------------------------------------------

export type EcpayResult = {
  ok: boolean;
  status: number;
  data: Record<string, string> | null;
  raw: string;
};

const ECPAY_TIMEOUT_MS = 10_000;

async function ecpayPost(url: string, params: Record<string, string>): Promise<EcpayResult> {
  const signed = { ...params, CheckMacValue: await signParams(params) };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ECPAY_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(signed).toString(),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text();
  let data: Record<string, string> | null = null;
  if (raw.includes("=")) {
    data = Object.fromEntries(new URLSearchParams(raw));
  }
  return { ok: res.ok, status: res.status, data, raw };
}

// POST /Cashier/QueryTradeInfo/V5 -- authenticated read-back of one AIO
// order. The response carries its own CheckMacValue, verified here so
// callers can rely on `macValid` instead of re-implementing it.
export async function queryTradeInfo(
  merchantTradeNo: string,
): Promise<EcpayResult & { macValid: boolean }> {
  const result = await ecpayPost(QUERY_TRADE_INFO_URL, {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: merchantTradeNo,
    TimeStamp: String(Math.floor(Date.now() / 1000)),
  });
  const macValid = result.data ? await verifyCheckMacValue(result.data) : false;
  return { ...result, macValid };
}

// POST /CreditDetail/DoAction -- credit card capture/refund. ECPay's docs
// state the stage environment does NOT support this API (no real card
// authorization exists there), so this path can only be truly verified in
// production with a real transaction. For Action=R, TotalAmount is sent as
// the amount to refund -- also only verifiable in production.
export function creditDoAction(params: {
  merchantTradeNo: string;
  tradeNo: string;
  action: "C" | "R" | "E" | "N";
  totalAmount: number;
}): Promise<EcpayResult> {
  return ecpayPost(CREDIT_DO_ACTION_URL, {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: params.merchantTradeNo,
    TradeNo: params.tradeNo,
    Action: params.action,
    TotalAmount: String(params.totalAmount),
  });
}
