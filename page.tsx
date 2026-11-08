"use client";
import { useEffect, useMemo, useState } from "react";
import { Providers, useLang, useCart, useUser, useToast, Food, inr, foodName } from "@/lib/store";
import { FoodCard, PhotoCapture, StatusTimeline, Field, SelectField } from "@/components/ui";

type View = "home" | "menu" | "orders" | "favourites" | "profile" | "checkout";
type Category = { id: string; nameHi: string; nameEn: string; image: string | null; sortOrder: number };
type Banner = { id: string; titleHi: string | null; titleEn: string | null; descHi: string | null; descEn: string | null; image: string | null; videoUrl: string | null; link: string | null; buttonHi: string | null; buttonEn: string | null };
type Order = { id: string; orderRef: string; customerName: string; mobile: string; subtotal: number; discount: number; deliveryFee: number; total: number; paymentMethod: string; paymentStatus: string; status: string; createdAt: string; items: { id: string; nameSnapshot: string; priceSnapshot: number; qty: number; imageSnapshot: string | null }[] };
type Address = { id: string; label: string | null; house: string; street: string; city: string; state: string; pin: string; landmark: string | null; instructions: string | null; isDefault: boolean };

function App() {
  const { lang, setLang, t } = useLang();
  const { user, refresh, setUser } = useUser();
  const { count } = useCart();
  const { toast } = useToast();
  const [view, setView] = useState<View>("home");
  const [foods, setFoods] = useState<Food[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [favs, setFavs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [reviews, setReviews] = useState<{ id: string; rating: number; text: string | null; createdAt: string; userName: string }[]>([]);
  const [detailFood, setDetailFood] = useState<Food | null>(null);

  const load = async () => {
    const [f, c, b, s, fv, rv] = await Promise.all([
      fetch("/api/data?q=foods").then((r) => r.json()),
      fetch("/api/data?q=categories").then((r) => r.json()),
      fetch("/api/data?q=banners").then((r) => r.json()),
      fetch("/api/data?q=settings").then((r) => r.json()),
      fetch("/api/data?q=favourites").then((r) => r.json()),
      fetch("/api/data?q=reviews").then((r) => r.json()),
    ]);
    setFoods(f.foods || []); setCats(c.categories || []); setBanners(b.banners || []);
    setSettings(s.settings || {}); setFavs(fv.favourites || []); setReviews(rv.reviews || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (banners.length > 1) { const id = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000); return () => clearInterval(id); } }, [banners.length]);

  const toggleFav = async (f: Food) => {
    if (!user) { setAuthOpen(true); return; }
    const r = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle-favourite", foodId: f.id }) });
    const d = await r.json();
    if (d.favourite) setFavs((p) => [...p, f.id]); else setFavs((p) => p.filter((x) => x !== f.id));
  };

  const filtered = useMemo(() => {
    let list = foods;
    if (catFilter) list = list.filter((f) => f.categoryId === catFilter);
    if (vegOnly) list = list.filter((f) => f.veg);
    if (search) { const s = search.toLowerCase(); list = list.filter((f) => f.nameEn.toLowerCase().includes(s) || f.nameHi.includes(s)); }
    if (sort === "priceLow") list = [...list].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "priceHigh") list = [...list].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sort === "popular") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [foods, catFilter, vegOnly, search, sort]);

  const banner = banners[bannerIdx];
  const openNow = () => { const h = new Date().getHours(); return h >= 10 && h < 22; };

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button onClick={() => setView("home")} className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-xl text-white">🍔</span>
            <span className="text-left leading-tight">
              <span className="block font-extrabold text-orange-700">{lang === "hi" ? settings.restaurant_name_hi || t.brand : settings.restaurant_name || t.brand}</span>
              <span className="block text-[11px] text-slate-500">{t.tagline}</span>
            </span>
          </button>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {([["home", t.home], ["menu", t.menu], ["orders", t.myOrders], ["favourites", t.favourites], ["profile", t.profile]] as [View, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-2 text-sm font-semibold ${view === v ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-orange-50"}`}>{label}</button>
            ))}
            {user && (user.role === "admin" || user.role === "staff") && <a href="/admin" className="rounded-full px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">{t.admin}</a>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center rounded-full bg-slate-100 px-2 py-1 lg:flex">
              <button onClick={() => setLang("hi")} className={`rounded-full px-3 py-1 text-xs font-bold ${lang === "hi" ? "bg-orange-600 text-white" : "text-slate-600"}`}>हिंदी</button>
              <button onClick={() => setLang("en")} className={`rounded-full px-3 py-1 text-xs font-bold ${lang === "en" ? "bg-orange-600 text-white" : "text-slate-600"}`}>EN</button>
            </div>
            <button onClick={() => setCartOpen(true)} className="relative rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">🛒 {t.cart} {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[11px]">{count}</span>}</button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
                <button onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setUser(null); toast(t.logout); }} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">{t.logout}</button>
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white">{t.login}</button>
            )}
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {([["home", t.home], ["menu", t.menu], ["orders", t.myOrders], ["favourites", t.favourites], ["profile", t.profile]] as [View, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${view === v ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>
          ))}
          <div className="flex shrink-0 items-center rounded-full bg-slate-100 px-1 py-0.5">
            <button onClick={() => setLang("hi")} className={`rounded-full px-2 py-1 text-[11px] font-bold ${lang === "hi" ? "bg-orange-600 text-white" : ""}`}>हिंदी</button>
            <button onClick={() => setLang("en")} className={`rounded-full px-2 py-1 text-[11px] font-bold ${lang === "en" ? "bg-orange-600 text-white" : ""}`}>EN</button>
          </div>
        </nav>
      </header>

      {view === "home" && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 text-white">
            {banner?.image && <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
            <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-20">
              <p className="text-sm font-bold uppercase tracking-widest text-amber-200">{t.welcome}</p>
              <h1 className="mt-2 max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">{banner ? (lang === "hi" ? banner.titleHi : banner.titleEn) || t.heroTitle : t.heroTitle}</h1>
              <p className="mt-3 max-w-xl text-orange-100">{banner ? (lang === "hi" ? banner.descHi : banner.descEn) || t.heroSub : t.heroSub}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setView("menu")} className="rounded-full bg-white px-6 py-3 font-bold text-orange-700 shadow-lg hover:scale-105 transition">{banner ? (lang === "hi" ? banner.buttonHi : banner.buttonEn) || t.orderNow : t.orderNow}</button>
                <button onClick={() => setView("menu")} className="rounded-full bg-black/25 px-6 py-3 font-bold text-white ring-1 ring-white/40">{t.viewMenu}</button>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <span className={`rounded-full px-3 py-1 font-bold ${openNow() ? "bg-green-500" : "bg-red-500"}`}>{openNow() ? `● ${t.openNow}` : `● ${t.closed}`} · {settings.opening_hours}</span>
                <span className="rounded-full bg-white/20 px-3 py-1">{t.freeDeliveryAbove} · {t.deliveryTime}: {settings.est_time || 35} {t.minutes}</span>
              </div>
              {banners.length > 1 && <div className="mt-6 flex gap-2">{banners.map((_, i) => <button key={i} onClick={() => setBannerIdx(i)} className={`h-2 rounded-full transition-all ${i === bannerIdx ? "w-8 bg-white" : "w-2 bg-white/50"}`} />)}</div>}
            </div>
          </section>

          {/* Promo video */}
          {banner?.videoUrl && (
            <section className="mx-auto max-w-7xl px-4 py-8">
              <video src={banner.videoUrl} controls playsInline className="aspect-video w-full rounded-3xl shadow-xl" />
            </section>
          )}

          {/* Categories */}
          <section className="mx-auto max-w-7xl px-4 py-8">
            <h2 className="text-2xl font-extrabold">{t.categories}</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {cats.map((c) => (
                <button key={c.id} onClick={() => { setCatFilter(c.id); setView("menu"); }} className="group shrink-0 text-center">
                  <span className="block h-20 w-20 overflow-hidden rounded-full ring-2 ring-orange-200 group-hover:ring-orange-500 transition">
                    {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-orange-100 text-2xl">🍽️</span>}
                  </span>
                  <span className="mt-1 block text-xs font-bold">{lang === "hi" ? c.nameHi : c.nameEn}</span>
                </button>
              ))}
            </div>
          </section>

          <FoodSection title={t.popular} foods={foods.filter((f) => (f.rating ?? 0) >= 4.7).slice(0, 8)} favs={favs} onFav={toggleFav} onDetail={setDetailFood} />
          <FoodSection title={t.bestsellers} foods={foods.filter((f) => f.isBestseller).slice(0, 8)} favs={favs} onFav={toggleFav} onDetail={setDetailFood} />
          <FoodSection title={t.newArrivals} foods={foods.filter((f) => f.isNew).slice(0, 8)} favs={favs} onFav={toggleFav} onDetail={setDetailFood} />
          <FoodSection title={t.combos} foods={foods.filter((f) => f.isCombo).slice(0, 8)} favs={favs} onFav={toggleFav} onDetail={setDetailFood} />

          {/* Reviews */}
          <section className="bg-white py-10">
            <div className="mx-auto max-w-7xl px-4">
              <h2 className="text-2xl font-extrabold">⭐ {t.reviews}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {reviews.slice(0, 6).map((r) => (
                  <div key={r.id} className="rounded-2xl bg-[#FFF8F0] p-4 ring-1 ring-orange-100">
                    <div className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    <p className="mt-2 text-sm text-slate-700">{r.text}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">— {r.userName} · <span className="text-green-600">✓ {t.verifiedPurchase}</span></p>
                  </div>
                ))}
                {!reviews.length && <p className="text-slate-500">{t.noReviews}</p>}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mx-auto max-w-7xl px-4 py-10">
            <div className="grid gap-6 rounded-3xl bg-slate-900 p-8 text-white md:grid-cols-3">
              <div>
                <h3 className="text-xl font-extrabold">{t.contact}</h3>
                <p className="mt-2 text-sm text-slate-300">📍 {settings.address}</p>
                <p className="mt-1 text-sm text-slate-300">📞 {settings.phone}</p>
                <a href={`https://wa.me/${settings.whatsapp || "919876543210"}`} target="_blank" className="mt-3 inline-block rounded-full bg-green-500 px-4 py-2 text-sm font-bold">💬 {t.whatsapp}</a>
              </div>
              <div>
                <h3 className="text-xl font-extrabold">🕐 {t.hours}</h3>
                <p className="mt-2 text-sm text-slate-300">{settings.opening_hours}</p>
                <p className="mt-1 text-sm text-slate-300">{t.deliveryTime}: {settings.est_time || 35} {t.minutes}</p>
              </div>
              <div>
                <h3 className="text-xl font-extrabold">🔗</h3>
                <div className="mt-2 flex gap-3 text-sm">
                  <a href={settings.instagram || "#"} target="_blank" className="text-slate-300 hover:text-white">Instagram</a>
                  <a href={settings.facebook || "#"} target="_blank" className="text-slate-300 hover:text-white">Facebook</a>
                  <a href={settings.maps_link || "#"} target="_blank" className="text-slate-300 hover:text-white">Google Maps</a>
                </div>
                <p className="mt-3 text-xs text-slate-400">{t.minOrder}: {inr(Number(settings.min_order || 99))} · {t.deliveryFee}: {inr(Number(settings.delivery_charge || 40))}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {view === "menu" && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-3xl font-extrabold">{t.menu}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="min-w-[200px] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
            <button onClick={() => setVegOnly(!vegOnly)} className={`rounded-full px-4 py-2.5 text-sm font-bold ring-1 ${vegOnly ? "bg-green-600 text-white ring-green-600" : "bg-white ring-slate-200"}`}>🟢 {t.vegOnly}</button>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold">
              <option value="popular">{t.popularFirst}</option><option value="priceLow">{t.priceLow}</option><option value="priceHigh">{t.priceHigh}</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCatFilter("")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!catFilter ? "bg-orange-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{t.all}</button>
            {cats.map((c) => <button key={c.id} onClick={() => setCatFilter(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${catFilter === c.id ? "bg-orange-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{lang === "hi" ? c.nameHi : c.nameEn}</button>)}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((f) => <div key={f.id} onClick={() => setDetailFood(f)} className="cursor-pointer"><FoodCard food={f} isFav={favs.includes(f.id)} onFav={toggleFav} /></div>)}
          </div>
          {!filtered.length && <p className="py-16 text-center text-slate-500">{t.noData}</p>}
        </section>
      )}

      {view === "favourites" && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-3xl font-extrabold">♥ {t.favourites}</h1>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {foods.filter((f) => favs.includes(f.id)).map((f) => <FoodCard key={f.id} food={f} isFav onFav={toggleFav} />)}
          </div>
          {!foods.some((f) => favs.includes(f.id)) && <p className="py-16 text-center text-slate-500">{t.emptyFav}</p>}
        </section>
      )}

      {view === "orders" && <OrdersView onReorder={(items) => { items.forEach((i: { foodId: string; qty: number }) => { const f = foods.find((x) => x.id === i.foodId); if (f) useCartAdd(f, i.qty); }); setCartOpen(true); }} />}
      {view === "profile" && <ProfileView />}
      {view === "checkout" && <CheckoutView settings={settings} goOrders={() => setView("orders")} />}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer close={() => setCartOpen(false)} goCheckout={() => { setCartOpen(false); setView("checkout"); }} />}

      {/* Auth modal */}
      {authOpen && <AuthModal close={() => setAuthOpen(false)} />}

      {/* Food detail */}
      {detailFood && <FoodDetail food={detailFood} close={() => setDetailFood(null)} isFav={favs.includes(detailFood.id)} onFav={toggleFav} />}

      <footer className="border-t border-orange-100 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {lang === "hi" ? settings.restaurant_name_hi || t.brand : settings.restaurant_name || t.brand} · {settings.phone}
      </footer>
    </div>
  );
}

function useCartAdd(f: Food, qty: number) {
  // helper used by reorder — adds via cart context through a tiny bridge
  const { add, setQty, items } = useCart();
  const ex = items.find((i) => i.food.id === f.id);
  if (ex) setQty(f.id, ex.qty + qty); else add(f);
}

function FoodSection({ title, foods, favs, onFav, onDetail }: { title: string; foods: Food[]; favs: string[]; onFav: (f: Food) => void; onDetail: (f: Food) => void }) {
  if (!foods.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {foods.map((f) => <div key={f.id} onClick={() => onDetail(f)} className="cursor-pointer"><FoodCard food={f} isFav={favs.includes(f.id)} onFav={onFav} /></div>)}
      </div>
    </section>
  );
}

function CartDrawer({ close, goCheckout }: { close: () => void; goCheckout: () => void }) {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={close}>
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-extrabold">🛒 {t.cart}</h2>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.map(({ food, qty }) => (
            <div key={food.id} className="mb-3 flex gap-3 rounded-2xl bg-[#FFF8F0] p-3 ring-1 ring-orange-100">
              {food.image && <img src={food.image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
              <div className="flex-1">
                <p className="text-sm font-bold">{foodName(food, "hi")}</p>
                <p className="text-xs text-slate-500">{inr(food.discountPrice ?? food.price)} × {qty} = <b>{inr((food.discountPrice ?? food.price) * qty)}</b></p>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => setQty(food.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white font-bold ring-1 ring-slate-200">−</button>
                  <span className="font-bold">{qty}</span>
                  <button onClick={() => setQty(food.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white font-bold ring-1 ring-slate-200">+</button>
                  <button onClick={() => remove(food.id)} className="ml-auto text-xs font-bold text-red-500">{t.del}</button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <p className="py-16 text-center text-slate-500">{t.emptyCart}</p>}
        </div>
        {items.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between font-bold"><span>{t.subtotal}</span><span>{inr(subtotal)}</span></div>
            <button onClick={goCheckout} className="mt-3 w-full rounded-xl bg-orange-600 py-3.5 font-bold text-white">{t.checkout} →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthModal({ close }: { close: () => void }) {
  const { t } = useLang();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", confirmPassword: "", token: "" });
  const [demoToken, setDemoToken] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    const body = { action: mode, ...form };
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || t.error); return; }
    if (mode === "forgot") { setDemoToken(d.demoToken || ""); setMode("reset"); toast(t.resetSent); return; }
    if (mode === "reset") { toast(t.resetDone); setMode("login"); return; }
    setUser(d.user); toast(t.saved); close();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={close}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{mode === "login" ? t.login : mode === "register" ? t.register : mode === "forgot" ? t.forgot : t.reset}</h2>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold">✕</button>
        </div>
        <div className="mt-4 space-y-3">
          {mode === "register" && <Field label={t.fullName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          <Field label={t.mobile} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} inputMode="numeric" maxLength={10} />
          {mode === "register" && <Field label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
          {mode !== "forgot" && <Field label={t.password} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
          {mode === "register" && <Field label={t.confirmPassword} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />}
          {mode === "reset" && <Field label="Reset Token" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />}
          {demoToken && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Demo token: <b>{demoToken}</b></p>}
          {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{err}</p>}
          <button onClick={submit} className="w-full rounded-xl bg-orange-600 py-3 font-bold text-white">{mode === "login" ? t.login : mode === "register" ? t.register : t.reset}</button>
          <div className="flex justify-between text-sm">
            {mode === "login" && <><button onClick={() => setMode("register")} className="font-bold text-orange-600">{t.register}</button><button onClick={() => setMode("forgot")} className="text-slate-500">{t.forgot}</button></>}
            {mode === "register" && <button onClick={() => setMode("login")} className="font-bold text-orange-600">{t.login}</button>}
            {(mode === "forgot" || mode === "reset") && <button onClick={() => setMode("login")} className="font-bold text-orange-600">{t.back}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FoodDetail({ food, close, isFav, onFav }: { food: Food; close: () => void; isFav: boolean; onFav: (f: Food) => void }) {
  const { lang, t } = useLang();
  const { user } = useUser();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<{ id: string; rating: number; text: string | null; userName: string }[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  useEffect(() => { fetch(`/api/data?q=reviews&foodId=${food.id}`).then((r) => r.json()).then((d) => setReviews(d.reviews || [])); }, [food.id]);
  const submitReview = async () => {
    const r = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", foodId: food.id, rating, text }) });
    const d = await r.json();
    if (!r.ok) { toast(d.error === "Only verified purchasers can review" ? t.onlyPurchased : t.error); return; }
    toast(t.reviewSubmitted); setText("");
    fetch(`/api/data?q=reviews&foodId=${food.id}`).then((r) => r.json()).then((d) => setReviews(d.reviews || []));
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={close}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {food.image && <img src={food.image} alt="" className="aspect-video w-full object-cover" />}
        <div className="p-5">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-extrabold">{foodName(food, lang)}</h2>
            <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold">✕</button>
          </div>
          <p className="mt-1 text-sm text-slate-600">{lang === "hi" ? food.descHi : food.descEn}</p>
          <p className="mt-2 text-lg font-extrabold">{inr(food.discountPrice ?? food.price)} {food.discountPrice && <span className="text-sm text-slate-400 line-through">{inr(food.price)}</span>}</p>
          <div className="mt-3"><FoodCard food={food} isFav={isFav} onFav={onFav} /></div>
          <h3 className="mt-5 font-extrabold">⭐ {t.reviews}</h3>
          <div className="mt-2 space-y-2">
            {reviews.map((r) => <div key={r.id} className="rounded-xl bg-[#FFF8F0] p-3 text-sm"><span className="text-amber-500">{"★".repeat(r.rating)}</span> {r.text} <span className="text-xs text-slate-500">— {r.userName}</span></div>)}
            {!reviews.length && <p className="text-sm text-slate-500">{t.noReviews}</p>}
          </div>
          {user ? (
            <div className="mt-4 rounded-2xl border p-3">
              <p className="text-sm font-bold">{t.writeReview}</p>
              <div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-xl border p-2 text-sm" rows={2} />
              <button onClick={submitReview} className="mt-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white">{t.submitReview}</button>
            </div>
          ) : <p className="mt-3 text-xs text-slate-500">{t.loginRequired}</p>}
        </div>
      </div>
    </div>
  );
}

function OrdersView({ onReorder }: { onReorder: (items: { foodId: string; qty: number }[]) => void }) {
  const { t, lang } = useLang();
  const { user } = useUser();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"active" | "previous">("active");
  const load = () => fetch("/api/orders?q=my-orders").then((r) => r.json()).then((d) => setOrders(d.orders || []));
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);
  if (!user) return <section className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-lg font-bold">{t.loginRequired}</p></section>;
  const active = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status));
  const prev = orders.filter((o) => ["delivered", "cancelled", "rejected"].includes(o.status));
  const list = tab === "active" ? active : prev;
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">📦 {t.myOrders}</h1>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setTab("active")} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "active" ? "bg-orange-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{t.activeOrders} ({active.length})</button>
        <button onClick={() => setTab("previous")} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "previous" ? "bg-orange-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{t.previousOrders} ({prev.length})</button>
      </div>
      <div className="mt-6 space-y-4">
        {list.map((o) => (
          <div key={o.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-extrabold">{t.orderRef}: {o.orderRef}</p>
                <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{t.statusLabels[o.status] || o.status}</span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {o.items.map((it) => (
                <div key={it.id} className="shrink-0 text-center">
                  {it.imageSnapshot && <img src={it.imageSnapshot} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                  <p className="mt-1 max-w-[90px] truncate text-[11px] font-semibold">{it.nameSnapshot}</p>
                  <p className="text-[11px] text-slate-500">×{it.qty} · {inr(it.priceSnapshot * it.qty)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
              <span>{t.subtotal}: <b>{inr(o.subtotal)}</b></span>
              <span>{t.discount}: <b className="text-green-600">−{inr(o.discount)}</b></span>
              <span>{t.deliveryFee}: <b>{inr(o.deliveryFee)}</b></span>
              <span>{t.total}: <b>{inr(o.total)}</b></span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{t.payment}: {o.paymentMethod.toUpperCase()} · {t.paymentStatus}: {o.paymentStatus}</p>
            <div className="mt-4"><StatusTimeline status={o.status} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["placed", "accepted"].includes(o.status) && <button onClick={async () => { await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel-order", orderId: o.id }) }); toast(t.cancelled); load(); }} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 ring-1 ring-red-200">{t.cancelOrder}</button>}
              <button onClick={async () => { const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reorder", orderId: o.id }) }); const d = await r.json(); onReorder(d.items || []); toast(t.reorder); }} className="rounded-xl bg-orange-600 px-3 py-2 text-sm font-bold text-white">{t.reorder}</button>
              <button onClick={() => window.print()} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">{t.printReceipt}</button>
            </div>
          </div>
        ))}
        {!list.length && <p className="py-16 text-center text-slate-500">{t.emptyOrders}</p>}
      </div>
    </section>
  );
}

function ProfileView() {
  const { t } = useLang();
  const { user, refresh } = useUser();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [history, setHistory] = useState<{ id: string; points: number; reason: string | null; createdAt: string }[]>([]);
  const [addrForm, setAddrForm] = useState({ label: "घर", house: "", street: "", city: "", state: "", pin: "", landmark: "", instructions: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const load = () => {
    fetch("/api/orders?q=addresses").then((r) => r.json()).then((d) => setAddresses(d.addresses || []));
    fetch("/api/orders?q=loyalty").then((r) => r.json()).then((d) => setHistory(d.history || []));
  };
  useEffect(() => { load(); }, []);
  if (!user) return <section className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-lg font-bold">{t.loginRequired}</p></section>;
  const saveAddr = async () => {
    const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save-address", address: addrForm }) });
    if (r.ok) { toast(t.addressSaved); setAddrForm({ label: "घर", house: "", street: "", city: "", state: "", pin: "", landmark: "", instructions: "" }); load(); }
  };
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">👤 {t.profile}</h1>
      <div className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-slate-100">
        <p className="text-xl font-extrabold">{user.name}</p>
        <p className="text-sm text-slate-500">📱 {user.mobile} {user.email ? `· ✉️ ${user.email}` : ""}</p>
        <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">⭐ {t.myPoints}: {user.points}</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
          <h2 className="font-extrabold">📍 {t.addressBook}</h2>
          <div className="mt-3 space-y-2">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-xl bg-[#FFF8F0] p-3 text-sm ring-1 ring-orange-100">
                <b>{a.label}</b> {a.isDefault && <span className="text-xs text-green-600">({t.defaultAddr})</span>}
                <p>{a.house}, {a.street}, {a.city}, {a.state} — {a.pin}</p>
                {a.landmark && <p className="text-xs text-slate-500">{a.landmark}</p>}
                <button onClick={async () => { await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete-address", addressId: a.id }) }); load(); }} className="mt-1 text-xs font-bold text-red-500">{t.del}</button>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Field label={t.house} value={addrForm.house} onChange={(e) => setAddrForm({ ...addrForm, house: e.target.value })} />
            <Field label={t.street} value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.city} value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
              <Field label={t.state} value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.pin} value={addrForm.pin} onChange={(e) => setAddrForm({ ...addrForm, pin: e.target.value })} />
              <Field label={t.landmark} value={addrForm.landmark} onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })} />
            </div>
            <button onClick={saveAddr} className="w-full rounded-xl bg-orange-600 py-2.5 font-bold text-white">{t.saveAddress}</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <h2 className="font-extrabold">🔑 {t.changePassword}</h2>
            <div className="mt-3 space-y-2">
              <Field label={t.currentPassword} type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              <Field label={t.newPassword} type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              <button onClick={async () => { const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change-password", ...pw }) }); if (r.ok) { toast(t.resetDone); setPw({ currentPassword: "", newPassword: "" }); } else toast(t.error); }} className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white">{t.changePassword}</button>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <h2 className="font-extrabold">⭐ {t.pointsHistory}</h2>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {history.map((h) => <div key={h.id} className="flex justify-between text-sm"><span>{h.reason || ""} <span className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</span></span><b className={h.points >= 0 ? "text-green-600" : "text-red-500"}>{h.points > 0 ? "+" : ""}{h.points}</b></div>)}
              {!history.length && <p className="text-sm text-slate-500">{t.noData}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckoutView({ settings, goOrders }: { settings: Record<string, string>; goOrders: () => void }) {
  const { t } = useLang();
  const { items, subtotal, clear } = useCart();
  const { user } = useUser();
  const { toast } = useToast();
  const [customer, setCustomer] = useState({ name: user?.name || "", mobile: user?.mobile || "", email: user?.email || "", house: "", street: "", city: "", state: "", pin: "", landmark: "", instructions: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [redeem, setRedeem] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ orderRef: string } | null>(null);

  useEffect(() => { fetch("/api/orders?q=addresses").then((r) => r.json()).then((d) => setAddresses(d.addresses || [])); }, []);
  const deliveryFeeBase = Number(settings.delivery_charge || 40);
  const freeAbove = Number(settings.free_above || 499);
  const redeemPoints = redeem && user ? Math.min(user.points, Math.floor(subtotal * 0.2)) : 0;
  const discount = couponDiscount + redeemPoints;
  const deliveryFee = subtotal - discount >= freeAbove ? 0 : deliveryFeeBase;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const applyCoupon = async () => {
    const r = await fetch(`/api/data?q=validate-coupon&code=${couponCode}&subtotal=${subtotal}`);
    const d = await r.json();
    if (d.ok) { setCouponDiscount(d.discount); toast(t.couponApplied); }
    else toast(t.couponInvalid);
  };

  const placeOrder = async () => {
    if (!customer.name || !customer.mobile || !customer.house || !customer.city || !customer.pin) { toast(t.error); return; }
    setPlacing(true);
    const r = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-order",
        items: items.map((i) => ({ foodId: i.food.id, qty: i.qty })),
        customer, paymentMethod, couponCode: couponDiscount ? couponCode : "",
        redeemPoints, photoData: photo, photoConsent: !!photo,
      }),
    });
    const d = await r.json();
    setPlacing(false);
    if (!r.ok) { toast(d.error || t.error); return; }
    setPlaced(d.order); clear(); toast(t.orderPlaced);
  };

  if (placed) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-green-200">
          <div className="text-6xl">🎉</div>
          <h1 className="mt-3 text-2xl font-extrabold text-green-700">{t.orderPlaced}</h1>
          <p className="mt-1 font-bold">{t.orderRef}: {placed.orderRef}</p>
          <div className="mt-4"><StatusTimeline status="placed" /></div>
          <button onClick={goOrders} className="mt-6 rounded-xl bg-orange-600 px-6 py-3 font-bold text-white">{t.myOrders}</button>
        </div>
      </section>
    );
  }

  if (!items.length) return <section className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-lg font-bold">{t.emptyCart}</p></section>;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t.checkout}</h1>
      {!user && <p className="mt-1 text-sm text-slate-500">{t.guestCheckout}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <h2 className="font-extrabold">👤 {t.customerDetails}</h2>
            {addresses.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {addresses.map((a) => <button key={a.id} onClick={() => setCustomer({ name: user?.name || "", mobile: user?.mobile || "", email: user?.email || "", house: a.house, street: a.street, city: a.city, state: a.state, pin: a.pin, landmark: a.landmark || "", instructions: a.instructions || "" })} className="shrink-0 rounded-xl bg-[#FFF8F0] px-3 py-2 text-xs font-bold ring-1 ring-orange-200">📍 {a.label} — {a.city}</button>)}
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t.fullName} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <Field label={t.mobile} value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} inputMode="numeric" maxLength={10} />
              <Field label={t.email} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              <Field label={t.house} value={customer.house} onChange={(e) => setCustomer({ ...customer, house: e.target.value })} />
              <Field label={t.street} value={customer.street} onChange={(e) => setCustomer({ ...customer, street: e.target.value })} />
              <Field label={t.city} value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
              <Field label={t.state} value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} />
              <Field label={t.pin} value={customer.pin} onChange={(e) => setCustomer({ ...customer, pin: e.target.value })} />
              <Field label={t.landmark} value={customer.landmark} onChange={(e) => setCustomer({ ...customer, landmark: e.target.value })} />
              <Field label={t.instructions} value={customer.instructions} onChange={(e) => setCustomer({ ...customer, instructions: e.target.value })} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <h2 className="font-extrabold">📸 {t.takePhoto}</h2>
            <div className="mt-3"><PhotoCapture photo={photo} setPhoto={setPhoto} /></div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <h2 className="font-extrabold">💳 {t.payment}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[["cod", t.cod], ["upi", t.upi], ["online", t.online]].map(([v, label]) => (
                <button key={v} onClick={() => setPaymentMethod(v)} className={`rounded-xl px-3 py-3 text-sm font-bold ring-1 ${paymentMethod === v ? "bg-orange-600 text-white ring-orange-600" : "bg-white ring-slate-200"}`}>{label}</button>
              ))}
            </div>
            {paymentMethod !== "cod" && <p className="mt-2 text-xs text-amber-700">{t.paymentNote}</p>}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-extrabold">🧾 {t.orderSummary}</h2>
          <div className="mt-3 space-y-2">
            {items.map(({ food, qty }) => (
              <div key={food.id} className="flex items-center gap-2 text-sm">
                {food.image && <img src={food.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <span className="flex-1">{foodName(food, "hi")} × {qty}</span>
                <b>{inr((food.discountPrice ?? food.price) * qty)}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder={t.coupon} className="flex-1 rounded-xl border px-3 py-2 text-sm uppercase outline-none focus:border-orange-500" />
            <button onClick={applyCoupon} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">{t.apply}</button>
          </div>
          {user && user.points > 0 && (
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={redeem} onChange={(e) => setRedeem(e.target.checked)} />
              ⭐ {t.redeem} ({user.points} {t.points} = {inr(redeemPoints)})
            </label>
          )}
          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span>{t.subtotal}</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between text-green-600"><span>{t.discount}</span><span>−{inr(discount)}</span></div>
            <div className="flex justify-between"><span>{t.deliveryFee}</span><span>{deliveryFee === 0 ? t.freeDeliveryAbove.split(" ")[0] + " ₹0" : inr(deliveryFee)}</span></div>
            <div className="flex justify-between text-lg font-extrabold"><span>{t.total}</span><span>{inr(total)}</span></div>
          </div>
          <button onClick={placeOrder} disabled={placing} className="mt-4 w-full rounded-xl bg-orange-600 py-3.5 font-bold text-white disabled:opacity-50">
            {placing ? t.loading : `${t.confirmOrder} · ${inr(total)}`}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">{t.minOrder}: {inr(Number(settings.min_order || 99))}</p>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return <Providers><App /></Providers>;
}
