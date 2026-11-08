import { db } from "../src/db";
import { categories, foods, banners, coupons, settings, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

const IMG = {
  pizza: "https://images.pexels.com/photos/19081130/pexels-photo-19081130.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  pizza2: "https://images.pexels.com/photos/19081129/pexels-photo-19081129.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  burger: "https://images.pexels.com/photos/20395260/pexels-photo-20395260.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  burger2: "https://images.pexels.com/photos/29173097/pexels-photo-29173097.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  burger3: "https://images.pexels.com/photos/10135119/pexels-photo-10135119.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  combo: "https://images.pexels.com/photos/30660324/pexels-photo-30660324.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  combo2: "https://images.pexels.com/photos/30622042/pexels-photo-30622042.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dosa: "https://images.pexels.com/photos/20422138/pexels-photo-20422138.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dosa2: "https://images.pexels.com/photos/20422129/pexels-photo-20422129.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dosa3: "https://images.pexels.com/photos/20422133/pexels-photo-20422133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  thali: "https://images.pexels.com/photos/29978153/pexels-photo-29978153.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mini: "https://images.pexels.com/photos/10296492/pexels-photo-10296492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

async function main() {
  const cats = [
    { nameHi: "पिज़्ज़ा", nameEn: "Pizza", image: IMG.pizza, sortOrder: 1 },
    { nameHi: "बर्गर", nameEn: "Burger", image: IMG.burger, sortOrder: 2 },
    { nameHi: "सैंडविच", nameEn: "Sandwich", image: IMG.mini, sortOrder: 3 },
    { nameHi: "चाइनीज़", nameEn: "Chinese", image: IMG.thali, sortOrder: 4 },
    { nameHi: "साउथ इंडियन", nameEn: "South Indian", image: IMG.dosa, sortOrder: 5 },
    { nameHi: "स्नैक्स", nameEn: "Snacks", image: IMG.combo2, sortOrder: 6 },
    { nameHi: "पेय पदार्थ", nameEn: "Beverages", image: IMG.combo, sortOrder: 7 },
    { nameHi: "विशेष कॉम्बो", nameEn: "Special Combos", image: IMG.combo, sortOrder: 8 },
  ];
  const catIds: Record<string, string> = {};
  for (const c of cats) {
    const [row] = await db.insert(categories).values(c).returning();
    catIds[c.nameEn] = row.id;
  }

  const menu = [
    { cat: "Pizza", nameHi: "पनीर पिज़्ज़ा", nameEn: "Paneer Pizza", descHi: "ताज़ा पनीर, शिमला मिर्च और चीज़ के साथ कुरकुरी बेस।", descEn: "Fresh paneer, capsicum and cheese on a crispy base.", price: 299, discountPrice: 249, image: IMG.pizza, rating: 4.8, veg: true, best: true, isNew: false },
    { cat: "Pizza", nameHi: "मार्गेरिटा पिज़्ज़ा", nameEn: "Margherita Pizza", descHi: "क्लासिक टमाटर सॉस, मोज़ेरेला और तुलसी।", descEn: "Classic tomato sauce, mozzarella and basil.", price: 199, discountPrice: null, image: IMG.pizza2, rating: 4.6, veg: true, best: false, isNew: true },
    { cat: "Burger", nameHi: "वेज चीज़ बर्गर", nameEn: "Veg Cheese Burger", descHi: "कुरकुरी वेज पैटी, चीज़ स्लाइस और स्पेशल सॉस।", descEn: "Crispy veg patty, cheese slice and special sauce.", price: 149, discountPrice: 119, image: IMG.burger2, rating: 4.7, veg: true, best: true, isNew: false },
    { cat: "Burger", nameHi: "चिकन बर्गर", nameEn: "Chicken Burger", descHi: "जूसी चिकन पैटी, लेट्यूस और मेयोनीज़।", descEn: "Juicy chicken patty, lettuce and mayo.", price: 199, discountPrice: 169, image: IMG.burger3, rating: 4.6, veg: false, best: false, isNew: false },
    { cat: "Burger", nameHi: "डबल चीज़ बर्गर", nameEn: "Double Cheese Burger", descHi: "डबल पैटी, डबल चीज़ — असली स्वाद का धमाका।", descEn: "Double patty, double cheese — a flavour blast.", price: 249, discountPrice: 199, image: IMG.burger, rating: 4.9, veg: true, best: true, isNew: true },
    { cat: "Sandwich", nameHi: "ग्रिल्ड वेज सैंडविच", nameEn: "Grilled Veg Sandwich", descHi: "तीन परतों वाला ग्रिल्ड सैंडविच, हरी चटनी के साथ।", descEn: "Triple-layer grilled sandwich with green chutney.", price: 129, discountPrice: 99, image: IMG.mini, rating: 4.5, veg: true, best: false, isNew: false },
    { cat: "Chinese", nameHi: "हक्का नूडल्स", nameEn: "Hakka Noodles", descHi: "वोक में भुनी सब्ज़ियों के साथ हक्का नूडल्स।", descEn: "Wok-tossed noodles with crunchy vegetables.", price: 179, discountPrice: 149, image: IMG.thali, rating: 4.6, veg: true, best: false, isNew: false },
    { cat: "Chinese", nameHi: "मंचूरियन राइस", nameEn: "Manchurian Rice", descHi: "वेज मंचूरियन के साथ फ्राइड राइस।", descEn: "Veg manchurian served with fried rice.", price: 219, discountPrice: 189, image: IMG.thali, rating: 4.7, veg: true, best: true, isNew: false },
    { cat: "South Indian", nameHi: "मसाला डोसा", nameEn: "Masala Dosa", descHi: "कुरकुरा डोसा, आलू मसाला, नारियल चटनी और सांभर।", descEn: "Crispy dosa, spiced potato, coconut chutney and sambar.", price: 149, discountPrice: 119, image: IMG.dosa, rating: 4.8, veg: true, best: true, isNew: false },
    { cat: "South Indian", nameHi: "इडली सांभर (4 पीस)", nameEn: "Idli Sambar (4 pc)", descHi: "नरम इडली, गरमा-गरम सांभर और चटनी के साथ।", descEn: "Soft idlis with hot sambar and chutney.", price: 99, discountPrice: 79, image: IMG.dosa2, rating: 4.5, veg: true, best: false, isNew: false },
    { cat: "South Indian", nameHi: "मेदू वड़ा", nameEn: "Medu Vada", descHi: "कुरकुरे बाहर से, नरम अंदर से — सांभर के साथ।", descEn: "Crisp outside, soft inside — served with sambar.", price: 119, discountPrice: null, image: IMG.dosa3, rating: 4.4, veg: true, best: false, isNew: true },
    { cat: "Snacks", nameHi: "फ्रेंच फ्राइज़ (बड़ा)", nameEn: "French Fries (Large)", descHi: "सुनहरे कुरकुरे फ्राइज़, केचप के साथ।", descEn: "Golden crispy fries with ketchup.", price: 99, discountPrice: 79, image: IMG.burger, rating: 4.5, veg: true, best: false, isNew: false },
    { cat: "Beverages", nameHi: "कोल्ड ड्रिंक (250ml)", nameEn: "Cold Drink (250ml)", descHi: "ठंडा और ताज़गी भरा — किसी भी खाने के साथ परफेक्ट।", descEn: "Chilled and refreshing — perfect with any meal.", price: 40, discountPrice: null, image: IMG.combo2, rating: 4.3, veg: true, best: false, isNew: false },
    { cat: "Special Combos", nameHi: "बर्गर + फ्राइज़ + कोल्ड ड्रिंक कॉम्बो", nameEn: "Burger + Fries + Cold Drink Combo", descHi: "वेज चीज़ बर्गर + बड़े फ्राइज़ + कोल्ड ड्रिंक — पूरा पेट, कम दाम!", descEn: "Veg cheese burger + large fries + cold drink — full meal, less price!", price: 349, discountPrice: 249, image: IMG.combo, rating: 4.9, veg: true, best: true, isNew: true, combo: "Burger + French Fries + Cold Drink" },
    { cat: "Special Combos", nameHi: "पिज़्ज़ा + गार्लिक ब्रेड कॉम्बो", nameEn: "Pizza + Garlic Bread Combo", descHi: "पनीर पिज़्ज़ा + गार्लिक ब्रेड — परिवार के लिए परफेक्ट।", descEn: "Paneer pizza + garlic bread — perfect for family.", price: 449, discountPrice: 349, image: IMG.pizza, rating: 4.8, veg: true, best: false, isNew: false, combo: "Paneer Pizza + Garlic Bread" },
  ];

  for (const m of menu) {
    await db.insert(foods).values({
      categoryId: catIds[m.cat], nameHi: m.nameHi, nameEn: m.nameEn, descHi: m.descHi, descEn: m.descEn,
      price: m.price, discountPrice: m.discountPrice, image: m.image, rating: m.rating, veg: m.veg,
      available: true, stock: 50, isBestseller: m.best, isNew: m.isNew, isCombo: !!m.combo, comboItems: m.combo || null,
    });
  }

  await db.insert(banners).values([
    { titleHi: "पहले ऑर्डर पर 20% छूट!", titleEn: "20% OFF on your first order!", descHi: "कोड FIRST20 का उपयोग करें।", descEn: "Use code FIRST20 today.", image: IMG.combo, buttonHi: "अभी ऑर्डर करें", buttonEn: "Order Now", link: "#menu", active: true, sortOrder: 1 },
    { titleHi: "₹499+ पर मुफ़्त डिलीवरी", titleEn: "Free delivery above ₹499", descHi: "गरमा-गरम खाना, तेज़ डिलीवरी।", descEn: "Hot food, fast delivery.", image: IMG.pizza, buttonHi: "मेनू देखें", buttonEn: "View Menu", link: "#menu", active: true, sortOrder: 2 },
  ]);

  await db.insert(coupons).values([
    { code: "FIRST20", type: "percent", value: 20, minOrder: 199, maxDiscount: 150, expiresAt: new Date(Date.now() + 90 * 86400000), usageLimit: 1000, active: true },
    { code: "VIVEK50", type: "fixed", value: 50, minOrder: 299, maxDiscount: null, expiresAt: new Date(Date.now() + 90 * 86400000), usageLimit: 500, active: true },
    { code: "FREEDEL", type: "fixed", value: 40, minOrder: 149, maxDiscount: null, expiresAt: new Date(Date.now() + 90 * 86400000), usageLimit: 500, active: true },
  ]);

  const defaults: Record<string, string> = {
    restaurant_name: "Vivek Food Centre", restaurant_name_hi: "विवेक फूड सेंटर",
    phone: "+91 98765 43210", whatsapp: "919876543210",
    address: "Main Market Road, Near Bus Stand, India",
    maps_link: "https://maps.google.com", opening_hours: "10:00 AM – 10:00 PM (All Days)",
    delivery_charge: "40", free_above: "499", min_order: "99", est_time: "35",
    points_per_100: "10", instagram: "https://instagram.com", facebook: "https://facebook.com",
  };
  for (const [k, v] of Object.entries(defaults)) {
    await db.insert(settings).values({ key: k, value: v }).onConflictDoNothing();
  }

  // Admin user: mobile 9876543210 / password admin123
  const [existingAdmin] = await db.select().from(users).where((await import("drizzle-orm")).eq(users.mobile, "9876543210")).limit(1);
  if (!existingAdmin) {
    await db.insert(users).values({ name: "Vivek Food Centre Admin", mobile: "9876543210", email: "admin@vivekfood.in", passwordHash: hashPassword("admin123"), role: "admin" });
  }
  console.log("Seed complete. Admin: 9876543210 / admin123");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
