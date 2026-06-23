# Адмін-панель — CRUD товарів (Iteration 1)

**Дата:** 2026-06-23
**Статус:** затверджено, готовий до плану реалізації

## Мета

Дати власниці робочий інструмент в `/admin` для повного управління товарами:
створення, редагування, видалення, завантаження фото. Це перша ітерація
адмін-панелі; пов'язані розділи (замовлення, відгуки, налаштування) — окремі
ітерації.

## Обсяг

**У межах:**
- Робочий логін (`Credentials`) + захист усіх `/admin` роутів.
- CRUD товарів: список, створення, редагування, видалення.
- Завантаження фото в Cloudinary через **signed direct upload**.
- Управління варіантами товару (розмір / тканина / ціна).

**Поза межами (наступні ітерації):**
- Управління замовленнями, відгуками, налаштуваннями сайту.
- Дашборд / статистика.
- Підключення публічного каталогу до БД (зараз `lib/catalog.ts` віддає моки).
- Бекап-скрипт фото з Cloudinary.

## Ключові рішення

### Зберігання фото — Cloudinary, signed direct upload
- Файли живуть у Cloudinary (CDN + автооптимізація), у PostgreSQL — лише URL-и.
- **Signed upload:** server action генерує підпис → браузер заливає файл напряму
  в Cloudinary. Файли НЕ проходять через наш сервер (не вантажать його трафік,
  секрет не світиться на клієнті).
- У `Product.images[]` / `ProductVariant.images[]` зберігаємо повний `secure_url`
  (збігається з `next.config.ts` `remotePatterns` для `res.cloudinary.com` і з
  тим, як рендерять картинки публічні компоненти через `next/image`).
- `public_id` для видалення виводимо з URL — **схему БД не міняємо**.
- Оригінали фото дублює власниця у себе (Drive/комп). Бекап-скрипт — опційно
  пізніше.

### Free-tier Cloudinary
- ~25 кредитів/міс (1 кредит = 1 GB сховища АБО 1 GB трафіку АБО 1000
  трансформацій). Для старту з великим запасом. Трафік мінімізований тим, що
  все рендериться через `next/image` + Cloudinary (WebP/AVIF під розмір екрана,
  кеш Next.js). Реальний ризик не «зникнення файлів», а білінг/акаунт — закрито
  правилом «Cloudinary = робоча копія, оригінали в власниці».

### Авторизація — split-config next-auth v5
`middleware` працює на edge і несумісний з `bcrypt`/Prisma-adapter, тож наявний
`auth.ts` розділяємо:
- `auth.config.ts` — edge-safe: `pages`, `callbacks.authorized` (редірект
  неавторизованих на `/admin/login`).
- `auth.ts` — спредить `authConfig` + додає `PrismaAdapter`, `Credentials`,
  jwt/session callbacks.
- `middleware.ts` (новий, корінь) — `NextAuth(authConfig).auth` з
  `matcher: ['/admin/:path*']`.

### Мова адмінки — тільки українська
Адмінка поза `[locale]`, нею користується лише власниця. UA-рядки прямо в коді,
без `next-intl`. (Самі товари лишаються двомовними: поля `name_uk`/`name_en`,
`description_uk`/`description_en` у формі.)

## Архітектура

### Авторизація / захист
- `auth.config.ts`, `auth.ts` (рефактор), `middleware.ts` (новий).
- `app/admin/login/page.tsx` — робоча форма (client), `signIn('credentials')`,
  обробка помилок.

### Каркас
- `app/admin/layout.tsx` — власний `<html lang="uk">`, Montserrat, преміум-стиль
  з дизайн-токенів (rounded-3xl картки, rounded-full кнопки, `shadow-soft`).
  Навігація + кнопка «Вийти». Mobile-first від 375px.
- `app/admin/page.tsx` → редірект на `/admin/products`.

### Дані / серверні екшени
- `app/admin/products/actions.ts` (`'use server'`): `listProducts`,
  `getProduct(id)`, `createProduct`, `updateProduct`,
  `deleteProduct` (best-effort видалення фото з Cloudinary). Кожен екшен
  перевіряє сесію через `auth()`.
- `lib/validation/product.ts` — одна zod-схема для клієнта (react-hook-form
  resolver) і сервера.
- `lib/slug.ts` — генерація slug з `name_uk` (транслітерація UA→lat) + гарантія
  унікальності (суфікс `-2`, `-3`…).
- `lib/cloudinary.ts` — додати `getUploadSignature(folder)` і
  `publicIdFromUrl(url)`; лишити `deleteImage`. Серверний `uploadImage` для
  цього flow не потрібен.

### UI-компоненти
- `components/admin/ImageUploader.tsx` (client) — drag&drop, прев'ю, видалення,
  зміна порядку; signed upload під капотом → повертає `secure_url[]` у форму.
- `components/admin/ProductForm.tsx` (client, react-hook-form + zod), спільна для
  new/edit:
  - Поля: `category` (dress/couture/accessory), `slug` (авто з name_uk,
    редаговане), `name_uk`/`name_en`, `description_uk`/`description_en`,
    `colors` (мультивибір з `COLORS`), прапорці
    `inStock`/`isNew`/`isBestseller`/`isHidden`, фото товару (ImageUploader).
  - **Варіанти** (масив рядків): `size` (з `SIZES`), `fabric` (з `FABRICS`),
    `price`. Додати/видалити рядок, мінімум один (ціна живе на варіанті).

### Сторінки
- `products/page.tsx` (server) — список: мініатюра, назва, категорія, діапазон
  цін, badge-прапорці, дії «Редагувати / Видалити». Порожній стан.
- `products/new/page.tsx` — `ProductForm` (create).
- `products/[id]/edit/page.tsx` — fetch товару+варіантів → `ProductForm` (edit).
- `products/[id]/page.tsx` → редірект на edit.

## Потік даних

1. Логін → `middleware` пускає в `/admin`.
2. Форма товару: ImageUploader бере підпис (server action) → ллє фото в
   Cloudinary → `secure_url[]` лягають у стан форми.
3. Submit → server action валідовує (zod) → пише Product + ProductVariant у БД
   (транзакція) → `revalidatePath` → редірект на список.
4. Видалення: дістаємо `images[]` → best-effort `deleteImage` у Cloudinary →
   видаляємо запис (cascade на варіанти).

## Обробка помилок

- Server actions повертають типізований `{ ok: boolean; error?: string }`.
- Помилки валідації показуються у формі (per-field).
- Збій заливки фото — інлайн у ImageUploader, не блокує решту форми.
- Видалення фото з Cloudinary — best-effort: помилка логується, але не валить
  видалення запису в БД.
- Конфлікт slug — обробляється в `lib/slug.ts` (унікальність) і ловиться як
  fallback на Prisma unique constraint.

## Тестування

- Unit (TDD де доречно): `lib/slug.ts`, zod-схема, `publicIdFromUrl`.
- `npm run lint && npm run typecheck` — обов'язково.
- **`verify`** — реальний прогін у браузері: логін → створити товар із фото →
  побачити в списку → відредагувати → видалити. Перевірка верстки на 375px
  (iPhone SE) перш за все.

## Залежності

Нові не потрібні — `cloudinary`, `react-hook-form`, `zod`, `shadcn`, `next-auth`
уже у проекті.
