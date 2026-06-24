# Telegram Order Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save real orders to the database and send a formatted Telegram notification to the orders group immediately upon COD order creation.

**Architecture:** A server action `placeOrder` writes the order (+ items) to Postgres via Prisma, then fire-and-forgets `sendNewOrderNotification` to the Telegram group. `CheckoutView` calls this action instead of the current mock. Online-payment notification is left for the Monobank webhook iteration.

**Tech Stack:** Next.js 15 App Router, Prisma v7, grammy (Telegram bot), Node.js built-in `node:test`

## Global Constraints

- TS strict — no `any`, use `unknown` + narrowing
- Server Components by default; `'use client'` only where state/handlers needed
- All strings in UI via `next-intl` — no hardcoded strings
- Run `npm run lint && npm run typecheck` before considering any task done
- Prisma client import: `import { prisma } from '@/lib/prisma'`
- Telegram bot/chat helpers already in `lib/telegram.ts` — extend there, don't create new files

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `PaymentMethod` enum, `paymentMethod` and `ref` fields to `Order` |
| `app/[locale]/(checkout)/checkout/actions.ts` | Create | `placeOrder` server action |
| `lib/telegram.ts` | Modify | Add `sendNewOrderNotification` + `buildOrderMessage` |
| `lib/telegram.test.ts` | Create | Unit test for `buildOrderMessage` |
| `components/features/checkout/CheckoutView.tsx` | Modify | Wire `placeOrder`, remove mock |
| `.env.example` | Modify | Document `TELEGRAM_ORDER_CHAT_ID` |

---

## Task 1: Schema — add `paymentMethod` and `ref` to Order

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces:
  - `Order.ref: String` — human-readable order reference (`KC-XXXXXX`)
  - `Order.paymentMethod: PaymentMethod` — enum `cod | card`
  - `PaymentMethod` enum available in generated Prisma types at `@/app/generated/prisma`

- [ ] **Step 1: Edit schema**

Open `prisma/schema.prisma`. Add the enum directly above the `Order` model, and add two fields inside `Order`:

```prisma
enum PaymentMethod {
  cod
  card
}

model Order {
  id           String        @id @default(cuid())
  ref          String        @unique
  status       OrderStatus   @default(new)
  paymentMethod PaymentMethod @default(cod)

  customerName String
  phone        String
  email        String
  city         String
  novaPoshta   String
  note         String?       @db.Text

  items       OrderItem[]
  totalAmount Decimal       @db.Decimal(10, 2)

  monoInvoiceId String?
  monoPaidAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([ref])
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-order-ref-payment-method
```

Expected: migration created and applied, no errors.

- [ ] **Step 3: Verify generated types**

```bash
grep -n "paymentMethod\|PaymentMethod\|ref" app/generated/prisma/models/Order.ts | head -20
```

Expected: lines showing `ref`, `paymentMethod`, and `PaymentMethod` type.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Order.ref and Order.paymentMethod to schema"
```

---

## Task 2: Telegram — `sendNewOrderNotification` + `buildOrderMessage`

**Files:**
- Modify: `lib/telegram.ts`
- Create: `lib/telegram.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks at runtime (pure message builder + existing bot helper)
- Produces:
  - `buildOrderMessage(order: OrderForNotification): string` — exported for testing
  - `sendNewOrderNotification(order: OrderForNotification): Promise<void>` — exported, called by server action
  - `OrderForNotification` type — exported interface

```ts
export interface OrderForNotification {
  ref: string;
  customerName: string;
  phone: string;
  city: string;
  novaPoshta: string;
  note: string | null;
  totalAmount: number; // already converted from Decimal
  paymentMethod: 'cod' | 'card';
  monoPaidAt: Date | null;
  items: Array<{
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    qty: number;
  }>;
}
```

- [ ] **Step 1: Write the failing test**

