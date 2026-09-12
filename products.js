/* ═══════════════════════════════════════════════════════════════════════
   products.js — CartWave Shared Product Data Module
   Single source of truth: cart stores only {id, qty} pairs.
   All names, prices, images are looked up live from this array.
   ═══════════════════════════════════════════════════════════════════════
   PRICES IN INDIAN RUPEES (₹) — Boutique accessible pricing
   ═══════════════════════════════════════════════════════════════════════ */

const PRODUCTS = [
  {
    id: "aurora-headphones",
    name: "Aurora Headphones",
    tagline: "Immersive sound, sculpted silence.",
    price: 4999,
    category: "audio",
    image: "assets/product_headphones.jpg",
    spotlightImage: "assets/spotlight_headphones.jpg",
    rating: 4.9,
    reviews: 1247,
    badge: "Featured 3D",
    isFeatured: true,
    /* Sketchfab embed — CC BY 4.0, model by oscar_creativo */
    sketchfabId: "db92168ca39541939d0110e64a37f92e",
    sketchfabAuthor: "oscar_creativo",
    specs: {
      material: "Aerospace aluminium & protein leather",
      driver: "40 mm Beryllium",
      battery: "38 h ANC on",
      weight: "248 g",
      connectivity: "Bluetooth 5.3 · 3.5 mm",
      anc: "Adaptive Hybrid ANC"
    },
    description: "Engineered for audiophiles who refuse compromise. The Aurora wraps you in 40 mm beryllium drivers and adaptive hybrid ANC, delivering studio-reference sound in absolute silence — for up to 38 hours on a single charge."
  },
  {
    id: "solstice-watch",
    name: "Solstice Automatic",
    tagline: "Time, elevated.",
    price: 6499,
    category: "accessories",
    image: "assets/product_watch.jpg",
    rating: 4.8,
    reviews: 834,
    badge: "Premium",
    specs: {
      material: "316L Stainless Steel & Sapphire",
      movement: "Miyota 9039 Automatic",
      water: "100 m WR",
      weight: "142 g"
    },
    description: "A minimalist automatic timepiece with a sunburst black dial, rose-gold indices, and a hand-stitched Horween leather strap."
  },
  {
    id: "valkyrie-keyboard",
    name: "Valkyrie Mechanical",
    tagline: "Tactile perfection on your desk.",
    price: 4499,
    category: "workspace",
    image: "assets/product_keyboard.jpg",
    rating: 4.9,
    reviews: 542,
    badge: "New Release",
    specs: {
      material: "CNC Anodized Aluminium & Brass",
      switches: "Gateron Oil King Linear",
      layout: "75% Compact Layout",
      connectivity: "Tri-mode 2.4G / BT / Type-C"
    },
    description: "Machined from a solid block of aircraft-grade 6063 aluminium with a mirror-polished solid brass bottom weight. Pre-lubed linear switches offer acoustic bliss."
  },
  {
    id: "heritage-crossbody",
    name: "Heritage Crossbody",
    tagline: "Carry your story.",
    price: 3899,
    category: "bags",
    image: "assets/product_bag.jpg",
    rating: 4.7,
    reviews: 612,
    badge: "Handcrafted",
    specs: {
      material: "Full-grain vegetable-tanned leather",
      dimensions: '9.5" × 7" × 3"',
      weight: "380 g",
      closure: "Solid brass buckle"
    },
    description: "Cut from a single hide of Tuscan vegetable-tanned leather that develops a rich patina uniquely yours. Solid brass hardware and hand-burnished edges."
  },
  {
    id: "aethel-sunglasses",
    name: "Aethel Titanium Aviator",
    tagline: "Featherlight silhouette, timeless gaze.",
    price: 2199,
    category: "accessories",
    image: "assets/product_sunglasses.jpg",
    rating: 4.9,
    reviews: 418,
    badge: "Trending",
    specs: {
      material: "Japanese Grade-5 Beta Titanium",
      lenses: "Polarized Amber UV400",
      weight: "16 g Ultra-light",
      coating: "Hydrophobic Anti-reflective"
    },
    description: "Forged in Sabae, Japan using grade-5 beta-titanium wire weighing only 16 grams. Custom amber gradient polarized lenses block 100% harmful UVA/UVB rays."
  },
  {
    id: "ember-speaker",
    name: "Ember Mini Speaker",
    tagline: "Big sound, small footprint.",
    price: 2499,
    category: "audio",
    image: "assets/product_speaker.jpg",
    rating: 4.6,
    reviews: 987,
    badge: "Compact",
    specs: {
      material: "Recycled woven fabric & copper",
      driver: "Full-range 45 mm neodymium",
      battery: "14 h playback",
      waterproof: "IPX7 submersible"
    },
    description: "A pint-sized powerhouse wrapped in tactile recycled wool fabric with brushed copper accents. 360° omnidirectional sound that easily fills a room."
  },
  {
    id: "sienna-wallet",
    name: "Sienna Brass Wallet",
    tagline: "Minimalism folded to perfection.",
    price: 1499,
    category: "accessories",
    image: "assets/product_wallet.jpg",
    rating: 4.8,
    reviews: 729,
    badge: "Essential",
    specs: {
      material: "Italian Buttero Vegetable Leather",
      capacity: "Up to 8 cards + folded cash",
      hardware: "Spring-tempered brass clip",
      profile: "Slim 8 mm thickness"
    },
    description: "Crafted from full-grain Italian Buttero leather with a spring-tempered solid brass tension clip. Fits discreetly into front pockets without bulk."
  },
  {
    id: "ritual-pourover",
    name: "Ritual Pour-Over Set",
    tagline: "Mornings, perfected.",
    price: 1799,
    category: "home",
    image: "assets/product_coffee.jpg",
    rating: 4.6,
    reviews: 2031,
    badge: "Popular",
    specs: {
      material: "Japanese ceramic & black walnut",
      capacity: "400 ml / 2 cups",
      weight: "620 g",
      includes: "Dripper, carafe, 50 filters"
    },
    description: "A Japanese-ceramic dripper on a black-walnut stand, engineered for a clean, full-bodied cup. The ritual of hand-pouring slows you down just enough."
  },
  {
    id: "kanso-planter",
    name: "Kanso Fluted Planter",
    tagline: "Living sculpture for your sanctuary.",
    price: 1299,
    category: "home",
    image: "assets/product_planter.jpg",
    rating: 4.7,
    reviews: 388,
    badge: "Artisanal",
    specs: {
      material: "Fluted terracotta & matte glaze",
      dimensions: '5.5" dia × 5" height',
      drainage: "Mesh-guarded drainage hole",
      finish: "Hand-brushed matte charcoal"
    },
    description: "Architectural fluting meets wabi-sabi stillness. Hand-spun terracotta finished in a soft matte charcoal mineral glaze, with optimal root drainage."
  },
  {
    id: "memento-journal",
    name: "Memento Journal",
    tagline: "Write it down. Remember it all.",
    price: 1199,
    category: "workspace",
    image: "assets/product_journal.jpg",
    rating: 4.8,
    reviews: 1543,
    badge: "Editor's Pick",
    specs: {
      material: "Italian pebble-grain leather",
      pages: "192 pages, 100 gsm ivory",
      dimensions: '8.5" × 5.5"',
      ruling: "5 mm dot grid"
    },
    description: "Bound in deep navy Italian leather with subtle gold-foil embossing, 192 pages of fountain-pen-friendly ivory stock, and dual satin ribbon markers."
  },
  {
    id: "sanctuary-candle",
    name: "Sanctuary Candle",
    tagline: "Atmosphere in a jar.",
    price: 899,
    category: "home",
    image: "assets/product_candle.jpg",
    rating: 4.9,
    reviews: 3429,
    badge: "Top Rated",
    specs: {
      material: "100% natural soy wax, wooden wick",
      scent: "Sandalwood · Amber · Cedar",
      burn: "55 h burn time",
      weight: "255 g / 9 oz"
    },
    description: "Hand-poured pure soy wax in a reusable amber glass jar with a walnut lid. Notes of smoked sandalwood, warm amber, and Virginia cedar fill a room in minutes."
  }
];

