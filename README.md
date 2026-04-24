# multi-service

Monorepo for the DevJay Tools suite. This file describes what is currently live in this workspace, how deployment works, and how to add new tools.

## Brand

- Name: DevJay Tools
- Creator: Dev Jay (`devjaybusiness@gmail.com`)
- Tagline: Free, simple tools that respect your time and your files.
- Voice: Plain, non-technical.
- Palette: black, blue, white, green only.
- Current live URL: `https://jaytools.netlify.app/`
- Planned custom domain: `devjaybusiness.com`

## What this suite is

DevJay Tools is a set of free, focused web utilities. Each tool solves one repetitive task with minimal friction:

- no signup
- no tracking
- browser-first processing where possible
- revenue from optional donations only

Right now this repo hosts the hub and tool folders together. Tools can still be peeled into separate repos/subdomains later when needed.

## Tools currently in this repo

| Tool | What it does | Path | Status |
|---|---|---|---|
| Hub | Searchable homepage and tool registry. | `/` | Live |
| Folder Creator | Visual builder + paste import (Excel/Word/text), ZIP + ASCII output. | `folder-tool` | Live |
| Image Editor | Shapes/text/draw + rotate/flip + adjustments + undo/redo + export guard. | `image-editor` | Live |
| Prompt Enhancer | Gemini-backed prompt rewrite + local recent history. | `prompt-enhancer` | Live |
| Stopwatch with Splits | Split tracking with notes and copyable timecodes. | `stopwatch` | Live |
| Pseudo Word Generator | Generate pronounceable fake words. | `pseudo-word` | Live |
| JSON Formatter | Format/minify/validate JSON. | `json-formatter` | Live |
| Regex Tester | Live regex highlighting + groups. | `regex-tester` | Live |
| Web Dev Unit Converter | px/rem, hex/rgba, epoch/ISO converters. | `unit-converter` | Live |
| Bulk Image Resizer | Batch resize/crop many images to exact output size. | `bulk-image-resizer` | Live |
| Password Generator | Secure random password generation in-browser. | `password-generator` | Live |
| QR Generator | Create and download QR code PNG. | `qr-generator` | Live |
| Diff Checker | Compare two text blocks with highlighted changes. | `diff-checker` | Live |
| PDF Merger | Merge multiple PDFs in-browser. | `pdf-merger` | Live |
| SVG Optimizer | Basic SVG cleanup/minification. | `svg-optimizer` | Live |
| Audio Trimmer | Trim audio clip and download as WAV. | `audio-trimmer` | Live |

## Hosting and deployment model (current)

- Single repo deployed to Netlify (`publish = "."`).
- Static HTML/CSS/JS by default; no build step.
- Server logic only where needed via Netlify functions (`prompt-enhancer/netlify/functions/enhance.js`).
- Domain migration to `devjaybusiness.com` is still pending.

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

## Deployment checklist

- [x] Replace `YOUR_HANDLE` placeholders with production Ko-fi/PayPal links.
- [ ] Add `og-image.png` (1200x630) and wire into all tool pages that need it.
- [ ] Connect custom domain `devjaybusiness.com` in Netlify.
- [ ] Add an OG image (`og-image.png`, 1200x630) referenced in `<meta property="og:image">`.

## Adding a new service

1. Create a new GitHub repo.
2. Copy in shared baseline files (including this README context conventions).
3. Build `index.html` with shared layout conventions.
4. Add `privacy.html`, `terms.html`, `README.md`, `TODO.md`, and `netlify.toml`.
5. Register the new service in the hub `tools.js` list for discovery.
6. Deploy to Netlify and attach `[tool].devjaybusiness.com`.
7. Update the services table in this README.
