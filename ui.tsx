"use client";
import { useRef, useState } from "react";
import { Food, useCart, useLang, useToast, foodName, foodDesc, inr } from "@/lib/store";

export function VegMark({ veg }: { veg: boolean }) {
  return (
    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${veg ? "border-green-600" : "border-red-600"}`}>
      <span className={`h-2 w-2 rounded-full ${veg ? "bg-green-600" : "bg-red-600"}`} />
    </span>
  );
}

export function FoodCard({ food, isFav, onFav }: { food: Food; isFav: boolean; onFav: (f: Food) => void }) {
  const { lang, t } = useLang();
  const { add, items, setQty } = useCart();
  const { toast } = useToast();
  const inCart = items.find((i) => i.food.id === food.id);
  const price = food.discountPrice ?? food.price;
  const out = !food.available || food.stock <= 0;
  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-xl hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {food.image ? <img src={food.image} alt={foodName(food, lang)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="grid h-full place-items-center text-5xl">🍽️</div>}
        <div className="absolute left-2 top-2 rounded-md bg-white/95 p-1"><VegMark veg={food.veg} /></div>
        {food.isNew && <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white">{lang === "hi" ? "नया" : "NEW"}</span>}
        {food.isBestseller && <span className="absolute bottom-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">★ {t.bestsellers}</span>}
        <button onClick={() => onFav(food)} className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full shadow ${isFav ? "bg-red-500 text-white" : "bg-white/95 text-slate-600"}`} aria-label="favourite">
          {isFav ? "♥" : "♡"}
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-tight text-slate-900">{foodName(food, lang)}</h3>
          <span className="shrink-0 rounded-md bg-green-700 px-1.5 py-0.5 text-xs font-bold text-white">{food.rating?.toFixed(1)} ★</span>
        </div>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-slate-500">{foodDesc(food, lang)}</p>
        {food.isCombo && food.comboItems && <p className="mt-1 text-[11px] font-semibold text-orange-600">🎁 {food.comboItems}</p>}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-extrabold text-slate-900">{inr(price)}</span>
            {food.discountPrice && <span className="ml-1 text-sm text-slate-400 line-through">{inr(food.price)}</span>}
            {food.discountPrice && <span className="ml-1 text-xs font-bold text-green-600">{Math.round(((food.price - price) / food.price) * 100)}% {t.discount}</span>}
          </div>
          <span className={`text-[11px] font-semibold ${out ? "text-red-500" : food.stock <= 5 ? "text-amber-600" : "text-green-600"}`}>
            {out ? t.outOfStock : food.stock <= 5 ? `${t.lowStock}: ${food.stock}` : t.available}
          </span>
        </div>
        <div className="mt-3">
          {out ? (
            <button disabled className="w-full rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-400">{t.outOfStock}</button>
          ) : inCart ? (
            <div className="flex items-center justify-between rounded-xl bg-orange-600 px-2 py-1.5 text-white">
              <button onClick={() => setQty(food.id, inCart.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-lg font-bold">−</button>
              <span className="font-bold">{inCart.qty} {t.added}</span>
              <button onClick={() => setQty(food.id, inCart.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-lg font-bold">+</button>
            </div>
          ) : (
            <button onClick={() => { add(food); toast(`${foodName(food, lang)} — ${t.added}`); }} className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 active:scale-[.98]">{t.addToCart}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhotoCapture({ photo, setPhoto }: { photo: string | null; setPhoto: (p: string | null) => void }) {
  const { t } = useLang();
  const [step, setStep] = useState<"idle" | "consent" | "camera" | "preview">("idle");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => { streamRef.current?.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; };

  const openCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setStep("camera");
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 100);
    } catch {
      setError(t.cameraDenied);
      setStep("idle");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    const w = Math.min(v.videoWidth, 640);
    const h = (v.videoHeight / v.videoWidth) * w;
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")?.drawImage(v, 0, 0, w, h);
    setPhoto(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
    setStep("preview");
  };

  if (photo) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-bold text-green-800">✓ {t.photoSaved}</p>
        <img src={photo} alt="customer" className="mt-2 h-32 w-32 rounded-xl object-cover ring-2 ring-green-300" />
        <div className="mt-3 flex gap-2">
          <button onClick={() => { setPhoto(null); setStep("consent"); }} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300">{t.retake}</button>
          <button onClick={() => setPhoto(null)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200">{t.removePhoto}</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t.photoRetention}</p>
      </div>
    );
  }

  if (step === "consent") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="font-bold text-slate-900">📸 {t.takePhoto}</h4>
        <p className="mt-1 text-sm text-slate-600">{t.photoExplain}</p>
        <p className="mt-1 text-xs text-slate-500">{t.photoConsentText}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={openCamera} className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white">{t.allowCamera}</button>
          <button onClick={() => setStep("idle")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-300">{t.skip}</button>
        </div>
      </div>
    );
  }

  if (step === "camera") {
    return (
      <div className="rounded-2xl bg-slate-900 p-4 text-white">
        <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full rounded-xl object-cover" />
        <div className="mt-3 flex gap-2">
          <button onClick={capture} className="flex-1 rounded-xl bg-orange-600 py-3 font-bold">{t.capture}</button>
          <button onClick={() => { stopCamera(); setStep("idle"); }} className="rounded-xl bg-white/10 px-4 py-3 font-semibold">{t.skip}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setStep("consent")} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-4 font-bold text-slate-700 hover:border-orange-400 hover:text-orange-600">
        📸 {t.takePhoto}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export const STATUS_FLOW = ["placed", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];

export function StatusTimeline({ status }: { status: string }) {
  const { t } = useLang();
  const idx = STATUS_FLOW.indexOf(status);
  if (status === "cancelled" || status === "rejected") {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-center font-bold text-red-600">{t.statusLabels[status] || status}</div>;
  }
  return (
    <div className="flex items-start">
      {STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center">
          <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= idx ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-500"}`}>
            {i <= idx ? "✓" : i + 1}
          </div>
          <p className={`mt-1 text-center text-[10px] font-semibold leading-tight ${i <= idx ? "text-orange-700" : "text-slate-400"}`}>{t.statusLabels[s]}</p>
          {i < STATUS_FLOW.length - 1 && <div className={`-mt-9 h-1 w-full ${i < idx ? "bg-orange-600" : "bg-slate-200"}`} style={{ marginLeft: "50%" }} />}
        </div>
      ))}
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input {...props} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
    </label>
  );
}
export function SelectField({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <select {...props} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500">{children}</select>
    </label>
  );
}