/* ─── Category labels for filter pills ──────────────────────────────── */
const CATEGORIES = [
  { key: "all",         label: "All Objects" },
  { key: "audio",       label: "Audio" },
  { key: "accessories", label: "Accessories" },
  { key: "workspace",   label: "Workspace" },
  { key: "bags",        label: "Leather Goods" },
  { key: "home",        label: "Home & Ritual" }
];

/* ─── Discount tiers (₹ — adjusted for new pricing) ─────────────────── */
const DISCOUNT_TIERS = [
  { min: 0,    pct: 0,  label: "" },
  { min: 2500, pct: 5,  label: "5 % off orders over ₹2,500" },
  { min: 5000, pct: 10, label: "10 % off orders over ₹5,000" },
  { min: 8000, pct: 15, label: "15 % off orders over ₹8,000" }
];
const FREE_SHIPPING_THRESHOLD = 1999; // ₹ Free delivery over ₹1,999
const STANDARD_SHIPPING_FEE = 99;    // ₹ Standard delivery if under threshold

/* ─── Helpers ───────────────────────────────────────────────────────── */
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

function getDiscountTier(subtotal) {
  let tier = DISCOUNT_TIERS[0];
  for (const t of DISCOUNT_TIERS) {
    if (subtotal >= t.min) tier = t;
  }
  return tier;
}
