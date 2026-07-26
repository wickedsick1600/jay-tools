# multi-service

Monorepo for the Juankit suite. This is the central documentation for project purpose, architecture, services, deployment model, standards, and maintenance workflow.

## Project overview

Juankit is a suite of free, focused web utilities built for speed and privacy.

- No signup
- No tracking
- Browser-first processing where possible
- Revenue from optional donations only

## Brand and product identity

- Name: Juankit
- Creator: Dev Jay (`devjaybusiness@gmail.com`)
- Tagline: Pick a utility, finish the job — free browser tools that keep files on your device.
- Voice: Plain, non-technical
- Palette: black, blue, white, green
- Canonical site URL: `https://juankit.com/` (apex; `og-image.png` at repo root for social previews + favicon)

## Repository structure

This repository currently hosts the hub and multiple tool folders in one place.

- Hub root: `/` (`index.html`, `main.js`, `tools.js`)
- Shared guidance: `_shared/`
- Tool directories: each service under its own folder (for example `image-editor/`)
- Optional future state: each tool can be split into an independent repo and subdomain

## Services in this monorepo

| Service | Purpose | Path | Runtime |
|---|---|---|---|
| Hub | Searchable homepage and service registry | `/` | Static |
| Folder Creator | Folder tree builder + paste import + ZIP/ASCII output | `folder-tool/` | Static |
| Image Editor | Browser image editing with full-resolution paste, drawing, transforms, and export | `image-editor/` | Static |
| Image Converter | Batch conversion/compression to WebP, JPEG, or PNG with real size comparison | `image-converter/` | Static |
| Stopwatch with Splits | Stopwatch with split notes and copyable timecodes | `stopwatch/` | Static |
| Pseudo Word Generator | Generate pronounceable fake words | `pseudo-word/` | Static |
| JSON Formatter | Token-preserving format/minify/validation with foldable results | `json-formatter/` | Static |
| Regex Tester | Live regex matching and capture groups | `regex-tester/` | Static |
| Web Dev Unit Converter | px/rem, hex/rgba, epoch/ISO conversions | `unit-converter/` | Static |
| Currency Converter | Convert one amount to multiple currencies using daily reference rates | `currency-converter/` | Static + public rates API |
| Bulk Image Resizer | Batch image resize/crop workflows | `bulk-image-resizer/` | Static |
| Password Generator | Secure in-browser random password generation | `password-generator/` | Static |
| QR Generator | Create and download QR code PNG | `qr-generator/` | Static |
| Fake User Generator | Create country-matched checkout test profiles | `fake-user-generator/` | Static |
| Diff Checker | Compare two text blocks and show differences | `diff-checker/` | Static |
| PDF Editor | Annotate/sign PDF and export | `pdf-editor/` | Static |
| PDF to Images | Convert PDF pages to PNG/JPG/WebP images | `pdf-to-images/` | Static |
| PDF Merger | Merge multiple PDFs in-browser | `pdf-merger/` | Static |
| SVG Optimizer | Basic SVG cleanup/minification | `svg-optimizer/` | Static |
| Audio Trimmer | Trim audio in-browser and export WAV | `audio-trimmer/` | Static |
| YouTube Looper | Replay and loop YouTube videos | `youtube-looper/` | Static |
| Word Counter | Live word, character, sentence, paragraph, line, and time estimates | `word-counter/` | Static |

## Tech stack and conventions

- Plain HTML, CSS, and JavaScript
- **Site footer:** canonical markup lives in [`_shared/site-footer.html`](_shared/site-footer.html). `npm run build` runs [`scripts/sync-footer.mjs`](scripts/sync-footer.mjs) and replaces every `<footer class="site-footer">…</footer>` across the repo (Netlify runs this on deploy). Edit the fragment, then run `npm run build` and commit the updated HTML files. `npm run footer:check` detects drift locally and can also be used in CI.
- No bundler for app JavaScript; no transpilation of tool pages
- CDN libraries only when they provide clear value
- No browser ES modules in tool pages; keep `file://` compatibility
- Prefer broad browser support and simple UI behavior

### Shared layout CSS (`style.css`)

- **Canonical file:** root `style.css`. Several tool folders keep a **byte-identical copy** for deploys that only ship that folder; after changing global rules, update the root file and re-copy to those duplicates (or merge the same edits into extended sheets such as `image-editor/style.css` and `folder-tool/style.css`, which append tool-only rules after the shared block).
- **`--maxw`:** default max width for `<main>` (often `800px`; individual tools may override via `:root` or page `<style>`).
- **`--chrome-maxw`:** max width for `header.site-header .wrap` and `footer.site-footer .wrap` (`1180px`) so the header/footer bar matches the hub even when main content is narrower.