Create `lib/telegram.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderMessage } from "./telegram.ts";

const baseOrder = {
  ref: "KC-ABC123",
  customerName: "Марія Коваль",
  phone: "+380671234567",
  city: "Київ",
  novaPoshta: "№5 — вул. Хрещатик, 1",
  note: null,
  totalAmount: 1600,
  paymentMethod: "cod" as const,
  monoPaidAt: null,
  items: [
    { name: "Сукня", size: "110", color: "рожева", price: 1200, qty: 1 },
    { name: "Обідок", size: null, color: null, price: 200, qty: 2 },
  ],
};

test("buildOrderMessage includes order ref", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("KC-ABC123"), "should contain ref");
});

test("buildOrderMessage includes customer name and phone", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Марія Коваль"));
  assert.ok(msg.includes("+380671234567"));
});

test("buildOrderMessage formats COD payment", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Постоплата"));
  assert.ok(!msg.includes("Онлайн"));
});

test("buildOrderMessage formats card payment as paid", () => {
  const msg = buildOrderMessage({
    ...baseOrder,
    paymentMethod: "card",
    monoPaidAt: new Date(),
  });
  assert.ok(msg.includes("Онлайн"));
  assert.ok(msg.includes("Оплачено"));
});

test("buildOrderMessage shows note only when present", () => {
  const withNote = buildOrderMessage({ ...baseOrder, note: "подарунок" });
  assert.ok(withNote.includes("подарунок"));

  const withoutNote = buildOrderMessage({ ...baseOrder, note: null });
  assert.ok(!withoutNote.includes("Примітка"));
});

test("buildOrderMessage includes item lines with price", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Сукня"));
  assert.ok(msg.includes("1 200"));
  assert.ok(msg.includes("1 600"));
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test lib/telegram.test.ts
```

Expected: `ReferenceError` or `SyntaxError` — `buildOrderMessage` not exported yet.

- [ ] **Step 3: Add `OrderForNotification`, `buildOrderMessage`, `sendNewOrderNotification` to `lib/telegram.ts`**

Add after the existing imports and before `getBot()`:

```ts
export interface OrderForNotification {
  ref: string;
  customerName: string;
  phone: string;
  city: string;
  novaPoshta: string;
  note: string | null;
  totalAmount: number;
  paymentMethod: 'cod' | 'card';
  monoPaidAt: Date | null;
  items: Array<{
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    qty: number;
  }>;
}

function getOrderChatId(): string {
  const id = process.env.TELEGRAM_ORDER_CHAT_ID;
  if (!id) throw new Error("TELEGRAM_ORDER_CHAT_ID is not set");
  return id;
}

export function buildOrderMessage(order: OrderForNotification): string {
  const fmt = (n: number) =>
    n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const itemLines = order.items
    .map((i) => {
      const attrs = [i.size, i.color].filter(Boolean).join(', ');
      const label = attrs ? `${i.name} (${attrs})` : i.name;
      return `• ${label} × ${i.qty} — ${fmt(i.price * i.qty)} ₴`;
    })
    .join('\n');

  const paymentLine =
    order.paymentMethod === 'cod'
      ? '💳 <b>Оплата:</b> Постоплата (при отриманні)'
      : '💳 <b>Оплата:</b> Онлайн — ✅ Оплачено';

  const noteLine = order.note
    ? `\n📝 <i>Примітка: ${order.note}</i>`
    : '';

  return [
    `🛍 <b>Нове замовлення #${order.ref}</b>`,
    '',
    `👤 <b>Замовник</b>`,
    `Ім'я: ${order.customerName}`,
    `Телефон: ${order.phone}`,
    '',
    `📦 <b>Товари</b>`,
    itemLines,
    '',
    `💰 <b>Сума: ${fmt(order.totalAmount)} ₴</b>`,
    '',
    `🚚 <b>Доставка</b>`,
    `${order.city}, Нова Пошта ${order.novaPoshta}`,
    '',
    paymentLine,
    noteLine,
  ]
    .join('\n')
    .trim();
}

