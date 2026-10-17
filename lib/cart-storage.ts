export const CART_STORAGE_KEY = "global_market_cart";
export const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_CART_ITEMS = 50;

export type CartStorageItem = {
  id: string;
  productId: string;
  slug?: string | null;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  merchantId: string;
  merchantName: string;
  deepLink: string;
  freshness: string;
  inStock: boolean;
  isFixture?: boolean;
  expiresAt?: string;
};

type StoredCart = {
  version: 1;
  items: CartStorageItem[];
};

export type AddToCartResult = {
  items: CartStorageItem[];
  added: boolean;
  limitReached: boolean;
};

const hasExpired = (item: CartStorageItem, now = Date.now()) => {
  if (!item.expiresAt) return false;
  const expiresAt = Date.parse(item.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
};

const withExpiry = (item: CartStorageItem): CartStorageItem => ({
  ...item,
  expiresAt: item.expiresAt && Number.isFinite(Date.parse(item.expiresAt))
    ? item.expiresAt
    : new Date(Date.now() + CART_TTL_MS).toISOString(),
});

function writeCart(items: CartStorageItem[]) {
  if (typeof window === "undefined") return;
  const value: StoredCart = { version: 1, items: items.map(withExpiry) };
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
}

function parseStoredCart(raw: string | null): CartStorageItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredCart | CartStorageItem[];
    const items = Array.isArray(parsed) ? parsed : parsed?.version === 1 && Array.isArray(parsed.items) ? parsed.items : [];
    return items.filter((item): item is CartStorageItem => Boolean(
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.productId === "string" &&
      typeof item.title === "string",
    ));
  } catch {
    return [];
  }
}

/** Read active saved items and remove entries whose 30-day TTL has elapsed. */
export function getCart(): CartStorageItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  const parsed = parseStoredCart(raw);
  const active = parsed.filter((item) => !hasExpired(item)).map(withExpiry);
  if (active.length !== parsed.length || JSON.stringify(active) !== JSON.stringify(parsed)) writeCart(active);
  return active;
}

/** Add a product once, while enforcing the 50-item saved-cart limit. */
export function addToCart(item: CartStorageItem): AddToCartResult {
  const current = getCart();
  const existing = current.some((saved) => saved.id === item.id || saved.productId === item.productId);
  if (existing) return { items: current, added: false, limitReached: false };
  if (current.length >= MAX_CART_ITEMS) return { items: current, added: false, limitReached: true };

  const items = [withExpiry(item), ...current];
  writeCart(items);
  return { items, added: true, limitReached: false };
}

export function removeFromCart(id: string): CartStorageItem[] {
  const items = getCart().filter((item) => item.id !== id && item.productId !== id);
  writeCart(items);
  return items;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function saveCart(items: CartStorageItem[]): CartStorageItem[] {
  const active = items.filter((item) => !hasExpired(item)).slice(0, MAX_CART_ITEMS).map(withExpiry);
  writeCart(active);
  return active;
}
