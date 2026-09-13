/* ═══════════════════════════════════════════════════════════════════════
   script.js — CartWave  ·  Cinematic E-Commerce Showcase
   ═══════════════════════════════════════════════════════════════════════
   Cart Module ➜ Rendering ➜ Navbar Contrast ➜ Side-Dot Sync ➜
   Scroll-Reveal ➜ Checkout ➜ localStorage Persistence
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── DOM Caching ───────────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════════════
   CART MODULE — Single Source of Truth
   Stores only { id, qty } pairs. Prices/names always from PRODUCTS.
   ═══════════════════════════════════════════════════════════════════════ */
const Cart = (() => {
  const STORAGE_KEY = 'cartwave_cart';
  let items = []; // [ { id: string, qty: number }, … ]
  let listeners = [];

  /* ─ Persistence ─ */
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch(e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate: only keep items that exist in PRODUCTS
        items = parsed.filter(i => getProduct(i.id) && i.qty > 0);
      }
    } catch(e) { items = []; }
  }

  /* ─ Notify all listeners on change ─ */
  function notify() {
    save();
    listeners.forEach(fn => fn(items));
  }

  /* ─ Public API ─ */
  function add(id, qty = 1) {
    const existing = items.find(i => i.id === id);
    if (existing) { existing.qty += qty; }
    else { items.push({ id, qty }); }
    notify();
  }
  function setQty(id, qty) {
    if (qty <= 0) return remove(id);
    const existing = items.find(i => i.id === id);
    if (existing) existing.qty = qty;
    notify();
  }
  function remove(id) {
    items = items.filter(i => i.id !== id);
    notify();
  }
  function clear() {
    items = [];
    notify();
  }
  function getItems() { return items.map(i => ({ ...i })); }
  function getCount() { return items.reduce((s, i) => s + i.qty, 0); }
  function getSubtotal() {
    return items.reduce((s, i) => {
      const p = getProduct(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }
  function getShipping() {
    if (items.length === 0 || getSubtotal() === 0) return 0;
    return getSubtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  }
  function getDiscount() {
    if (items.length === 0) return 0;
    const tier = getDiscountTier(getSubtotal());
    return tier.pct > 0 ? getSubtotal() * (tier.pct / 100) : 0;
  }
  function getTotal() {
    if (items.length === 0 || getSubtotal() === 0) return 0;
    return Math.max(0, getSubtotal() - getDiscount() + getShipping());
  }
  function onChange(fn) { listeners.push(fn); }

  // Initialize from localStorage
  load();

  return { add, setQty, remove, clear, getItems, getCount, getSubtotal, getShipping, getDiscount, getTotal, onChange, notify };
})();


/* ═══════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════════════ */
function showToast(message, imgSrc) {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    ${imgSrc ? `<img class="toast__img" src="${imgSrc}" alt="">` : `<div class="toast__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`}
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); }, 2200);
  setTimeout(() => { toast.remove(); }, 2600);
}


/* ═══════════════════════════════════════════════════════════════════════
   FORMAT HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const stars = rating => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
};


/* ═══════════════════════════════════════════════════════════════════════
   §2  SHOP — Curated Luxury Collection with High-Res Photography
   ═══════════════════════════════════════════════════════════════════════ */
let activeCategory = 'all';

function renderFilters() {
  const container = $('#shop-filters');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(c =>
    `<button class="filter-pill${c.key === activeCategory ? ' active' : ''}" data-cat="${c.key}">${c.label}</button>`
  ).join('');

  container.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    activeCategory = pill.dataset.cat;
    $$('.filter-pill', container).forEach(p => p.classList.toggle('active', p.dataset.cat === activeCategory));
    renderProductGrid();
  });
}

