import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/hutko";
import { sendNewOrderNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const password = process.env.HUTKO_MERCHANT_PASSWORD;
  if (!password) {
    console.error("[hutko webhook] HUTKO_MERCHANT_PASSWORD is not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[hutko webhook] invalid JSON body", err);
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!verifySignature(password, payload)) {
    console.error("[hutko webhook] invalid signature", payload);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const orderRef = payload.order_id;
  const orderStatus = payload.order_status;
  const paymentId = payload.payment_id;
  if (typeof orderRef !== "string") {
    return NextResponse.json({ error: "missing order_id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { ref: orderRef },
    include: { items: true, accessoryItems: true },
  });
  if (!order) {
    console.error("[hutko webhook] order not found", orderRef);
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  // Idempotent: a final state was already recorded, ignore retried callbacks.
  if (order.status === "paid" || order.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }

  if (orderStatus === "approved") {
    const paidAt = new Date();
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paymentInvoiceId: paymentId === undefined || paymentId === null ? null : String(paymentId),
        paidAt,
      },
    });

    await sendNewOrderNotification({
      ref: order.ref,
      customerName: order.customerName,
      phone: order.phone,
      city: order.city,
      novaPoshta: order.novaPoshta,
      note: order.note,
      totalAmount: order.totalAmount.toNumber(),
      paymentMethod: "card",
      paidAt,
      items: [
        ...order.items.map((i) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          price: i.price.toNumber(),
          qty: i.qty,
        })),
        ...order.accessoryItems.map((i) => ({
          name: i.name,
          size: null,
          color: null,
          price: i.price.toNumber(),
          qty: i.qty,
        })),
      ],
    }).catch((err) => console.error("[hutko webhook] Telegram error", err));
  } else if (orderStatus === "declined" || orderStatus === "expired") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "cancelled" },
    });
  }
  // Other statuses (created/processing/reversed) are transient or out of
  // scope — acknowledge without changing Order state.

  return NextResponse.json({ ok: true });
}
