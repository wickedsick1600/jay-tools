# multi-service-hub

Landing page for the DevJay Tools suite. This file is the single source of truth for what the suite is, why it exists, how services fit together, and how this hub is run.

## Brand

- Name: DevJay Tools
- Creator: Dev Jay (`devjaybusiness@gmail.com`)
- Tagline: Free, simple tools that respect your time and your files.
- Voice: Plain, non-technical.
- Palette: black, blue, white, green only.
- Hub domain: `devjaybusiness.com`
- Tool subdomains: `[tool].devjaybusiness.com` (for example `foldercreator.devjaybusiness.com`)

## What this suite is

DevJay Tools is a set of free, focused web utilities. Each tool solves one repetitive task with minimal friction:

- no signup
- no tracking
- browser-first processing where possible
- revenue from optional donations only

The suite is intentionally split into separate repos and deployments. Each tool is isolated so failures, policy issues, or downtime in one service do not break the others.

## Services in the suite

| Service | What it does | Repo | Subdomain |
|---|---|---|---|
| Hub | Landing page with tool listing, search/categories, donation links, and feedback form. | `multi-service-hub` | `devjaybusiness.com` |
| Folder Creator | Builds folder layouts as downloadable `.zip` files and exports ASCII trees. | `folder-tool` | `foldercreator.devjaybusiness.com` |
| Image Editor | Crop/resize/compress, annotate images, and keep processing in-browser. | `image-editor` | `images.devjaybusiness.com` |
| Prompt Enhancer | Turns rough prompts into polished prompts for common AI tools. | `prompt-enhancer` | `prompts.devjaybusiness.com` |

More services can be added using the same conventions.

## Hosting and deployment model

- One GitHub repo per service.
- Netlify free tier per service.
- Push to `main` triggers auto-deploy.
- One subdomain per service via CNAME/custom domain.
- Static HTML/CSS/JS by default; no build step.
- Server logic only via Netlify functions in `netlify/functions/*.js`.

## Stack conventions

- Plain HTML, CSS, and JavaScript.
- CDN libraries only when they clearly save time.
- Keep browser compatibility broad.
- Avoid browser-only modern features with weak support.
- No ES modules in browser code; use plain `<script>` tags for `file://` compatibility.
- Shared baseline files are copied across repos when updated.

## UX and content principles

- Usefulness first; clean and restrained UI.
- Plain language for non-technical users.
- Mobile-first, single-column-friendly layouts.
- Tap targets should be at least 44x44.
- Include a short "How does this work?" section in each tool.

## What services should not do

- No accounts, login, or OAuth.
- No analytics, trackers, or fingerprinting.
- No newsletter/email capture patterns by default.
- No cookie banner unless legally required.
- No paid tiers or feature paywalls.
- No server upload of user files unless the feature absolutely requires it.

## Security rules

- Secrets/API keys live only in Netlify environment variables.
- Secrets are accessed only from serverless functions.
- Never place secrets in client JavaScript.
- Rate-limit functions that call paid/quota-limited APIs.

## Donations and feedback

- Primary donation link: Ko-fi.
- Fallback donation link: PayPal.me.
- Show donation links consistently in service footers.
- Feedback is collected on the hub via Netlify Forms and sent to `devjaybusiness@gmail.com`.
- Individual tools should link users back to the hub feedback page.

## Legal baseline

Every service includes:

- `privacy.html` in plain language
- `terms.html` with as-is use terms and change/discontinuation rights

Both pages must be linked from each service footer.

## Hub local preview

Open `index.html` directly in a browser. No build step required.

## Hub deployment

Push to `main` to auto-deploy on Netlify.

## Hub pre-launch checklist

- [ ] Replace `YOUR_HANDLE` placeholders in `index.html`, `header.html`, `footer.html`, `privacy.html`, `terms.html` with Ko-fi/PayPal usernames.
- [ ] Replace `your-*-site.netlify.app` placeholders with real Netlify URLs or production domains.
- [ ] Add an OG image (`og-image.png`, 1200x630) referenced in `<meta property="og:image">`.

## Adding a new service

1. Create a new GitHub repo.
2. Copy in shared baseline files (including this README context conventions).
3. Build `index.html` with shared layout conventions.
4. Add `privacy.html`, `terms.html`, `README.md`, `TODO.md`, and `netlify.toml`.
5. Register the new service in the hub `tools.js` list for discovery.
6. Deploy to Netlify and attach `[tool].devjaybusiness.com`.
7. Update the services table in this README.
