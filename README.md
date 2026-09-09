# every-read

Official website for Every Read — a calm book tracker and reading journal for Android.

Canonical public host: `https://everyread.80ezstudio.com/`

Cloudflare Pages hosts the website. GitHub holds its source and deployment history.
`https://er.80ezstudio.com/` remains the separate short link to Google Play.

## Cloudflare deployment

- Project: `every-read-80ezstudio`
- Production branch: `main`
- Build command: `node scripts/build.mjs`
- Build output directory: `dist`
- Custom domain: `everyread.80ezstudio.com`

The build copies only public site assets, maps canonical URLs and internal page links to
Cloudflare's extensionless URLs, and validates the sitemap against the output pages.
The production `pages.dev` address redirects permanently to the custom domain.

The root `CNAME` is retained for the legacy GitHub Pages URL to redirect visitors to
the canonical domain. It is excluded from Cloudflare's deployed files. DNS for the
custom domain must point to the Cloudflare Pages project, not to GitHub Pages.

Submit `https://everyread.80ezstudio.com/sitemap.xml` in the `80ezstudio.com` Search
Console domain property (or the matching HTTPS URL-prefix property). Keep the old
property for historical reporting while Google processes the move.
