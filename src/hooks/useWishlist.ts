import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

const LS_WISHLIST = "kinon_wishlist_guest";

function loadGuest(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_WISHLIST) ?? "[]")); }
  catch { return new Set(); }
}

export function useWishlist(userId?: string) {
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFromSupabase(userId);
    } else {
      setWishlist(loadGuest());
      setSynced(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId && synced) {
      localStorage.setItem(LS_WISHLIST, JSON.stringify([...wishlist]));
    }
  }, [wishlist, userId, synced]);

  const loadFromSupabase = async (uid: string) => {
    const { data } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", uid);
    setWishlist(new Set((data ?? []).map((r: any) => r.product_id as number)));
    setSynced(true);
  };

  const toggleWishlist = useCallback(async (id: number) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (userId) supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", id).then(() => {});
      } else {
        next.add(id);
        if (userId) supabase.from("wishlist_items").insert({ user_id: userId, product_id: id }).then(() => {});
      }
      return next;
    });
  }, [userId]);

  return { wishlist, toggleWishlist };
}
