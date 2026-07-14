'use server';

import { prisma } from '@/lib/prisma';
import { sendNewOrderNotification } from '@/lib/telegram';
import type { CartItem } from '@/lib/stores/cart';
import { createHutkoPayment as requestHutkoCheckout } from '@/lib/hutko';
import { routing, type Locale } from '@/i18n/routing';

export interface PlaceOrderPayload {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  novaPoshta: string;
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
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `KC-${timestamp}${random}`;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  // ── Validate input ───────────────────────────────────────────────────────────
  if (!payload.firstName.trim()) return { error: "Вкажіть ім'я" };
  if (!isValidPhone(payload.phone)) return { error: 'Невірний номер телефону' };
  if (!payload.city.trim()) return { error: 'Вкажіть місто' };
  if (!payload.novaPoshta.trim()) return { error: 'Вкажіть відділення' };
  if (!payload.items.length) return { error: 'Кошик порожній' };

  const productLines = payload.items.filter(
    (i): i is Extract<CartItem, { kind: 'product' }> => i.kind === 'product',
  );
  const accessoryLines = payload.items.filter(
    (i): i is Extract<CartItem, { kind: 'accessory' }> => i.kind === 'accessory',
  );

  // ── Fetch authoritative prices from DB (never trust client prices) ───────────
  const variantIds = productLines.map((i) => i.variantId);
  const productIds = productLines.map((i) => i.productId);
  const accessoryIds = accessoryLines.map((i) => i.accessoryId);

  let variants: { id: string; price: { toNumber: () => number } | number }[];
  let products: { id: string }[];
  let accessories: { id: string; price: { toNumber: () => number } | number }[];
  try {
    [variants, products, accessories] = await Promise.all([
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, price: true },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
      accessoryIds.length > 0
        ? prisma.productAccessory.findMany({
            where: { id: { in: accessoryIds } },
            select: { id: true, price: true },
          })
        : Promise.resolve([]),
    ]);
  } catch (err) {
    console.error('[placeOrder] DB lookup error', err);
    return { error: 'Помилка збереження замовлення. Спробуйте ще раз.' };
  }

  const variantPriceMap = new Map(
    variants.map((v) => [
      v.id,
      typeof v.price === 'number' ? v.price : v.price.toNumber(),
    ]),
  );
  const productIdSet = new Set(products.map((p) => p.id));
  const accessoryPriceMap = new Map(
    accessories.map((a) => [
      a.id,
      typeof a.price === 'number' ? a.price : a.price.toNumber(),
    ]),
  );

  let resolvedProductItems: (Extract<CartItem, { kind: 'product' }> & { price: number })[];
  let resolvedAccessoryItems: { name: string; price: number; qty: number }[];
  try {
    resolvedProductItems = productLines.map((i) => {
      if (!productIdSet.has(i.productId)) {
        throw new Error(`Product ${i.productId} not found`);
      }
      const price = variantPriceMap.get(i.variantId);
      if (price === undefined) {
        throw new Error(`Variant ${i.variantId} not found`);
      }
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) {
        throw new Error(`Invalid qty ${i.qty}`);
      }
      return { ...i, price };
    });
    resolvedAccessoryItems = accessoryLines.map((i) => {
      const price = accessoryPriceMap.get(i.accessoryId);
      if (price === undefined) {
        throw new Error(`Accessory ${i.accessoryId} not found`);
      }
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) {
        throw new Error(`Invalid qty ${i.qty}`);
      }
      return { name: i.name, price, qty: i.qty };
    });
  } catch {
    return { error: 'Товар не знайдено або недоступний' };
  }

  const totalAmount =
    resolvedProductItems.reduce((s, i) => s + i.price * i.qty, 0) +
    resolvedAccessoryItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ref = generateRef();
  const customerName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

  // ── Persist ──────────────────────────────────────────────────────────────────
  let order: { id: string; ref: string };
  try {
    order = await prisma.order.create({
      data: {
        ref,
        customerName,
        phone: payload.phone.replace(/\s/g, ''),
        email: '',
        city: payload.city,
        novaPoshta: payload.novaPoshta,
        note: payload.note.trim() || null,
        paymentMethod: payload.paymentMethod,
        totalAmount,
        items: {
          create: resolvedProductItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            size: i.size ?? undefined,
            color: i.color ?? undefined,
            price: i.price,
            qty: i.qty,
          })),
        },
        accessoryItems: {
          create: resolvedAccessoryItems.map((i) => ({
            name: i.name,
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
      customerName,
      phone: payload.phone.replace(/\s/g, ''),
      city: payload.city,
      novaPoshta: payload.novaPoshta,
      note: payload.note.trim() || null,
      totalAmount,
      paymentMethod: 'cod',
      paidAt: null,
      items: [
        ...resolvedProductItems.map((i) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          price: i.price,
          qty: i.qty,
        })),
        ...resolvedAccessoryItems.map((i) => ({
          name: i.name,
          size: null,
          color: null,
          price: i.price,
          qty: i.qty,
        })),
      ],
    }).catch((err) => console.error('[placeOrder] Telegram error', err));
  }

  return { orderId: order.id, ref: order.ref };
}

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
