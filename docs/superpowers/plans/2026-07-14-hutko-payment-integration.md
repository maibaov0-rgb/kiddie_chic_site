# Hutko Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire real card-payment checkout using Hutko (ПУМБ) test acquiring: server-side payment creation (Schema B, host-to-host), signed webhook confirmation, and Order status updates.

**Architecture:** `placeOrder` creates the `Order` (unchanged for COD). For card payment, a new `createHutkoPayment` server action signs and POSTs to Hutko's `checkout/url/` endpoint and returns a `checkout_url` for the client to redirect to. Hutko confirms payment asynchronously via a signed server-to-server callback to `app/api/webhooks/hutko/route.ts`, which flips `Order.status` and fires the existing Telegram notification. All signature logic (SHA1, alphabetical `|`-joined) lives in one pure module (`lib/hutko.ts`) so it can be unit-tested without a live Hutko account.

**Tech Stack:** Next.js 16 App Router (server actions + route handlers), Prisma (PostgreSQL), `node:test` + `node:assert/strict` (existing project test convention, run via `npx tsx --test`), `node:crypto` for SHA1.

## Global Constraints

- TS strict — no `any`, use `unknown` + narrowing (CLAUDE.md Code style)
- Payment requests only from server actions / route handlers, never from the client (CLAUDE.md Безпека)
- Webhook signature verification is mandatory (CLAUDE.md Безпека — Monobank rule now applies to Hutko)
- All UI copy through next-intl, no hardcoded strings in JSX (CLAUDE.md Code style) — existing hardcoded Ukrainian error strings inside `checkout/actions.ts` are pre-existing convention for server-action error messages and are followed as-is, not introduced fresh here
- `npm run lint && npm run typecheck` before considering any task done (CLAUDE.md Команди)
- Buttons `rounded-full` or `rounded-2xl` minimum, tap targets ≥ 44×44px, soft transitions (CLAUDE.md Дизайн / Mobile-first)
- Secrets only in `.env`, keep `.env.example` current, never commit real secrets (CLAUDE.md Безпека)

---

### Task 1: Rename Order payment fields + migration

**Files:**
- Modify: `prisma/schema.prisma:166-167`
- Migration: created by `npx prisma migrate dev`

**Interfaces:**
- Produces: `Order.paymentInvoiceId: String?`, `Order.paidAt: DateTime?` (replaces `monoInvoiceId`/`monoPaidAt`) — every later task reads/writes these two field names.

- [ ] **Step 1: Rename the fields in the schema**

In `prisma/schema.prisma`, inside `model Order`, replace:

```prisma
  monoInvoiceId String?
  monoPaidAt    DateTime?
```

with:

```prisma
  paymentInvoiceId String?
  paidAt           DateTime?
```

- [ ] **Step 2: Generate and apply the migration**

