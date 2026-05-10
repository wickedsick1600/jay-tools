# multi-service TODO checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Documentation maintenance
- [x] Make `README.md` the complete project documentation source of truth
- [x] Convert `TODO.md` to checklist-only tracker (backlog + deployment + launch)
- [x] Document Netlify secrets scanning (`OPENAI_*` values must not appear in repo), required `OPENAI_MODEL`, and feedback form success URL (`/index.html?thanks=1`)

## Core platform status
- [x] Homepage with category tabs
- [x] Live search across title/description/tags/category
- [x] Data-driven tool registry (`tools.js`)
- [x] Mobile-responsive layout
- [x] Feedback form via Netlify Forms
- [x] Plain-language legal pages

## Pre-deployment checklist
- [x] Rebrand to Juankit; apex URLs in `sitemap.xml`, `robots.txt`, hub + tool meta, and `netlify.toml` www→apex redirects
- [x] Confirm `juankit.com` DNS is pointed at Netlify and set as primary (apex canonical)
- [x] Replace all `YOUR_HANDLE` placeholders (Ko-fi + PayPal)
- [x] Add `og-image.png` at repo root (hub meta tags point at `https://juankit.com/og-image.png`)
- [x] Push repo to GitHub
- [x] Create Netlify site and connect repository
- [x] Enable Forms and email notification to `devjaybusiness@gmail.com`
- [x] Submit test feedback and verify email receipt (form `action`: `/index.html?thanks=1`)

## Prompt Enhancer deployment checklist
- [x] Create OpenAI API key
- [x] Add `OPENAI_API_KEY` in Netlify env vars
- [x] Set `OPENAI_MODEL` in Netlify only (never commit the value — Netlify secrets scanning matches repo text to env values)
- [ ] Set `GLOBAL_DAILY_LIMIT` (optional; code defaults to **300**/day if unset)
- [x] Deploy and verify Enhance flow works
- [x] Verify API key is not exposed in client source
- [ ] Validate rate-limiting behavior under load

## Tool split and subdomain checklist
- [ ] Move `image-editor` to own repo
- [ ] Map `imageeditor.juankit.com`
- [ ] Move `folder-tool` to own repo
- [ ] Map `foldercreator.juankit.com`
- [ ] Move `prompt-enhancer` to own repo
- [ ] Map `promptenhancer.juankit.com`
- [ ] Update `tools.js` URLs after each split

## Launch quality checklist
- [ ] Final copy edit of hub content
- [ ] Mobile search QA
- [ ] Cross-browser test (Safari, Firefox, Chrome, Edge)
- [ ] Load-test layout with 20+ tools in registry
- [x] Submit site to Google Search Console (DNS TXT + sitemap)
- [x] Submit site to Bing Webmaster Tools (import / manual)

## Service deployment tracker
- [ ] Folder Creator independently deployed
- [ ] Image Editor independently deployed
- [ ] Prompt Enhancer independently deployed
- [x] Stopwatch deployed with hub
- [x] Pseudo Word Generator deployed with hub
- [x] JSON Formatter deployed with hub
- [x] Regex Tester deployed with hub
- [x] Web Dev Unit Converter deployed with hub
- [x] PDF Editor deployed with hub
- [x] Bulk Image Resizer deployed with hub
- [x] YouTube Looper deployed with hub
- [x] Password Generator, QR Generator, Diff Checker, PDF Merger, SVG Optimizer, Audio Trimmer deployed with hub (see hub registry)

## Growth and operations backlog
- [x] Dismissible bookmark hint (`bookmark-hint.js`, `localStorage` key `juankit_bookmark_hint_v1`)
- [ ] Add "Did this help?" donation prompt after successful actions
- [ ] Add per-tool privacy trust blurb
- [ ] Verify privacy + terms pages across all tools
- [ ] Run donation test flow (Ko-fi -> PayPal payout path)
- [ ] Publish first-week launch posts (r/webdev, r/InternetIsBeautiful, Show HN)

## Future tool backlog
- [ ] Image to Text (OCR)
- [ ] Exam/Reviewer Generator
- [ ] AI Token Counter

## Completed tool implementations
- [x] Stopwatch with Splits
- [x] Bulk Image Resizer
- [x] Pseudo Word Generator
- [x] JSON Formatter
- [x] Regex Tester
- [x] Web Dev Unit Converter
- [x] Diff Checker
- [x] SVG Optimizer
- [x] PDF Editor
- [x] PDF Merger
- [x] YouTube Replay/Looper
- [x] Audio Trimmer
- [x] QR Generator
- [x] Password Generator
