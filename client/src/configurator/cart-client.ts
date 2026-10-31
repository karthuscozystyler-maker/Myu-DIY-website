import { selectionKey, type CartSelectionLine } from "./cart-plan";

declare global {
  interface Window {
    /** Set from the SHOPLINE snippet: <div data-myu-embed data-cart-api data-cart-handles> */
    __MYU_CART__?: { api?: string; handles?: string[] };
  }
}

// Defaults: the merchant's existing kit API and the SHOPLINE products it already knows.
// The snippet can override both without rebuilding (see deliverables/API-接駁說明.md).
export const CART_API = "https://cozystyle-xsddw2az.manus.space";
export const CART_CATALOG_HANDLES = ["myumyu-lego-set-2", "myumyu-lego-set-1"];
const cartApi = () =>
  (typeof window !== "undefined" && window.__MYU_CART__?.api?.replace(/\/+$/, "")) ||
  CART_API;
const cartHandles = () =>
  (typeof window !== "undefined" && window.__MYU_CART__?.handles?.length
    ? window.__MYU_CART__.handles
    : CART_CATALOG_HANDLES);
export type CartResult = {
  status: "success" | "error" | "partial" | "uncertain";
  message: string;
  added: CartSelectionLine[];
};
type CartContext = { sessionId: string; customerId: string };
export type ResolvedCartLine = CartSelectionLine & {
  productSetId: string;
  variationId: string;
};
type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;
const id = (value: unknown) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value) ? value : "";

export function merchantCartContext(): CartContext | null {
  if (
    typeof window === "undefined" ||
    !/(^|\.)cozystyler\.com$/.test(window.location.hostname)
  )
    return null;
  const config = (
    window as unknown as {
      mainConfig?: {
        sessionId?: unknown;
        currentUser?: { _id?: unknown; id?: unknown };
      };
    }
  ).mainConfig;
  const sessionId =
    typeof config?.sessionId === "string" ? config.sessionId.trim() : "";
  const customer = config?.currentUser?._id ?? config?.currentUser?.id;
  return sessionId
    ? { sessionId, customerId: typeof customer === "string" ? customer : "" }
    : null;
}

/** Strictly matches a SKU to one actual live variation; never guesses IDs. */
export function resolveSelection(
  lines: CartSelectionLine[],
  catalogs: unknown[]
): ResolvedCartLine[] {
  if (
    !lines.length ||
    lines.some(
      line =>
        !line.sku || !Number.isSafeInteger(line.quantity) || line.quantity < 1
    )
  )
    throw new Error("請先選擇有效的商品及數量。");
  const matches = new Map<
    string,
    { productSetId: string; variationId: string; available: number | null }[]
  >();
  for (const catalog of catalogs) {
    if (
      !isRecord(catalog) ||
      catalog.available !== true ||
      catalog.kind !== "single" ||
      !id(catalog.productSetId) ||
      !Array.isArray(catalog.children)
    )
      continue;
    const parent = catalog.productSetId as string;
    for (const child of catalog.children) {
      if (
        !isRecord(child) ||
        child.productId !== parent ||
        !Array.isArray(child.variations)
      )
        continue;
      for (const variation of child.variations) {
        if (
          !isRecord(variation) ||
          typeof variation.sku !== "string" ||
          !id(variation.key)
        )
          continue;
        const quantity =
          typeof variation.quantity === "number" &&
          Number.isFinite(variation.quantity)
            ? variation.quantity
            : null;
        const limit =
          typeof variation.preorderLimit === "number" &&
          Number.isFinite(variation.preorderLimit)
            ? variation.preorderLimit
            : null;
        const available =
          quantity === null || limit === null
            ? null
            : limit < 0 || limit >= 9999
              ? null
              : Math.max(0, limit === 0 ? quantity : limit + quantity);
        const item = {
          productSetId: parent,
          variationId: variation.key as string,
          available,
        };
        const list = matches.get(variation.sku) ?? [];
        if (
          !list.some(
            existing =>
              existing.productSetId === item.productSetId &&
              existing.variationId === item.variationId
          )
        )
          list.push(item);
        matches.set(variation.sku, list);
      }
    }
  }
  return lines.map(line => {
    const found = matches.get(line.sku);
    if (!found || found.length !== 1)
      throw new Error(`${line.name}暫未開放購買，請稍後再試或聯絡我們。`);
    const variation = found[0];
    if (variation.available !== null && variation.available < line.quantity)
      throw new Error(`${line.name}暫時數量不足，請調整後再試。`);
    return {
      ...line,
      productSetId: variation.productSetId,
      variationId: variation.variationId,
    };
  });
}