function renderProductGrid() {
  const container = $('#shop-grid');
  if (!container) return;

  const filtered = activeCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: var(--sp-3xl); color: var(--clr-text-secondary);">No objects found in this category.</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-card__img-wrap">
        <img class="product-card__img" src="${p.image}" alt="${p.name}" loading="lazy">
        <span class="product-card__badge"><span class="spark-dot"></span>${p.badge}</span>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.category}</span>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__tagline">${p.tagline}</p>
        <div class="product-card__rating">
          <span class="product-card__stars">${stars(p.rating)}</span>
          <span>${p.rating} (${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-card__footer">
          <span class="product-card__price">${fmt(p.price)}</span>
          <button class="product-card__add-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart" title="Add to Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // Attach ThreeUI 3D tilt and specular sheen
  if (typeof initThreeUICardTilt === 'function') {
    initThreeUICardTilt();
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   §3  FEATURED PRODUCT — Seamless Floating Levitation 3D Model
   (No box, transparent canvas, fluid physics levitation, smooth rotation)
   ═══════════════════════════════════════════════════════════════════════ */
function renderSpotlight() {
  const p = PRODUCTS.find(prod => prod.isFeatured) || PRODUCTS[0];
  const container = $('#spotlight-inner');
  if (!container) return;

  container.innerHTML = `
    <!-- Left: Seamless Floating Levitation 3D Stage (No Box) -->
    <div class="spotlight__stage">
      <!-- Pulsing Floor Ambient Glow / Shadow -->
      <div class="spotlight__floor-glow"></div>

      <!-- Organic Levitation Float Wrapper -->
      <div class="spotlight__levitation">
        <iframe
          src="https://sketchfab.com/models/${p.sketchfabId}/embed?autostart=1&autorotate=0.3&transparent=1&ui_controls=0&ui_infos=0&ui_watermark=0&ui_stop=0&ui_theme=dark"
          title="${p.name} 3D Levitation Model"
          frameborder="0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          loading="eager"
        ></iframe>
      </div>

      <!-- Floating Spec Badges organically orbiting in 3D -->
      <div class="spotlight__specs-orbit">
        <div class="spec-badge">
          <span class="spec-badge__value"><span class="spark-dot"></span>${p.specs.driver || '40 mm'}</span>
          Beryllium Driver
        </div>
        <div class="spec-badge">
          <span class="spec-badge__value"><span class="spark-dot"></span>${p.specs.battery || '38 Hours'}</span>
          Battery with ANC
        </div>
        <div class="spec-badge">
          <span class="spec-badge__value"><span class="spark-dot"></span>${p.specs.anc || 'Adaptive ANC'}</span>
          Hybrid Silence
        </div>
        <div class="spec-badge">
          <span class="spec-badge__value"><span class="spark-dot"></span>${p.specs.weight || '248 g'}</span>
          Featherlight Fit
        </div>
      </div>

      <!-- Drag to Orbit Glass Hint Pill -->
      <div class="spotlight__drag-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Interactive 3D · Smooth Levitation · Drag to Orbit</span>
      </div>

      <!-- Acoustic Soundwave Visualizer Strip -->
      <div class="spotlight__soundwave" aria-label="Acoustic Frequency Spectrum">
        <div class="soundwave-bar" style="--h: 35%; --delay: 0.1s"></div>
        <div class="soundwave-bar" style="--h: 60%; --delay: 0.3s"></div>
        <div class="soundwave-bar" style="--h: 90%; --delay: 0.15s"></div>
        <div class="soundwave-bar" style="--h: 50%; --delay: 0.4s"></div>
        <div class="soundwave-bar" style="--h: 80%; --delay: 0.25s"></div>
        <div class="soundwave-bar" style="--h: 100%; --delay: 0.05s"></div>
        <div class="soundwave-bar" style="--h: 70%; --delay: 0.35s"></div>
        <div class="soundwave-bar" style="--h: 85%; --delay: 0.2s"></div>
        <div class="soundwave-bar" style="--h: 55%; --delay: 0.45s"></div>
        <div class="soundwave-bar" style="--h: 40%; --delay: 0.1s"></div>
        <div class="soundwave-bar" style="--h: 75%; --delay: 0.3s"></div>
        <div class="soundwave-bar" style="--h: 95%; --delay: 0.15s"></div>
      </div>
    </div>

    <!-- Right: Product Narrative & Acquisition -->
    <div class="spotlight__content">
      <div class="spotlight__eyebrow">Featured Showcase · Interactive 3D</div>
      <h2 class="spotlight__title">Experience the<br><span class="accent">${p.name}</span></h2>
      <p class="spotlight__desc">${p.description}</p>

      <div class="spotlight__price-row">
        <span class="spotlight__price">${fmt(p.price)}</span>
        <span class="spotlight__mrp">₹7,999 M.R.P.</span>
        <span class="spotlight__discount-tag">38% OFF</span>
        <span class="spotlight__rating">
          <span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews.toLocaleString()} verified reviews)
        </span>
      </div>

      <div class="spotlight__perks">
        <div class="spotlight__perk-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Free Delivery over ₹1,999
        </div>
        <div class="spotlight__perk-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          7-Day Easy Returns
        </div>
        <div class="spotlight__perk-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          1-Year Official Warranty
        </div>
      </div>

      <div class="spotlight__actions">
        <div class="qty-selector" id="spotlight-qty">
          <button class="qty-selector__btn" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-selector__val" id="spotlight-qty-val">1</span>
          <button class="qty-selector__btn" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn-add-spotlight" id="spotlight-add" data-id="${p.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;

  // Quantity selector logic
  let spotQty = 1;
  const qtyVal = $('#spotlight-qty-val');
  $('#spotlight-qty')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-delta]');
    if (!btn) return;
    spotQty = Math.max(1, Math.min(10, spotQty + parseInt(btn.dataset.delta)));
    if (qtyVal) qtyVal.textContent = spotQty;
  });

  // Add to cart
  $('#spotlight-add')?.addEventListener('click', () => {
    Cart.add(p.id, spotQty);
    showToast(`Added ${spotQty}× ${p.name}`, p.image);
    spotQty = 1;
    if (qtyVal) qtyVal.textContent = 1;
  });
}


/* ═══════════════════════════════════════════════════════════════════════
   §4 + §5  CART SECTION + CHECKOUT — Render on Cart Change
   ═══════════════════════════════════════════════════════════════════════ */
function renderCartSection() {
  const items = Cart.getItems();
  const listEl = $('#cart-items-list');
  const totalsEl = $('#cart-totals');
  const ctaBtn = $('#cart-checkout-btn');
  const subtotal = Cart.getSubtotal();
  const discount = Cart.getDiscount();
  const shipping = Cart.getShipping();
  const total = Cart.getTotal();
  const tier = getDiscountTier(subtotal);

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="cart-section__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Your cart is empty</p>
        <button class="hero__cta" onclick="document.getElementById('shop').scrollIntoView({behavior:'smooth'})">Start Shopping</button>
      </div>`;
    totalsEl.style.display = 'none';
    ctaBtn.disabled = true;
    updateShippingProgress(0);
    updateDiscountBadge('cart', 0);
    return;
  }

  listEl.innerHTML = items.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item__img" src="${p.image}" alt="${p.name}">
        <div class="cart-item__info">
          <div class="cart-item__name">${p.name}</div>
          <div class="cart-item__tagline">${p.tagline}</div>
        </div>
        <div class="cart-item__qty">
          <button class="cart-item__qty-btn" data-cart-delta="${item.id}:-1" aria-label="Decrease">−</button>
          <span class="cart-item__qty-val">${item.qty}</span>
          <button class="cart-item__qty-btn" data-cart-delta="${item.id}:1" aria-label="Increase">+</button>
        </div>
        <span class="cart-item__price">${fmt(p.price * item.qty)}</span>
        <button class="cart-item__remove" data-cart-remove="${item.id}" aria-label="Remove ${p.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  }).join('');

  // Totals
  totalsEl.style.display = 'block';
  $('#cart-subtotal').textContent = fmt(subtotal);
  $('#cart-shipping-cost').textContent = shipping === 0 ? 'Free' : fmt(shipping);
  $('#cart-total').textContent = fmt(total);

  // Discount row
  const discountRow = $('#cart-discount-row');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    $('#cart-discount-label').textContent = `Discount (${tier.pct}%)`;
    $('#cart-discount-val').textContent = `-${fmt(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }

  ctaBtn.disabled = false;

  // Shipping progress + discount badge
  updateShippingProgress(subtotal);
  updateDiscountBadge('cart', subtotal);
}

function renderDrawer() {
  const items = Cart.getItems();
  const body = $('#cart-drawer-body');
  const subtotal = Cart.getSubtotal();
  const total = Cart.getTotal();
  const drawerCheckout = $('#drawer-checkout-btn');

  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Your cart is empty</p>
      </div>`;
    $('#drawer-total').textContent = '₹0';
    if (drawerCheckout) drawerCheckout.disabled = true;
    updateShippingProgress(0, 'drawer');
    updateDiscountBadge('drawer', 0);
    return;
  }

  if (drawerCheckout) drawerCheckout.disabled = false;

  body.innerHTML = items.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `
      <div class="drawer-item" data-id="${item.id}">
        <img class="drawer-item__img" src="${p.image}" alt="${p.name}">
        <div class="drawer-item__info">
          <div class="drawer-item__name">${p.name}</div>
          <div class="drawer-item__price">${fmt(p.price * item.qty)}</div>
        </div>
        <div class="drawer-item__qty">
          <button class="drawer-item__qty-btn" data-drawer-delta="${item.id}:-1" aria-label="Decrease">−</button>
          <span class="drawer-item__qty-val">${item.qty}</span>
          <button class="drawer-item__qty-btn" data-drawer-delta="${item.id}:1" aria-label="Increase">+</button>
        </div>
      </div>`;
  }).join('');

  // Drawer footer
  $('#drawer-total').textContent = fmt(total);
  updateShippingProgress(subtotal, 'drawer');
  updateDiscountBadge('drawer', subtotal);
}

