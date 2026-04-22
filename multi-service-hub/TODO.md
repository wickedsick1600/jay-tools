# multi-service-hub — Task Tracker

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Architecture note
This is the "everything in one place" working directory. All three tool services live here as subdirectories (`folder-tool/`, `image-editor/`, `prompt-enhancer/`). Each will eventually be peeled off into its own repo and deployed to its own subdomain of `devjaybusiness.com`.

Subdomain plan:
- Hub → `devjaybusiness.com`
- Folder Creator → `foldercreator.devjaybusiness.com`
- Image Editor → `imageeditor.devjaybusiness.com`
- Prompt Enhancer → `promptenhancer.devjaybusiness.com`

When you peel a tool into its own repo:
1. Copy the subdirectory to a new repo.
2. Paste `GLOBAL_CONTEXT.md` + `CLAUDE.md` from `_shared/` into the new repo.
3. Update that tool's entry in [tools.js](tools.js) — change `url` from relative (`./tool-name/`) to the full subdomain URL.
4. Create a new Netlify site pointing at the repo.
5. Add a DNS CNAME record for the subdomain pointing at the Netlify site, then verify in Netlify domain settings.

## MVP
- [x] Homepage with category tabs (All / Image / Audio / Video / AI / Dev Tools / Text)
- [x] Live search that filters across title, description, tags, and category
- [x] Data-driven tool list ([tools.js](tools.js) is the single source of truth)
- [x] "Coming soon" state for tools not yet built
- [x] Per-tool metadata: title, description, longDescription, category, tags
- [x] Modern CSS palette (black, blue, white, green only)
- [x] Mobile-responsive layout
- [x] DevJay Tools branding throughout
- [x] Feedback form via Netlify Forms → devjaybusiness@gmail.com
- [x] Plain-language privacy, terms, README

