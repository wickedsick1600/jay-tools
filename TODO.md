# multi-service TODO checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Documentation maintenance
- [x] Make `README.md` the complete project documentation source of truth
- [x] Convert `TODO.md` to checklist-only tracker (backlog + deployment + launch)

## Core platform status
- [x] Homepage with category tabs
- [x] Live search across title/description/tags/category
- [x] Data-driven tool registry (`tools.js`)
- [x] Mobile-responsive layout
- [x] Feedback form via Netlify Forms
- [x] Plain-language legal pages

## Pre-deployment checklist
- [x] Rebrand to Juankit; apex URLs in `sitemap.xml`, `robots.txt`, hub + tool meta, and `netlify.toml` www→apex redirects
- [ ] Confirm `juankit.com` DNS is pointed at Netlify and set as primary (apex canonical)
- [x] Replace all `YOUR_HANDLE` placeholders (Ko-fi + PayPal)
- [x] Add `og-image.png` at repo root (hub meta tags point at `https://juankit.com/og-image.png`)
- [ ] Push repo to GitHub
- [ ] Create Netlify site and connect repository
- [ ] Enable Forms and email notification to `devjaybusiness@gmail.com`
- [ ] Submit test feedback and verify email receipt

## Prompt Enhancer deployment checklist
- [ ] Create OpenAI API key
- [ ] Add `OPENAI_API_KEY` in Netlify env vars
- [ ] Set `OPENAI_MODEL=gpt-4o-mini`
- [ ] Set `GLOBAL_DAILY_LIMIT`
- [ ] Deploy and verify Enhance flow works
- [ ] Verify API key is not exposed in client source
- [ ] Validate rate-limiting behavior

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
- [ ] Submit site to Google Search Console
- [ ] Submit site to Bing Webmaster Tools

## Service deployment tracker
- [ ] Folder Creator independently deployed
- [ ] Image Editor independently deployed
- [ ] Prompt Enhancer independently deployed
- [ ] Stopwatch deployed with hub
- [ ] Pseudo Word Generator deployed with hub
- [ ] JSON Formatter deployed with hub
- [ ] Regex Tester deployed with hub
- [ ] Web Dev Unit Converter deployed with hub
- [ ] PDF Editor deployed with hub
- [ ] Bulk Image Resizer deployed with hub
- [ ] YouTube Looper deployed with hub

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
