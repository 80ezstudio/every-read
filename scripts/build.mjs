import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const canonical = 'https://everyread.80ezstudio.com';
const pages = [
  'index.html', 'book-tracker.html', 'reading-journal.html', 'tbr-tracker.html',
  'remember-what-you-read.html', 'tbr-reset.html', 'reading-journal-template.html',
  'book-club-questions.html', 'help.html',
];
const assets = [
  'home.css', 'styles.css', 'every-read-icon.webp', 'app-home.webp',
  'app-details.webp', 'app-notes.webp', 'app-goals.webp', '_headers', '_redirects',
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
  await writeFile(path.join(output, file), html);
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
console.log(`Validated and built ${pages.length} canonical pages, sitemap, robots, 404 and ${assets.length} public assets.`);
