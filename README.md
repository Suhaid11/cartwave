# CartWave 🌊

A single-page e-commerce showcase built around a cinematic, full-viewport scroll-snap experience. I created this project to demonstrate clean front-end architecture, responsive design, and reactive state management using only core web standards.

---

## Tech Stack

- **HTML5 & CSS3**: Custom properties (tokens), CSS Grid, Flexbox, and CSS scroll-snap (`scroll-snap-type: y mandatory`).
- **JavaScript (ES6+)**: Vanilla JS using the module pattern and event delegation. No frameworks or external runtime dependencies.
- **Intersection Observer API**: Handles navbar contrast switching (dark/light) and active side-dot synchronization.
- **Web Storage API**: `localStorage` for persisting cart state across page reloads.

---

## Key Features

- **Full-Viewport Scroll-Snap**: 5 distinct sections (`Hero`, `Shop`, `Featured 3D`, `Cart`, `Checkout`) aligned to full viewport height.
- **Curated Product Collection**: Responsive product grid with category filter pills, star ratings, and quick add-to-cart.
- **Featured 3D Showcase**: Containerless floating 3D model with smooth levitation physics and interactive drag-to-orbit controls.
- **Dual Cart Surfaces**: Slide-in frosted glass drawer plus a dedicated full-screen cart review section.
- **Dynamic Shipping Progress Bar**: Real-time progress tracker towards free delivery over ₹1,999.
- **Tiered Discounts**: Automatically calculated multi-tier order discounts (5%, 10%, 15%).
- **Minimal Checkout Flow**: Order form tailored with Indian address and UPI/Card placeholders, finished with a celebratory confetti animation.

---

## How the Cart Works

The cart is managed by a standalone module that treats product data as immutable. Instead of duplicating product names, images, or prices in state, the cart only tracks an array of `{ id, qty }` pairs. Every calculation (subtotal, shipping, discount, final total) dynamically references the central `products.js` file. This eliminates stale price bugs and ensures that any catalog update is immediately reflected everywhere in the application. Any state change triggers a centralized `notify()` call that updates all dependent UI views and syncs to `localStorage`.

---

## Design Approach

I wanted to avoid the generic template look common in e-commerce demos. The interface uses full-bleed cinematic imagery, layered dark gradients, and frosted-glass elements (`backdrop-filter: blur()`). Instead of navigating across traditional multi-page routes, sections snap into place vertically like slides in a presentation, creating an immersive, editorial feel while keeping interactions fast and cohesive.

---

## Project Structure

```text
CartWave/
├── index.html       # Single-page HTML shell with all 5 sections, drawer, and navigation
├── styles.css       # Complete styling system, CSS variables, glassmorphism, and responsive queries
├── products.js     # Central product catalog data, technical specs, pricing, and discount tiers
├── script.js       # App logic: cart state management, DOM rendering, and IntersectionObservers
├── assets/         # High-resolution product imagery and hero background video
│   ├── hero-bg.mp4
│   ├── hero-fallback.jpg
│   └── product_*.jpg
└── README.md       # Project overview and documentation
```

---

## How to Run Locally

No build tools, bundlers, or `npm install` required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Suhaid11/cartwave.git
   cd cartwave
   ```

2. **Open the project:**
   - **Directly:** Double-click `index.html` to open it in any modern browser.
   - **Via a local server (recommended for smooth video streaming):**
     ```bash
     npx serve .
     # or
     python -m http.server 3000
     ```
   - Open `http://localhost:3000` in your browser.

---

## Credits & Attributions

- **Hero Video**: Provided by [cottonbro studio on Pexels](https://www.pexels.com/video/4320605/) under the [Pexels License](https://www.pexels.com/license/) (free for personal and commercial use).
- **Featured 3D Model**: Aurora Headphones 3D model by [oscar_creativo on Sketchfab](https://sketchfab.com/models/db92168ca39541939d0110e64a37f92e) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

## License

This project is licensed under the [MIT License](LICENSE).
