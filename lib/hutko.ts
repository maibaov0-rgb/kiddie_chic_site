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
  let merchantId: string;
  let password: string;
  try {
    merchantId = getMerchantId();
    password = getMerchantPassword();
  } catch (err) {
    console.error("[createHutkoPayment] missing credentials", err);
    return { error: "Платіжний сервіс тимчасово недоступний. Спробуйте ще раз пізніше." };
  }
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