export async function sendNewOrderNotification(order: OrderForNotification): Promise<void> {
  const text = buildOrderMessage(order);
  await getBot().api.sendMessage(getOrderChatId(), text, { parse_mode: 'HTML' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test lib/telegram.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/telegram.ts lib/telegram.test.ts
git commit -m "feat: add sendNewOrderNotification with message builder"
```

---

## Task 3: Server action — `placeOrder`

**Files:**
- Create: `app/[locale]/(checkout)/checkout/actions.ts`

**Interfaces:**
- Consumes:
  - `CartItem` from `@/lib/stores/cart` — `{ productId, variantId, name, size, fabric, color, price, qty, imageUrl }`
  - `prisma` from `@/lib/prisma`
  - `sendNewOrderNotification`, `OrderForNotification` from `@/lib/telegram`
  - `PaymentMethod` enum from `@/app/generated/prisma`
- Produces:
  - `placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult>`
  - `PlaceOrderPayload` — exported type
  - `PlaceOrderResult` — `{ orderId: string; ref: string }` on success, `{ error: string }` on validation failure

- [ ] **Step 1: Create the server action file**

```ts
'use server';

import { prisma } from '@/lib/prisma';
import { sendNewOrderNotification } from '@/lib/telegram';
import type { CartItem } from '@/lib/stores/cart';

export interface PlaceOrderPayload {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;         // city name, e.g. "Київ"
  novaPoshta: string;   // branch description, e.g. "№5 — вул. Хрещатик, 1"
  note: string;
  paymentMethod: 'cod' | 'card';
  items: CartItem[];
}

export type PlaceOrderResult =
  | { orderId: string; ref: string }
  | { error: string };

function isValidPhone(p: string): boolean {
  return /^\+380\d{9}$/.test(p.replace(/\s/g, ''));
}

function generateRef(): string {
  return `KC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  // ── Validate ────────────────────────────────────────────────────────────────
  if (!payload.firstName.trim()) return { error: 'Вкажіть ім\'я' };
  if (!isValidPhone(payload.phone)) return { error: 'Невірний номер телефону' };
  if (!payload.city.trim()) return { error: 'Вкажіть місто' };
  if (!payload.novaPoshta.trim()) return { error: 'Вкажіть відділення' };
  if (!payload.items.length) return { error: 'Кошик порожній' };

  const totalAmount = payload.items.reduce((s, i) => s + i.price * i.qty, 0);
  const ref = generateRef();

  // ── Persist ─────────────────────────────────────────────────────────────────
  let order: { id: string; ref: string };
  try {
    order = await prisma.order.create({
      data: {
        ref,
        customerName: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
        phone: payload.phone.replace(/\s/g, ''),
        email: '',           // collected at checkout? currently not in form — leave empty
        city: payload.city,
        novaPoshta: payload.novaPoshta,
        note: payload.note.trim() || null,
        paymentMethod: payload.paymentMethod,
        totalAmount,
        items: {
          create: payload.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            name: i.name,
            size: i.size ?? undefined,
            fabric: i.fabric ?? undefined,
            color: i.color ?? undefined,
            price: i.price,
            qty: i.qty,
          })),
        },
      },
      select: { id: true, ref: true },
    });
  } catch (err) {
    console.error('[placeOrder] DB error', err);
    return { error: 'Помилка збереження замовлення. Спробуйте ще раз.' };
  }

  // ── Notify (fire-and-forget for COD) ────────────────────────────────────────
  if (payload.paymentMethod === 'cod') {
    void sendNewOrderNotification({
      ref: order.ref,
      customerName: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
      phone: payload.phone.replace(/\s/g, ''),
      city: payload.city,
      novaPoshta: payload.novaPoshta,
      note: payload.note.trim() || null,
      totalAmount,
      paymentMethod: 'cod',
      monoPaidAt: null,
      items: payload.items.map((i) => ({
        name: i.name,
        size: i.size,
        color: i.color,
        price: i.price,
        qty: i.qty,
      })),
    }).catch((err) => console.error('[placeOrder] Telegram error', err));
  }

  return { orderId: order.id, ref: order.ref };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. If Prisma complains about `email` being required but empty — check: `email` is `String` (non-nullable) in schema. If so, this is fine since we pass `''`. If `OrderItem.variantId` complains about `undefined` vs `null` — change to `variantId: i.variantId ?? null`.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(checkout)/checkout/actions.ts"
git commit -m "feat: add placeOrder server action with DB write and Telegram notification"
```

---

## Task 4: Wire `CheckoutView` to `placeOrder`

**Files:**
- Modify: `components/features/checkout/CheckoutView.tsx`

**Interfaces:**
- Consumes: `placeOrder`, `PlaceOrderPayload` from `@/app/[locale]/(checkout)/checkout/actions` (note: import path must be locale-agnostic — use `@/app/[locale]/(checkout)/checkout/actions` or move actions to a shared location if this fails; if Next.js rejects the import, move the file to `lib/orders/actions.ts`)

> **Import path note:** Next.js server actions can be imported from client components using any relative or alias path — the `[locale]` bracket in the path is fine at import time since it resolves at build time.

- [ ] **Step 1: Add import and wire `handleSubmit`**

In `CheckoutView.tsx`, add the import near the top:

```ts
import { placeOrder } from '@/app/[locale]/(checkout)/checkout/actions';
```

Replace the entire `handleSubmit` function (lines 187–212) with:

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setTouched({ firstName: true, lastName: true, phone: true, city: true, branch: true });
  if (!formValid) {
    const first = document.querySelector('[data-invalid="true"]');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (form.payment === 'card') return;

  setSubmitting(true);
  setSubmitted(true);

  const result = await placeOrder({
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    city: form.city?.name ?? '',
    novaPoshta: form.branch ? `№${form.branch.number} — ${form.branch.description}` : '',
    note: '',
    paymentMethod: form.payment,
    items,
  });

  if ('error' in result) {
    setSubmitting(false);
    setSubmitted(false);
    // Show the error — add state for it
    setServerError(result.error);
    return;
  }

  router.push(`/${locale}/order-success?ref=${result.ref}`);
  clearCart();
}
```

- [ ] **Step 2: Add `serverError` state and error UI**

Add state near the other `useState` calls:

```ts
const [serverError, setServerError] = useState<string | null>(null);
```

Add error display just before the closing `</form>` tag's spacer div (before `{/* Spacer for mobile sticky bar */}`):

```tsx
{serverError && (
  <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
    <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-float">
      {serverError}
    </div>
  </div>
)}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. Common issue: `form.payment` is `PayMethod = 'card' | 'cod'` but `PlaceOrderPayload.paymentMethod` is `'cod' | 'card'` — same type, no error expected.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/features/checkout/CheckoutView.tsx
git commit -m "feat: wire CheckoutView to placeOrder server action"
```

---

## Task 5: Environment — add `TELEGRAM_ORDER_CHAT_ID` to `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**

Find the `# ── Telegram` section in `.env.example` and replace it with:

```env
# ── Telegram ───────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ADMIN_CHAT_ID=""   # personal chat — callback requests, couture alerts
TELEGRAM_ORDER_CHAT_ID=""   # group chat for new order notifications (negative int)
```

- [ ] **Step 2: Add the real value to your local `.env`**

```env
TELEGRAM_ORDER_CHAT_ID=-5269101876
```

(Also regenerate `TELEGRAM_BOT_TOKEN` via @BotFather `/revoke` and update `.env` with the new token.)

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: document TELEGRAM_ORDER_CHAT_ID in .env.example"
```

---

## Task 6: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Place a test COD order**

Navigate to `/catalog`, add an item to the cart, go to `/checkout`. Fill in:
- Ім'я: Тест
- Телефон: +380671234567
- Місто: Київ (any branch)
- Оплата: Постоплата

Click submit.

Expected:
- Redirect to `/order-success?ref=KC-XXXXXX`
- Order ref shown on success page
- Telegram message arrives in the group within a few seconds

- [ ] **Step 3: Verify DB record**

```bash
npx prisma studio
```

Open the `Order` table. Confirm the new order has correct `ref`, `paymentMethod = cod`, all `orderItems`.

- [ ] **Step 4: Verify error state**

Temporarily break `TELEGRAM_ORDER_CHAT_ID` in `.env` (set to `invalid`). Place another order. Expected: order saves to DB and redirect succeeds, but a `[placeOrder] Telegram error` appears in server logs. Restore the correct value.

- [ ] **Step 5: Final lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: no errors.
