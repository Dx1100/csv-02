# CSV Toolbox

Free, private, browser-based CSV tools built with [Astro](https://astro.build): split, merge, deduplicate, view, change delimiters, extract columns, and convert CSV files. All processing happens client-side using JavaScript in background Web Workers — no backend, no signup, and zero file uploads.

**Tools:**
- CSV Splitter (`/split-csv/`)
- CSV Merger (`/merge-csv/`)
- Duplicate Remover (`/remove-duplicates-csv/`)
- Large CSV Viewer (`/csv-viewer/`)
- Delimiter Changer (`/change-delimiter-csv/`)
- Column Extractor (`/extract-columns-csv/`)
- CSV ⇄ JSON (`/csv-to-json/`)
- CSV → XML (`/csv-to-xml/`)
- CSV → YAML (`/csv-to-yaml/`)
- CSV → Markdown (`/csv-to-markdown/`)
- CSV → HTML (`/csv-to-html/`)
- CSV Guides & Tutorials (`/guides/`)

## Local development

```bash
npm install
npm run dev      # Runs dev server on http://localhost:3000
npm run build    # Builds static output in dist/
npm run preview  # Previews production build
```

## Deployment

Configured for deployment via Cloudflare Pages or any static web host.

1. Connect the GitHub repository `Dx1100/csv-toolbox`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. If deploying to a custom domain (e.g. `example.com`), update:
   - `site` in `astro.config.mjs`
   - Sitemap URL in `public/robots.txt`

## Technical SEO & Trust

- Canonical URL generation and sitemap indices aligned with `https://free-csv-toolbox.pages.dev/`.
- Dynamic preview-environment indexing suppression via `CF_PAGES_BRANCH` environment detection.
- Structured data (JSON-LD) for `WebSite`, `Organization`, `SoftwareApplication`, and `FAQPage`.
- Clean error handling with `noindex, follow` tags on 404/500 error pages.
- No intrusive anti-developer or anti-user right-click blocking scripts.
