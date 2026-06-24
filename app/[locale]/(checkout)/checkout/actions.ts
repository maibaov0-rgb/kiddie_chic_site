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
  if (!payload.firstName.trim()) return { error: "Вкажіть ім'я" };
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
        email: '',           // not collected at checkout yet — leave empty
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
