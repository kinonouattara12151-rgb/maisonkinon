import {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import type { User as SupaUser, Session } from "@supabase/supabase-js";
import type { User, Order, OrderItem, DeliveryInfo } from "../types";

function toAppUser(su: SupaUser): User {
  return {
    id:        su.id,
    firstName: su.user_metadata?.first_name ?? "",
    lastName:  su.user_metadata?.last_name  ?? "",
    email:     su.email ?? "",
    createdAt: su.created_at,
  };
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login:    (email: string, password: string) => Promise<string | null>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<string | null>;
  logout:   () => Promise<void>;
  orders:   Order[];
  placeOrder:         (items: OrderItem[], total: number, delivery: DeliveryInfo) => Promise<void>;
  requestReset:       (email: string) => Promise<string | null>;
  resetPassword:      (token: string, newPassword: string) => Promise<string | null>;
  validateResetToken: (token: string) => { valid: boolean; email?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [_session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ? toAppUser(data.session.user) : null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ? toAppUser(s.user) : null);
      if (!s) setOrders([]);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchOrders(user.id);
  }, [user?.id]);

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!data) return;

    const mapped: Order[] = data.map((o: any) => ({
      id:            o.id,
      userId:        o.user_id,
      total:         o.total,
      status:        o.status,
      date:          o.created_at,
      customerName:  o.customer_name,
      customerEmail: o.customer_email,
      delivery: {
        phone:         o.phone,
        city:          o.city,
        commune:       o.commune,
        preferredDate: o.preferred_date,
        preferredTime: o.preferred_time,
        notes:         o.delivery_notes,
      },
      items: (o.order_items ?? []).map((i: any) => ({
        productId:   i.product_id,
        productName: i.product_name,
        brand:       i.brand,
        price:       i.price,
        quantity:    i.quantity,
        image:       i.image,
      })),
    }));

    setOrders(mapped);
  };

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login")) return "E-mail ou mot de passe incorrect.";
      return error.message;
    }
    return null;
  }, []);

  const register = useCallback(async (
    firstName: string, lastName: string, email: string, password: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) {
      if (error.message.includes("already registered")) return "Un compte avec cet e-mail existe déjà.";
      return error.message;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const placeOrder = useCallback(async (
    items: OrderItem[], total: number, delivery: DeliveryInfo,
  ) => {
    if (!user) return;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id:        user.id,
        total,
        status:         "confirmée",
        phone:          delivery.phone,
        city:           delivery.city,
        commune:        delivery.commune,
        preferred_date: delivery.preferredDate,
        preferred_time: delivery.preferredTime,
        delivery_notes: delivery.notes ?? "",
        customer_name:  `${user.firstName} ${user.lastName}`.trim(),
        customer_email: user.email,
      })
      .select()
      .single();

    if (error || !order) throw new Error(error?.message ?? "Erreur lors de la commande.");

    await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id:     order.id,
        product_id:   item.productId,
        product_name: item.productName,
        brand:        item.brand,
        price:        item.price,
        quantity:     item.quantity,
        image:        item.image,
      })),
    );

    await fetchOrders(user.id);
  }, [user]);

  const requestReset = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? error.message : null;
  }, []);

  const validateResetToken = useCallback((_token: string) => ({ valid: true }), []);

  const resetPassword = useCallback(async (_token: string, newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? error.message : null;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: !!user, loading,
      login, register, logout,
      orders, placeOrder,
      requestReset, resetPassword, validateResetToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
