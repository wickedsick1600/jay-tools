# folder-tool

Turn an indented text tree into a downloadable `.zip` folder structure. Also outputs clean ASCII trees for READMEs.

## Local preview

Open `index.html` in a browser. All libraries load from CDN; no build step.

## Deploy

Pushes to `main` auto-deploy to Netlify. No serverless functions — pure static site.

## How it parses input

- Indentation: 2 spaces = one level (tabs are normalized to 2 spaces).
- Name ending in `/` → folder.
- Name with a file extension (`.js`, `.md`, etc.) → empty file.
- Name with no extension and no trailing slash → folder.
- ASCII characters like `├── └── │` are stripped before parsing, so you can also paste existing tree diagrams back in.

## Before going live

- [ ] Replace `YOUR_HANDLE` and `your-hub-site.netlify.app` placeholders across HTML files.
- [ ] Add `og-image.png` and reference from meta tag.
