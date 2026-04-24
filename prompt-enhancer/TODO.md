# prompt-enhancer — Task Tracker

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## MVP
- [x] Simple prompt input + target selector
- [x] Serverless proxy (`netlify/functions/enhance.js`) calling Gemini 2.0 Flash
- [x] Per-IP rate limit (10/hour) inside the function
- [x] System prompts per target (ChatGPT, Claude, Midjourney, SD, generic)
- [x] Copy-to-clipboard output
- [x] Privacy page explicitly noting data is sent to Google Gemini
- [x] Terms linking to Gemini API terms
- [x] Local history of last 5 enhancements (localStorage only)
- [x] Additional target profiles in selector

## Before deploy
- [ ] Get Gemini API key from https://aistudio.google.com/apikey
- [ ] Add `GEMINI_API_KEY` to Netlify site environment variables (NEVER commit)
- [x] Replace `YOUR_HANDLE` placeholders
- [ ] Create GitHub repo and push
- [ ] Install Netlify CLI locally (`npm install -g netlify-cli`) and test via `netlify dev`
- [ ] Deploy and run a smoke test
- [ ] View live page source and confirm `GEMINI_API_KEY` / key prefix is NOT present

## Launch polish
- [ ] Submit to Google Search Console
- [ ] Add `og-image.png`
- [ ] Monitor Netlify function logs for the first week — watch for 429s and quota exhaustion

## Future
- [ ] Optional "paste your own Gemini API key" field for power users (unlimited per-user use, key stored only in localStorage)
- [ ] More target profiles (Sora, DALL-E 3, video prompts)
