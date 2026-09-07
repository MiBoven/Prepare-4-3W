# Prepare 4 3W

*So you can let surf the WWW*

A tiny, privacy-friendly toolbox for getting a website ready to ship — starting with a favicon generator. Everything runs entirely in your browser, nothing is ever uploaded to a server.

**Live at:** [prepare43w.michels.world](https://prepare43w.michels.world)

## Features

### Favicons
- Upload, drag & drop, or **paste from the clipboard** (Ctrl+V / Cmd+V) a single image (any browser-supported format: PNG, WEBP, JPG, GIF, ...)
- A square crop selection sits on top of the full image — drag it to move, drag any corner handle to resize. The selection always stays square and can never be dragged or resized outside the image
- **Center** snaps the selection back to the middle at its current size; **Maximize** grows it to the largest square that fits the image
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

### Baukasten *(coming soon)*
A header/main/footer builder with a live preview, for putting together page sections as building blocks. Not implemented yet — shown as a disabled placeholder on the home screen for now.

### Navigation & menu
- The logo sits next to the page title; clicking either takes you back to the home screen
- The menu (☰, top right) currently holds two things: a **Dark mode** toggle and **About** (a short info modal with the app description and version)

## How it works

The crop tool displays the full image and overlays a square selection box positioned in on-screen pixels. When you hit "Generate favicons", the on-screen crop rectangle is converted back into the original image's pixel coordinates (using the ratio between displayed size and natural size), then drawn onto a `<canvas>` at each required output size via `drawImage()` — which is what handles both downscaling and, if needed, upscaling.

Each PNG is produced with `canvas.toBlob('image/png')`. For `favicon.ico`, the raw bytes of the 16/32/48px PNGs are packed into a standard `ICONDIR`/`ICONDIRENTRY` structure (the modern PNG-in-ICO format supported since Windows Vista) — no server round-trip needed. The ZIP file is assembled by hand (local file headers, a central directory, and the end-of-central-directory record, all using the uncompressed "store" method), keeping the app dependency-free.

## Files

- `index.html` — markup for the home screen and the favicon tool
- `style.css` — all styling
- `app.js` — theme/menu/fullscreen behavior, the crop tool, icon/manifest generation, and the ZIP writer
- Push all three to the repo root; `index.html` links to the other two with relative paths

## Favicon

Prepare 4 3W's own favicon set — fittingly, generated with the app itself — is included at the repo root:

- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`
- `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest` (linked from `index.html`'s `<head>`)
- `logo.png` (shown next to the page title)

If any file were ever missing, browsers just silently skip it — nothing breaks, you'd just see a generic icon.

## Browser support

Works in all modern browsers (Chrome, Safari, Firefox, Edge). Uses the Pointer Events API for the crop tool's drag/resize handles (mouse, touch, and pen all work) and `canvas.toBlob()` for image export, both widely supported.

## Changelog

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
