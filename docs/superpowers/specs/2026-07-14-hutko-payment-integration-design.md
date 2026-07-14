# Hutko payment integration — design

## Контекст

Оплата карткою на checkout зараз не працює: `placeOrder` створює `Order` з `paymentMethod='card'`, але ніколи не викликає платіжний шлюз — клієнта одразу кидає на `/order-success`. Поля `monoInvoiceId`/`monoPaidAt` в схемі та `app/api/webhooks/monobank/route.ts` лишились заглушкою з часів, коли планували Monobank Acquiring; провайдер змінився на **ПУМБ (Hutko)**.

Мета: повноцінна (production-ready) інтеграція з тестовими реквізитами Hutko (`merchant_id=1700002`, пароль `test`), яка пізніше перемикається на прод просто заміною `.env`.

## Протокол Hutko (з офіційної документації docs.hutko.org)

- Схема взаємодії **B** (host-to-host): наш сервер POST'ить підписаний JSON на `https://pay.hutko.org/api/checkout/url/`, отримує `checkout_url` у відповідь, редіректимо клієнта туди.
- Підпис (`signature`): SHA1 від рядка `пароль|значення_полів_в_алфавітному_порядку_ключів`, розділених `|`, порожні поля пропускаються, результат — lowercase hex. Той самий алгоритм для запиту, response і callback.
- `order_id` = наш `Order.ref` (унікальний, вже генерується).
- `server_callback_url` — Hutko шле сюди server-to-server callback (JSON) з фінальним статусом; чекає у відповідь `200 OK`, інакше ретраїть через 2с/60с/300с/10хв/1год/1добу. Дозволити вхідний IP `52.49.13.27`.
- `response_url` — куди редіректиться браузер клієнта після оплати. Використовуємо лише для UX-редіректу, без довіри до вмісту query-параметрів.
- `order_status`: `created`/`processing`/`declined`/`approved`/`expired`/`reversed`.
- `lifetime` замовлення на боці Hutko — лишаємо дефолт (36000с / 10 год), окремо не передаємо.

## Архітектура / потік даних

```
CheckoutView (client, 'use client')
  → placeOrder(payload)                          [існуюча server action]
      створює Order (status='new'); для 'cod' одразу шле Telegram (без змін)
      для 'card' — Telegram НЕ шлемо тут
  → якщо paymentMethod === 'card':
      createHutkoPayment(orderId)                 [нова server action]
        → підписаний POST на pay.hutko.org/api/checkout/url/
        → success → window.location = checkout_url (зовнішній редірект)
        → failure → показуємо помилку + кнопку "Спробувати ще раз"
                     → повторний виклик createHutkoPayment(orderId) з тим самим Order
  → якщо 'cod' → router.push(/order-success) як зараз

Клієнт оплачує на pay.hutko.org → браузер повертається на
  response_url = /{locale}/order-success?ref=... → статичне "дякуємо, замовлення прийнято"
  (сторінка НЕ читає статус з БД і не довіряє query-параметрам редіректу)

Hutko паралельно шле POST /api/webhooks/hutko (server-to-server)
  → verifySignature() — якщо невалідний → 400, лог, без змін у БД
  → знайти Order по order_id (=ref); не знайдено → 404, лог
  → якщо Order.status вже 'paid' або 'cancelled' → 200 OK, нічого не міняти (ідемпотентність)
  → order_status='approved' → Order.status='paid', paymentInvoiceId=payment_id, paidAt=now
                                → sendNewOrderNotification (Telegram)
  → order_status у ('declined','expired') → Order.status='cancelled'
  → інші статуси ('created','processing','reversed') → ігнорувати, 200 OK
  → завжди 200 OK при валідному підписі й знайденому Order
```

## Файли

- **`lib/hutko.ts`** (новий)
  - `buildSignature(password: string, params: Record<string, string>): string` — SHA1 за алгоритмом Hutko
  - `verifySignature(password: string, payload: Record<string, unknown>): boolean` — прибирає `signature`/`response_signature_string`, звіряє
  - `createHutkoPayment(params: { orderId: string; amount: number; orderDesc: string }): Promise<{ checkoutUrl: string } | { error: string }>` — читає `HUTKO_MERCHANT_ID`/`HUTKO_MERCHANT_PASSWORD` з env, викликає `pay.hutko.org/api/checkout/url/`

- **`app/[locale]/(checkout)/checkout/actions.ts`**
  - `placeOrder`: для `paymentMethod === 'card'` прибрати виклик `sendNewOrderNotification` (лишити тільки для `cod`)
  - нова `createHutkoPayment(orderId: string): Promise<{ checkoutUrl: string } | { error: string }>` — читає Order з БД (amount, ref), викликає `lib/hutko.ts`

- **`app/api/webhooks/hutko/route.ts`** (новий, замінює `app/api/webhooks/monobank/route.ts` — старий файл видалити)

- **`prisma/schema.prisma`**
  - `Order.monoInvoiceId` → `paymentInvoiceId`
  - `Order.monoPaidAt` → `paidAt`
  - нова міграція (`npx prisma migrate dev`)

- **`.env.example`**
  - прибрати `MONOBANK_TOKEN`, `MONOBANK_WEBHOOK_SECRET`
  - додати `HUTKO_MERCHANT_ID=""`, `HUTKO_MERCHANT_PASSWORD=""`

- **`lib/telegram.ts`**
  - `OrderForNotification.monoPaidAt` → `paidAt`

- **`components/features/checkout/CheckoutView.tsx`**
  - гілка `card`: виклик `createHutkoPayment` після успішного `placeOrder`, стан завантаження/помилки, кнопка retry, зовнішній редірект на `checkout_url`

## Помилки й крайні випадки

| Ситуація | Поведінка |
|---|---|
| Невалідний підпис у webhook | 400, лог, без змін у БД |
| Order не знайдено по `order_id` з webhook | 404, лог |
| Webhook для Order у фінальному статусі (paid/cancelled) | 200 OK, без змін (ідемпотентність при ретраях Hutko) |
| Мережева помилка / 4xx від Hutko при `createHutkoPayment` | Order лишається `new`; клієнту — помилка + retry (Order не видаляється) |
| `declined`/`expired` від Hutko | `Order.status = 'cancelled'`; клієнт для повторної спроби оформлює нове замовлення |

## Тестування

- Unit: `buildSignature`/`verifySignature` — звірити з прикладами хешів із документації Hutko (відомі `signature` для заданих полів)
- Ручна перевірка (`verify` skill): пройти checkout з тестовими картками
  - `4444555511116666` — успіх без 3DS → Order.status='paid', приходить Telegram
  - `4444111155556666` — відхилено → Order.status='cancelled'
- Перевірити ідемпотентність: повторно надіслати той самий callback (curl) — переконатись, що повторної обробки/повторного Telegram-сповіщення немає

## Поза межами цього спека

- Production-реквізити Hutko (перемикання `.env` — без змін коду)
- Polling/live-статус на `/order-success` (рішення: статична сторінка, без прив'язки до статусу з БД)
- Refund/verification/p2p-операції Hutko
