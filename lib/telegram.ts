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
