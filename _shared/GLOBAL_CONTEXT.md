# Global Context — Juankit

This is the shared product and engineering context for the Juankit monorepo. Copy it into a standalone tool repository only when that tool is intentionally split from the monorepo.

When starting a new service in the suite, your prompt becomes:
> "I'm building **[service name]** which does **[one-line description]**. Here's the global plan for the whole suite: [paste this file]. Build it following these conventions."

---

## Brand

- **Name:** Juankit
- **Creator:** Dev Jay (contact: devjaybusiness@gmail.com)
- **Tagline:** Pick a utility, finish the job — free browser tools that keep files on your device.
- **Voice:** Plain, non-technical. Imagine explaining to a friend who isn't a developer.
- **Palette:** Black, blue, white, green. No other accent colors.
- **Hub domain:** `juankit.com` (root, apex canonical)
- **Tool subdomains (optional split):** `[tool].juankit.com` (e.g., `foldercreator.juankit.com`, `imageeditor.juankit.com`)

## What the suite is

A collection of free, focused web utilities. Each tool solves one small, repetitive pain point. Zero signup. Zero tracking. Files processed in the browser wherever possible. Revenue comes only from voluntary donations.

The current production model is one monorepo and one Netlify site at `juankit.com`. Each tool lives in its own folder. A tool may later move to a separate repository, deployment, and subdomain when traffic, risk, or operational ownership justifies the split.

## Services in the suite

The live catalog spans PDF, image, code, text, finance, audio, and video utilities. The service table in root `README.md` documents the current tools; root `tools.js` is the runtime source of truth for live and coming-soon status, URLs, search metadata, and categories.

## Hosting & deployment

- **One Netlify site today.** Pushes to `main` deploy the hub and all tool folders to `juankit.com`.
- **Optional split later.** A separately operated tool can use `[tool].juankit.com` through its own Netlify site and DNS record.
- **Static HTML/CSS/JS.** Netlify runs **`npm ci && npm run build`** to inject `_shared/site-footer.html` and the temporary retired-storage migration into every production page; opening `index.html` directly still works for local preview.
- The current suite has no custom serverless functions. The hub feedback form is handled by Netlify Forms.

## Donations

- **Ko-fi** (primary) — 0% fee on tips. Link prominently from every service.
- **PayPal.me** (fallback) — covers users who prefer PayPal or can't use Ko-fi.
- Same donation links appear on every service's footer.

## Feedback

- The hub collects feedback via **Netlify Forms** (built into the hosting platform). Form submissions are emailed to `devjaybusiness@gmail.com`. No third-party form service required.
- The hub form’s **`action`** is **`/index.html?thanks=1`** so Netlify’s post-submit redirect resolves reliably; **`/?thanks=1#…` alone caused 404** on redirect for this suite. Client JS shows the thank-you state and scrolls to the feedback block.
- Individual tools don't have their own feedback forms — they link to the hub's feedback section (`/#feedback`).

## Stack conventions

- **Plain HTML / CSS / JS.** No React, Vue, Svelte, Tailwind, or build tools.
- **CDN libraries only** where they save real time (JSZip, Pica, Cropper.js, Fabric.js, FileSaver.js). Root npm scripts exist only for repository maintenance tasks such as footer synchronization, consistency checks, and dependency-free core tests.
- **Broad browser support:** use flex, grid, and CSS variables. Avoid container queries, `:has()`, and CSS nesting (not all older browsers support them).
- **No ES modules in the browser.** Load scripts with plain `<script>` tags so the page works when opened directly from `file://`.
- **Shared files in this monorepo:** root `style.css` is canonical, `_shared/site-footer.html` is synchronized by `npm run build`, and a few tool folders carry copied or extended CSS for standalone deployment compatibility.

## UI principles

- **Usefulness > aesthetics**, but aesthetics still matter. Clean, modern, restrained.
- **Plain language.** A non-technical user should understand every sentence. No jargon, no "client-side processing" — say "runs in your browser, your files never leave your device."
- **Mobile-first, single-column layouts.** Tap targets at least 44×44px.
- **Palette: black, blue, white, green only.** No other accent colors.
- Every tool should include a small **"How does this work?"** section in plain English.
- Every tool should include a **"Support this tool"** section before the footer, then a related tools placeholder: `<section class="related-tools" data-related-tools></section>`.
- One-level-deep tool pages should load `../tools.js` and `../related-tools.js` before `../bookmark-hint.js`; `related-tools.js` picks 3 random live tools from the central registry and excludes the current tool.
- **Header/footer match the hub:** same nav labels — **All tools** (to `https://juankit.com/` or `/`), **Feedback** (hub `/#feedback`), **Support** (hub `/#support`). The **footer** is generated from `_shared/site-footer.html` (`npm run build`) so Privacy, Terms, All tools, Feedback, Sitemap, and support links stay identical on every page. Shared `style.css` uses **`--chrome-maxw`** for the header/footer inner width (wider bar) and **`--maxw`** for `<main>` (narrower content) so chrome lines up with the hub.
- **Optional bookmark reminder:** the central monorepo includes `bookmark-hint.js` — a dismissible strip above the footer. New pages should load it before `</body>` (`bookmark-hint.js` from site root, or `../bookmark-hint.js` one folder deep). After dismiss, `localStorage` key `juankit_bookmark_hint_v1` hides it.

## What services DO NOT do

- **No user accounts, no login, no OAuth.** Zero signup friction.
- **No analytics, no trackers, no fingerprinting.** Netlify's built-in request logs are enough.
- **No passive email collection, no newsletter popups, no marketing lists.** The feedback form accepts an optional reply address only when a user chooses to provide one.
- **No cookie banners** unless legally required.
- **No uploads of user files to Juankit servers.** Current file-processing tools work in the browser. Embedded services and public-data APIs may still receive normal web request information and must be disclosed; input content or amounts should remain local unless the tool explicitly says otherwise.
- **No premium tiers, no paywalls.** Everything is free. Donations only.

## Security rules

- The current production tools do not require application secrets.
- Never commit credentials or expose them in browser JavaScript. If a future integration needs a secret, store it in the hosting environment and access it only from server-side code.
- Validate user input at trust boundaries, use `textContent` for user-controlled output, keep the CSP narrow, and pin third-party scripts with integrity metadata.
- Any future paid or quota-limited backend must have distributed rate limits, a global cost cap, abuse controls, and documented data retention before launch.

## Legal

The root `privacy.html` and `terms.html` apply site-wide and are linked from every synchronized footer. Add a tool-specific notice when a tool handles data or relies on a third party in a materially different way.

## Adding a new service

1. Create a folder for the tool in this monorepo.
2. Write `index.html` with the shared header/footer conventions and only the CSS/JavaScript files the tool needs.
3. Load `../tools.js`, `../related-tools.js`, and `../bookmark-hint.js` before `</body>`.
4. Add the tool to root `tools.js`, root `sitemap.xml`, the service table in `README.md`, and the checklist in `TODO.md`.
5. Add a tool-specific privacy notice or deployment config only when the tool's behavior requires it.
6. Run `npm run build`, then `npm run verify`, and test the tool on mobile and supported browsers.
7. If the tool is later split out, copy the relevant shared context and configure its standalone repository, Netlify site, canonical URL, and DNS record.
