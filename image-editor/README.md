# image-editor

Browser-based image editor: add shapes/text/drawings, rotate/flip, tune image adjustments, undo/redo edits, then resize/compress and download. Files never leave the user's device.

## Local preview

Open `index.html` in a browser. Fabric.js loads from CDN.

## Deploy

Push to `main` → Netlify auto-deploys. Static site, no serverless functions.

## Libraries

- [Fabric.js](https://github.com/fabricjs/fabric.js) — canvas with shapes, text, and free draw

## Before going live

- [x] Replace `YOUR_HANDLE` (Ko-fi / PayPal) placeholders.
- [ ] Point `imageeditor.devjaybusiness.com` at the Netlify site.
- [ ] Add `og-image.png`.
- [x] Add max export-size guard to reduce browser OOM failures.
