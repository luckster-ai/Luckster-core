// Payment Rebuild -- Step 6: Oen Provider Adapter.
//
// Concrete implementation of PaymentProviderAdapter (./paymentProviderAdapter.ts)
// for Oen's one-time /checkout endpoint. This is the ONLY module Payment
// Core (create-order-checkout, retry-order-payment) imports to talk to a
// provider -- Core references OEN_PROVIDER_NAME / oenAdapter by name today
// only because Oen is currently the first (not final) Provider; swapping
// to a different Provider later means adding a sibling Adapter module and
// changing this one import, not editing Core's own logic.
//
// Uses createOneTimeCheckout() / oneTimeCheckoutRedirectUrl() from ./oen.ts
// -- NOT createSubscriptionCheckout() / checkoutRedirectUrl(), which stay
// Legacy-only (/checkout-schedule, recurring). Nothing here is shared with
// or imported by the Legacy subscription path.

import {
  createOneTimeCheckout,
  OEN_MODE,
  oenConfigError,
  oneTimeCheckoutRedirectUrl,
} from "./oen.ts";
import type {
  PaymentProviderAdapter,
  StartCheckoutInput,
  StartCheckoutResult,
} from "./paymentProviderAdapter.ts";

export const OEN_PROVIDER_NAME = "oen";

// Oen's /checkout requires productDetails (see oen.ts's createOneTimeCheckout
// comment for the empirical evidence). Core already validates planCode is
// one of these two values (PLAN_PRICING in create-order-checkout/index.ts)
// before this Adapter is ever called -- this map only supplies the
// human-readable product label Oen's payload requires, it does not
// re-validate planCode. Names match the existing plan labels already shown
// to members (data/pricing.js, ContractReviewPage.jsx's CHECKOUT_PLANS).
const PLAN_DISPLAY_NAME: Record<string, string> = {
  monthly: "月方案",
  annual: "年方案",
};

export const oenAdapter: PaymentProviderAdapter = {
  async startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
    // Same fail-fast config/mode guard as the Legacy function
    // (create-subscription-checkout/index.ts) -- this is Oen-specific
    // config validation, so it belongs here in the Adapter, not in Core.
    if (OEN_MODE !== "test") {
      throw new Error("oen_not_test_mode");
    }
    const cfgErr = oenConfigError();
    if (cfgErr) {
      throw new Error(`oen_misconfigured: ${cfgErr}`);
    }

    const result = await createOneTimeCheckout({
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      successUrl: input.successUrl,
      failureUrl: input.failureUrl,
      customId: input.orderId,
      planId: `joti_${input.planCode}`,
      planName: PLAN_DISPLAY_NAME[input.planCode] ?? input.planCode,
    });

    const checkoutId = result.json?.data?.id;
    if (!result.ok || !result.json || result.json.code !== "S0000" || !checkoutId) {
      throw new Error(
        `oen_checkout_failed: status=${result.status} code=${result.json?.code ?? "?"} ` +
          `message=${result.json?.message ?? "?"} raw=${result.raw.slice(0, 500)}`,
      );
    }

    return {
      providerCheckoutRef: checkoutId,
      redirectUrl: oneTimeCheckoutRedirectUrl(checkoutId),
    };
  },
};
