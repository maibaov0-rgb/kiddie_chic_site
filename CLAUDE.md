# CLAUDE.md

## Продакшн сервер (КРИТИЧНО)

- VPS: `5.189.167.89` — на сервері крутиться **кілька сайтів**
- При деплої працювати **тільки з контейнерами `kiddie_chic_*`** (`kiddie_chic_web`, `kiddie_chic_db`)
- **Ніколи не робити** `docker compose down` без `-f docker-compose.prod.yml` — це може зупинити інші сайти
- Безпечний деплой: `docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d web`
- Міграції: запускаються автоматично при старті контейнера (`prisma migrate deploy`)

## Команди

- `npm run dev` — dev server
- `npm run lint && npm run typecheck` — **запускай перед тим як вважати задачу готовою**
- `npx prisma migrate dev` — міграції БД
- `npx prisma studio` — GUI БД

## Стек

Next.js 15 (App Router, TS strict) · PostgreSQL + Prisma · Tailwind + shadcn/ui · Framer Motion · next-intl · Auth.js · Zustand · Cloudinary · Resend · grammy · Docker + Caddy

## Code style

- TS strict — **ніяких `any`**, використовуй `unknown` + narrowing
- Server Components за замовчуванням; `'use client'` тільки де потрібен стейт або event handlers
- Зображення тільки через `next/image` з Cloudinary loader
- Усі тексти через `next-intl` — **жодних hardcoded рядків** у UI
- Кошик — Zustand з persist у localStorage

## Mobile-first (КРИТИЧНО)

Перевіряй верстку **спочатку на 375px (iPhone SE)**, потім розширюй до desktop.

- Tap targets ≥ 44×44px
- Body font ≥ 16px на mobile (інакше iOS зумить input при фокусі)
- Галерея товару — горизонтальний swipe, не grid
- Навігація — burger або bottom nav, не desktop dropdown
- Sticky CTA "Купити" на сторінці товару при скролі mobile

## Дизайн

- Палітра: молочний (#FDF8F4), пудрово-рожевий (#F4C6C6), бежевий (#EDE0D4), білий, золоті акценти (#C9A96E)
- Стиль: преміум, мінімалізм, багато повітря, м'які анімації
- **Шрифти** (за побажанням замовника): sans — **Montserrat**, body default Medium (500), доступні ваги 400/500/600/700; serif для заголовків/логотипу — **Playfair Display**. Не міняй цю пару без узгодження.
- **Чекай референси/скріншоти від користувача перед стартом UI**

### UI — Округлість і м'якість (КРИТИЧНО)

Сайт про одяг для дівчаток — ніяких гострих країв, всі елементи ніжні та заокруглені:

- **Жодних квадратних кутів** — `rounded-none` і `rounded-sm` заборонені
- Кнопки — `rounded-full` або мінімум `rounded-2xl`
- Картки товарів — `rounded-3xl`
- Модалки, drawer-и — `rounded-3xl` зверху або з усіх боків
- Інпути та селекти — `rounded-2xl`
- Badges/теги — `rounded-full`
- Зображення — завжди з `rounded-2xl` або `rounded-3xl`
- Тіні — м'які розмиті (`shadow-soft`), ніяких різких
- Hover-стани — плавна анімація `transition-all duration-300 ease-in-out`
- Spacing — щедрий `padding`, `gap`, `margin` — «повітря» пріоритет

### Скіли для UI

Використовуй при розробці компонентів:
- `ui-ux-pro-max` — планування та перевірка UI/UX
- `ui-styling` — shadcn/ui + Tailwind компоненти
- `design` — дизайн-токени, банери, іконки
- `brand` — консистентність бренду
- `frontend-design` — нестандартні візуальні рішення, антишаблонність

## Використання скілів та плагінів (КРИТИЧНО)

**Усе встановлене в цьому проекті — використовуй проактивно, не чекай команди `/`.**
Якщо опис скіла матчить задачу — викликай його, ще до того як писати код.
Список повторюватиметься у системних нагадуваннях кожної сесії, нижче — мапа тригерів.

| Коли | Що викликати |
|---|---|
| Будь-яка UI-задача (нова сторінка, компонент, рев'ю верстки) | `ui-ux-pro-max` + `frontend-design` |
| Перед стартом нової фічі, неоднозначні вимоги | `superpowers:brainstorming` |
| Багатокрокова задача (типу `/checkout` з Mono) | `superpowers:writing-plans` → `superpowers:executing-plans` |
| Реалізація фічі або фіксу | `superpowers:test-driven-development` (де доречно) |
| Будь-який баг або несподівана поведінка | `superpowers:systematic-debugging` |
| Перед тим як сказати "готово" / закомітити | `superpowers:verification-before-completion` + `verify` (запуск у браузері) |
| 2+ незалежних задач паралельно | `superpowers:dispatching-parallel-agents` |
| Робота над довгою фічею, ізоляція | `superpowers:using-git-worktrees` |
| Завершення гілки (merge / PR / cleanup) | `superpowers:finishing-a-development-branch` |
| Рев'ю PR або поточних змін | `/code-review` |
| Перевірка безпеки (Mono webhook, секрети, env) | `/security-review` |
| Запустити dev-сервер і подивитись фічу в браузері | `run` або `verify` |

**Правила:**
- `npm run lint && npm run typecheck` — недостатньо щоб закрити задачу. Для UI-фіч — обов'язково `verify` (реальний запуск).
- Якщо в processed list є релевантний скіл — `lint+typecheck pass` без виклику скіла **не** означає що задача готова.
- Не дублювати: якщо `ui-ux-pro-max` уже застосовано — `design`/`ui-styling` не потрібні поверх.

## SEO і доступність

- SSR/SSG для всіх публічних сторінок
- Metadata API: `title`, `description`, OpenGraph на кожній сторінці
- Schema.org Product + BreadcrumbList на сторінках товарів
- hreflang uk/en, `sitemap.xml`, `robots.txt`
- `alt` обов'язковий, focus-стани видимі, семантичний HTML

## Безпека

- Усі ключі в `.env`, `.env.example` тримай актуальним. **Ніколи не комітимо секрети.**
- Monobank webhook — **обов'язкова перевірка підпису**
- Платіжні запити — тільки з server actions / route handlers, ніколи з клієнта

## Продуктова специфікація

Повна бізнес-логіка (розділи сайту, модель товару, checkout flow, адмін-панель, інтеграції) — у `@SPEC.md`. **Читай його перед роботою над фічами.**

## Не роби без обговорення з користувачем

- Не змінюй стек, не додавай нові залежності
- Не починай UI без референсів
- Не міняй модель даних після перших міграцій
- Не комітимо тестові ключі чи hardcoded credentials