function renderCheckoutSummary() {
  const items = Cart.getItems();
  const container = $('#checkout-summary-items');
  const subtotal = Cart.getSubtotal();
  const discount = Cart.getDiscount();
  const shipping = Cart.getShipping();
  const total = Cart.getTotal();
  const tier = getDiscountTier(subtotal);

  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding: var(--sp-lg) 0; color: var(--clr-text-muted); font-size: var(--fs-sm); text-align: center;">
        Your cart is empty. Add products to complete checkout.
      </div>`;
    $('#co-subtotal').textContent = '₹0';
    $('#co-shipping').textContent = '₹0';
    $('#co-total').textContent = '₹0';
    $('#co-discount-row').style.display = 'none';
    $('#checkout-place-btn').disabled = true;
    return;
  }

  container.innerHTML = items.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `
      <div class="checkout__summary-item">
        <img class="checkout__summary-img" src="${p.image}" alt="${p.name}">
        <div class="checkout__summary-name">${p.name}<span>Qty: ${item.qty}</span></div>
        <span class="checkout__summary-price">${fmt(p.price * item.qty)}</span>
      </div>`;
  }).join('');

  $('#co-subtotal').textContent = fmt(subtotal);
  $('#co-shipping').textContent = shipping === 0 ? 'Free' : fmt(shipping);
  $('#co-total').textContent = fmt(total);

  const discountRow = $('#co-discount-row');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    $('#co-discount-label').textContent = `Discount (${tier.pct}%)`;
    $('#co-discount-val').textContent = `-${fmt(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }

  // Enable/disable place order button
  $('#checkout-place-btn').disabled = false;
}

/* ── Update shipping progress bar ── */
function updateShippingProgress(subtotal, prefix = 'cart') {
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const fill = $(`#${prefix}-shipping-fill`);
  const label = $(`#${prefix}-shipping-label`);
  const wrap = $(`#${prefix}-shipping`);

  fill.style.width = `${pct}%`;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    label.innerHTML = `🎉 You've unlocked <strong>free shipping!</strong>`;
    wrap.classList.add('complete');
  } else {
    const remaining = fmt(FREE_SHIPPING_THRESHOLD - subtotal);
    label.innerHTML = `Add <strong>${remaining}</strong> more for <strong>free shipping</strong>`;
    wrap.classList.remove('complete');
  }
}

