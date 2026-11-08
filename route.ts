import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, foods, coupons, couponUsage, addresses, users, loyaltyHistory, stockHistory, notifications } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s });

async function getSettings() {
  const { settings } = await import("@/db/schema");
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const u = await getSessionUser();

  if (q === "my-orders") {
    if (!u) return json({ orders: [] });
    const rows = await db.select().from(orders).where(eq(orders.userId, u.id)).orderBy(desc(orders.createdAt));
    const withItems = await Promise.all(rows.map(async (o) => ({
      ...o,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    })));
    return json({ orders: withItems });
  }

  if (q === "order") {
    const id = req.nextUrl.searchParams.get("id") || "";
    const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!o) return json({ error: "Not found" }, 404);
    if (!isAdmin(u) && o.userId !== u?.id) return json({ error: "Forbidden" }, 403);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    return json({ order: { ...o, items } });
  }

  if (q === "photo") {
    const id = req.nextUrl.searchParams.get("id") || "";
    const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!o || !o.photoData) return json({ error: "No photo" }, 404);
    // Only owner or admin can view
    if (!isAdmin(u) && o.userId !== u?.id) return json({ error: "Forbidden" }, 403);
    const [meta, data] = o.photoData.split(",");
    const buf = Buffer.from(data, "base64");
    return new NextResponse(buf, { headers: { "Content-Type": meta.replace("data:", ""), "Cache-Control": "private, no-store" } });
  }

  if (q === "addresses") {
    if (!u) return json({ addresses: [] });
    const rows = await db.select().from(addresses).where(eq(addresses.userId, u.id)).orderBy(desc(addresses.createdAt));
    return json({ addresses: rows });
  }

  if (q === "loyalty") {
    if (!u) return json({ history: [] });
    const rows = await db.select().from(loyaltyHistory).where(eq(loyaltyHistory.userId, u.id)).orderBy(desc(loyaltyHistory.createdAt)).limit(50);
    return json({ history: rows, points: u.points });
  }

  return json({ error: "Unknown query" }, 400);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const u = await getSessionUser();
  const s = await getSettings();
  const deliveryFeeBase = Number(s.delivery_charge || 40);
  const freeAbove = Number(s.free_above || 499);
  const minOrderAmt = Number(s.min_order || 99);
  const pointsPer100 = Number(s.points_per_100 || 10);

  if (body.action === "create-order") {
    const items = body.items as { foodId: string; qty: number }[];
    if (!items?.length) return json({ error: "Cart empty" }, 400);
    // Validate stock & compute server-side totals (never trust client prices)
    let subtotal = 0;
    const resolved: { food: typeof foods.$inferSelect; qty: number }[] = [];
    for (const it of items) {
      const [f] = await db.select().from(foods).where(eq(foods.id, it.foodId)).limit(1);
      if (!f || !f.available) return json({ error: `Item unavailable: ${f?.nameEn || it.foodId}` }, 400);
      if ((f.stock ?? 0) < it.qty) return json({ error: `Only ${f.stock} left of ${f.nameEn}` }, 400);
      subtotal += (f.discountPrice ?? f.price) * it.qty;
      resolved.push({ food: f, qty: it.qty });
    }
    if (subtotal < minOrderAmt) return json({ error: `Minimum order ₹${minOrderAmt}` }, 400);

    let discount = 0;
    let couponRow = null;
    if (body.couponCode) {
      const [c] = await db.select().from(coupons).where(eq(coupons.code, body.couponCode.toUpperCase())).limit(1);
      if (!c || !c.active) return json({ error: "Invalid coupon" }, 400);
      if (c.expiresAt && c.expiresAt < new Date()) return json({ error: "Coupon expired" }, 400);
      if (c.usageLimit && (c.usedCount ?? 0) >= c.usageLimit) return json({ error: "Coupon limit reached" }, 400);
      if (subtotal < (c.minOrder ?? 0)) return json({ error: "Minimum order for coupon not met" }, 400);
      discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      discount = Math.min(discount, subtotal);
      couponRow = c;
    }
    // Loyalty redemption: 1 point = ₹1, max 20% of subtotal
    let pointsRedeemed = 0;
    if (body.redeemPoints && u && u.points > 0) {
      pointsRedeemed = Math.min(u.points, Math.floor(subtotal * 0.2), Number(body.redeemPoints));
      discount += pointsRedeemed;
    }
    const deliveryFee = subtotal - discount >= freeAbove ? 0 : deliveryFeeBase;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const orderRef = "VFC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const pointsEarned = Math.floor(total / 100) * pointsPer100;

    const photoData = body.photoData && body.photoConsent ? String(body.photoData).slice(0, 400000) : null;

    const [order] = await db.insert(orders).values({
      orderRef, userId: u?.id || null,
      customerName: body.customer.name, mobile: body.customer.mobile, email: body.customer.email || null,
      house: body.customer.house, street: body.customer.street, city: body.customer.city, state: body.customer.state,
      pin: body.customer.pin, landmark: body.customer.landmark || null, instructions: body.customer.instructions || null,
      subtotal, discount, deliveryFee, total,
      paymentMethod: body.paymentMethod || "cod",
      paymentStatus: body.paymentMethod === "cod" ? "pending" : "pending",
      couponCode: couponRow?.code || null,
      photoData, photoConsent: !!photoData, pointsEarned,
    }).returning();

    for (const r of resolved) {
      await db.insert(orderItems).values({
        orderId: order.id, foodId: r.food.id,
        nameSnapshot: `${r.food.nameHi} / ${r.food.nameEn}`,
        priceSnapshot: r.food.discountPrice ?? r.food.price,
        qty: r.qty, imageSnapshot: r.food.image,
      });
      await db.update(foods).set({ stock: sql`${foods.stock} - ${r.qty}` }).where(eq(foods.id, r.food.id));
      await db.insert(stockHistory).values({ foodId: r.food.id, change: -r.qty, reason: `Order ${orderRef}` });
    }
    if (couponRow) {
      await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, couponRow.id));
      await db.insert(couponUsage).values({ couponId: couponRow.id, userId: u?.id || null, orderId: order.id });
    }
    if (pointsRedeemed > 0 && u) {
      await db.update(users).set({ points: u.points - pointsRedeemed }).where(eq(users.id, u.id));
      await db.insert(loyaltyHistory).values({ userId: u.id, points: -pointsRedeemed, reason: "Redeemed", orderId: order.id });
    }
    // Notify admins
    await db.insert(notifications).values({ userId: null, title: `New Order ${orderRef}`, body: `${body.customer.name} — ₹${total}`, type: "order" });
    return json({ order: { ...order, items: resolved.map((r) => ({ name: r.food.nameEn, qty: r.qty, price: r.food.discountPrice ?? r.food.price })) } });
  }

  if (body.action === "cancel-order") {
    if (!u) return json({ error: "Login required" }, 401);
    const [o] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
    if (!o || o.userId !== u.id) return json({ error: "Forbidden" }, 403);
    if (!["placed", "accepted"].includes(o.status ?? "")) return json({ error: "Cannot cancel now" }, 400);
    await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, o.id));
    // restore stock
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    for (const it of items) {
      if (it.foodId) {
        await db.update(foods).set({ stock: sql`${foods.stock} + ${it.qty}` }).where(eq(foods.id, it.foodId));
        await db.insert(stockHistory).values({ foodId: it.foodId, change: it.qty, reason: `Cancelled ${o.orderRef}` });
      }
    }
    return json({ ok: true });
  }

  if (body.action === "delete-photo") {
    const [o] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
    if (!o) return json({ error: "Not found" }, 404);
    if (!isAdmin(u) && o.userId !== u?.id) return json({ error: "Forbidden" }, 403);
    await db.update(orders).set({ photoData: null, photoConsent: false }).where(eq(orders.id, o.id));
    return json({ ok: true });
  }

  if (body.action === "save-address") {
    if (!u) return json({ error: "Login required" }, 401);
    const a = body.address;
    if (body.addressId) {
      await db.update(addresses).set({ ...a }).where(and(eq(addresses.id, body.addressId), eq(addresses.userId, u.id)));
    } else {
      await db.insert(addresses).values({ userId: u.id, ...a });
    }
    return json({ ok: true });
  }

  if (body.action === "delete-address") {
    if (!u) return json({ error: "Login required" }, 401);
    await db.delete(addresses).where(and(eq(addresses.id, body.addressId), eq(addresses.userId, u.id)));
    return json({ ok: true });
  }

  if (body.action === "reorder") {
    const [o] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
    if (!o) return json({ error: "Not found" }, 404);
    if (!isAdmin(u) && o.userId !== u?.id) return json({ error: "Forbidden" }, 403);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    const result = [];
    for (const it of items) {
      if (!it.foodId) continue;
      const [f] = await db.select().from(foods).where(eq(foods.id, it.foodId)).limit(1);
      if (f && f.available && (f.stock ?? 0) >= it.qty) {
        result.push({ foodId: f.id, qty: it.qty, price: f.discountPrice ?? f.price, name: f.nameEn, available: true });
      } else {
        result.push({ foodId: it.foodId as string, qty: it.qty, price: it.priceSnapshot, name: it.nameSnapshot, available: false });
      }
    }
    return json({ items: result });
  }

  return json({ error: "Unknown action" }, 400);
}
