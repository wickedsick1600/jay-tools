# prompt-enhancer

Turns a rough prompt idea into a polished, structured prompt for ChatGPT, Claude, Midjourney, Stable Diffusion, Gemini, and other target profiles.

## Architecture

- `index.html` + `script.js` — UI. No API key here.
- `netlify/functions/enhance.js` — serverless proxy. The ONLY file that touches `GEMINI_API_KEY`.

## Local preview

Requires [Netlify CLI](https://docs.netlify.com/cli/get-started/) so the serverless function works:

```bash
npm install -g netlify-cli
netlify dev
```

Then open the local URL it prints. Without `netlify dev`, the static page loads but enhance requests fail.

## Setup (one-time)

1. Get a free Gemini API key at https://aistudio.google.com/apikey
2. In your Netlify site settings → Environment variables → add `GEMINI_API_KEY` = your key.
3. Never commit the key. Never paste it into client code.

## Free tier quota

Gemini 2.0 Flash gives **1,500 requests / day** per API key (shared across all users of this site). The serverless function enforces a per-IP rate limit of 10 req/hour to deter abuse. If the daily quota is hit, users see a 502 error until the quota resets.

## Before going live

- [ ] Set `GEMINI_API_KEY` in Netlify environment variables.
- [x] Replace `YOUR_HANDLE` placeholders.
- [ ] Test via `netlify dev` first — confirm enhance succeeds locally.
- [ ] After deploy, view page source and Ctrl+F for `GEMINI` or your key prefix — must not appear.
- [ ] Add `og-image.png`.

## Local UX features

- Recent history (last 5 prompts) is stored in `localStorage` only.
- History entries can be reloaded into input/output with one click.
