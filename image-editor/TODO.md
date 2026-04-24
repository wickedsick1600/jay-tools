# image-editor — Task Tracker

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## MVP
- [x] Drag/drop + file picker with validation
- [x] Fabric.js canvas with image as background
- [x] Shape tools: rectangle, circle, line
- [x] Text tool with font family, size, bold, italic
- [x] Free-draw brush
- [x] Color picker for fill/stroke
- [x] Select/move/resize/rotate objects
- [x] Delete selected + clear all
- [x] Resize on export (locked aspect ratio toggle)
- [x] Quality slider + format picker (JPEG / WebP / PNG)
- [x] Original + output size stats
- [x] Privacy, terms, README
- [x] Whole-image rotate (left/right) and flip (horizontal/vertical)
- [x] Basic adjustments: brightness, contrast, saturation
- [x] Undo/redo history for canvas actions
- [x] Max export-size guard for large output dimensions

## Before deploy
- [ ] Set up subdomain: imageeditor.devjaybusiness.com → Netlify
- [x] Replace `YOUR_HANDLE` (Ko-fi / PayPal) placeholders
- [ ] Add `og-image.png`
- [ ] Create GitHub repo and push
- [ ] Create Netlify site, connect repo

## Launch polish
- [ ] Submit to Google Search Console
- [ ] Test on mobile (touch shape handles, file picker)
- [ ] Test with large images (10MB+) to confirm browser stability

## Future
- [ ] Crop tool (Fabric doesn't ship one — may need a rect-mask approach)
- [ ] Auto downscale very large source image on load (not just export guard)
