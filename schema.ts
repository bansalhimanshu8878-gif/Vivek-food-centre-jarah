import { pgTable, uuid, text, integer, boolean, timestamp, real, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"), // customer | admin | staff
  staffRole: text("staff_role"), // super_admin | order_manager | kitchen_manager | delivery_manager
  points: integer("points").notNull().default(0),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").default("घर"),
  house: text("house").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pin: text("pin").notNull(),
  landmark: text("landmark"),
  instructions: text("instructions"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameHi: text("name_hi").notNull(),
  nameEn: text("name_en").notNull(),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
});

export const foods = pgTable("foods", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  nameHi: text("name_hi").notNull(),
  nameEn: text("name_en").notNull(),
  descHi: text("desc_hi"),
  descEn: text("desc_en"),
  price: integer("price").notNull(),
  discountPrice: integer("discount_price"),
  image: text("image"),
  rating: real("rating").default(4.5),
  veg: boolean("veg").default(true),
  available: boolean("available").default(true),
  stock: integer("stock").default(50),
  isBestseller: boolean("is_bestseller").default(false),
  isNew: boolean("is_new").default(false),
  isCombo: boolean("is_combo").default(false),
  comboItems: text("combo_items"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderRef: text("order_ref").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  house: text("house"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  pin: text("pin"),
  landmark: text("landmark"),
  instructions: text("instructions"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0),
  deliveryFee: integer("delivery_fee").default(0),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").default("cod"), // cod | upi | online
  paymentStatus: text("payment_status").default("pending"), // pending | paid | refunded | failed
  transactionId: text("transaction_id"),
  refundStatus: text("refund_status").default("none"),
  status: text("status").default("placed"), // placed|accepted|preparing|ready|out_for_delivery|delivered|cancelled|rejected
  couponCode: text("coupon_code"),
  photoData: text("photo_data"), // data URL, only served via protected API
  photoConsent: boolean("photo_consent").default(false),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt)]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
  nameSnapshot: text("name_snapshot").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  qty: integer("qty").notNull(),
  imageSnapshot: text("image_snapshot"),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"), // percent | fixed
  value: integer("value").notNull(),
  minOrder: integer("min_order").default(0),
  maxDiscount: integer("max_discount"),
  expiresAt: timestamp("expires_at"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
});

export const couponUsage = pgTable("coupon_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  foodId: uuid("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  text: text("text"),
  photo: text("photo"),
  approved: boolean("approved").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favourites = pgTable("favourites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  foodId: uuid("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
}, (t) => [index("fav_user_food_idx").on(t.userId, t.foodId)]);

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleHi: text("title_hi"),
  titleEn: text("title_en"),
  descHi: text("desc_hi"),
  descEn: text("desc_en"),
  image: text("image"),
  videoUrl: text("video_url"),
  link: text("link"),
  buttonHi: text("button_hi"),
  buttonEn: text("button_en"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // null = admin broadcast
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").default("info"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockHistory = pgTable("stock_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  foodId: uuid("food_id").references(() => foods.id, { onDelete: "cascade" }),
  change: integer("change").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyHistory = pgTable("loyalty_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason"),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
