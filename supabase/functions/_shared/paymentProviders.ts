// ECPay integration: Provider routing.
//
// The single place that maps a provider name to its Adapter, so Core
// (create-order-checkout, retry-order-payment) no longer imports one
// specific Adapter by name. Which provider NEW Orders use is config, not
// code: ACTIVE_PAYMENT_PROVIDER (default "oen", i.e. exactly the behaviour
// before ECPay existed). An existing Order always stays with the provider
// recorded on it (orders.provider) -- see retry-order-payment.

import { ECPAY_PROVIDER_NAME, ecpayAdapter } from "./ecpayAdapter.ts";
import { OEN_PROVIDER_NAME, oenAdapter } from "./oenAdapter.ts";
import type { PaymentProviderAdapter } from "./paymentProviderAdapter.ts";

const ADAPTERS: Record<string, PaymentProviderAdapter> = {
  [OEN_PROVIDER_NAME]: oenAdapter,
  [ECPAY_PROVIDER_NAME]: ecpayAdapter,
};

export function activeProviderName(): string {
  return Deno.env.get("ACTIVE_PAYMENT_PROVIDER") ?? OEN_PROVIDER_NAME;
}

export function getProviderAdapter(name: string): PaymentProviderAdapter | null {
  return ADAPTERS[name] ?? null;
}
