"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export type Gateway = "zarinpal" | "mock";

/** Initiates the gateway session and follows the browser redirect. */
export async function startPayment(orderId: string, gateway: Gateway) {
  const res = await api<{ redirect_url: string }>(`/checkout/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify({ gateway }),
  });
  window.location.href = res.redirect_url;
}

/** The two gateway buttons; order creation stays with the caller so the
    order exists exactly once, right before this redirect. */
export function PayGateways({ onPay, busyGateway, disabled }: {
  onPay: (gw: Gateway) => void;
  busyGateway: Gateway | null;
  disabled?: boolean;
}) {
  // one pay attempt at a time: the other gateway must not start a second
  // order while the first request is still in flight
  const busy = busyGateway !== null;
  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm font-medium">انتخاب درگاه پرداخت</p>
      <Button className="w-full" onClick={() => onPay("zarinpal")} disabled={disabled || busy} loading={busyGateway === "zarinpal"}>
        پرداخت با زرین‌پال
      </Button>
      <Button variant="outline" className="w-full" onClick={() => onPay("mock")} disabled={disabled || busy} loading={busyGateway === "mock"}>
        درگاه آزمایشی
      </Button>
      <p className="text-center text-xs text-muted-foreground">درگاه آزمایشی فقط برای تست نصب است.</p>
    </div>
  );
}
