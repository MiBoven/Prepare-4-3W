# Prepare 4 3W

*So you can let surf the WWW*

A tiny, privacy-friendly toolbox for getting a website ready to ship — starting with a favicon generator. Everything runs entirely in your browser, nothing is ever uploaded to a server.

**Live at:** [prepare4w.michels.world](https://prepare4w.michels.world) *(adjust to the actual subdomain once set up)*

## Features

### Favicons
- Upload or drag & drop a single image (any browser-supported format: PNG, WEBP, JPG, GIF, ...)
- A square crop selection sits on top of the full image — drag it to move, drag any corner handle to resize. The selection always stays square
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

## How it works

The crop tool displays the full image and overlays a square selection box positioned in on-screen pixels. When you hit "Generate favicons", the on-screen crop rectangle is converted back into the original image's pixel coordinates (using the ratio between displayed size and natural size), then drawn onto a `<canvas>` at each required output size via `drawImage()` — which is what handles both downscaling and, if needed, upscaling.

Each PNG is produced with `canvas.toBlob('image/png')`. For `favicon.ico`, the raw bytes of the 16/32/48px PNGs are packed into a standard `ICONDIR`/`ICONDIRENTRY` structure (the modern PNG-in-ICO format supported since Windows Vista) — no server round-trip needed. The ZIP file is assembled by hand (local file headers, a central directory, and the end-of-central-directory record, all using the uncompressed "store" method), keeping the app dependency-free.

## Files

- `index.html` — markup for the home screen and the favicon tool
- `style.css` — all styling
- `app.js` — theme/menu/fullscreen behavior, the crop tool, icon/manifest generation, and the ZIP writer
- Push all three to the repo root; `index.html` links to the other two with relative paths

## Favicon

`index.html` already references these files at the repo root for Prepare 4 3W's *own* favicon (add them yourself — they aren't included, and yes, this is a little on-the-nose for a favicon-generator app):

- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180×180, used for "Add to Home Screen" on iOS)
- `logo.png` (used in the header)

If any file is missing, browsers just silently skip it — nothing breaks, you'll just see a generic icon until they're added.

## Browser support

Works in all modern browsers (Chrome, Safari, Firefox, Edge). Uses the Pointer Events API for the crop tool's drag/resize handles (mouse, touch, and pen all work) and `canvas.toBlob()` for image export, both widely supported.

## Changelog

### 0.1.0 — 2026-09-08 — Initial release
- Home screen with a tool grid; Favicons is live, Baukasten shown as a "coming soon" placeholder
- Favicon tool: image upload/drag & drop, square crop selection (movable, resizable via corner handles)
- Selectable output set (favicon.ico, 16×16, 32×32, apple-touch-icon, android-chrome 192/512, site.webmanifest), remembered via `localStorage`
- Warning when the crop selection is below the recommended 512×512px minimum
- Client-side multi-size `favicon.ico` builder (PNG-in-ICO)
- Client-side `site.webmanifest` generation
- Download files individually, all at once, or as a ZIP (via a small hand-written, vendor-free ZIP writer)
