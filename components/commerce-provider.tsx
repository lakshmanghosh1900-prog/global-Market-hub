"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ListingProduct } from "@/lib/types";
import {
  addToCart as addStoredCartItem,
  clearCart as clearStoredCart,
  getCart as getStoredCart,
  removeFromCart as removeStoredCartItem,
  saveCart,
  type CartStorageItem,
} from "@/lib/cart-storage";
import { WishlistCartDrawer } from "@/components/cart/WishlistCartDrawer";

type SavedProduct = ListingProduct & { addedPrice: number; targetPrice?: number };

type CommerceContextValue = {
  cart: CartStorageItem[];
  wishlist: SavedProduct[];
  cartCount: number;
  addToCart: (product: ListingProduct) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: ListingProduct) => void;
  isWishlisted: (productId: string) => boolean;
  setTargetPrice: (productId: string, targetPrice: number) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

export const WISHLIST_STORAGE_KEY = "gmh-commerce-v1";
const CommerceContext = createContext<CommerceContextValue | null>(null);

function clientFreshness(product: ListingProduct) {
  const elapsedHours = Math.max(0, Math.floor((Date.now() - product.lastSync.getTime()) / 3_600_000));
  const updated = elapsedHours < 1 ? "updated just now" : elapsedHours < 24 ? `updated ${elapsedHours}h ago` : `updated ${Math.floor(elapsedHours / 24)}d ago`;
  return product.inStock ? `In stock · ${updated}` : `Currently unavailable · ${updated}`;
}

function toCartItem(product: ListingProduct): CartStorageItem {
  return {
    id: product.id,
    productId: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    currency: "INR",
    imageUrl: product.image ?? "",
    merchantId: product.merchant.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    merchantName: product.merchant,
    deepLink: product.affiliateUrl,
    freshness: clientFreshness(product),
    inStock: product.inStock,
  };
}

function readLocalWishlist(): SavedProduct[] {
  try {
    const saved = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "{}") as { wishlist?: SavedProduct[] };
    return Array.isArray(saved.wishlist) ? saved.wishlist : [];
  } catch {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    return [];
  }
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartStorageItem[]>([]);
  const [wishlist, setWishlist] = useState<SavedProduct[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const refreshFromServer = () => {
    void fetch("/api/commerce/state", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const state = await response.json() as { cart?: CartStorageItem[]; wishlist?: SavedProduct[]; mode?: string };
      if (state.mode === "local") return;
      if (Array.isArray(state.cart)) setCart(saveCart(state.cart));
      if (Array.isArray(state.wishlist)) setWishlist(state.wishlist.map((item) => ({ ...item, lastSync: new Date(item.lastSync) })));
    }).catch(() => undefined);
  };

  useEffect(() => {
    setCart(getStoredCart());
    setWishlist(readLocalWishlist());
    setHydrated(true);
    refreshFromServer();
    const onAuthChanged = () => refreshFromServer();
    window.addEventListener("gmh-auth-changed", onAuthChanged);
    return () => window.removeEventListener("gmh-auth-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(cart);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify({ wishlist }));
  }, [cart, wishlist, hydrated]);

  const value = useMemo<CommerceContextValue>(() => ({
    cart,
    wishlist,
    cartCount: cart.length,
    addToCart: (product) => {
      const result = addStoredCartItem(toCartItem(product));
      setCart(result.items);
      if (result.limitReached) {
        setCartNotice("Your saved cart can hold up to 50 items. Remove one before saving another.");
        window.setTimeout(() => setCartNotice(""), 4200);
      } else if (!result.added) {
        setCartNotice("That product is already saved in your cart.");
        window.setTimeout(() => setCartNotice(""), 3000);
      }
      void fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      setDrawerOpen(true);
    },
    removeFromCart: (id) => {
      setCart(removeStoredCartItem(id));
      void fetch(`/api/cart?productId=${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clearCart: () => {
      clearStoredCart();
      setCart([]);
      void fetch("/api/cart", { method: "DELETE" });
    },
    toggleWishlist: (product) => {
      setWishlist((current) => {
        const exists = current.some((item) => item.id === product.id);
        if (exists) void fetch(`/api/wishlist?productId=${encodeURIComponent(product.id)}`, { method: "DELETE" });
        else void fetch("/api/wishlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
        return exists ? current.filter((item) => item.id !== product.id) : [...current, { ...product, addedPrice: product.price }];
      });
    },
    isWishlisted: (productId) => wishlist.some((item) => item.id === productId),
    setTargetPrice: (productId, targetPrice) => {
      setWishlist((current) => current.map((item) => item.id === productId ? { ...item, targetPrice } : item));
      void fetch("/api/wishlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, targetPrice }) });
    },
    drawerOpen,
    setDrawerOpen,
  }), [cart, wishlist, drawerOpen]);

  return (
    <CommerceContext.Provider value={value}>
      {children}
      <WishlistCartDrawer />
      {cartNotice ? <div className="cart-toast" role="status">{cartNotice}</div> : null}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