function hashed(value: string) {
  let n = 2166136261;
  for (let i = 0; i < value.length; i++) {
    n ^= value.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return (n >>> 0).toString(36);
}
function safeSessionStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

export function createCartClient({
  request = fetch,
  context = merchantCartContext,
  handles,
  storage = safeSessionStorage(),
}: {
  request?: typeof fetch;
  context?: () => CartContext | null;
  handles?: readonly string[];
  storage?: Storage;
} = {}) {
  const records = new Map<string, CartResult>();
  let active = false;
  const recordKey = (lines: CartSelectionLine[], cart: CartContext) =>
    `myu-cart-v1:${hashed(cart.sessionId + ":" + cart.customerId)}:${hashed(selectionKey(lines))}`;
  const read = (key: string): CartResult | null => {
    if (records.has(key)) return records.get(key)!;
    try {
      const parsed = JSON.parse(storage?.getItem(key) ?? "null");
      if (
        isRecord(parsed) &&
        ["success", "partial", "uncertain"].includes(String(parsed.status)) &&
        typeof parsed.message === "string" &&
        Array.isArray(parsed.added)
      )
        return parsed as CartResult;
    } catch {
      /* Storage is optional; never store session/customer identifiers. */
    }
    return null;
  };
  const save = (key: string, value: CartResult) => {
    records.set(key, value);
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      /* In-memory guard remains. */
    }
  };
  const previous = (lines: CartSelectionLine[]) => {
    const cart = context();
    return cart ? read(recordKey(lines, cart)) : null;
  };
  const error = (message: string): CartResult => ({
    status: "error",
    message,
    added: [],
  });
  async function timedRequest(url: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      return await request(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function add(
    lines: CartSelectionLine[],
    progress: (text: string) => void = () => {}
  ): Promise<CartResult> {
    // Read session and current user at click time, not when the script first loads.
    const cart = context();
    if (!cart)
      return error("暫時未能連接商店購物車，請重新整理商店頁面後再試。");
    if (active) return error("另一份清單正在加入購物車，請稍候再試。");
    const key = recordKey(lines, cart);
    const prior = read(key);
    if (prior) return prior;
    active = true;
    const added: CartSelectionLine[] = [];
    try {
      progress("確認商品中…");
      const catalogs = await Promise.all(
        (handles ?? cartHandles()).map(async handle => {
          const response = await timedRequest(
            `${cartApi()}/api/kit/${encodeURIComponent(handle)}`,
            { method: "GET", credentials: "omit" }
          );
          if (!response.ok)
            throw new Error("暫時未能確認商品，尚未加入任何貨品。請稍後再試。");
          return response.json() as Promise<unknown>;
        })
      );
      // Resolve ALL lines before the first write; an unavailable cloth cannot leave accessories alone in cart.
      const resolved = resolveSelection(lines, catalogs).sort(
        (a, b) => Number(a.role === "cloth") - Number(b.role === "cloth")
      );
      // Accessories may be bought alone. Add the cloth last so a partial write
      // cannot leave only the non-standalone cloth in the customer's cart.
      for (const [index, line] of resolved.entries()) {
        const live = context();
        if (
          !live ||
          live.sessionId !== cart.sessionId ||
          live.customerId !== cart.customerId
        ) {
          const result = {
            status: added.length ? "partial" : "error",
            message: "登入狀態已改變，請先前往購物車確認，再重新選購。",
            added,
          } as CartResult;
          if (added.length) save(key, result);
          return result;
        }
        progress(`加入中 ${index + 1}/${resolved.length}…`);
        const uncertain: CartResult = {
          status: "uncertain",
          message: "加入結果尚未確認，為免重複加貨，請先前往購物車查看。",
          added: [...added],
        };
        // Persist BEFORE sending: a refresh/closed tab must not silently repeat an unconfirmed write.
        save(key, uncertain);
        let response: Response;
        let data: unknown;
        try {
          response = await timedRequest(`${cartApi()}/api/kit/add`, {
            method: "POST",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: cart.sessionId,
              customerId: cart.customerId,
              kind: "single",
              productSetId: line.productSetId,
              variationId: line.variationId,
              quantity: line.quantity,
            }),
          });
          data = await response.json();
        } catch {
          return uncertain;
        }
        if (!response.ok || !isRecord(data) || data.ok !== true) {
          const result: CartResult = {
            status: added.length ? "partial" : "uncertain",
            message: added.length
              ? "只有以下商品確認已加入。其餘商品未完成，請前往購物車確認，避免重複加貨。"
              : "暫未能確認加車結果，請先前往購物車查看，再聯絡客服協助。",
            added: [...added],
          };
          save(key, result);
          return result;
        }
        added.push({
          sku: line.sku,
          name: line.name,
          quantity: line.quantity,
          unit: line.unit,
          role: line.role,
        });
      }
      const result: CartResult = {
        status: "success",
        message: "已加入購物車，請到購物車確認款式、價格及結帳。",
        added,
      };
      save(key, result);
      return result;
    } catch (reason) {
      return error(
        reason instanceof Error
          ? reason.message
          : "暫時未能加入購物車，請稍後再試。"
      );
    } finally {
      active = false;
    }
  }
  function allowAnother(lines: CartSelectionLine[]): boolean {
    const cart = context();
    if (!cart || active) return false;
    const key = recordKey(lines, cart);
    if (read(key)?.status !== "success") return false;
    records.delete(key);
    try {
      storage?.removeItem(key);
    } catch {
      /* In-memory result was cleared. */
    }
    return true;
  }
  return { add, previous, allowAnother };
}
const client = createCartClient();
export const addCartSelection = client.add;
export const getPreviousCartResult = client.previous;
export const allowAnotherCartSelection = client.allowAnother;
