# Prepare 4 3W

*So you can let surf the WWW*

A tiny, privacy-friendly toolbox for getting a website ready to ship — starting with a favicon generator. Everything runs entirely in your browser, nothing is ever uploaded to a server.

**Live at:** [prepare43w.michels.world](https://prepare43w.michels.world)

## Features

### Favicons
- Upload, drag & drop, or **paste from the clipboard** (Ctrl+V / Cmd+V) a single image (any browser-supported format: PNG, WEBP, JPG, GIF, ...)
- A square crop selection sits on top of the full image — drag it to move, drag any corner handle to resize. The selection always stays square and can never be dragged or resized outside the image
- **Center** snaps the selection back to the middle at its current size; **Maximize** grows it to the largest square that fits the image
- Corner handles have a generous 40×40px touch target for fingers, while the visible grip stays fully inside the selection — it can never render (or be dragged) outside the image, even at the very edge
- Recommended minimum crop size is **512×512px**; if your selection is smaller, the larger icons are upscaled and a warning is shown next to the download buttons
- Choose which files to generate — your last selection is remembered (`localStorage`) for next time:

  | File | What it's for |
  |---|---|
  | `favicon.ico` | Multi-size icon (16/32/48px embedded) — the classic browser tab icon |
  | `favicon-16x16.png` | Small PNG fallback for browser tabs |
  | `favicon-32x32.png` | Larger PNG fallback, used by some browsers/OSes |
  | `apple-touch-icon.png` | 180×180 — iOS "Add to Home Screen" icon |
  | `android-chrome-192x192.png` | Android home screen / PWA icon |
  | `android-chrome-512x512.png` | Larger Android/PWA icon, also used for splash screens |
  | `site.webmanifest` | Small JSON file describing the site as an installable app (name, icons, colors, display mode); automatically pulls in both Android icons above |

- The default selection (matching the four favicon files most sites need) is `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, and `apple-touch-icon.png`
- Download files individually, all at once, or bundled as a ZIP
- `favicon.ico` is built client-side as a real multi-size icon: three PNG-encoded images (16/32/48px) are packed directly into the `.ico` container — no conversion service involved
- The ZIP is built with a small vendor-free ZIP writer (uncompressed "store" method) — no external library needed for a handful of small icon files
- `site.webmanifest` ships with placeholder `name`/`short_name` values ("My App") — edit those for the site you're actually using it on

### Baukasten
Freely assemble a header, main, and footer section out of five block types — Logo, Nav, Text, Image, Button — each with its own editable fields (image paths, link labels/URLs, heading level, text content, button labels). Per section you can:
- Add any number of blocks in any order via the block palette
- Reorder blocks with ↑/↓, or remove them
- For Nav blocks, add/remove individual links within the block

A live preview (rendered in a sandboxed `<iframe>`) updates as you type, and below it sit two read-only code panels — **HTML** and **CSS** — each with a **Copy** button. The generated CSS is deliberately colorless (only layout, spacing, and structure) so the snippet can be dropped into any existing site without fighting its color scheme; the one exception is the button style, which borders itself in `currentColor` so it's still visible against whatever text color the target page already uses.

There's no download here — Baukasten is copy-paste only, since the output is meant to be pasted into an existing project rather than shipped as standalone files.

### Navigation & menu
- The logo sits next to the page title; clicking either takes you back to the home screen
- The menu (☰, top right) currently holds two things: a **Dark mode** toggle and **About** (a short info modal with the app description and version)

### Link preview
Open Graph and Twitter Card meta tags are set in `index.html`'s `<head>`, so sharing the link (chat apps, social media, etc.) shows a preview card with the logo, title, subtitle, and a short description — without the version number, which only appears in the in-app About modal.

### Offline support
Once you've visited the site once (and especially once you've "installed" it via the browser's add-to-home-screen prompt, enabled by `site.webmanifest`), a service worker lets it keep working without a network connection. It uses a stale-while-revalidate strategy: every request is answered from the cache instantly if available, while a background fetch quietly refreshes that cache entry for next time — so you always get an immediate response, and you're never more than one online visit out of date.

## How it works

The crop tool displays the full image and overlays a square selection box positioned in on-screen pixels. When you hit "Generate favicons", the on-screen crop rectangle is converted back into the original image's pixel coordinates (using the ratio between displayed size and natural size), then drawn onto a `<canvas>` at each required output size via `drawImage()` — which is what handles both downscaling and, if needed, upscaling.

Each PNG is produced with `canvas.toBlob('image/png')`. For `favicon.ico`, the raw bytes of the 16/32/48px PNGs are packed into a standard `ICONDIR`/`ICONDIRENTRY` structure (the modern PNG-in-ICO format supported since Windows Vista) — no server round-trip needed. The ZIP file is assembled by hand (local file headers, a central directory, and the end-of-central-directory record, all using the uncompressed "store" method), keeping the app dependency-free.

## Files

- `index.html` — markup for the home screen, the favicon tool, and the Baukasten
- `style.css` — all styling
- `app.js` — theme/menu/fullscreen behavior, the crop tool, icon/manifest generation, the ZIP writer, and the Baukasten
- `service-worker.js` — stale-while-revalidate caching for offline support
- `favicon.ico` — kept at the repo root; some browsers and crawlers still request `/favicon.ico` directly regardless of `<link>` tags, so this one stays outside the `icons/` folder
- `icons/` — the rest of Prepare 4 3W's own favicon set (`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`); all referenced with absolute paths, so the folder can be renamed if needed
- `logo.png` — kept at the repo root next to the other source files, since it's an in-app branding asset rather than a generated favicon
- Push everything to the repo root, preserving the `icons/` folder structure

## Favicon

Prepare 4 3W's own favicon set — fittingly, generated with the app itself — is included:

- `favicon.ico` at the repo root
- `icons/favicon-16x16.png`, `icons/favicon-32x32.png`, `icons/apple-touch-icon.png`, `icons/android-chrome-192x192.png`, `icons/android-chrome-512x512.png`, `icons/site.webmanifest` (all linked from `index.html`'s `<head>`)
- `logo.png` at the repo root (shown next to the page title)

If any file were ever missing, browsers just silently skip it — nothing breaks, you'd just see a generic icon.

## Browser support

Works in all modern browsers (Chrome, Safari, Firefox, Edge). Uses the Pointer Events API for the crop tool's drag/resize handles (mouse, touch, and pen all work) and `canvas.toBlob()` for image export, both widely supported.

## Changelog

### 1.1.0 — 2026-09-08
- Added the Baukasten: freely combinable Logo/Nav/Text/Image/Button blocks for a header, main, and footer section, each with editable fields, reordering, and per-block removal
- Live preview via a sandboxed iframe, plus copy-to-clipboard HTML and CSS output — colorless/generic styling meant to be pasted into any existing site

### 1.0.0 — 2026-09-08 — First stable release
- Declared stable after the favicon generator, offline support, and link preview were all in place and tested

### 0.9.0 — 2026-09-08
- Added Open Graph / Twitter Card meta tags for a proper link preview (logo, title, subtitle, description — no version number) when the URL is shared
- Crop handles are now a full 40×40px touch target (up from 20×20px) for easier use on phones, and the visible grip is inset inside the crop box so it can no longer visually or functionally sit outside the image
- Raised the minimum crop size slightly (40px → 90px) so the larger handles don't overlap each other on a very small selection

### 0.3.0 — 2026-09-08
- Added offline support: a stale-while-revalidate service worker caches the app shell and its own icons, so the site keeps working without a network connection after the first visit
- `icons/site.webmanifest` now includes `start_url` and `scope`, which browsers require to consider a site installable as a PWA

### 0.2.2 — 2026-09-08
- Fixed the crop selection being able to sit in empty letterboxed space next to a portrait-oriented image instead of being bounded to the actual visible image
- Fixed the crop selection resetting to its default position on Ctrl+scroll zoom (desktop) or on the mobile browser's address bar hiding while scrolling — both fire a plain `resize` event, which used to fully re-center the box; it's now re-applied proportionally instead
- Fixed the download buttons being visible and clickable (producing an empty ZIP) before any image had been generated — caused by a CSS rule that unintentionally overrode the `hidden` attribute
- Moved Prepare 4 3W's own generated favicon files into an `icons/` subfolder to keep the repo root tidy; `favicon.ico` stays at the root for maximum browser/crawler compatibility

### 0.2.1 — 2026-09-08
- Fixed the header: logo, title, and subtitle now live together in one `.brand` block inside `<header>` (matching JPG75), instead of a separate block below the header
- About modal restyled to match JPG75's structure (plain `<p>`, `.muted`, `.muted.small`, `data-close` button)
- Renamed dropdown/menu CSS classes to `.menu-dropdown` / `.menu-item` for consistency with the rest of the suite

### 0.2.0 — 2026-09-08
- Own favicon set (all files, including `site.webmanifest`) added to the repo root, generated with the app itself
- Images can now also be pasted from the clipboard (Ctrl+V / Cmd+V), in addition to upload and drag & drop
- Added **Center** and **Maximize** buttons to the crop tool
- Fixed the crop selection being able to be dragged/resized past the edge of the image in some corner-handle cases
- Logo now sits next to the page title instead of in the header; clicking either goes home
- Reworked the menu: dark mode toggle moved out of the header and into the menu; added an **About** entry; removed the michels.world link

### 0.1.0 — 2026-09-08 — Initial release
- Home screen with a tool grid; Favicons is live, Baukasten shown as a "coming soon" placeholder
- Favicon tool: image upload/drag & drop, square crop selection (movable, resizable via corner handles)
- Selectable output set (favicon.ico, 16×16, 32×32, apple-touch-icon, android-chrome 192/512, site.webmanifest), remembered via `localStorage`
- Warning when the crop selection is below the recommended 512×512px minimum
- Client-side multi-size `favicon.ico` builder (PNG-in-ICO)
- Client-side `site.webmanifest` generation
- Download files individually, all at once, or as a ZIP (via a small hand-written, vendor-free ZIP writer)