Run: `npx prisma migrate dev --name rename_mono_fields_to_payment`
Expected: prompts create a new folder under `prisma/migrations/`, applies it to the local dev DB, and reports `Your database is now in sync with your schema.` followed by Prisma Client generation output.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors referencing `monoInvoiceId`/`monoPaidAt` yet (nothing else has been touched, so this should still pass — the old field names aren't referenced via the Prisma client type until later tasks compile against it).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): rename Order mono* payment fields to provider-neutral names"
```

---

### Task 2: `lib/hutko.ts` — signature + payment creation

**Files:**
- Create: `lib/hutko.ts`
- Test: `lib/hutko.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces:
  - `buildSignature(password: string, params: Record<string, string | number | undefined | null>): string`
  - `verifySignature(password: string, payload: Record<string, unknown>): boolean`
  - `interface CreateHutkoPaymentParams { orderId: string; amount: number; orderDesc: string; responseUrl: string; serverCallbackUrl: string }`
  - `type CreateHutkoPaymentResult = { checkoutUrl: string } | { error: string }`
  - `createHutkoPayment(params: CreateHutkoPaymentParams): Promise<CreateHutkoPaymentResult>`
- Consumes: `process.env.HUTKO_MERCHANT_ID`, `process.env.HUTKO_MERCHANT_PASSWORD`

- [ ] **Step 1: Write the failing tests**

Create `lib/hutko.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSignature, verifySignature } from "./hutko.ts";

// Known-good example straight from docs.hutko.org ("Формування підпису"):
// raw string "test|125|USD|1396424|test order|test123456" → sha1 → this hex
const DOC_EXAMPLE_HASH = "df38818facfbfd79953fa847667dac73a1291127".slice(0, 40);

test("buildSignature matches the documented example string and hash", () => {
  const sig = buildSignature("test", {
    order_id: "test123456",
    order_desc: "test order",
    currency: "USD",
    amount: "125",
    merchant_id: "1396424",
  });
  assert.equal(sig, DOC_EXAMPLE_HASH);
});

test("buildSignature ignores field order in the input object", () => {
  const a = buildSignature("test", { amount: "125", currency: "USD", merchant_id: "1396424", order_desc: "test order", order_id: "test123456" });
  const b = buildSignature("test", { order_id: "test123456", merchant_id: "1396424", currency: "USD", order_desc: "test order", amount: "125" });
  assert.equal(a, b);
});

test("buildSignature excludes empty/undefined/null fields but keeps '0'", () => {
  const withEmpty = buildSignature("pw", { a: "1", b: "", c: undefined, d: null, e: 0 });
  const withoutEmpty = buildSignature("pw", { a: "1", e: 0 });
  assert.equal(withEmpty, withoutEmpty);
});

test("verifySignature returns true for a self-signed payload", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(verifySignature("test", { ...params, signature }), true);
});

test("verifySignature ignores signature/response_signature_string when recomputing", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(
    verifySignature("test", { ...params, signature, response_signature_string: "***|irrelevant" }),
    true,
  );
});

test("verifySignature returns false when a field is tampered with", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(verifySignature("test", { ...params, amount: "99999", signature }), false);
});

test("verifySignature returns false when signature is missing", () => {
  assert.equal(verifySignature("test", { order_id: "KC-TEST1" }), false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test lib/hutko.test.ts`
Expected: FAIL — `Cannot find module './hutko.ts'` (file doesn't exist yet)

- [ ] **Step 3: Implement `lib/hutko.ts`**

```typescript
import { createHash } from "node:crypto";

const CHECKOUT_URL_ENDPOINT = "https://pay.hutko.org/api/checkout/url/";

function getMerchantId(): string {
  const id = process.env.HUTKO_MERCHANT_ID;
  if (!id) throw new Error("HUTKO_MERCHANT_ID is not set");
  return id;
}

function getMerchantPassword(): string {
  const password = process.env.HUTKO_MERCHANT_PASSWORD;
  if (!password) throw new Error("HUTKO_MERCHANT_PASSWORD is not set");
  return password;
}

/**
 * SHA1(password|value1|value2|...) where values are every non-empty param
 * (excluding signature/response_signature_string), sorted by key, joined by "|".
 * https://docs.hutko.org/uk/docs/page/3/ — "Формування підпису запиту і відповіді"
 */
export function buildSignature(
  password: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const values = Object.entries(params)
    .filter(([key]) => key !== "signature" && key !== "response_signature_string")
    .filter(([, value]) => value !== undefined && value !== null && String(value) !== "")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, value]) => String(value));
  const raw = [password, ...values].join("|");
  return createHash("sha1").update(raw, "utf8").digest("hex").toLowerCase();
}

export function verifySignature(password: string, payload: Record<string, unknown>): boolean {
  const signature = payload.signature;
  if (typeof signature !== "string" || signature.length === 0) return false;

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === "signature" || key === "response_signature_string") continue;
    if (value === undefined || value === null) continue;
    params[key] = String(value);
  }
  return buildSignature(password, params) === signature.toLowerCase();
}

export interface CreateHutkoPaymentParams {
  orderId: string;
  /** Order total in UAH, e.g. 1250.5 */
  amount: number;
  orderDesc: string;
  responseUrl: string;
  serverCallbackUrl: string;
}

export type CreateHutkoPaymentResult = { checkoutUrl: string } | { error: string };

export async function createHutkoPayment(
  params: CreateHutkoPaymentParams,
): Promise<CreateHutkoPaymentResult> {
  const merchantId = getMerchantId();
  const password = getMerchantPassword();
  const amountKopecks = Math.round(params.amount * 100);

  const requestParams: Record<string, string> = {
    merchant_id: merchantId,
    order_id: params.orderId,
    order_desc: params.orderDesc,
    amount: String(amountKopecks),
    currency: "UAH",
    response_url: params.responseUrl,
    server_callback_url: params.serverCallbackUrl,
    version: "1.0.1",
  };
  const signature = buildSignature(password, requestParams);

  let res: Response;
  try {
    res = await fetch(CHECKOUT_URL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: { ...requestParams, signature } }),
    });
  } catch (err) {
    console.error("[createHutkoPayment] network error", err);
    return { error: "Не вдалося зв'язатися з платіжним сервісом. Спробуйте ще раз." };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error("[createHutkoPayment] invalid JSON response", err);
    return { error: "Платіжний сервіс повернув некоректну відповідь." };
  }

  const response = (json as { response?: Record<string, unknown> }).response;
  if (!response || response.response_status !== "success" || typeof response.checkout_url !== "string") {
    console.error("[createHutkoPayment] failure response", json);
    return { error: "Не вдалося створити платіж. Спробуйте ще раз." };
  }

  return { checkoutUrl: response.checkout_url };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test lib/hutko.test.ts`
Expected: `# pass 7`, `# fail 0`

- [ ] **Step 5: Update `.env.example`**

In `.env.example`, replace:

```
# ── Monobank Acquiring ─────────────────────────────────────────────────────────
MONOBANK_TOKEN=""
MONOBANK_WEBHOOK_SECRET=""  # for X-Sign signature verification
```

with:

```
# ── Hutko Acquiring (ПУМБ) ───────────────────────────────────────────────────────
HUTKO_MERCHANT_ID=""
HUTKO_MERCHANT_PASSWORD=""
```

Then add the same two keys to your local `.env` (not committed) with the test values for manual verification later: `HUTKO_MERCHANT_ID=1700002`, `HUTKO_MERCHANT_PASSWORD=test`.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add lib/hutko.ts lib/hutko.test.ts .env.example
git commit -m "feat(payments): add Hutko signature and payment-creation helpers"
```

---

### Task 3: Rename `monoPaidAt` in `lib/telegram.ts`

**Files:**
- Modify: `lib/telegram.ts:20-37,52-94`
- Modify: `lib/telegram.test.ts`

**Interfaces:**
- Produces: `OrderForNotification.paidAt: Date | null` (replaces `monoPaidAt`) — consumed by Task 4 and Task 5.
- Consumes: nothing new.

- [ ] **Step 1: Update the existing test file to use the new field name**

In `lib/telegram.test.ts`, replace both occurrences of `monoPaidAt` with `paidAt` (line 14 in `baseOrder`, line 42 in the "formats card payment as paid" test):

```typescript
const baseOrder = {
  ref: "KC-ABC123",
  customerName: "Марія Коваль",
  phone: "+380671234567",
  city: "Київ",
  novaPoshta: "№5 — вул. Хрещатик, 1",
  note: null,
  totalAmount: 1600,
  paymentMethod: "cod" as const,
  paidAt: null,
  items: [
    { name: "Сукня", size: "110", color: "рожева", price: 1200, qty: 1 },
    { name: "Обідок", size: null, color: null, price: 200, qty: 2 },
  ],
};
```

```typescript
test("buildOrderMessage formats card payment as paid", () => {
  const msg = buildOrderMessage({
    ...baseOrder,
    paymentMethod: "card",
    paidAt: new Date(),
  });
  assert.ok(msg.includes("Онлайн"));
  assert.ok(msg.includes("Оплачено"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test lib/telegram.test.ts`
Expected: FAIL — TypeScript error, `paidAt` does not exist on the `OrderForNotification` type used by `buildOrderMessage` (still named `monoPaidAt` in `lib/telegram.ts`)

- [ ] **Step 3: Rename the field in `lib/telegram.ts`**

In `lib/telegram.ts`, in `OrderForNotification` (line 29), replace:

```typescript
  monoPaidAt: Date | null;
```

with:

```typescript
  paidAt: Date | null;
```

`buildOrderMessage` doesn't read this field directly (it only branches on `paymentMethod`), so no other change is needed in that function.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test lib/telegram.test.ts`
Expected: `# pass 7`, `# fail 0`

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: errors in `app/[locale]/(checkout)/checkout/actions.ts` referencing `monoPaidAt` — this is expected and gets fixed in Task 4.

- [ ] **Step 6: Commit**

```bash
git add lib/telegram.ts lib/telegram.test.ts
git commit -m "refactor(telegram): rename monoPaidAt to paidAt"
```

---

### Task 4: `createHutkoPayment` server action + gate COD-only Telegram notification

**Files:**
- Modify: `app/[locale]/(checkout)/checkout/actions.ts`

**Interfaces:**
- Consumes: `createHutkoPayment` (aliased) and `CreateHutkoPaymentResult` from `lib/hutko.ts` (Task 2); `routing`/`Locale` from `@/i18n/routing`; `prisma` from `@/lib/prisma`; `Order.paymentInvoiceId`/`paidAt` (Task 1).
- Produces: `export async function createHutkoPayment(orderId: string, locale: Locale): Promise<{ checkoutUrl: string } | { error: string }>` — consumed by Task 6 (`CheckoutView.tsx`).

- [ ] **Step 1: Add the import and gate the Telegram notification to `cod` only**

At the top of `app/[locale]/(checkout)/checkout/actions.ts`, add the new imports next to the existing ones:

```typescript
import { createHutkoPayment as requestHutkoCheckout } from '@/lib/hutko';
import { routing, type Locale } from '@/i18n/routing';
```

The `sendNewOrderNotification` call at the bottom of `placeOrder` (currently `if (payload.paymentMethod === 'cod') { ... }`) is already gated to `cod` only — no change needed there. Card notifications will be sent from the webhook in Task 5 instead.

- [ ] **Step 2: Add the `createHutkoPayment` server action**

Append to the end of `app/[locale]/(checkout)/checkout/actions.ts`:

```typescript
export async function createHutkoPayment(
  orderId: string,
  locale: Locale,
): Promise<{ checkoutUrl: string } | { error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { ref: true, status: true, totalAmount: true },
  });
  if (!order) return { error: 'Замовлення не знайдено' };
  if (order.status !== 'new') return { error: 'Це замовлення вже оброблено' };

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const localePath = locale === routing.defaultLocale ? '' : `/${locale}`;

  const amount =
    typeof order.totalAmount === 'number' ? order.totalAmount : order.totalAmount.toNumber();

  return requestHutkoCheckout({
    orderId: order.ref,
    amount,
    orderDesc: `Замовлення ${order.ref} — Kiddie Chic`,
    responseUrl: `${appUrl}${localePath}/order-success?ref=${order.ref}`,
    serverCallbackUrl: `${appUrl}/api/webhooks/hutko`,
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors (the earlier `monoPaidAt`/`monoInvoiceId` errors from Task 1/3 are now resolved since this file no longer references them — confirm by grepping)

Run: `grep -n "mono" "app/[locale]/(checkout)/checkout/actions.ts"`
Expected: no output

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(checkout)/checkout/actions.ts"
git commit -m "feat(checkout): add createHutkoPayment server action"
```

---

### Task 5: `app/api/webhooks/hutko/route.ts` — signed callback handler

**Files:**
- Create: `app/api/webhooks/hutko/route.ts`
- Delete: `app/api/webhooks/monobank/route.ts`

**Interfaces:**
- Consumes: `verifySignature` from `lib/hutko.ts` (Task 2); `prisma` from `@/lib/prisma`; `sendNewOrderNotification`, `OrderForNotification` from `@/lib/telegram` (Task 3); `Order.paymentInvoiceId`/`paidAt` (Task 1).
- Produces: `POST /api/webhooks/hutko` route — target of `server_callback_url` set in Task 4.

- [ ] **Step 1: Delete the old Monobank stub**

```bash
rm "app/api/webhooks/monobank/route.ts"
```

- [ ] **Step 2: Create the Hutko webhook route**

Create `app/api/webhooks/hutko/route.ts`:

```typescript
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/hutko/route.ts
git rm app/api/webhooks/monobank/route.ts
git commit -m "feat(payments): add signed Hutko webhook handler, remove Monobank stub"
```

---

### Task 6: Enable card payment in `CheckoutView.tsx`

**Files:**
- Modify: `components/features/checkout/CheckoutView.tsx`
- Modify: `messages/uk.json:132-136`
- Modify: `messages/en.json:132-136`

**Interfaces:**
- Consumes: `createHutkoPayment(orderId: string, locale: Locale)` from Task 4; `placeOrder` (unchanged, existing).
- Produces: nothing consumed elsewhere — UI leaf.

- [ ] **Step 1: Update translation files**

In `messages/uk.json`, replace:

```json
    "payCardBadge": "Скоро",
```

with:

```json
    "payCardRetry": "Спробувати ще раз",
```

In `messages/en.json`, replace:

```json
    "payCardBadge": "Soon",
```

with:

```json
    "payCardRetry": "Try again",
```

- [ ] **Step 2: Enable the card `PayCard` option**

In `components/features/checkout/CheckoutView.tsx`, replace the card `PayCard` (around line 417-425):

```tsx
            <PayCard
              selected={form.payment === 'card'}
              disabled
              icon={<CreditCard size={20} />}
              title={t('payCardTitle')}
              subtitle={t('payCardSubtitle')}
              badge={t('payCardBadge')}
              onClick={() => undefined}
            />
```

with:

```tsx
            <PayCard
              selected={form.payment === 'card'}
              icon={<CreditCard size={20} />}
              title={t('payCardTitle')}
              subtitle={t('payCardSubtitle')}
              onClick={() => setField('payment', 'card')}
            />
```

Remove the now-unused `badge`/`disabled` handling from the `PayCard` component definition at the bottom of the file (around line 598-644) — replace:

```tsx
function PayCard({
  selected, disabled, icon, title, subtitle, badge, onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative flex items-start gap-3 rounded-3xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        selected
          ? 'border-gold bg-gold/5'
          : disabled
            ? 'cursor-not-allowed border-foreground/10 bg-foreground/3 opacity-60'
            : 'border-foreground/15 bg-white hover:border-gold/50'
      }`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-gold text-white' : 'bg-powder-100 text-gold'}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-foreground/55">{subtitle}</span>
      </span>
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white">
          <Check size={14} />
        </span>
      )}
    </button>
  );
}
```

with:

```tsx
function PayCard({
  selected, icon, title, subtitle, onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex items-start gap-3 rounded-3xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        selected
          ? 'border-gold bg-gold/5'
          : 'border-foreground/15 bg-white hover:border-gold/50'
      }`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-gold text-white' : 'bg-powder-100 text-gold'}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-foreground/55">{subtitle}</span>
      </span>
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white">
          <Check size={14} />
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Wire the card-payment flow into submit handling**

In `components/features/checkout/CheckoutView.tsx`, update the import line (currently `import { placeOrder } from '@/app/[locale]/(checkout)/checkout/actions';`) to:

```tsx
import { placeOrder, createHutkoPayment } from '@/app/[locale]/(checkout)/checkout/actions';
import type { Locale } from '@/i18n/routing';
```

Add new state next to the existing `serverError` state (around line 62):

```tsx
  const [hutkoRetry, setHutkoRetry] = useState<{ id: string; ref: string } | null>(null);
```

Add a new helper function above `handleSubmit` (around line 188):

```tsx
  async function attemptHutkoPayment(orderId: string, ref: string) {
    setServerError(null);
    setSubmitting(true);
    const result = await createHutkoPayment(orderId, locale as Locale);
    if ('error' in result) {
      setSubmitting(false);
      setHutkoRetry({ id: orderId, ref });
      setServerError(result.error);
      return;
    }
    clearCart();
    window.location.href = result.checkoutUrl;
  }
```

Replace the body of `handleSubmit` (currently lines 189-223) with:

```tsx
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, phone: true, city: true, branch: true });
    if (!formValid) {
      const first = document.querySelector('[data-invalid="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setServerError(null);
    setHutkoRetry(null);
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
      setServerError(result.error);
      return;
    }

    if (form.payment === 'card') {
      await attemptHutkoPayment(result.orderId, result.ref);
      return;
    }

    router.push(`/${locale}/order-success?ref=${result.ref}`);
    clearCart();
  }
```

- [ ] **Step 4: Remove the `card`-blocking `disabled` conditions on the submit buttons**

There are two submit `<button>` elements (desktop, around line 484-491, and the mobile sticky bar, around line 512-519). In both, replace:

```tsx
              disabled={submitting || form.payment === 'card'}
```

with:

```tsx
              disabled={submitting}
```

(two occurrences — one per button)

- [ ] **Step 5: Add the retry button next to the error toast**

Replace the existing error toast block (around line 522-528):

```tsx
      {serverError && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-float">
            {serverError}
          </div>
        </div>
      )}
