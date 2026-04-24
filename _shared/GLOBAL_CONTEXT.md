# Global Context — DevJay Tools

This file is **copy-pasted unchanged into every service repo in the suite**. It gives any human or AI opening the repo cold the full context of what the suite is, how its pieces fit together, and the conventions every service follows.

When starting a new service in the suite, your prompt becomes:
> "I'm building **[service name]** which does **[one-line description]**. Here's the global plan for the whole suite: [paste this file]. Build it following these conventions."

---

## Brand

- **Name:** DevJay Tools
- **Creator:** Dev Jay (contact: devjaybusiness@gmail.com)
- **Tagline:** Free, simple tools that respect your time and your files.
- **Voice:** Plain, non-technical. Imagine explaining to a friend who isn't a developer.
- **Palette:** Black, blue, white, green. No other accent colors.
- **Hub domain:** `devjaybusiness.com` (root)
- **Tool subdomains:** `[tool].devjaybusiness.com` (e.g., `foldercreator.devjaybusiness.com`, `imageeditor.devjaybusiness.com`)

## What the suite is

A collection of free, focused web utilities. Each tool solves one small, repetitive pain point. Zero signup. Zero tracking. Files processed in the browser wherever possible. Revenue comes only from voluntary donations.

The suite is **deliberately fragmented**: each tool is its own repo, its own Netlify deployment, its own subdomain. This isolates blast radius — if one tool violates a third-party ToS or breaks, the others keep running untouched. They only share a parent domain name; independence is preserved because each subdomain is an independent DNS record pointing at an independent Netlify site.

## Services in the suite

| Service | What it does | Repo | Subdomain |
|---|---|---|---|
| **Hub** | Landing page. Lists all tools, provides search + categories, donation links, feedback form. | `multi-service` | `devjaybusiness.com` |
| **Folder Creator** | Type a folder layout, get it as a downloadable .zip. Also makes clean ASCII trees for READMEs. | `folder-tool` | `foldercreator.devjaybusiness.com` |
| **Image Editor** | Crop, resize, compress, draw shapes, add text. Runs in the browser — your files never leave your device. | `image-editor` | `imageeditor.devjaybusiness.com` |
| **Prompt Enhancer** | Turn a rough prompt into a polished one for ChatGPT, Claude, Midjourney, or Stable Diffusion. | `prompt-enhancer` | `promptenhancer.devjaybusiness.com` |

More services will be added over time using the same conventions.

## Hosting & deployment

- **Netlify free tier** for every service. 100 GB bandwidth/month per site is enough to start.
- **One GitHub repo per service.** Push to `main` → Netlify auto-deploys.
- **Subdomain per service.** Point `[tool].devjaybusiness.com` at the tool's Netlify site via a CNAME record or Netlify's "Custom domain" settings.
- **Static HTML/CSS/JS.** No build step. Open `index.html` locally and it just works (except serverless tools, which need `netlify dev`).
- Tools that need server logic use **Netlify serverless functions** at `netlify/functions/*.js`. Nothing else runs server-side.

## Donations

- **Ko-fi** (primary) — 0% fee on tips. Link prominently from every service.
- **PayPal.me** (fallback) — covers users who prefer PayPal or can't use Ko-fi.
- Same donation links appear on every service's footer.

## Feedback

- The hub collects feedback via **Netlify Forms** (built into the hosting platform). Form submissions are emailed to `devjaybusiness@gmail.com`. No third-party form service required.
- Individual tools don't have their own feedback forms — they link to the hub's feedback page.

## Stack conventions

- **Plain HTML / CSS / JS.** No React, Vue, Svelte, Tailwind, or build tools.
- **CDN libraries only** where they save real time (JSZip, Pica, Cropper.js, Fabric.js, FileSaver.js). No npm install unless the service has a serverless function that needs it.
- **Broad browser support:** use flex, grid, and CSS variables. Avoid container queries, `:has()`, and CSS nesting (not all older browsers support them).
- **No ES modules in the browser.** Load scripts with plain `<script>` tags so the page works when opened directly from `file://`.
- **Shared files are physically copied across repos**, not linked: `style.css`, header/footer snippets, `CLAUDE.md`, and this `GLOBAL_CONTEXT.md` are identical in every repo. When you update one, paste the update into every repo.

## UI principles

- **Usefulness > aesthetics**, but aesthetics still matter. Clean, modern, restrained.
- **Plain language.** A non-technical user should understand every sentence. No jargon, no "client-side processing" — say "runs in your browser, your files never leave your device."
- **Mobile-first, single-column layouts.** Tap targets at least 44×44px.
- **Palette: black, blue, white, green only.** No other accent colors.
- Every tool should include a small **"How does this work?"** section in plain English.

## What services DO NOT do

- **No user accounts, no login, no OAuth.** Zero signup friction.
- **No analytics, no trackers, no fingerprinting.** Netlify's built-in request logs are enough.
- **No email collection, no newsletter popups, no modals.**
- **No cookie banners** unless legally required.
- **No uploads of user files to any server** unless the feature explicitly requires it (only Prompt Enhancer does, because AI inference has to happen server-side).
- **No premium tiers, no paywalls.** Everything is free. Donations only.

## Security rules

- API keys live **only in Netlify environment variables**, accessed **only from serverless functions**. Never in client JS. Never committed to the repo.
- The `netlify/functions/` directory is the only place that touches secrets.
- Rate-limit any serverless function that calls a paid or quota-limited third-party API.

## Legal

Every service has:
- `privacy.html` — plain-language explanation of what happens to user data.
- `terms.html` — "provided as-is", right to modify/discontinue, user responsibility for their own use.
- Both linked from the footer of every page.

## Adding a new service

1. Create a new GitHub repo.
2. Copy into it: `CLAUDE.md`, `GLOBAL_CONTEXT.md`, `style.css`, shared header/footer, privacy + terms templates.
3. Write `index.html` using the shared header/footer/CSS.
4. Add `privacy.html`, `terms.html`, `README.md`, `TODO.md`, `netlify.toml`.
5. Add the service to the hub's `tools.js` registry so it shows up in search and the right category tab.
6. Deploy to Netlify, then add a CNAME for `[tool].devjaybusiness.com`.
7. Update the "Services in the suite" table in this file, then paste the updated version into every repo.
