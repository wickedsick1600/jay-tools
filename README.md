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
- Canonical site URL: `https://juankit.com/` (apex; add `og-image.png` at repo root for social previews — already referenced in hub meta tags)

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
| Image Editor | Browser image editing with drawing, transforms, and export | `image-editor/` | Static |
| Prompt Enhancer | Prompt rewriting with OpenAI-compatible backend function | `prompt-enhancer/` | Static + Netlify Function |
| Stopwatch with Splits | Stopwatch with split notes and copyable timecodes | `stopwatch/` | Static |
| Pseudo Word Generator | Generate pronounceable fake words | `pseudo-word/` | Static |
| JSON Formatter | Format, minify, and validate JSON | `json-formatter/` | Static |
| Regex Tester | Live regex matching and capture groups | `regex-tester/` | Static |
| Web Dev Unit Converter | px/rem, hex/rgba, epoch/ISO conversions | `unit-converter/` | Static |
| Bulk Image Resizer | Batch image resize/crop workflows | `bulk-image-resizer/` | Static |
| Password Generator | Secure in-browser random password generation | `password-generator/` | Static |
| QR Generator | Create and download QR code PNG | `qr-generator/` | Static |
| Diff Checker | Compare two text blocks and show differences | `diff-checker/` | Static |
| PDF Editor | Annotate/sign PDF and export | `pdf-editor/` | Static |
| PDF Merger | Merge multiple PDFs in-browser | `pdf-merger/` | Static |
| SVG Optimizer | Basic SVG cleanup/minification | `svg-optimizer/` | Static |
| Audio Trimmer | Trim audio in-browser and export WAV | `audio-trimmer/` | Static |
| YouTube Looper | Replay and loop YouTube videos | `youtube-looper/` | Static |

## Tech stack and conventions

- Plain HTML, CSS, and JavaScript
- No bundler/build step for static pages
- CDN libraries only when they provide clear value
- No browser ES modules in tool pages; keep `file://` compatibility
- Prefer broad browser support and simple UI behavior

## Security and privacy model

- Process user files in browser whenever possible
- Keep secrets only in Netlify environment variables
- Access secrets only from server-side functions
- Never expose API keys in client JavaScript
- Avoid analytics, trackers, and fingerprinting

## Prompt Enhancer backend configuration

Required in local `.env` and Netlify env vars:

- `OPENAI_API_KEY`

Recommended defaults:

- `OPENAI_MODEL=gpt-4o-mini`
- `GLOBAL_DAILY_LIMIT=100`

Optional hardening:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TURNSTILE_SECRET_KEY`

Core serverless function path:

- `prompt-enhancer/netlify/functions/enhance.js`

## Local development

No build step is required.

1. Open `index.html` directly in browser for quick local preview.
2. For function testing and parity with production, run Netlify CLI locally if needed.

## Deployment model

Current model is single-repo deployment on Netlify.

- Publish directory: repository root (`.`)
- Auto deploy: push to `main`
- Mixed runtime: static pages + serverless functions where needed

Deployment runbook and domain/DNS procedures are documented in `DEPLOY.md`.

## Legal and trust baseline

Each service should include:

- `privacy.html`
- `terms.html`

Both pages must be linked in service footers.

Donations and feedback baseline:

- Donations: Ko-fi primary, PayPal fallback
- Feedback: hub Netlify Form routed to `devjaybusiness@gmail.com`

## Adding a new service

1. Create the new service folder (or new repo if splitting immediately).
2. Build with the shared suite conventions.
3. Add legal pages (`privacy.html`, `terms.html`) and `netlify.toml` if needed.
4. Register the service in `tools.js`.
5. Deploy and verify links, metadata, and navigation.
6. Add the service entry to this README service table.

## Documentation map

- `README.md` - project source of truth (this file)
- `TODO.md` - actionable checklist (backlog, deployment tasks, launch tasks)
- `DEPLOY.md` - operational deployment runbook and troubleshooting
