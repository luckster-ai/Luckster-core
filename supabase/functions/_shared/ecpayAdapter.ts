// ECPay integration: ECPay (綠界) Provider Adapter.
//
// Sibling of ./oenAdapter.ts implementing the same PaymentProviderAdapter
// contract (./paymentProviderAdapter.ts). Core never imports this module
// directly -- it is selected through ./paymentProviders.ts.
//
// Structural differences from Oen, all contained here:
//   - No server-to-server "create checkout" call exists for AIO: the
//     browser must POST a signed form to ECPay, so startCheckout() only
//     builds and signs the fields and returns them as `formPost`.
//   - MerchantTradeNo is max 20 alphanumeric chars and can NEVER be reused
//     (not even across retries), so it cannot be a UUID. A fresh one is
//     generated per checkout and stored as
//     checkout_sessions.merchant_trade_no -- the key ecpay-webhook
//     resolves the session by (and later the paid Order's
//     provider_checkout_ref, which the refund flow reads).
//   - ClientBackURL is a plain "back to shop" link that carries no payment
//     result, so the return URL is sent without Core's `result` hint.

import {
  AIO_CHECKOUT_URL,
  creditDoAction,
  ECPAY_MERCHANT_ID,
  ECPAY_RETURN_URL,
  ecpayConfigError,
  type EcpayResult,
  signParams,
} from "./ecpay.ts";
import type {
  CheckoutFormPost,
  PaymentProviderAdapter,
  StartCheckoutInput,
  StartCheckoutResult,
} from "./paymentProviderAdapter.ts";

export const ECPAY_PROVIDER_NAME = "ecpay";

// Same labels as oenAdapter.ts's PLAN_DISPLAY_NAME (shown on ECPay's
// hosted payment page as the item name).
const PLAN_DISPLAY_NAME: Record<string, string> = {
  monthly: "JOTI 月方案",
  annual: "JOTI 年方案",
};

const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

// "yyyy/MM/dd HH:mm:ss" in UTC+8, as AIO's MerchantTradeDate requires.
function formatUtc8DateTime(ms: number): string {
  const d = new Date(ms + UTC8_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// "J" + yyMMddHHmmss (UTC+8) + 7 random alphanumerics = 20 chars. The
// timestamp keeps it readable in ECPay's merchant backend; the random
// suffix makes a collision between two attempts in the same second
// negligible (36^7).
function generateMerchantTradeNo(ms: number): string {
  const stamp = formatUtc8DateTime(ms).replace(/[^0-9]/g, "").slice(2);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `J${stamp}${suffix}`;
}

// Builds and signs the AIO form fields. `reference` is echoed back in
// CustomField1 (an extra cross-check only, never the identity source --
// the webhook resolves by MerchantTradeNo).
async function buildSignedCheckout(input: {
  amount: number;
  planCode: string;
  backUrl: string;
  reference: string;
}): Promise<{ merchantTradeNo: string; formPost: CheckoutFormPost }> {
  // Fail fast unless ECPAY_MODE and the payment host match (test <->
  // stage, live <-> production) and the merchant secrets are set.
  const cfgErr = ecpayConfigError();
  if (cfgErr) {
    throw new Error(`ecpay_misconfigured: ${cfgErr}`);
  }

  const nowMs = Date.now();
  const merchantTradeNo = generateMerchantTradeNo(nowMs);

  const fields: Record<string, string> = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: formatUtc8DateTime(nowMs),
    PaymentType: "aio",
    TotalAmount: String(input.amount),
    TradeDesc: "JOTI 線上課程",
    ItemName: PLAN_DISPLAY_NAME[input.planCode] ?? input.planCode,
    ReturnURL: ECPAY_RETURN_URL,
    ChoosePayment: "Credit",
    ClientBackURL: input.backUrl,
    CustomField1: input.reference,
    EncryptType: "1",
  };
  fields.CheckMacValue = await signParams(fields);

  return { merchantTradeNo, formPost: { action: AIO_CHECKOUT_URL, fields } };
}

// Order-first adapter (PaymentProviderAdapter contract). No longer used
// for new ECPay purchases -- create-order-checkout's ECPay branch uses
// startEcpaySessionCheckout() below, and retry-order-payment refuses ECPay
// Orders -- kept only so the provider registry stays type-complete.
export const ecpayAdapter: PaymentProviderAdapter = {
  async startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
    const backUrl = new URL(input.successUrl);
    backUrl.searchParams.delete("result");

    const { merchantTradeNo, formPost } = await buildSignedCheckout({
      amount: input.amount,
      planCode: input.planCode,
      backUrl: backUrl.toString(),
      reference: input.orderId,
    });

    return {
      providerCheckoutRef: merchantTradeNo,
      redirectUrl: AIO_CHECKOUT_URL,
      formPost,
    };
  },
};

// Checkout Session flow: signs the AIO form for a checkout_sessions row
// that does not exist yet (create-order-checkout inserts it right after,
// with the MerchantTradeNo returned here). CustomField1 carries the
// session id; the member comes back to /checkout/return?session=<id>.
export async function startEcpaySessionCheckout(input: {
  sessionId: string;
  amount: number;
  planCode: string;
  returnUrl: string;
}): Promise<{ merchantTradeNo: string; redirectUrl: string; formPost: CheckoutFormPost }> {
  const { merchantTradeNo, formPost } = await buildSignedCheckout({
    amount: input.amount,
    planCode: input.planCode,
    backUrl: input.returnUrl,
    reference: input.sessionId,
  });
  return { merchantTradeNo, redirectUrl: AIO_CHECKOUT_URL, formPost };
}

// ECPay's refund capability -- same placement as oenAdapter.ts's
// refundOenOrder(): a plain provider-specific export, deliberately NOT part
// of the PaymentProviderAdapter interface. Called only by
// terminate-service-period after Core's termination RPC has committed.
//
// Uses CreditDetail/DoAction Action=R (退刷), which per ECPay's docs covers
// a partial or full refund once the authorization is in the 要關帳 or
// 已關帳 stage (the normal state with daily auto-close enabled).
// NOT VERIFIED: ECPay's stage environment does not support DoAction, so
// this has only been exercised up to the request/CheckMacValue level --
// the real refund behaviour must be verified in production (LIVE).
export function refundEcpayOrder(input: {
  merchantTradeNo: string;
  tradeNo: string;
  amount: number;
}): Promise<EcpayResult> {
  const cfgErr = ecpayConfigError();
  if (cfgErr) {
    throw new Error(`ecpay_misconfigured: ${cfgErr}`);
  }

  return creditDoAction({
    merchantTradeNo: input.merchantTradeNo,
    tradeNo: input.tradeNo,
    action: "R",
    totalAmount: input.amount,
  });
}
