# folder-tool — Task Tracker

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## MVP
- [x] Parse indented tree (tabs + spaces, strips ASCII box chars)
- [x] Generate ZIP via JSZip + FileSaver.js
- [x] Generate ASCII tree output (copy to clipboard)
- [x] Privacy, terms, README
- [x] "How it works" and donate sections
- [x] Visual builder UI with row actions
- [x] Paste import from Excel/Word/notes
- [x] Sample presets (HR/Admin/Personal)
- [x] Copy plain list output

## Before deploy
- [x] Replace `YOUR_HANDLE` placeholders
- [ ] Add `og-image.png` (1200×630)
- [ ] Create GitHub repo and push
- [ ] Create Netlify site, connect repo, verify auto-deploy

## Launch polish
- [ ] Submit to Google Search Console
- [ ] Test on mobile (portrait, landscape)
- [ ] Test edge cases: deeply nested trees, trees with special chars in names, tabs mixed with spaces

## Future
- [ ] Option to seed files with boilerplate content for each generated file
- [ ] Import a real folder (via File System Access API) and output its ASCII tree
