# Admin Products CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Ukrainian-language admin panel at `/admin` for full product CRUD (create / edit / delete / list) with Cloudinary signed image upload, plus the login + route protection needed to use it.

**Architecture:** next-auth v5 split-config protects `/admin` via `middleware.ts`. Server actions in `app/admin/products/actions.ts` handle DB writes through Prisma; a shared zod schema validates on both client and server. Photos upload directly from browser to Cloudinary using a server-generated signature; only `secure_url` strings are stored in `Product.images[]` / `ProductVariant.images[]`.

**Tech Stack:** Next.js 16 (App Router, TS strict), Prisma v7 (pg adapter), next-auth v5, react-hook-form + zod, Cloudinary, Tailwind v4 + shadcn-style components.

## Global Constraints

- TS strict — **no `any`**, use `unknown` + narrowing.
- Server Components by default; `'use client'` only where state/handlers needed.
- Images only via `next/image`; Cloudinary URLs (`res.cloudinary.com`) already whitelisted in `next.config.ts`.
- Admin UI is **Ukrainian only**, strings inline (NOT next-intl). Admin lives outside `[locale]`.
- Product data stays bilingual: `name_uk`/`name_en`, `description_uk`/`description_en`.
- Rounding rules (CLAUDE.md): no `rounded-none`/`rounded-sm`; buttons `rounded-full`/`rounded-2xl`; cards `rounded-3xl`; inputs/selects `rounded-2xl`; badges `rounded-full`; soft `shadow-soft`; transitions `transition-all duration-300 ease-in-out`.
- Mobile-first: verify at 375px first. Tap targets ≥44×44px, body font ≥16px.
- Prisma client import path: `@/app/generated/prisma/client`. Prisma instance: `import { prisma } from "@/lib/prisma"`.
- Do NOT change the Prisma schema. Do NOT add dependencies.
- Run `npm run lint && npm run typecheck` before considering any task done; final task runs `verify` in a browser.

---

### Task 1: Split auth config + protect /admin with middleware

**Files:**
- Create: `auth.config.ts`
- Modify: `auth.ts`
- Create: `middleware.ts`

**Interfaces:**
- Produces: `authConfig` (NextAuthConfig, edge-safe) exported from `auth.config.ts`; unchanged exports `{ handlers, auth, signIn, signOut }` from `auth.ts`.

- [ ] **Step 1: Create `auth.config.ts` (edge-safe, no Prisma/bcrypt)**

```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token["id"] = user.id;
        token["role"] = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token["id"] as string;
        (session.user as { role?: string }).role = token["role"] as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith("/admin");
      const isLoginPage = pathname === "/admin/login";
      if (isAdminRoute && !isLoginPage && !session?.user) {
        return Response.redirect(new URL("/admin/login", request.nextUrl));
      }
      return true;
    },
  },
  providers: [], // real providers added in auth.ts (Node runtime)
} satisfies NextAuthConfig;
```

- [ ] **Step 2: Rewrite `auth.ts` to spread `authConfig` + add adapter/provider**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;
        const match = await bcrypt.compare(parsed.data.password, user.password);
        if (!match) return null;
        return user;
      },
    }),
  ],
});
```

- [ ] **Step 3: Create `middleware.ts` (root)**

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 4: Verify build/typecheck**

Run: `npm run typecheck`
Expected: PASS (no type errors).

- [ ] **Step 5: Manual smoke (note in commit, full check in Task 13)**

Start `npm run dev`, open `/admin/products` while logged out → should redirect to `/admin/login`.

- [ ] **Step 6: Commit**

```bash
git add auth.config.ts auth.ts middleware.ts
git commit -m "feat(admin): split auth config and protect /admin via middleware"
```

---

### Task 2: Working login page

**Files:**
- Modify: `app/admin/login/page.tsx`
- Create: `app/admin/login/actions.ts`

**Interfaces:**
- Consumes: `signIn` from `@/auth`.
- Produces: `loginAction(_prev, formData): Promise<{ error?: string }>` server action.

- [ ] **Step 1: Create `app/admin/login/actions.ts`**

```ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/products",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Невірний email або пароль" };
    }
    throw error; // re-throw redirect
  }
}
```

- [ ] **Step 2: Rewrite `app/admin/login/page.tsx` (client form)**

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FDF8F4] p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-8 shadow-soft"
      >
        <h1 className="text-center text-2xl font-semibold text-[#3d2f28]">
          Вхід в адмінку
        </h1>

        <div className="space-y-2">
          <label htmlFor="email" className="text-base font-medium text-[#3d2f28]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-base font-medium text-[#3d2f28]">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
          />
        </div>

        {state?.error && (
          <p className="rounded-2xl bg-[#F4C6C6]/40 px-4 py-2 text-center text-sm text-[#9b4a4a]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#F4C6C6] py-3 text-base font-semibold text-[#3d2f28] transition-all duration-300 ease-in-out hover:bg-[#efb4b4] disabled:opacity-60"
        >
          {pending ? "Входимо…" : "Увійти"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/login/page.tsx app/admin/login/actions.ts
git commit -m "feat(admin): working credentials login page"
```

