import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName: string;
  orderId: string;
  totalAmount: number;
}): Promise<void> {
  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? "orders@kiddiechic.ua",
    to:      opts.to,
    subject: `Замовлення №${opts.orderId} прийнято — Kiddie Chic`,
    // HTML template to be added in the design phase
    html: `<p>Дякуємо, ${opts.customerName}! Ваше замовлення №${opts.orderId} на суму ${opts.totalAmount} ₴ прийнято в обробку.</p>`,
  });
}
