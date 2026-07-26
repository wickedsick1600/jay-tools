# Deployment Guide

Step-by-step for getting Juankit live on Netlify. Written assuming you already have Netlify, Ko-fi, and PayPal accounts.

---

## Path A — Ship everything as one Netlify site (recommended first)

This is the fastest way to launch. All tools ship from one Netlify site with **apex domain** `https://juankit.com/` (you still get a `*.netlify.app` URL until DNS is wired). You can peel individual tools onto subdomains later without breaking Path A URLs (see Path B below).

### 1. Confirm production links

Production links currently used:

| Service | Link |
|---|---|
| Ko-fi | `https://ko-fi.com/devjaybusiness` |
| PayPal | `https://paypal.me/devjaybusiness` |

Quick check: `rg "YOUR_HANDLE" .` should return zero results.

### 2. Push this repo to GitHub

```bash
cd multi-service
git init
git add .
git commit -m "Initial commit — Juankit suite"
# Create a new GitHub repo (e.g. devjay/tools) via gh or the web UI
git remote add origin https://github.com/YOUR_GH_USER/tools.git
git push -u origin main
```

### 3. Create the Netlify site

1. In Netlify dashboard → **Add new site** → **Import an existing project** → pick your GitHub repo.
2. Build settings: **Build command** `npm ci && npm run build` (from [netlify.toml](netlify.toml)), **Publish directory** blank (root). Netlify uses Node to sync the shared footer and the temporary retired-storage migration into every production HTML file before publish. Click **Deploy**.
3. Wait ~20 seconds. You'll get a `random-name.netlify.app` URL. Click it — the hub should load.

### 4. Point your domain at Netlify

In Netlify → **Domain management** → **Add custom domain** → enter `juankit.com`.

Netlify will ask you to either:
- **Option 1 (easiest):** transfer DNS to Netlify — follow the instructions on screen.
- **Option 2:** keep your current DNS — use the **exact** `A` / `CNAME` values Netlify shows for `juankit.com` and `www.juankit.com` (they change occasionally; copying from the dashboard avoids stale IPs).

Set **`juankit.com`** as the **primary domain** so canonical URLs match [sitemap.xml](sitemap.xml) and structured data (`https://juankit.com/...`). The repo includes **301 redirects** in [netlify.toml](netlify.toml) from `www.juankit.com` to the apex.

**Optional (SEO):** In **Domain management**, also add your old `*.netlify.app` host as a domain alias, then add a Netlify **redirect rule** so `https://YOUR-OLD-SITE.netlify.app/*` → `https://juankit.com/:splat` (301). That consolidates backlinks from earlier deployments.

**Social preview:** Keep `og-image.png` at the **publish root** so `https://juankit.com/og-image.png` resolves. The hub references it in `og:image`, `twitter:image`, favicon, and Organization `logo` in JSON-LD.