```

with:

```tsx
      {serverError && (
        <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-float">
            {serverError}
          </div>
          {hutkoRetry && (
            <button
              type="button"
              onClick={() => attemptHutkoPayment(hutkoRetry.id, hutkoRetry.ref)}
              disabled={submitting}
              className="flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-white shadow-card transition-all hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              {t('payCardRetry')}
            </button>
          )}
        </div>
      )}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add components/features/checkout/CheckoutView.tsx messages/uk.json messages/en.json
git commit -m "feat(checkout): enable card payment via Hutko, add retry UI"
```

- [ ] **Step 9: Manual end-to-end verification (use the `verify` skill)**

With `HUTKO_MERCHANT_ID=1700002` and `HUTKO_MERCHANT_PASSWORD=test` set in local `.env`, and `NEXT_PUBLIC_APP_URL` pointing at a publicly reachable tunnel (e.g. `ngrok http 3000`, since Hutko must reach `server_callback_url`):

1. Start the dev server, add items to cart, go to `/checkout`.
2. Select "Оплатити карткою", fill the form, submit.
3. Confirm redirect to `pay.hutko.org/checkout?token=...`.
4. Pay with test card `4444555511116666` (any expiry/CVV) → expect redirect back to `/order-success`.
5. Check `npx prisma studio` (or `db:studio`): the `Order` row has `status='paid'`, `paidAt` set, `paymentInvoiceId` set.
6. Confirm the Telegram order notification arrived in `TELEGRAM_ORDER_CHAT_ID`.
7. Repeat with test card `4444111155556666` (declined) → expect `Order.status='cancelled'`, no Telegram notification.
8. Re-send the same webhook payload manually via `curl` (copy from server logs) → expect `Order` unchanged and no duplicate Telegram message (idempotency check).

---

## Self-Review Notes

- **Spec coverage:** signature algorithm (Task 2), Schema B payment creation (Task 2/4), webhook + status mapping + idempotency (Task 5), field rename (Task 1/3), env vars (Task 2), COD-vs-card Telegram timing (Task 4/5), retry-on-failure UX (Task 6), static `/order-success` (no change, confirmed out of scope) — all covered.
- **Type consistency:** `paymentInvoiceId`/`paidAt` used identically across Task 1 (schema), Task 3 (`OrderForNotification`), Task 5 (webhook `prisma.order.update`) — verified matching names throughout.
- **No placeholders:** every step has complete, runnable code or an exact command.
