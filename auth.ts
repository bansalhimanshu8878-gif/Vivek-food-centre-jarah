import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET = process.env.AUTH_SECRET || "vfc-dev-secret-change-in-production-32chars!!";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw: string, stored: string) {
  try {
    const [salt, hash] = stored.split(":");
    const calc = scryptSync(pw, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(hash), Buffer.from(calc));
  } catch { return false; }
}
export function signToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function verifyToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data.id as string;
  } catch { return null; }
}
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get("vfc_token")?.value;
  if (!token) return null;
  const id = verifyToken(token);
  if (!id) return null;
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}
export async function setSession(userId: string) {
  const store = await cookies();
  store.set("vfc_token", signToken(userId), { httpOnly: true, path: "/", maxAge: 7 * 24 * 3600, sameSite: "lax" });
}
export async function clearSession() {
  const store = await cookies();
  store.delete("vfc_token");
}
export function isAdmin(u: { role: string } | null) {
  return !!u && (u.role === "admin" || u.role === "staff");
}
export function canManageOrders(u: { role: string; staffRole: string | null } | null) {
  if (!u) return false;
  if (u.role === "admin") return true;
  return ["super_admin", "order_manager", "kitchen_manager", "delivery_manager"].includes(u.staffRole || "");
}
export function canManageMenu(u: { role: string; staffRole: string | null } | null) {
  if (!u) return false;
  if (u.role === "admin") return true;
  return ["super_admin", "order_manager"].includes(u.staffRole || "");
}
export function canManageSettings(u: { role: string; staffRole: string | null } | null) {
  return !!u && u.role === "admin";
}