---

### Task 3: Admin shell layout + root redirect

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `app/admin/page.tsx`
- Create: `app/admin/logout/actions.ts`

**Interfaces:**
- Produces: admin shell with nav + logout; `logoutAction()` server action.

- [ ] **Step 1: Create `app/admin/logout/actions.ts`**

```ts
"use server";

import { signOut } from "@/auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
```

- [ ] **Step 2: Rewrite `app/admin/layout.tsx`**

Login page must NOT show the shell. Detect via `auth()` — if no session, render children bare (login page handles its own layout); otherwise wrap in shell.

```tsx
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { auth } from "@/auth";
import { logoutAction } from "./logout/actions";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="uk" className={`h-full antialiased ${montserrat.variable}`}>
      <body className="min-h-full bg-[#FDF8F4] font-[family-name:var(--font-montserrat)] text-[#3d2f28]">
        {session?.user ? (
          <div className="flex min-h-screen flex-col">
            <header className="flex items-center justify-between gap-4 bg-white px-4 py-4 shadow-soft sm:px-8">
              <nav className="flex items-center gap-4">
                <Link href="/admin/products" className="text-lg font-semibold">
                  Kiddie Chic · Адмін
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-full px-3 py-2 text-base transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                >
                  Товари
                </Link>
              </nav>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-4 py-2 text-base font-medium transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                >
                  Вийти
                </button>
              </form>
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
              {children}
            </main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Rewrite `app/admin/page.tsx` to redirect**

```tsx
import { redirect } from "next/navigation";

export default function AdminHome() {
  redirect("/admin/products");
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx app/admin/logout/actions.ts
git commit -m "feat(admin): shell layout with nav + logout, root redirect"
```

---

### Task 4: Slug utility (TDD)

**Files:**
- Create: `lib/slug.ts`
- Test: `lib/slug.test.ts`

**Interfaces:**
- Produces: `slugify(input: string): string`; `uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string>`.

This project has no test runner configured yet. Use Node's built-in test runner via `tsx`.

- [ ] **Step 1: Write failing test `lib/slug.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueSlug } from "./slug.ts";

test("slugify transliterates cyrillic and lowercases", () => {
  assert.equal(slugify("Сукня Принцеса"), "suknia-printsesa");
});

test("slugify strips punctuation and collapses dashes", () => {
  assert.equal(slugify("  Сукня!!  №1 "), "suknia-1");
});

test("uniqueSlug returns base when free", async () => {
  const out = await uniqueSlug("dress", async () => false);
  assert.equal(out, "dress");
});