## Before deploy
- [ ] Register `devjaybusiness.com` (or confirm it's ready to point at Netlify)
- [ ] Replace `YOUR_HANDLE` placeholders (Ko-fi + PayPal) in index.html, privacy.html, terms.html
- [ ] Add `og-image.png` (1200×630) with DevJay branding
- [ ] Create GitHub repo and push
- [ ] Create Netlify site, connect repo, point root domain at it
- [ ] In Netlify dashboard: enable **Forms** (detects the `data-netlify` attribute on deploy)
- [ ] In Netlify Forms: add a notification → email → `devjaybusiness@gmail.com`
- [ ] Submit a test feedback message and confirm it arrives in Gmail

## Peel tools into independent repos + subdomains
- [ ] image-editor → own repo + `imageeditor.devjaybusiness.com`
- [ ] folder-tool → own repo + `foldercreator.devjaybusiness.com`
- [ ] prompt-enhancer → own repo + `promptenhancer.devjaybusiness.com` (plus `GEMINI_API_KEY` env var)
- [ ] After each move: update that tool's `url` in [tools.js](tools.js) to the full subdomain URL

## Launch polish
- [ ] Final copy edit of homepage
- [ ] Submit every site to Google Search Console
- [ ] Test search on mobile
- [ ] Test with many tools in registry (20+) to confirm layout holds up
- [ ] Confirm all pages render correctly on Safari, Firefox, Chrome, Edge

## Post-launch (suite-wide tracker)
Treat this as the master status board for all services.

### Folder Creator
- [x] MVP implementation
- [x] DevJay rebrand + plain-language legal pages
- [ ] Deployed independently to Netlify
- [ ] Subdomain live

### Image Editor
- [x] MVP implementation (Fabric.js: shapes, text, free draw, colors, fonts)
- [x] DevJay rebrand + plain-language legal pages
- [ ] Deployed independently to Netlify
- [ ] Subdomain live

### Stopwatch with Splits
- [x] MVP implementation
- [ ] Deployed with the hub

### Pseudo Word Generator
- [x] MVP implementation
- [ ] Deployed with the hub

### JSON Formatter
- [x] MVP implementation
- [ ] Deployed with the hub

### Regex Tester
- [x] MVP implementation
- [ ] Deployed with the hub

### Web Dev Unit Converter
- [x] MVP implementation
- [ ] Deployed with the hub

### Bulk Image Resizer
- [x] MVP implementation
- [ ] Deployed with the hub

### Prompt Enhancer
- [x] MVP implementation
- [x] DevJay rebrand + plain-language legal pages
- [ ] Get a Google AI Studio API key (free tier) from your Gmail account
- [ ] Add `GEMINI_API_KEY` to the prompt-enhancer Netlify site env vars
- [ ] Deployed independently to Netlify
- [ ] Subdomain live
- [ ] Rate limiting tested (10 requests / IP / hour by default)
- [ ] Verify key is NOT in client source (Ctrl+F page source for `GEMINI` / key prefix)

### Cross-cutting
- [ ] Ko-fi account live and test donation received
- [ ] PayPal.me test donation received
- [ ] Ko-fi → PayPal → GCash/bank payout path tested end-to-end
- [ ] Privacy + Terms reviewed on every tool
- [ ] Posted to r/webdev / r/InternetIsBeautiful / Show HN

## Future tool ideas (triage)

### Build next (pure JS, no heavy deps, clear spec)
- [x] **Stopwatch with Splits** — HH:MM:SS, split list with per-split descriptions, copy buttons. No lib.
- [x] **Bulk Image Resizer** — drop many images, pick a preset (2:1 @ 2000×1000 JPEG etc.) or custom, download as .zip. Canvas + JSZip.
- [x] **Pseudo Word Generator** — length range + style (Latin-ish / Fantasy / Tech-brand). Pure JS.
- [x] **JSON Formatter** — format / minify / validate, error line reporting. Pure JS.
- [x] **Regex Tester** — live highlight, capture groups. Pure JS.
- [x] **Web Dev Unit Converter** — px↔rem, hex↔rgba, epoch↔ISO. Pure JS.

Note: these six currently link to the hub's privacy/terms (`https://devjaybusiness.com/privacy.html`). When any of them gets peeled onto its own subdomain, add a local `privacy.html` + `terms.html` to that tool's new repo and update the footer links.

### Build later (real library commitment or AI integration)
- [ ] **Image to Text (OCR)** — Tesseract.js (~2MB WASM). Worth it but warn users on cost/perf.
- [ ] **Exam / Reviewer Generator** — Gemini-backed, reuse prompt-enhancer serverless pattern. Design prompt carefully (structured JSON output with questions + answers).
- [ ] **Diff Checker** — needs a diff algo; jsdiff is ~15KB, acceptable.
- [ ] **AI Token Counter** — port of tiktoken to JS is available.
- [ ] **SVG Optimizer** — SVGO has a browser build.
- [ ] **PDF Merger** — pdf-lib. Easy, real demand.
- [ ] **YouTube Replay / Looper** — embed player + loop logic, client-side only, no download features (ToS).
- [ ] **Audio Trimmer** — Web Audio API.
- [ ] **QR Generator** — qrcode.js.
- [ ] **Password Generator** — `crypto.getRandomValues`.

### Skipped / declined
- **YouTube audio download of a portion** — violates YouTube ToS, and browsers can't cleanly grab YT streams without a server proxy. Risk of takedown/API revocation.
- **"Add to bookmarks" header button** — modern browsers removed the programmatic bookmark API. A button that just says "Press Ctrl+D" is clutter for no real function.

## From Gemini's research — worth acting on (non-tool)
- [ ] **"Did this help you?" donate prompt** — show a small polite nudge only after a successful task completion (download / copy), not on page load. Higher conversion, zero friction.
- [ ] **Per-tool bottom-of-page "Why this tool is private" blurb** — reinforces the trust signal on every subdomain.
- [ ] **Submit each site to Bing Webmaster + Yandex**, not just Google.
- [ ] **Long-tail SEO**: target phrases like "resize images to 2000x1000 no upload", "merge PDF without uploading", "regex tester no login". Use these as the `<title>` and `<h1>` of each tool.
- [ ] **Content Security Policy header** in each Netlify `_headers` file once we're off local previews.