/* ── Update discount tier badge ── */
function updateDiscountBadge(prefix, subtotal) {
  const tier = getDiscountTier(subtotal);
  const el = $(`#${prefix}-discount`);
  const textEl = $(`#${prefix}-discount-text`);
  if (tier.pct > 0) {
    el.style.display = 'flex';
    textEl.textContent = tier.label;
  } else {
    el.style.display = 'none';
  }
}

/* ── Update nav cart count badge ── */
function updateNavCartCount() {
  const count = Cart.getCount();
  const badge = $('#nav-cart-count');
  badge.textContent = count;
  badge.classList.toggle('empty', count === 0);
}


/* ═══════════════════════════════════════════════════════════════════════
   CART DRAWER — Open / Close
   ═══════════════════════════════════════════════════════════════════════ */
function openDrawer() {
  $('#cart-drawer').classList.add('open');
  $('#cart-drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  $('#cart-drawer').classList.remove('open');
  $('#cart-drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}


/* ═══════════════════════════════════════════════════════════════════════
   NAVBAR CONTRAST SWITCHING
   Uses Intersection Observer to detect which section is most visible.
   Light text on dark sections, dark text on the light checkout section.
   ═══════════════════════════════════════════════════════════════════════ */
function setupNavbarContrast() {
  const navbar = $('#navbar');
  const sideDots = $('#side-dots');
  const sections = $$('.section');
  let currentSection = 'home';

  const observer = new IntersectionObserver(entries => {
    // Find the entry with the highest intersection ratio
    let best = null;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!best || entry.intersectionRatio > best.intersectionRatio) {
          best = entry;
        }
      }
    });

    if (best) {
      currentSection = best.target.id;
      const theme = best.target.dataset.theme;

      // Navbar contrast
      navbar.classList.toggle('navbar--light', theme === 'light');

      // Side-dots contrast
      sideDots.classList.toggle('on-light', theme === 'light');

      // Active nav link
      $$('.navbar__link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === currentSection);
      });

      // Active side dot
      $$('.side-dots__dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.target === currentSection);
      });
    }
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

  sections.forEach(s => observer.observe(s));
}