Netlify auto-provisions a free SSL cert (Let's Encrypt) within ~1 minute of DNS resolving.

### 5. Enable the feedback form

1. Deploy must have already happened (Netlify's build agent detects the `data-netlify="true"` attribute on the feedback form in `index.html`).
2. Go to **Forms** in your site dashboard. You should see `feedback` listed.
3. Click **Forms** → **Form notifications** → **Add notification** → **Email notification**.
4. Set recipient: `devjaybusiness@gmail.com`. Save.
5. Go back to the live site, submit a test message. Within ~30 seconds you should get it in Gmail.
6. After submit, the browser should land on **`/index.html?thanks=1`** (Netlify follows the form `action`). You should see the green “Thanks…” line on the feedback card and be scrolled to that section. If you ever change the form `action`, use this pattern — **`/?thanks=1#…` alone caused HTTP 404 redirects** on Netlify for this project.

### 6. Final checks before telling anyone

- [ ] Every tool loads on mobile and desktop
- [ ] Feedback form test message arrived in Gmail
- [ ] Ko-fi support button goes to the right page
- [ ] PayPal support button goes to the right page
- [ ] Verify new tools: Password Generator, QR Generator, Diff Checker, PDF Merger, SVG Optimizer, Audio Trimmer
- [ ] Verify Image Converter output/downloads, Word Counter live counts, and Currency Converter fresh + cached-rate states
- [ ] Run `npm run verify` (footer, source, registry/sitemap, and core tests)
- [ ] Confirm the retired page and its former Function endpoints return `404` after this cleanup release
- [ ] Remove the retired tool's Netlify environment variables, revoke its provider credential, and delete dedicated storage/human-verification resources
- [ ] If storage was shared, purge the retired tool's `feedback:*` records and backups without deleting unrelated data; review old provider/Function logs under their retention controls
- [ ] Visit a production page on `https://juankit.com` and confirm the retired browser keys are gone. Repeat on any previously used `www`, `*.netlify.app`, or tool-subdomain origin because browser storage cannot be cleared cross-origin

### 7. Submit to search engines

- Google: [Google Search Console](https://search.google.com/search-console) → add property `juankit.com` → verify via DNS TXT record → submit `https://juankit.com/sitemap.xml`.
- Bing: [Bing Webmaster Tools](https://www.bing.com/webmasters) → import from Google Search Console (one click).

---

## Path B — Peel a tool onto its own subdomain (do this only when a specific tool earns it)

Pick this for a tool once it's getting real traffic or you want to isolate the blast radius.

Target layout (example — only if you split tools later):
- Hub → `juankit.com`
- Image Editor → `imageeditor.juankit.com`
- Folder Creator → `foldercreator.juankit.com`
- …etc.

### Steps

1. Create a new repo containing **just** that tool's directory contents. Copy `_shared/GLOBAL_CONTEXT.md` and the root `CLAUDE.md` in alongside.
2. Add your own `privacy.html` + `terms.html` to the new repo (the tool currently links to `juankit.com/privacy.html` — once it's a separate site, it needs its own copy).
3. Push to GitHub. Create a new Netlify site from the repo. Deploy.
4. Netlify → new site → **Domain management** → **Add custom domain** → `imageeditor.juankit.com` (or whichever). Netlify will show a CNAME record to add.
5. In your DNS provider (wherever `juankit.com` is managed): add a CNAME record:
   - Name: `imageeditor`
   - Value: `<your-netlify-site>.netlify.app`
6. Wait a minute for DNS to propagate. SSL provisions automatically.
7. In the **hub** repo, edit `tools.js` — change that tool's `url` from the relative path (`./image-editor/`) to the full URL (`https://imageeditor.juankit.com/`). Commit + push. Hub redeploys automatically.
8. (Optional) Delete the tool's directory from this repo so the old path 404s. Or leave it in place as a fallback — it'll keep working.

If a future tool has server-side code or host configuration, document and migrate that configuration separately. The current suite does not deploy custom Netlify Functions.

---

## Payouts — Ko-fi → PayPal → GCash / local bank (PH)

1. Ko-fi: dashboard → **Withdraw** → send to PayPal. Ko-fi takes 0% on tips; you'll see your full balance minus currency conversion by PayPal.
2. PayPal: log in → Wallet → **Transfer money** → link your GCash or local PH bank. GCash linkage uses your mobile number; bank needs account number + SWIFT (BDO: `BNORPHMM`, BPI: `BOPIPHMM`).
3. First withdrawal usually clears in 3–5 business days. After that it's 1–2.
4. Alternative if PayPal gets sticky: Wise or Payoneer both work from Ko-fi and often have lower fees for larger amounts. Not needed for MVP.

Run a test donation with a second account (or friend) of $1–2 to confirm the whole path works end-to-end before publicizing the site.

---

## Troubleshooting

**"After submitting feedback I get HTTP 404."**
- Confirm the hub form’s `action` in `index.html` is **`/index.html?thanks=1`** (not only `/?thanks=1#feedback`). Netlify’s post-submit redirect must resolve to a real deployed asset; the fragment-only pattern broke redirects here.

**"The feedback form submits but I don't get email."**
- Netlify Forms only detects forms on the **deployed** version, not local previews. Deploy first, then check.
- Check spam folder.
- Confirm the notification email is `devjaybusiness@gmail.com` in Netlify Forms settings.

**"Images on Bulk Image Resizer process but the .zip is empty."**
- Check browser console for errors. Usually means the browser ran out of memory on very large inputs. Cap input image size in the UI if this keeps happening.

**"Page loads but the tool cards are empty."**
- Usually means `tools.js` failed to load. Open DevTools → Network. Look for 404 or MIME errors.

---

## Marketing nudge list (do these in the first week, not all at once)

- [ ] Post on r/webdev: "I built X free tools, all browser-only, no upload" — link to hub.
- [ ] Post on r/InternetIsBeautiful.
- [ ] Show HN post.
- [ ] Product Hunt launch (pick a Tuesday).
- [ ] Submit each tool to AlternativeTo with the main competitor tagged.
- [ ] Tweet a quick demo GIF for each tool (QuickTime → GIF converter or native macOS Cmd+Shift+5).
- [ ] Long-tail SEO: make sure each tool's `<title>` and `<h1>` match a real search phrase (e.g. "regex tester no login", "resize images to 2000x1000 no upload").