test("uniqueSlug appends suffix on collision", async () => {
  const taken = new Set(["dress", "dress-2"]);
  const out = await uniqueSlug("dress", async (s) => taken.has(s));
  assert.equal(out, "dress-3");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/slug.test.ts`
Expected: FAIL (module not found / functions undefined).

- [ ] **Step 3: Implement `lib/slug.ts`**

```ts
const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie",
  ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "",
  ю: "iu", я: "ia",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in CYR_MAP ? CYR_MAP[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await exists(root))) return root;
  let n = 2;
  while (await exists(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/slug.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/slug.ts lib/slug.test.ts
git commit -m "feat(admin): slug utility with cyrillic transliteration"
```

---

### Task 5: Cloudinary signed-upload helpers (TDD for URL parsing)

**Files:**
- Modify: `lib/cloudinary.ts`
- Test: `lib/cloudinary.test.ts`

**Interfaces:**
- Consumes: existing `cloudinary`, `deleteImage` in `lib/cloudinary.ts`.
- Produces: `getUploadSignature(folder?: string): { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string }`; `publicIdFromUrl(url: string): string | null`.

- [ ] **Step 1: Write failing test `lib/cloudinary.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { publicIdFromUrl } from "./cloudinary.ts";

test("publicIdFromUrl extracts folder/name without version or extension", () => {
  const url =
    "https://res.cloudinary.com/demo/image/upload/v1700000000/kiddie-chic/abc123.jpg";
  assert.equal(publicIdFromUrl(url), "kiddie-chic/abc123");
});

test("publicIdFromUrl handles nested folders", () => {
  const url =
    "https://res.cloudinary.com/demo/image/upload/v1/kiddie-chic/dresses/x.png";
  assert.equal(publicIdFromUrl(url), "kiddie-chic/dresses/x");
});

test("publicIdFromUrl returns null for non-cloudinary url", () => {
  assert.equal(publicIdFromUrl("https://example.com/x.jpg"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/cloudinary.test.ts`
Expected: FAIL (`publicIdFromUrl` not exported).

- [ ] **Step 3: Append helpers to `lib/cloudinary.ts`**

```ts
export function getUploadSignature(folder: string = "kiddie-chic") {
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
    folder,
  };
}

export function publicIdFromUrl(url: string): string | null {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || idx === -1) return null;
  let rest = url.slice(idx + marker.length);
  // drop leading version segment vNNN/ if present
  rest = rest.replace(/^v\d+\//, "");
  // drop file extension
  return rest.replace(/\.[a-z0-9]+$/i, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/cloudinary.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cloudinary.ts lib/cloudinary.test.ts
git commit -m "feat(admin): cloudinary signed-upload signature + publicId parsing"
```

---

### Task 6: Shared product validation schema (TDD)

**Files:**
- Create: `lib/validation/product.ts`
- Test: `lib/validation/product.test.ts`

**Interfaces:**
- Produces: `productSchema` (zod), `type ProductInput = z.infer<typeof productSchema>`, `variantSchema`.

- [ ] **Step 1: Write failing test `lib/validation/product.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "./product.ts";

const valid = {
  category: "dress",
  name_uk: "Сукня",
  name_en: "Dress",
  description_uk: "опис",
  description_en: "desc",
  images: ["https://res.cloudinary.com/demo/image/upload/v1/k/a.jpg"],
  colors: ["powder"],
  inStock: true,
  isNew: false,
  isBestseller: false,
  isHidden: false,
  variants: [{ size: "98-104", fabric: "satin", price: 1200 }],
};

test("accepts a valid product", () => {
  assert.equal(productSchema.safeParse(valid).success, true);
});

test("rejects empty name_uk", () => {
  const r = productSchema.safeParse({ ...valid, name_uk: "" });
  assert.equal(r.success, false);
});

test("rejects product with no variants", () => {
  const r = productSchema.safeParse({ ...valid, variants: [] });
  assert.equal(r.success, false);
});

test("rejects non-positive price", () => {
  const r = productSchema.safeParse({
    ...valid,
    variants: [{ size: "98-104", fabric: "satin", price: 0 }],
  });
  assert.equal(r.success, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/validation/product.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/validation/product.ts`**

```ts
import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1, "Оберіть розмір"),
  fabric: z.string().min(1, "Оберіть тканину"),
  price: z.coerce.number().positive("Ціна має бути більшою за 0"),
});

export const productSchema = z.object({
  category: z.enum(["dress", "couture", "accessory"]),
  name_uk: z.string().min(1, "Введіть назву (укр)"),
  name_en: z.string().min(1, "Введіть назву (eng)"),
  description_uk: z.string().min(1, "Введіть опис (укр)"),
  description_en: z.string().min(1, "Введіть опис (eng)"),
  images: z.array(z.string().url()).default([]),
  colors: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "Додайте хоча б один варіант"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/validation/product.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validation/product.ts lib/validation/product.test.ts
git commit -m "feat(admin): shared zod product validation schema"
```

---

### Task 7: Product server actions

**Files:**
- Create: `app/admin/products/actions.ts`

**Interfaces:**
- Consumes: `prisma`, `auth`, `productSchema`/`ProductInput`, `uniqueSlug`/`slugify`, `deleteImage`, `publicIdFromUrl`.
- Produces:
  - `listProductsAction(): Promise<ProductListItem[]>`
  - `getProductAction(id): Promise<ProductWithVariants | null>`
  - `createProductAction(input: ProductInput): Promise<ActionResult>`
  - `updateProductAction(id: string, input: ProductInput): Promise<ActionResult>`
  - `deleteProductAction(id: string): Promise<ActionResult>`
  - Types: `ActionResult = { ok: true; id?: string } | { ok: false; error: string }`.

- [ ] **Step 1: Create `app/admin/products/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { uniqueSlug } from "@/lib/slug";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
}

export async function listProductsAction() {
  await requireAdmin();
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { price: "asc" } } },
  });
}

export async function getProductAction(id: string) {
  await requireAdmin();
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
}

export async function createProductAction(
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Перевірте заповнення полів" };
  }
  const data = parsed.data;
  const slug = await uniqueSlug(
    data.name_uk,
    async (s) => (await prisma.product.count({ where: { slug: s } })) > 0,
  );

  const created = await prisma.product.create({
    data: {
      slug,
      category: data.category,
      name_uk: data.name_uk,
      name_en: data.name_en,
      description_uk: data.description_uk,
      description_en: data.description_en,
      images: data.images,
      colors: data.colors,
      inStock: data.inStock,
      isNew: data.isNew,
      isBestseller: data.isBestseller,
      isHidden: data.isHidden,
      variants: {
        create: data.variants.map((v) => ({
          size: v.size,
          fabric: v.fabric,
          price: v.price,
          images: [],
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  return { ok: true, id: created.id };
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Перевірте заповнення полів" };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        category: data.category,
        name_uk: data.name_uk,
        name_en: data.name_en,
        description_uk: data.description_uk,
        description_en: data.description_en,
        images: data.images,
        colors: data.colors,
        inStock: data.inStock,
        isNew: data.isNew,
        isBestseller: data.isBestseller,
        isHidden: data.isHidden,
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            fabric: v.fabric,
            price: v.price,
            images: [],
          })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  return { ok: true, id };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    select: { images: true },
  });
  if (!product) return { ok: false, error: "Товар не знайдено" };

  // Best-effort image cleanup — never blocks DB delete.
  await Promise.allSettled(
    product.images.map((url) => {
      const pid = publicIdFromUrl(url);
      return pid ? deleteImage(pid) : Promise.resolve();
    }),
  );

  await prisma.product.delete({ where: { id } }); // variants cascade
  revalidatePath("/admin/products");
  return { ok: true };
}
```

> Note on update strategy: variants are replaced wholesale (delete + recreate) because `OrderItem` snapshots variant data at order time (`name`/`size`/`fabric`/`price` are copied), so deleting a variant does not corrupt order history. `OrderItem.variantId` is optional and `onDelete` defaults to SetNull for that relation.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat(admin): product CRUD server actions"
```

---

### Task 8: ImageUploader component (signed direct upload)

**Files:**
- Create: `app/admin/products/sign-upload.ts`
- Create: `components/admin/ImageUploader.tsx`

**Interfaces:**
- Consumes: `getUploadSignature` from `@/lib/cloudinary`.
- Produces:
  - `signUploadAction(): Promise<{ timestamp; signature; apiKey; cloudName; folder }>` server action.
  - `<ImageUploader value={string[]} onChange={(urls: string[]) => void} />` client component.

- [ ] **Step 1: Create `app/admin/products/sign-upload.ts`**

```ts
"use server";

import { auth } from "@/auth";
import { getUploadSignature } from "@/lib/cloudinary";

export async function signUploadAction() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return getUploadSignature();
}
```

- [ ] **Step 2: Create `components/admin/ImageUploader.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { signUploadAction } from "@/app/admin/products/sign-upload";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await signUploadAction();
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: form },
        );
        if (!res.ok) throw new Error("upload failed");
        const json: { secure_url: string } = await res.json();
        uploaded.push(json.secure_url);
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError("Не вдалося завантажити фото. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-[#EDE0D4]"
          >
            <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/40 p-1 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded-full px-2 text-white"
                aria-label="Лівіше"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => remove(url)}
                className="rounded-full px-2 text-white"
                aria-label="Видалити"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded-full px-2 text-white"
                aria-label="Правіше"
              >
                →
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EDE0D4] text-center text-sm text-[#9b8b7e] transition-all duration-300 ease-in-out hover:border-[#C9A96E]">
          {busy ? "Завантаження…" : "+ Фото"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && <p className="text-sm text-[#9b4a4a]">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/products/sign-upload.ts components/admin/ImageUploader.tsx
git commit -m "feat(admin): ImageUploader with Cloudinary signed direct upload"
```

---

### Task 9: ProductForm component

**Files:**
- Create: `components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: `productSchema`/`ProductInput` from `@/lib/validation/product`; `ImageUploader`; `SIZES`, `FABRICS`, `COLORS` from `@/lib/catalog`; `ActionResult` from `@/app/admin/products/actions`.
- Produces: `<ProductForm defaultValues={ProductInput} onSubmit={(input) => Promise<ActionResult>} submitLabel={string} />`.

- [ ] **Step 1: Create `components/admin/ProductForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SIZES, FABRICS, COLORS } from "@/lib/catalog";
import type { ActionResult } from "@/app/admin/products/actions";

interface Props {
  defaultValues: ProductInput;
  onSubmit: (input: ProductInput) => Promise<ActionResult>;
  submitLabel: string;
}

const inputCls =
  "w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]";
const labelCls = "text-base font-medium text-[#3d2f28]";

export function ProductForm({ defaultValues, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const variants = useFieldArray({ control, name: "variants" });

  async function submit(data: ProductInput) {
    setServerError(null);
    const res = await onSubmit(data);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setServerError(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="space-y-2">
          <label className={labelCls}>Категорія</label>
          <select {...register("category")} className={inputCls}>
            <option value="dress">Сукні</option>
            <option value="couture">Кутюр</option>
            <option value="accessory">Аксесуари</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Назва (укр)</label>
            <input {...register("name_uk")} className={inputCls} />
            {errors.name_uk && (
              <p className="text-sm text-[#9b4a4a]">{errors.name_uk.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Назва (eng)</label>
            <input {...register("name_en")} className={inputCls} />
            {errors.name_en && (
              <p className="text-sm text-[#9b4a4a]">{errors.name_en.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Опис (укр)</label>
            <textarea {...register("description_uk")} rows={4} className={inputCls} />
            {errors.description_uk && (
              <p className="text-sm text-[#9b4a4a]">{errors.description_uk.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Опис (eng)</label>
            <textarea {...register("description_en")} rows={4} className={inputCls} />
            {errors.description_en && (
              <p className="text-sm text-[#9b4a4a]">{errors.description_en.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <label className={labelCls}>Фото товару</label>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader value={field.value ?? []} onChange={field.onChange} />
          )}
        />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <label className={labelCls}>Кольори</label>
        <Controller
          control={control}
          name="colors"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const selected = (field.value ?? []).includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        selected
                          ? field.value.filter((v: string) => v !== c.id)
                          : [...(field.value ?? []), c.id],
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-in-out ${
                      selected
                        ? "border-[#C9A96E] bg-[#FDF8F4]"
                        : "border-[#EDE0D4]"
                    }`}
                  >
                    {c.name_uk}
                  </button>
                );
              })}
            </div>
          )}
        />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["inStock", "В наявності"],
              ["isNew", "Новинка"],
              ["isBestseller", "Хіт"],
              ["isHidden", "Прихований"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-base">
              <input type="checkbox" {...register(name)} className="h-5 w-5 rounded-md" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Варіанти (розмір / тканина / ціна)</label>
          <button
            type="button"
            onClick={() => variants.append({ size: SIZES[0], fabric: FABRICS[0].id, price: 0 })}
            className="rounded-full bg-[#FDF8F4] px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#EDE0D4]"
          >
            + Додати варіант
          </button>
        </div>

        {errors.variants?.message && (
          <p className="text-sm text-[#9b4a4a]">{errors.variants.message}</p>
        )}

        <div className="space-y-3">
          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <select {...register(`variants.${i}.size`)} className={inputCls}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select {...register(`variants.${i}.fabric`)} className={inputCls}>
                {FABRICS.map((fab) => (
                  <option key={fab.id} value={fab.id}>
                    {fab.name_uk}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Ціна, ₴"
                {...register(`variants.${i}.price`)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => variants.remove(i)}
                className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </section>

      {serverError && (
        <p className="rounded-2xl bg-[#F4C6C6]/40 px-4 py-2 text-center text-sm text-[#9b4a4a]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#F4C6C6] py-4 text-base font-semibold text-[#3d2f28] transition-all duration-300 ease-in-out hover:bg-[#efb4b4] disabled:opacity-60 sm:w-auto sm:px-12"
      >
        {isSubmitting ? "Збереження…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (If `SIZES` is a readonly tuple, `SIZES[0]` is fine; `FABRICS[0].id` is a string.)

- [ ] **Step 3: Commit**

```bash
git add components/admin/ProductForm.tsx
git commit -m "feat(admin): ProductForm with variants, colors, flags, images"
```

---

### Task 10: Products list page

**Files:**
- Modify: `app/admin/products/page.tsx`
- Create: `components/admin/DeleteProductButton.tsx`

**Interfaces:**
- Consumes: `listProductsAction`, `deleteProductAction`.

- [ ] **Step 1: Create `components/admin/DeleteProductButton.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/admin/products/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Видалити товар «${name}»?`)) return;
    start(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-full px-4 py-2 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30 disabled:opacity-60"
    >
      {pending ? "…" : "Видалити"}
    </button>
  );
}
```

- [ ] **Step 2: Rewrite `app/admin/products/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { listProductsAction } from "./actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

const CATEGORY_LABEL: Record<string, string> = {
  dress: "Сукні",
  couture: "Кутюр",
  accessory: "Аксесуари",
};

export default async function ProductsPage() {
  const products = await listProductsAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-[#F4C6C6] px-5 py-3 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-[#efb4b4]"
        >
          + Додати товар
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center text-[#9b8b7e] shadow-soft">
          Поки немає товарів. Натисніть «Додати товар».
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const prices = p.variants.map((v) => Number(v.price));
            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FDF8F4]">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt="" fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name_uk}</p>
                  <p className="text-sm text-[#9b8b7e]">
                    {CATEGORY_LABEL[p.category]} ·{" "}
                    {min === max ? `${min} ₴` : `${min}–${max} ₴`}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.isNew && <Badge>Новинка</Badge>}
                    {p.isBestseller && <Badge>Хіт</Badge>}
                    {p.isHidden && <Badge>Прихований</Badge>}
                    {!p.inStock && <Badge>Немає</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="rounded-full px-4 py-2 text-sm transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                  >
                    Редагувати
                  </Link>
                  <DeleteProductButton id={p.id} name={p.name_uk} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#FDF8F4] px-3 py-1 text-xs text-[#9b8b7e]">
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/products/page.tsx components/admin/DeleteProductButton.tsx
git commit -m "feat(admin): products list page with delete"
```

---

### Task 11: New product page

**Files:**
- Modify: `app/admin/products/new/page.tsx`

**Interfaces:**
- Consumes: `ProductForm`, `createProductAction`, `ProductInput`.

- [ ] **Step 1: Rewrite `app/admin/products/new/page.tsx`**

This is a Server Component that renders the client form; pass the server action via a thin client wrapper. Bind the action in a `"use client"` wrapper to satisfy the `onSubmit` prop type.

Create wrapper `components/admin/NewProductForm.tsx`:

```tsx
"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/app/admin/products/actions";
import type { ProductInput } from "@/lib/validation/product";

const EMPTY: ProductInput = {
  category: "dress",
  name_uk: "",
  name_en: "",
  description_uk: "",
  description_en: "",
  images: [],
  colors: [],
  inStock: true,
  isNew: false,
  isBestseller: false,
  isHidden: false,
  variants: [{ size: "86-92", fabric: "satin", price: 0 }],
};

export function NewProductForm() {
  return (
    <ProductForm
      defaultValues={EMPTY}
      onSubmit={(input) => createProductAction(input)}
      submitLabel="Створити товар"
    />
  );
}
```

Then `app/admin/products/new/page.tsx`:

```tsx
import { NewProductForm } from "@/components/admin/NewProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Новий товар</h1>
      <NewProductForm />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/new/page.tsx components/admin/NewProductForm.tsx
git commit -m "feat(admin): new product page"
```

---

### Task 12: Edit product page + [id] redirect

**Files:**
- Modify: `app/admin/products/[id]/edit/page.tsx`
- Modify: `app/admin/products/[id]/page.tsx`
- Create: `components/admin/EditProductForm.tsx`

**Interfaces:**
- Consumes: `getProductAction`, `updateProductAction`, `ProductForm`, `ProductInput`.

- [ ] **Step 1: Create `components/admin/EditProductForm.tsx`**

```tsx
"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "@/app/admin/products/actions";
import type { ProductInput } from "@/lib/validation/product";

export function EditProductForm({
  id,
  defaultValues,
}: {
  id: string;
  defaultValues: ProductInput;
}) {
  return (
    <ProductForm
      defaultValues={defaultValues}
      onSubmit={(input) => updateProductAction(id, input)}
      submitLabel="Зберегти зміни"
    />
  );
}
```

- [ ] **Step 2: Rewrite `app/admin/products/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getProductAction } from "../../actions";
import { EditProductForm } from "@/components/admin/EditProductForm";
import type { ProductInput } from "@/lib/validation/product";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductAction(id);
  if (!product) notFound();

  const defaultValues: ProductInput = {
    category: product.category,
    name_uk: product.name_uk,
    name_en: product.name_en,
    description_uk: product.description_uk,
    description_en: product.description_en,
    images: product.images,
    colors: product.colors,
    inStock: product.inStock,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    isHidden: product.isHidden,
    variants: product.variants.map((v) => ({
      size: v.size,
      fabric: v.fabric,
      price: Number(v.price),
    })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Редагувати товар</h1>
      <EditProductForm id={id} defaultValues={defaultValues} />
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `app/admin/products/[id]/page.tsx` to redirect to edit**

```tsx
import { redirect } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/products/${id}/edit`);
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/products/[id]/edit/page.tsx" "app/admin/products/[id]/page.tsx" components/admin/EditProductForm.tsx
git commit -m "feat(admin): edit product page + id redirect"
```

---

### Task 13: Full verification (lint, typecheck, browser)

**Files:** none (verification only)

- [ ] **Step 1: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both PASS, no errors.

- [ ] **Step 2: Confirm admin user exists / seed**

Ensure `.env` has `ADMIN_EMAIL` / `ADMIN_PASSWORD` set, then:
Run: `npm run db:seed`
Expected: admin user created/updated.

- [ ] **Step 3: Browser verify (use `verify` skill)**

Start `npm run dev` and walk the full flow at **375px viewport first**, then desktop:
1. Visit `/admin/products` logged out → redirected to `/admin/login`.
2. Log in with seeded credentials → land on `/admin/products`.
3. Click "Додати товар" → fill UA/EN name + description, pick category, upload ≥1 photo (confirm it lands in Cloudinary and preview shows), add a variant with a price → "Створити товар".
4. See the new product in the list with thumbnail + price.
5. Edit it (change a flag + price) → "Зберегти зміни" → confirm persisted.
6. Delete it → confirm removed from list.
7. Click "Вийти" → redirected to login.

Expected: every step works; layout is clean and tappable at 375px; no console errors.

- [ ] **Step 4: Final commit (if any verify fixes were made)**

```bash
git add -A
git commit -m "fix(admin): address verification findings"
```

---

## Self-Review

**Spec coverage:**
- Cloudinary signed upload → Tasks 5, 8. ✓
- Store secure_url, derive public_id → Tasks 5, 7. ✓
- Auth split-config + middleware + login → Tasks 1, 2. ✓
- Admin shell, UA-only, redirect → Task 3. ✓
- Server actions (CRUD, session check, best-effort image delete) → Task 7. ✓
- Shared zod schema → Task 6. ✓
- slug uniqueness/transliteration → Task 4. ✓
- ProductForm (fields, variants, colors, flags, images) → Task 9. ✓
- Pages list/new/edit/[id] redirect → Tasks 10, 11, 12. ✓
- Error handling typed results → Task 7, surfaced in Task 9. ✓
- Tests (slug, publicIdFromUrl, zod) → Tasks 4, 5, 6. ✓
- verify in browser at 375px → Task 13. ✓
- No new deps, no schema change → respected throughout. ✓

**Placeholder scan:** No TBD/TODO; all code blocks present.

**Type consistency:** `ProductInput` shape consistent across schema (Task 6), actions (Task 7), form (Task 9), pages (Tasks 11, 12). `ActionResult` defined in Task 7, consumed in Task 9. `signUploadAction` return shape matches `getUploadSignature` (Task 5) used in Task 8. `SIZES`/`FABRICS`/`COLORS` come from existing `lib/catalog.ts`.

> Open item flagged for execution: confirm `@hookform/resolvers/zod` + zod v4 peer compatibility during Task 9; if the resolver import path differs, adjust import only (no logic change).