/* ═══════════════════════════════════════════════════════════════════════
   SCROLL-TRIGGERED STAGGER REVEAL (Intersection Observer)
   ═══════════════════════════════════════════════════════════════════════ */
let revealObserver = null;

function setupScrollReveal() {
  // Disconnect old observer if re-initializing (e.g., after filter change)
  if (revealObserver) revealObserver.disconnect();

  const cards = $$('.product-card:not(.revealed)');
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  cards.forEach(card => revealObserver.observe(card));
}


/* ═══════════════════════════════════════════════════════════════════════
   CHECKOUT — Form Handling + Thank-You State
   ═══════════════════════════════════════════════════════════════════════ */
function setupCheckout() {
  const form = $('#checkout-form');
  const formWrap = $('#checkout-form-wrap');
  const summary = $('#checkout-summary');
  const thankyou = $('#checkout-thankyou');

  form.addEventListener('submit', e => {
    e.preventDefault();
    // Basic validation
    const inputs = $$('.checkout__input', form);
    let valid = true;
    inputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = 'var(--clr-error)';
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
      }
    });
    if (!valid || Cart.getCount() === 0) return;

    // Show thank-you state
    formWrap.style.display = 'none';
    summary.style.display = 'none';
    thankyou.classList.add('visible');

    // Confetti!
    spawnConfetti();

    // Clear cart
    Cart.clear();
    form.reset();
  });

  // Restart shopping
  $('#thankyou-restart').addEventListener('click', () => {
    thankyou.classList.remove('visible');
    formWrap.style.display = '';
    summary.style.display = '';
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ── Confetti Animation ── */
function spawnConfetti() {
  const colors = ['#e8985a', '#f0c86a', '#5cb88a', '#e85a5a', '#7bb8f0', '#c87bf0', '#f0ece4'];
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${-10 + Math.random() * 20}px`;
    particle.style.width = `${6 + Math.random() * 8}px`;
    particle.style.height = `${6 + Math.random() * 8}px`;
    particle.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 4000);
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   HERO VIDEO FALLBACK
   If the video fails to load, use the static image background instead.
   ═══════════════════════════════════════════════════════════════════════ */
function setupHeroVideo() {
  const video = $('#hero-video');
  const wrap = $('#hero-video-wrap');
  if (!video) return;

  video.addEventListener('error', () => {
    wrap.classList.add('fallback');
    video.style.display = 'none';
  });

  // Also fallback if video doesn't start playing within 4s
  setTimeout(() => {
    if (video.readyState < 2 && !video.currentTime) {
      wrap.classList.add('fallback');
      video.style.display = 'none';
    }
  }, 4000);
}


/* ═══════════════════════════════════════════════════════════════════════
   EVENT DELEGATION — Global click handling for cart actions
   ═══════════════════════════════════════════════════════════════════════ */
function setupGlobalClicks() {
  document.addEventListener('click', e => {
    // ── 3D Showcase quantity adjustment ──
    const scQtyBtn = e.target.closest('[data-showcase-qty-delta]');
    if (scQtyBtn) {
      const [id, delta] = scQtyBtn.dataset.showcaseQtyDelta.split(':');
      const valEl = document.getElementById(`showcase-qty-val-${id}`);
      if (valEl) {
        let cur = parseInt(valEl.textContent) || 1;
        cur = Math.max(1, Math.min(10, cur + parseInt(delta)));
        valEl.textContent = cur;
      }
      return;
    }

    // ── 3D Showcase Add to Cart ──
    const scAddBtn = e.target.closest('[data-showcase-add]');
    if (scAddBtn) {
      const id = scAddBtn.dataset.showcaseAdd;
      const valEl = document.getElementById(`showcase-qty-val-${id}`);
      const qty = valEl ? (parseInt(valEl.textContent) || 1) : 1;
      Cart.add(id, qty);
      const p = getProduct(id);
      if (p) showToast(`Added ${qty}× ${p.name} to cart`, p.image);
      if (valEl) valEl.textContent = '1';
      return;
    }

    // ── Add to cart from other cards (fallback) ──
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const id = addBtn.dataset.add;
      Cart.add(id, 1);
      const p = getProduct(id);
      if (p) showToast(`Added ${p.name} to cart`, p.image);
      return;
    }

    // ── Cart section qty ──
    const cartDelta = e.target.closest('[data-cart-delta]');
    if (cartDelta) {
      const [id, delta] = cartDelta.dataset.cartDelta.split(':');
      const item = Cart.getItems().find(i => i.id === id);
      if (item) Cart.setQty(id, item.qty + parseInt(delta));
      return;
    }

    // ── Cart section remove ──
    const cartRemove = e.target.closest('[data-cart-remove]');
    if (cartRemove) {
      Cart.remove(cartRemove.dataset.cartRemove);
      return;
    }

    // ── Drawer qty ──
    const drawerDelta = e.target.closest('[data-drawer-delta]');
    if (drawerDelta) {
      const [id, delta] = drawerDelta.dataset.drawerDelta.split(':');
      const item = Cart.getItems().find(i => i.id === id);
      if (item) Cart.setQty(id, item.qty + parseInt(delta));
      return;
    }

    // ── Side-dot navigation ──
    const dot = e.target.closest('.side-dots__dot');
    if (dot) {
      const target = document.getElementById(dot.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  });
}


/* ═══════════════════════════════════════════════════════════════════════
   INITIALIZE
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* ── Render static content ── */
  renderFilters();
  renderProductGrid();
  renderSpotlight();

  /* ── Wire cart listeners ── */
  Cart.onChange(() => {
    updateNavCartCount();
    renderDrawer();
    renderCartSection();
    renderCheckoutSummary();
  });
  // Initial render
  Cart.notify();

  /* ── Navbar contrast switching ── */
  setupNavbarContrast();

  /* ── Hero video fallback ── */
  setupHeroVideo();

  /* ── Checkout form ── */
  setupCheckout();

  /* ── Global click delegation ── */
  setupGlobalClicks();

  /* ── Cart drawer toggle ── */
  $('#cart-drawer-toggle').addEventListener('click', openDrawer);
  $('#cart-drawer-close').addEventListener('click', closeDrawer);
  $('#cart-drawer-overlay').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  /* ── Drawer checkout button → scroll to checkout ── */
  $('#drawer-checkout-btn').addEventListener('click', () => {
    if (Cart.getCount() === 0) return;
    closeDrawer();
    setTimeout(() => {
      document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
    }, 350);
  });

  /* ── Cart section CTA → scroll to checkout ── */
  $('#cart-checkout-btn').addEventListener('click', () => {
    if (Cart.getCount() === 0) return;
    document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Hero CTA → scroll to shop ── */
  $('#hero-cta').addEventListener('click', () => {
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Preserve scroll position on reload ── */
  // Use sessionStorage to remember which section was visible
  try {
    const savedSection = sessionStorage.getItem('cartwave_section');
    if (savedSection) {
      const target = document.getElementById(savedSection);
      if (target) {
        // Use instant scroll to avoid jarring animation on reload
        setTimeout(() => target.scrollIntoView({ behavior: 'instant' }), 50);
      }
    }
  } catch(e) {}

  // Save current section on scroll
  let scrollSaveTimer;
   document.addEventListener('scroll', () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
      const sections = $$('.section');
      let visible = 'home';
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
          visible = s.id;
        }
      });
      try { sessionStorage.setItem('cartwave_section', visible); } catch(e) {}
    }, 200);
  }, { passive: true });


  /* ═══════════════════════════════════════════════════════════════════
     THREE.JS HERO BACKGROUND — Scoped to Hero + Performance Observer
     ═══════════════════════════════════════════════════════════════════ */
  if (typeof initThreeBG === 'function') {
    const bgStarted = initThreeBG();
    if (bgStarted) {
      const heroEl = document.getElementById('home');
      if (heroEl && 'IntersectionObserver' in window) {
        const heroObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (typeof resumeThreeBG === 'function') resumeThreeBG();
            } else {
              if (typeof pauseThreeBG === 'function') pauseThreeBG();
            }
          });
        }, { threshold: 0.05 });
        heroObserver.observe(heroEl);
      }
    }
  }

  /* ── ThreeUI Interactions Initialization ── */
  initThreeUICardTilt();
  initAmbientCursorSpotlight();
});


/* ═══════════════════════════════════════════════════════════════════
   ThreeUI — 3D Holographic Card Tilt & Specular Glare Controller
   ═══════════════════════════════════════════════════════════════════ */
function initThreeUICardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // Touch screens don't tilt

  const cards = document.querySelectorAll('.product-card, .hero__badge');
  cards.forEach(card => {
    if (card._tiltAttached) return;
    card._tiltAttached = true;

    let bounds = null;
    const maxTilt = 11; // degrees

    function onMouseEnter() {
      bounds = card.getBoundingClientRect();
      card.style.setProperty('--glare-opacity', '1');
    }

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      
      const width = bounds.width;
      const height = bounds.height;
      
      const normX = Math.max(-1, Math.min(1, (x / width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (y / height) * 2 - 1));

      // Calculate tilt angles (rotateX is driven by Y, rotateY is driven by X)
      const tiltX = (-normY * maxTilt).toFixed(2);
      const tiltY = (normX * maxTilt).toFixed(2);

      // Percentage for radial glare
      const glareX = ((x / width) * 100).toFixed(1) + '%';
      const glareY = ((y / height) * 100).toFixed(1) + '%';

      card.style.setProperty('--tilt-x', `${tiltX}deg`);
      card.style.setProperty('--tilt-y', `${tiltY}deg`);
      card.style.setProperty('--glare-x', glareX);
      card.style.setProperty('--glare-y', glareY);
      card.style.setProperty('--glare-opacity', '1');
    }

    function onMouseLeave() {
      bounds = null;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--glare-opacity', '0');
    }

    card.addEventListener('mouseenter', onMouseEnter, { passive: true });
    card.addEventListener('mousemove', onMouseMove, { passive: true });
    card.addEventListener('mouseleave', onMouseLeave, { passive: true });
  });
}


/* ═══════════════════════════════════════════════════════════════════
   ThreeUI — Interactive Ambient Spotlight Cursor Field
   ═══════════════════════════════════════════════════════════════════ */
function initAmbientCursorSpotlight() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch devices

  let spotlight = document.getElementById('ambient-cursor-spotlight');
  if (!spotlight) {
    spotlight = document.createElement('div');
    spotlight.id = 'ambient-cursor-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spotlight);
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;
  let active = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!active) {
      active = true;
      document.body.classList.add('cursor-active');
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    active = false;
    document.body.classList.remove('cursor-active');
  });

  // Smooth lerp animation loop
  function loop() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
