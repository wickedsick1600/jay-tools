# Deployment Guide

Step-by-step for getting DevJay Tools live on Netlify. Written assuming you already have Netlify, Ko-fi, and PayPal accounts.

---

## Path A — Ship everything as one Netlify site (recommended first)

This is the fastest way to launch. All tools live at one root site (`jaytools.netlify.app` now, later `devjaybusiness.com/<tool>/`). You can peel individual tools out to subdomains later without breaking anything (Path B below).

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
git commit -m "Initial commit — DevJay Tools suite"
# Create a new GitHub repo (e.g. devjay/tools) via gh or the web UI
git remote add origin https://github.com/YOUR_GH_USER/tools.git
git push -u origin main
```

### 3. Create the Netlify site

1. In Netlify dashboard → **Add new site** → **Import an existing project** → pick your GitHub repo.
2. Build settings: **Build command** blank, **Publish directory** blank (root). Click **Deploy**.
3. Wait ~20 seconds. You'll get a `random-name.netlify.app` URL. Click it — the hub should load.

### 4. Point your domain at Netlify

In Netlify → **Domain management** → **Add custom domain** → enter `devjaybusiness.com`.

Netlify will ask you to either:
- **Option 1 (easiest):** transfer DNS to Netlify — follow the instructions on screen.
- **Option 2:** keep your current DNS, add an `A` record pointing to `75.2.60.5` and a `CNAME` for `www` pointing to the Netlify URL.

Netlify auto-provisions a free SSL cert (Let's Encrypt) within ~1 minute of DNS resolving.

### 5. Enable the feedback form

1. Deploy must have already happened (Netlify's build agent detects the `data-netlify="true"` attribute on the feedback form in `index.html`).
2. Go to **Forms** in your site dashboard. You should see `feedback` listed.
3. Click **Forms** → **Form notifications** → **Add notification** → **Email notification**.
4. Set recipient: `devjaybusiness@gmail.com`. Save.
5. Go back to the live site, submit a test message. Within ~30 seconds you should get it in Gmail.

### 6. Add `GEMINI_API_KEY` for the Prompt Enhancer

1. In [Google AI Studio](https://aistudio.google.com/apikey), sign in with your Gmail, create an API key. Copy it.
2. Netlify dashboard → your site → **Site configuration** → **Environment variables** → **Add a variable**.
3. Key: `GEMINI_API_KEY`. Value: your key. Scope: **All contexts** (production + deploy previews). Save.
4. Trigger a redeploy: **Deploys** → **Trigger deploy** → **Deploy site**. The serverless function at `prompt-enhancer/netlify/functions/enhance.js` now has access to the key.
5. Visit `/prompt-enhancer/`, type a rough prompt, click Enhance. Should work.
6. View page source (Ctrl+U) and Ctrl+F for `GEMINI` and the first few characters of your key. **Neither should appear.** If either does, stop and investigate before publicizing the URL.

### 7. Final checks before telling anyone

- [ ] Every tool loads on mobile and desktop
- [ ] Feedback form test message arrived in Gmail
- [ ] Ko-fi donate button goes to the right page
- [ ] PayPal donate button goes to the right page
- [ ] View source on prompt-enhancer: no API key visible
- [ ] Verify new tools: Password Generator, QR Generator, Diff Checker, PDF Merger, SVG Optimizer, Audio Trimmer

### 8. Submit to search engines

- Google: [Google Search Console](https://search.google.com/search-console) → add `devjaybusiness.com` → verify via DNS TXT record → submit sitemap (Netlify auto-generates one at `/sitemap.xml` if you publish one; for now just let Google crawl).
- Bing: [Bing Webmaster Tools](https://www.bing.com/webmasters) → import from Google Search Console (one click).

---

## Path B — Peel a tool onto its own subdomain (do this only when a specific tool earns it)

Pick this for a tool once it's getting real traffic or you want to isolate the blast radius.

Target layout:
- Hub → `devjaybusiness.com`
- Image Editor → `imageeditor.devjaybusiness.com`
- Folder Creator → `foldercreator.devjaybusiness.com`
- Prompt Enhancer → `promptenhancer.devjaybusiness.com`
- …etc.

### Steps

1. Create a new repo containing **just** that tool's directory contents. Copy `_shared/GLOBAL_CONTEXT.md` + `_shared/CLAUDE.md` in alongside.
2. Add your own `privacy.html` + `terms.html` to the new repo (the tool currently links to `devjaybusiness.com/privacy.html` — once it's a separate site, it needs its own copy).
3. Push to GitHub. Create a new Netlify site from the repo. Deploy.
4. Netlify → new site → **Domain management** → **Add custom domain** → `imageeditor.devjaybusiness.com` (or whichever). Netlify will show a CNAME record to add.
5. In your DNS provider (wherever `devjaybusiness.com` is managed): add a CNAME record:
   - Name: `imageeditor`
   - Value: `<your-netlify-site>.netlify.app`
6. Wait a minute for DNS to propagate. SSL provisions automatically.
7. In the **hub** repo, edit `tools.js` — change that tool's `url` from the relative path (`./image-editor/`) to the full URL (`https://imageeditor.devjaybusiness.com/`). Commit + push. Hub redeploys automatically.
8. (Optional) Delete the tool's directory from this repo so the old path 404s. Or leave it in place as a fallback — it'll keep working.

### If the tool has serverless functions (currently just Prompt Enhancer)

Add `GEMINI_API_KEY` as an environment variable on the **new** Netlify site too (each Netlify site has its own env vars).

---

## Payouts — Ko-fi → PayPal → GCash / local bank (PH)

1. Ko-fi: dashboard → **Withdraw** → send to PayPal. Ko-fi takes 0% on tips; you'll see your full balance minus currency conversion by PayPal.
2. PayPal: log in → Wallet → **Transfer money** → link your GCash or local PH bank. GCash linkage uses your mobile number; bank needs account number + SWIFT (BDO: `BNORPHMM`, BPI: `BOPIPHMM`).
3. First withdrawal usually clears in 3–5 business days. After that it's 1–2.
4. Alternative if PayPal gets sticky: Wise or Payoneer both work from Ko-fi and often have lower fees for larger amounts. Not needed for MVP.

Run a test donation with a second account (or friend) of $1–2 to confirm the whole path works end-to-end before publicizing the site.

---

## Troubleshooting

**"The feedback form submits but I don't get email."**
- Netlify Forms only detects forms on the **deployed** version, not local previews. Deploy first, then check.
- Check spam folder.
- Confirm the notification email is `devjaybusiness@gmail.com` in Netlify Forms settings.

**"Prompt Enhancer returns 500 error."**
- 90% of the time this means `GEMINI_API_KEY` isn't set on the Netlify site, or it's set but you haven't redeployed after adding it. Trigger a redeploy.
- Check function logs: Netlify → **Functions** → `enhance` → **Function log**.

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
