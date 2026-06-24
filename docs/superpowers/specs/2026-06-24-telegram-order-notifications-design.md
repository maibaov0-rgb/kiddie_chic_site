# Telegram Order Notifications — Design

**Date:** 2026-06-24
**Status:** Approved

## Overview

Send a formatted Telegram message to a dedicated group whenever a new order is placed. COD orders notify immediately on creation; online-payment orders notify after the Monobank webhook confirms payment (implemented in a separate iteration).

This feature also completes real order persistence — the checkout currently mocks DB writes with a `console.log`.

---

## 1. Database Schema Change

Add `paymentMethod` enum and field to `Order`:

```prisma
enum PaymentMethod {
  cod   // Cash on delivery (постоплата)
  card  // Online via Monobank
}

model Order {
  // existing fields unchanged
  paymentMethod PaymentMethod @default(cod)
}
```

Migration: `npx prisma migrate dev --name add-order-payment-method`

---

## 2. Server Action

**File:** `app/[locale]/(checkout)/checkout/actions.ts`

```ts
'use server'
export async function placeOrder(payload: PlaceOrderPayload): Promise<{ orderId: string; ref: string }>
```

**PlaceOrderPayload:**
- `firstName`, `lastName`, `phone`
- `city` (name string)
- `novaPoshta` (branch description string)
- `paymentMethod: 'cod' | 'card'`
- `items: CartItem[]` — snapshot from Zustand cart store

**Logic:**
1. Server-side validation (phone format, required fields, non-empty items)
2. `prisma.order.create` with nested `orderItems` (snapshot: name, size, fabric, color, price, qty)
3. Generate `ref = KC-${timestamp base36 slice}` — same format as current mock
4. Add `ref String @unique` to `Order` in the same migration as `paymentMethod` — it's shown to the customer on the success page and in Telegram messages
5. If `paymentMethod === 'cod'`: `void sendNewOrderNotification(order)` (fire-and-forget, errors logged but do not throw)
6. Return `{ orderId, ref }` → client redirects to `/order-success?ref=...`

---

## 3. Telegram Notification

**File:** `lib/telegram.ts` — add `sendNewOrderNotification`

**New env var:** `TELEGRAM_ORDER_CHAT_ID` (group chat, negative ID e.g. `-5269101876`)
Existing `TELEGRAM_ADMIN_CHAT_ID` stays for personal notifications (callback requests, couture).

**Message format (HTML parse mode):**

```
🛍 <b>Нове замовлення #KC-ABC123</b>

👤 <b>Замовник</b>
Ім'я: Марія Коваль
Телефон: +380671234567

📦 <b>Товари</b>
• Сукня "Ніжність", р.110, рожева × 1 — 1 200 ₴
• Обідок з бантом × 2 — 400 ₴

💰 <b>Сума: 1 600 ₴</b>

🚚 <b>Доставка</b>
Київ, Нова Пошта №5
вул. Хрещатик, 1

💳 <b>Оплата:</b> Постоплата (при отриманні)

📝 <i>Примітка: подарунок, прошу загорнути</i>
```

For online payment (called from Monobank webhook later):
```
💳 <b>Оплата:</b> Онлайн — ✅ Оплачено
```

Note field shown only if non-empty.

---

## 4. CheckoutView Changes

`CheckoutView.tsx` `handleSubmit`:
- Replace mock `console.log` + fake timeout with `await placeOrder(payload)`
- Pass `form.payment` as `paymentMethod`
- Use returned `ref` in the redirect URL
- Error handling: catch action errors, show inline error message to user (don't redirect)

---

## 5. Monobank Webhook (stub for future iteration)

**File:** `app/api/webhooks/monobank/route.ts`

When implemented:
1. Verify `X-Sign` signature (HMAC-SHA512 with public key — documented separately)
2. On `status === 'success'`: find order by `monoInvoiceId`, update status to `paid`, set `monoPaidAt`
3. Call `sendNewOrderNotification(order)` with payment method `card` (shows "Онлайн — ✅ Оплачено")

Current iteration: leave as stub — do not implement in this plan.

---

## 6. Environment Variables

Add to `.env` and `.env.example`:

```env
TELEGRAM_ORDER_CHAT_ID=      # Telegram group for order notifications (negative int)
```

`.env.example` should document both:
```env
TELEGRAM_BOT_TOKEN=           # Bot token from @BotFather
TELEGRAM_ADMIN_CHAT_ID=       # Personal chat for callback/couture alerts
TELEGRAM_ORDER_CHAT_ID=       # Group chat for new order notifications
```

---

## 7. Out of Scope

- Monobank invoice creation (online payment flow) — separate feature
- Monobank webhook signature verification — separate feature
- Email notifications — separate feature
- Order status updates via Telegram — separate feature
