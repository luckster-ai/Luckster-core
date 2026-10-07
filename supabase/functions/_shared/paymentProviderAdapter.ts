// Payment Rebuild -- Step 5: Payment Core / Provider Adapter boundary.
//
// This file defines the CONTRACT a Payment Provider Adapter must satisfy.
// It is a TYPE DECLARATION ONLY -- there is no runtime implementation, no
// class, no default export, nothing callable. Step 6 will implement this
// interface for Oen; a future second provider would implement the same
// interface without any change to Payment Core.
//
// Payment Core (create-order-checkout, apply_order_payment, etc.) does not
// import or call anything from this file in Step 5. Order creation
// deliberately stops at status='pending_payment' with no checkout URL, so
// that Core can be built and tested independently of any provider -- see
// the "STEP 6 TODO" comments in create-order-checkout/index.ts and
// retry-order-payment/index.ts for exactly where a future Adapter call
// would be inserted.
//
// Deliberately minimal on purpose: the Adapter only starts a checkout
// attempt for an Order that Core has ALREADY created. It must never create
// Orders, decide pricing, or know about Contract Acceptance -- those stay
// on the Core side of this boundary.

export interface StartCheckoutInput {
  orderId: string;
  paymentAttempt: number;
  amount: number;
  currency: string;
  planCode: string;
  successUrl: string;
  failureUrl: string;
}

// ECPay integration: some providers (ECPay AIO) cannot be started by a
// plain GET redirect -- the browser itself must POST a signed form to the
// provider. `formPost` is optional and additive: when present, the
// frontend submits these fields to `action` instead of navigating to
// `redirectUrl`; Oen never sets it, so its behaviour is unchanged.
export interface CheckoutFormPost {
  action: string;
  fields: Record<string, string>;
}

export interface StartCheckoutResult {
  providerCheckoutRef: string;
  redirectUrl: string;
  formPost?: CheckoutFormPost;
}

export interface PaymentProviderAdapter {
  startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult>;
}
