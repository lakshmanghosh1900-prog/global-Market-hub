import assert from "node:assert/strict";
import test from "node:test";
import { addToCart, CART_STORAGE_KEY, clearCart, getCart, MAX_CART_ITEMS } from "@/lib/cart-storage";
import { cleanupExpiredCarts } from "@/lib/cart";

function installStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
  return values;
}

function item(id: string) {
  return {
    id,
    productId: id,
    title: `Product ${id}`,
    price: 49,
    currency: "INR",
    imageUrl: "",
    merchantId: "flipkart",
    merchantName: "Flipkart",
    deepLink: "https://www.flipkart.com/product",
    freshness: "In stock · updated just now",
    inStock: true,
  };
}

test("cart storage caps anonymous saved items at 50 and deduplicates products", () => {
  installStorage();
  clearCart();
  for (let index = 0; index < MAX_CART_ITEMS; index += 1) addToCart(item(String(index)));
  const result = addToCart(item("overflow"));
  assert.equal(result.limitReached, true);
  assert.equal(getCart().length, MAX_CART_ITEMS);
  assert.equal(addToCart(item("1")).added, false);
  assert.equal(JSON.parse(globalThis.window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}").version, 1);
});

test("cart storage drops items after their 30-day expiry", () => {
  const values = installStorage();
  values.set(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ ...item("expired"), expiresAt: new Date(Date.now() - 1).toISOString() }] }));
  assert.deepEqual(getCart(), []);
});

test("server cart cleanup requests deletion only for expired carts", async () => {
  let where: unknown;
  const result = await cleanupExpiredCarts({ cart: { deleteMany: async (args: { where: unknown }) => { where = args.where; return { count: 2 }; } } } as never, new Date("2026-10-17T00:00:00.000Z"));
  assert.equal(result.count, 2);
  assert.deepEqual(where, { expiresAt: { lte: new Date("2026-10-17T00:00:00.000Z") } });
});
