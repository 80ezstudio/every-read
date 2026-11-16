import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const canonical = 'https://everyread.80ezstudio.com';
const appStore = 'https://apps.apple.com/app/id6804274073';
const googlePlay = 'https://play.google.com/store/apps/details?id=com.eightyezstudio.mybookshelf';
const pages = [
  'index.html', 'book-tracker.html', 'reading-journal.html', 'tbr-tracker.html',
  'remember-what-you-read.html', 'tbr-reset.html', 'reading-journal-template.html',
  'book-club-questions.html', 'help.html',
];
const assets = [
  'home.css', 'styles.css', 'every-read-icon.webp', 'app-home.webp',
  'app-details.webp', 'app-notes.webp', 'app-goals.webp', '_headers', '_redirects',
];
// Apple generated the public provider token in App Store Connect. Campaigns
// use separate names so each source can be evaluated without another SDK.
const resourceCampaigns = [
  { page: 'reading-groups', resource: 'reading-journal-template.html', source: 'reading_groups', medium: 'community' },
  { page: 'book-clubs', resource: 'book-club-questions.html', source: 'book_clubs', medium: 'community' },
  { page: 'bookstagram', resource: 'reading-journal-template.html', source: 'instagram', medium: 'social' },
];

function pagePath(file) {
  return file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '');
}

function normaliseUrls(text) {
  for (const file of pages) {
    const url = pagePath(file);
    text = text.replaceAll(`${canonical}/${file}`, `${canonical}${url}`);
    text = text.replaceAll(`href="${file}"`, `href="${url}"`);
    text = text.replaceAll(`href="${file}#`, `href="${url}#`);
  }
  return text;
}

await mkdir(output, { recursive: true });
for (const file of pages) {
  const html = normaliseUrls(await readFile(path.join(root, file), 'utf8'));
  const expected = `${canonical}${pagePath(file)}`;
  if (!html.includes(`rel="canonical" href="${expected}"`)) {
    throw new Error(`Canonical URL mismatch: ${file}`);
  }
  if (html.includes('https://80ezstudio.github.io/every-read')) {
    throw new Error(`Legacy product host found: ${file}`);
  }
  const links = [...html.matchAll(/<a\b[^>]+\bhref="([^"]+)"/g)].map(match => match[1]);
  const hasPlayLink = links.some(link => link === googlePlay || link.startsWith(`${googlePlay}&amp;referrer=`));
  if (!links.includes(appStore) || !hasPlayLink) {
    throw new Error(`Missing an Every Read store download link: ${file}`);
  }
  await writeFile(path.join(output, file), html);
}
for (const { page, resource, source, medium } of resourceCampaigns) {
  const file = await readFile(path.join(output, resource), 'utf8');
  const apple = new URL('https://apps.apple.com/app/apple-store/id6804274073');
  apple.search = new URLSearchParams({ pt: '129315198', ct: `er_${source}`, mt: '8' });
  const referrer = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: 'every_read_resources',
    utm_content: resource.replace(/\.html$/, ''),
  });
  const play = `${googlePlay}&amp;referrer=${encodeURIComponent(referrer.toString())}`;
  const appleLink = apple.href.replaceAll('&', '&amp;');
  const appLinks = [...file.matchAll(/<a\b[^>]+\bhref="([^"]+)"/g)].map(match => match[1]);
  let html = file.replaceAll(`href="${appStore}"`, `href="${appleLink}"`);
  for (const href of new Set(appLinks.filter(link => link === googlePlay || link.startsWith(`${googlePlay}&amp;referrer=`)))) {
    html = html.replaceAll(`href="${href}"`, `href="${play}"`);
  }
  // The original resource stays canonical and in the sitemap. These copies
  // are for sharing, not additional search results.
  html = html.replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
  if (source === 'reading_groups') {
    const articleBody = '<div class="article-body shell">';
    if (!html.includes(articleBody)) throw new Error('Reading groups resource body is missing');
    html = html.replace(articleBody, articleBody +
      '<section><h2>Keep track of the books you read together</h2>' +
      '<p>For parents and carers: keep a list of your read-aloud books, mark where you stopped, ' +
      'and save a little note about the stories you enjoyed together. Start with the free template ' +
      'below, or keep your shared reading memories in your own Every Read journal.</p></section>');
  }
  if (!html.includes(`rel="canonical" href="${canonical}${pagePath(resource)}"`) ||
      !html.includes('content="noindex, follow"') ||
      !html.includes(`href="${appleLink}"`) || !html.includes(`href="${play}"`) ||
      html.includes(`href="${appStore}"`)) {
    throw new Error(`Invalid tagged resource page: ${page}`);
  }
  await writeFile(path.join(output, `${page}.html`), html);
}
for (const file of assets) await copyFile(path.join(root, file), path.join(output, file));
await copyFile(path.join(root, '404.html'), path.join(output, '404.html'));
const sitemap = normaliseUrls(await readFile(path.join(root, 'sitemap.xml'), 'utf8'));
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expectedUrls = pages.map(file => `${canonical}${pagePath(file)}`);
if (urls.length !== expectedUrls.length || expectedUrls.some(url => !urls.includes(url))) {
  throw new Error('Sitemap does not match the canonical output pages');
}
await writeFile(path.join(output, 'sitemap.xml'), sitemap);
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${canonical}/sitemap.xml`) || /Disallow:\s*\//i.test(robots)) {
  throw new Error('Robots file is not aligned with the canonical sitemap');
}
await writeFile(path.join(output, 'robots.txt'), robots);
console.log(`Validated and built ${pages.length} canonical pages, ${resourceCampaigns.length} tagged resource pages, sitemap, robots, 404 and ${assets.length} public assets.`);
