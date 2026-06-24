import { Bot } from "grammy";

let bot: Bot | null = null;

function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
    bot = new Bot(token);
  }
  return bot;
}

function getChatId(): string {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_ADMIN_CHAT_ID is not set");
  return chatId;
}

export interface OrderForNotification {
  ref: string;
  customerName: string;
  phone: string;
  city: string;
  novaPoshta: string;
  note: string | null;
  totalAmount: number;
  paymentMethod: "cod" | "card";
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildOrderMessage(order: OrderForNotification): string {
  const fmt = (n: number) =>
    n.toLocaleString("uk-UA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const itemLines = order.items
    .map((i) => {
      const attrs = [i.size && escapeHtml(i.size), i.color && escapeHtml(i.color)].filter(Boolean).join(", ");
      const label = attrs ? `${escapeHtml(i.name)} (${attrs})` : escapeHtml(i.name);
      return `• ${label} × ${i.qty} — ${fmt(i.price * i.qty)} ₴`;
    })
    .join("\n");

  const paymentLine =
    order.paymentMethod === "cod"
      ? "💳 <b>Оплата:</b> Постоплата (при отриманні)"
      : "💳 <b>Оплата:</b> Онлайн — ✅ Оплачено";

  const noteLine = order.note ? `\n📝 <i>Примітка: ${escapeHtml(order.note)}</i>` : "";

  return [
    `🛍 <b>Нове замовлення #${order.ref}</b>`,
    "",
    `👤 <b>Замовник</b>`,
    `Ім'я: ${escapeHtml(order.customerName)}`,
    `Телефон: ${escapeHtml(order.phone)}`,
    "",
    `📦 <b>Товари</b>`,
    itemLines,
    "",
    `💰 <b>Сума: ${fmt(order.totalAmount)} ₴</b>`,
    "",
    `🚚 <b>Доставка</b>`,
    `${escapeHtml(order.city)}, Нова Пошта ${escapeHtml(order.novaPoshta)}`,
    "",
    paymentLine,
    noteLine,
  ]
    .join("\n")
    .trim();
}

export async function sendNewOrderNotification(
  order: OrderForNotification
): Promise<void> {
  const text = buildOrderMessage(order);
  await getBot().api.sendMessage(getOrderChatId(), text, {
    parse_mode: "HTML",
  });
}

export async function sendOrderNotification(message: string): Promise<void> {
  await getBot().api.sendMessage(getChatId(), message, { parse_mode: "HTML" });
}

export async function sendCallbackRequest(name: string, phone: string): Promise<void> {
  const text = `📞 <b>Замовлення дзвінка</b>\n\nІм'я: ${name}\nТелефон: ${phone}`;
  await getBot().api.sendMessage(getChatId(), text, { parse_mode: "HTML" });
}

export async function sendCoutureRequest(phone: string): Promise<void> {
  const text = `👗 <b>Запит на консультацію по кутюрній сукні</b>\n\nТелефон: ${phone}`;
  await getBot().api.sendMessage(getChatId(), text, { parse_mode: "HTML" });
}