### Bookmark hint script

File: **`bookmark-hint.js`** at the publish root.

- Optional, **dismissible** strip injected **above** `footer.site-footer` with plain bookmark instructions (keyboard shortcuts + browser menu).
- **Persistence:** after **Dismiss**, `localStorage` key `juankit_bookmark_hint_v1` prevents the bar from showing again (private browsing or blocked storage disables the feature harmlessly).
- **Wiring:** from the publish root, `<script src="bookmark-hint.js" defer></script>` before `</body>`; from a one-level-deep tool path, `<script src="../bookmark-hint.js" defer></script>`. Styles live at the end of `style.css` (`.bookmark-hint-bar`, etc.).

### Tool page cross-promotion

- Every tool page must include a **Support this tool** section before the footer.
- Every tool page must include `<section class="related-tools" data-related-tools></section>` below that support section.
- One-level-deep tool pages must load `../tools.js` and `../related-tools.js` before `../bookmark-hint.js`. The related-tools script picks 3 random live tools from the central registry and excludes the current tool.

## Security and privacy model

- Process user files in the browser whenever possible
- The current production tools do not require application secrets or custom serverless functions
- If a future integration needs a secret, keep it in the host environment and access it only from server-side code
- Never expose API keys in client JavaScript or tracked files
- Avoid analytics, trackers, and fingerprinting
- The Currency Converter requests public reference-rate data from Frankfurter without an API key. Amounts and chosen target currencies stay in the browser; only the rate dataset and its cache are external/local state.
- `storage-migration.js` currently runs before other scripts on every production page to remove historical browser data from a retired feature. `scripts/sync-storage-migration.mjs` keeps that tag site-wide; remove both after the release-window follow-up in `TODO.md` is complete.

### Hub feedback form (Netlify Forms)

After a successful submit, users are redirected to **`/index.html?thanks=1`**. The hub’s `main.js` reads `thanks=1`, shows the inline success message, and scrolls to the feedback section. Avoid using only `/?thanks=1#fragment` as the form `action`; that pattern has triggered **404** redirects on Netlify for this site.

## Local development

There is no app bundler or transpilation step.

1. Open `index.html` directly in a browser for a quick local preview. Use a local HTTP server when testing browser security headers or third-party requests.
2. Run `npm test` for the dependency-free core tests.
3. Run `npm run check` for JavaScript syntax, registry, sitemap, canonical URL, duplicate-ID, and local-asset checks.
4. After changing `_shared/site-footer.html` or adding a page, run `npm run build` and commit the synchronized footer and storage-migration tag.
5. Run `npm run verify` before committing. The same command runs in `.github/workflows/ci.yml` for pushes and pull requests.

## Deployment model

Current model is single-repo deployment on Netlify.

- Publish directory: repository root (`.`)
- Auto deploy: push to `main`
- Runtime: static pages, plus the hosted Netlify Forms submission on the hub

Deployment runbook and domain/DNS procedures are documented in `DEPLOY.md`.

## Legal and trust baseline

The site-wide `privacy.html` and `terms.html` at the repository root are linked from every synchronized footer. Add a tool-specific notice only when a tool handles data differently enough to require one.

Donations and feedback baseline:

- Donations: Ko-fi primary, PayPal fallback
- Feedback: hub Netlify Form on `index.html`, notifications to `devjaybusiness@gmail.com` (configure in Netlify **Forms → Form notifications**)

## Adding a new service

1. Create the new service folder (or new repo if splitting immediately).
2. Build with the shared suite conventions.
3. Match **hub chrome:** same `site-header` / `site-footer` structure; nav labels **All tools** (to `/` or `/#tools` on the hub), **Feedback**, **Support**; link root `style.css` (or keep a synced copy) so `--chrome-maxw` header/footer alignment stays consistent.
4. Add a tool-specific privacy notice or `netlify.toml` only if the tool's behavior requires it.
5. Register the service in `tools.js` and add its canonical URL to `sitemap.xml`.
6. Load `../tools.js`, `../related-tools.js`, and **`../bookmark-hint.js`** before `</body>` (see [Bookmark hint script](#bookmark-hint-script)).
7. Add the service entry to this README table and track the work in `TODO.md`.
8. Deploy and verify links, metadata, navigation, mobile layout, and browser behavior.

## Documentation map

- `README.md` - project source of truth (this file)
- `TODO.md` - actionable checklist (backlog, deployment tasks, launch tasks)
- `DEPLOY.md` - operational deployment runbook (DNS, forms success URL, and troubleshooting)
- `bookmark-hint.js` - site-wide dismissible bookmark reminder ([details](#bookmark-hint-script))
