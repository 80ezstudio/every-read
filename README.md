# every-read

Official website for Every Read — a calm book tracker and reading journal for Android and iPhone.

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
The production `pages.dev` address redirects permanently to the custom domain via
the Cloudflare account Bulk Redirect list `every_read_canonical` and rule
`Every Read canonical website`. The 301 redirect preserves paths and query strings.
This is account configuration: Pages `_redirects` does not support hostname rules.

The root `CNAME` is retained for the legacy GitHub Pages URL to redirect visitors to
the canonical domain. It is excluded from Cloudflare's deployed files. DNS for the
custom domain must point to the Cloudflare Pages project, not to GitHub Pages.

Submit `https://everyread.80ezstudio.com/sitemap.xml` in the `80ezstudio.com` Search
Console domain property (or the matching HTTPS URL-prefix property). Keep the old
property for historical reporting while Google processes the move.

## Share links

Share a free resource first. Each URL serves the corresponding existing resource
with different App Store campaign and Google Play referral parameters on both
download buttons:

| Channel | Link | Free resource |
| --- | --- | --- |
| Reading groups and families | [Reading groups](https://everyread.80ezstudio.com/reading-groups) | Reading journal template and a read-aloud idea for parents and carers |
| Book clubs | [Book clubs](https://everyread.80ezstudio.com/book-clubs) | Book club discussion questions |
| Instagram | [Bookstagram](https://everyread.80ezstudio.com/bookstagram) | Reading journal template |

The three share pages are not indexed; the original resources remain canonical.
There are no new cookies, tracking scripts or app permissions. Apple campaign
reporting can suppress small counts, and store listing clicks are not verified
downloads or new paid subscriptions. Do not compare or add those measures.
