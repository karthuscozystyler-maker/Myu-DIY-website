import { describe, expect, it, vi } from "vitest";
import { createCartClient, resolveSelection } from "./cart-client";
import { buildDIYCartSelection, type CartSelectionLine } from "./cart-plan";
import { EMPTY_DESIGN } from "./model";

const parent = "111111111111111111111111";
const variation = (index: number) => index.toString(16).padStart(24, "0");
const lines: CartSelectionLine[] = [
  { sku: "cloth", name: "引磁布", quantity: 1, unit: "piece", role: "cloth" },
  {
    sku: "tin",
    name: "四入小鐵盒",
    quantity: 2,
    unit: "box",
    role: "accessory",
  },
];
const catalog = (rows = lines) => ({
  available: true,
  kind: "single",
  productSetId: parent,
  children: [
    {
      productId: parent,
      variations: rows.map((line, i) => ({
        sku: line.sku,
        key: variation(i + 1),
        quantity: 0,
        preorderLimit: 9999,
      })),
    },
  ],
});
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
const context = () => ({ sessionId: "test-only-session", customerId: "" });
const clientWith = (request: typeof fetch, ctx = context) =>
  createCartClient({
    request,
    context: ctx,
    handles: ["verified"],
    storage: undefined,
  });

describe("strict SKU preflight", () => {
  it("never guesses missing SKU IDs", () => {
    expect(() => resolveSelection(lines, [catalog(lines.slice(1))])).toThrow(
      "引磁布"
    );
  });
  it("rejects ambiguous SKU mappings and insufficient stock", () => {
    const duplicate = catalog();
    duplicate.children[0].variations.push({
      ...duplicate.children[0].variations[0],
      key: variation(9),
    });
    expect(() => resolveSelection(lines, [duplicate])).toThrow();
    const sold = catalog();
    sold.children[0].variations[1].preorderLimit = 0;
    expect(() => resolveSelection(lines, [sold])).toThrow("數量不足");
  });
  it("treats normal stock, limited preorder and unlimited preorder distinctly", () => {
    const data = catalog();
    data.children[0].variations[1] = {
      ...data.children[0].variations[1],
      quantity: -2,
      preorderLimit: 3,
    };
    expect(() => resolveSelection(lines, [data])).toThrow();
    data.children[0].variations[1].preorderLimit = 9999;
    expect(resolveSelection(lines, [data])[1].quantity).toBe(2);
  });
});

describe("cart writes use mocked transport only", () => {
  it("does not request anything without merchant session", async () => {
    const request = vi.fn();
    const client = createCartClient({
      request,
      context: () => null,
      handles: ["verified"],
    });
    expect((await client.add(lines)).status).toBe("error");
    expect(request).not.toHaveBeenCalled();
  });
  it("resolves every item before adding any; missing cloth leaves cart untouched", async () => {
    const request = vi.fn(async () =>
      response(catalog(lines.slice(1)))
    ) as unknown as typeof fetch;
    const client = clientWith(request);
    expect((await client.add(lines)).status).toBe("error");
    expect(
      vi.mocked(request).mock.calls.every(([, init]) => init?.method === "GET")
    ).toBe(true);
  });
  it("sends actual variation IDs and ceil box quantities, not physical tin count", async () => {
    const selected = buildDIYCartSelection({
      ...EMPTY_DESIGN,
      pieces: Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        kind: "tin",
        finish: "cream",
        x: 0,
        y: 0,
      })),
    });
    const writes: Record<string, unknown>[] = [];
    const request = vi.fn(async (_url, init) => {
      if (init?.method === "POST") {
        writes.push(JSON.parse(init.body as string));
        return response({ ok: true });
      }
      return response(catalog(selected));
    }) as typeof fetch;
    const client = clientWith(request, () => ({
      sessionId: "guest-or-member",
      customerId: "member-test",
    }));
    expect((await client.add(selected)).status).toBe("success");
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({
      customerId: "member-test",
      productSetId: parent,
      variationId: variation(1),
      quantity: 2,
    });
    expect(writes[1]).toMatchObject({
      kind: "single",
      variationId: variation(2),
      quantity: 1,
    });
    const before = writes.length;
    expect((await client.add(selected)).status).toBe("success");
    expect(writes.length).toBe(before);
    expect(client.allowAnother(selected)).toBe(true);
    expect((await client.add(selected)).status).toBe("success");
    expect(writes.length).toBe(before + 2);
  });
  it("stops on partial failure and never repeats known-added lines", async () => {
    let posts = 0;
    const request = vi.fn(async (_url, init) => {
      if (init?.method !== "POST") return response(catalog());
      return response({ ok: ++posts === 1 });
    }) as typeof fetch;
    const client = clientWith(request);
    const result = await client.add(lines);
    expect(result.status).toBe("partial");
    expect(client.allowAnother(lines)).toBe(false);
    expect(result.added).toEqual([lines[1]]);
    expect((await client.add(lines)).status).toBe("partial");
    expect(posts).toBe(2);
  });
  it("does not retry an unconfirmed timed-out write", async () => {
    let posts = 0;
    const request = vi.fn(async (_url, init) => {
      if (init?.method !== "POST") return response(catalog());
      posts++;
      throw new Error("connection closed after server may have added");
    }) as typeof fetch;
    const client = clientWith(request);
    expect((await client.add(lines)).status).toBe("uncertain");
    expect((await client.add(lines)).status).toBe("uncertain");
    expect(posts).toBe(1);
    expect(client.allowAnother(lines)).toBe(false);
  });
  it("blocks concurrent submissions", async () => {
    let release: () => void = () => {};
    const wait = new Promise<void>(resolve => {
      release = resolve;
    });
    const request = vi.fn(async (_url, init) => {
      if (init?.method !== "POST") {
        await wait;
        return response(catalog());
      }
      return response({ ok: true });
    }) as typeof fetch;
    const client = clientWith(request);
    const first = client.add(lines);
    expect((await client.add(lines)).message).toContain("正在加入");
    release();
    expect((await first).status).toBe("success");
  });
  it("does not add if cart identity changes during preflight", async () => {
    let customer = "";
    const request = vi.fn(async () => {
      customer = "signed-in-later";
      return response(catalog());
    }) as typeof fetch;
    const client = clientWith(request, () => ({
      sessionId: "test-session",
      customerId: customer,
    }));
    expect((await client.add(lines)).status).toBe("error");
    expect(
      vi.mocked(request).mock.calls.every(([, init]) => init?.method !== "POST")
    ).toBe(true);
  });
});
