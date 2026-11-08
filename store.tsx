"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { dict, Lang, Dict } from "./i18n";

export type Food = {
  id: string; categoryId: string | null; nameHi: string; nameEn: string; descHi: string | null; descEn: string | null;
  price: number; discountPrice: number | null; image: string | null; rating: number | null; veg: boolean;
  available: boolean; stock: number; isBestseller: boolean; isNew: boolean; isCombo: boolean; comboItems: string | null;
  reviewCount?: number;
};
export type CartItem = { food: Food; qty: number };
export type User = { id: string; name: string; mobile: string; email: string | null; role: string; staffRole?: string | null; points: number };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>(null as never);
const CartCtx = createContext<{ items: CartItem[]; add: (f: Food) => void; remove: (id: string) => void; setQty: (id: string, q: number) => void; clear: () => void; count: number; subtotal: number }>(null as never);
const UserCtx = createContext<{ user: User | null; refresh: () => Promise<void>; setUser: (u: User | null) => void }>(null as never);
const ToastCtx = createContext<{ toast: (msg: string) => void }>(null as never);

export const useLang = () => useContext(LangCtx);
export const useCart = () => useContext(CartCtx);
export const useUser = () => useContext(UserCtx);
export const useToast = () => useContext(ToastCtx);

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vfc_lang") as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
    else {
      const cookie = document.cookie.match(/vfc_lang=(hi|en)/)?.[1] as Lang | undefined;
      if (cookie) setLangState(cookie);
    }
    try {
      const cart = localStorage.getItem("vfc_cart");
      if (cart) setItems(JSON.parse(cart));
    } catch {}
    refresh();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth");
      const d = await r.json();
      setUser(d.user || null);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("vfc_lang", l);
    document.cookie = `vfc_lang=${l}; path=/; max-age=${365 * 86400}`;
    document.documentElement.lang = l;
  };

  useEffect(() => { localStorage.setItem("vfc_cart", JSON.stringify(items)); }, [items]);

  const add = (f: Food) => setItems((prev) => {
    const ex = prev.find((i) => i.food.id === f.id);
    if (ex) return prev.map((i) => (i.food.id === f.id ? { ...i, qty: i.qty + 1 } : i));
    return [...prev, { food: f, qty: 1 }];
  });
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.food.id !== id));
  const setQty = (id: string, q: number) => setItems((prev) => q <= 0 ? prev.filter((i) => i.food.id !== id) : prev.map((i) => (i.food.id === id ? { ...i, qty: q } : i)));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + (i.food.discountPrice ?? i.food.price) * i.qty, 0);

  const toast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  return (
    <LangCtx.Provider value={{ lang, setLang, t: dict[lang] as unknown as Dict }}>
      <UserCtx.Provider value={{ user, refresh, setUser }}>
        <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
          <ToastCtx.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
              {toasts.map((t) => (
                <div key={t.id} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl animate-[slideUp_.3s_ease]">{t.msg}</div>
              ))}
            </div>
          </ToastCtx.Provider>
        </CartCtx.Provider>
      </UserCtx.Provider>
    </LangCtx.Provider>
  );
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const foodName = (f: Food, lang: Lang) => (lang === "hi" ? f.nameHi : f.nameEn);
export const foodDesc = (f: Food, lang: Lang) => (lang === "hi" ? f.descHi || f.descEn : f.descEn || f.descHi);
