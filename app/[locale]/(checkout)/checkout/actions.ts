'use server';

import { prisma } from '@/lib/prisma';
import { sendNewOrderNotification } from '@/lib/telegram';
import type { CartItem } from '@/lib/stores/cart';

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

  // ── Fetch authoritative prices from DB (never trust client prices) ───────────
  const variantIds = payload.items
    .map((i) => i.variantId)
    .filter((id): id is string => id !== null);
  const productIds = payload.items.map((i) => i.productId);

  let variants: { id: string; price: { toNumber: () => number } | number }[];
  let products: { id: string }[];
  try {
    [variants, products] = await Promise.all([
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, price: true },
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      }),
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

  let resolvedItems: (CartItem & { price: number })[];
  try {
    resolvedItems = payload.items.map((i) => {
      if (!productIdSet.has(i.productId)) {
        throw new Error(`Product ${i.productId} not found`);
      }
      if (i.variantId === null) {
        throw new Error(`Item "${i.name}" has no variant`);
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
  } catch {
    return { error: 'Товар не знайдено або недоступний' };
  }

  const totalAmount = resolvedItems.reduce((s, i) => s + i.price * i.qty, 0);
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
          create: resolvedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            name: i.name,
            size: i.size ?? undefined,
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
      customerName,
      phone: payload.phone.replace(/\s/g, ''),
      city: payload.city,
      novaPoshta: payload.novaPoshta,
      note: payload.note.trim() || null,
      totalAmount,
      paymentMethod: 'cod',
      monoPaidAt: null,
      items: resolvedItems.map((i) => ({
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
