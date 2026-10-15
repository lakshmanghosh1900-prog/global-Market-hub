"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ListingProduct } from "@/lib/types";
import { CartDrawer } from "@/components/cart-drawer";

type SavedProduct = ListingProduct & { addedPrice: number; targetPrice?: number };
type CartLine = SavedProduct & { quantity: number };

type CommerceContextValue = {
  cart: CartLine[];
  wishlist: SavedProduct[];
  cartCount: number;
  addToCart: (product: ListingProduct) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: ListingProduct) => void;
  isWishlisted: (productId: string) => boolean;
  setTargetPrice: (productId: string, targetPrice: number) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const STORAGE_KEY = "gmh-commerce-v1";
const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<SavedProduct[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as { cart?: CartLine[]; wishlist?: SavedProduct[] };
      setCart(Array.isArray(saved.cart) ? saved.cart : []);
      setWishlist(Array.isArray(saved.wishlist) ? saved.wishlist : []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, wishlist }));
  }, [cart, wishlist]);

  const value = useMemo<CommerceContextValue>(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((total, item) => total + item.quantity, 0),
    addToCart: (product) => {
      if (!product.inStock) return;
      setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...current, { ...product, addedPrice: product.price, quantity: 1 }];
      });
      setDrawerOpen(true);
    },
    removeFromCart: (productId) => setCart((current) => current.filter((item) => item.id !== productId)),
    setQuantity: (productId, quantity) => {
      setCart((current) => current.map((item) => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
    },
    toggleWishlist: (product) => {
      setWishlist((current) => current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, { ...product, addedPrice: product.price }]);
    },
    isWishlisted: (productId) => wishlist.some((item) => item.id === productId),
    setTargetPrice: (productId, targetPrice) => setWishlist((current) => current.map((item) => item.id === productId ? { ...item, targetPrice } : item)),
    drawerOpen,
    setDrawerOpen,
  }), [cart, wishlist, drawerOpen]);

  return (
    <CommerceContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
