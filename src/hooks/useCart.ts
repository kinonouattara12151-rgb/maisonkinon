import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { CartItem, Product } from "../types";

const LS_CART = "kinon_cart_guest";

function loadGuestCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(LS_CART) ?? "[]"); }
  catch { return []; }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(LS_CART, JSON.stringify(items));
}

export function useCart(userId?: string, catalog: Product[] = []) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFromSupabase(userId);
    } else {
      setItems(loadGuestCart());
      setSynced(true);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && catalog.length > 0) loadFromSupabase(userId);
  }, [catalog.length]);

  useEffect(() => {
    if (!userId && synced) saveGuestCart(items);
  }, [items, userId, synced]);

  const loadFromSupabase = async (uid: string) => {
    const { data } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", uid);

    if (!data) { setSynced(true); return; }

    const mapped: CartItem[] = data
      .map((row: any) => {
        const product = catalog.find((p) => p.id === row.product_id);
        if (!product) return null;
        return { product, quantity: row.quantity };
      })
      .filter(Boolean) as CartItem[];

    setItems(mapped);
    setSynced(true);
  };

  const addToCart = useCallback(async (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const updated = prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
        if (userId) upsertSupabase(userId, product.id, (existing.quantity ?? 0) + 1);
        return updated;
      }
      if (userId) upsertSupabase(userId, product.id, 1);
      return [...prev, { product, quantity: 1 }];
    });
  }, [userId]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      if (userId) await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
    } else {
      setItems((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i));
      if (userId) upsertSupabase(userId, productId, quantity);
    }
  }, [userId]);

  const removeFromCart = useCallback(async (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (userId) await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
  }, [userId]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (userId) await supabase.from("cart_items").delete().eq("user_id", userId);
    else localStorage.removeItem(LS_CART);
  }, [userId]);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return { cartItems: items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart };
}

async function upsertSupabase(userId: string, productId: number, quantity: number) {
  await supabase.from("cart_items").upsert(
    { user_id: userId, product_id: productId, quantity },
    { onConflict: "user_id,product_id" },
  );
}
