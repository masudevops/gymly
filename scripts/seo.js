#!/usr/bin/env node
// Post-processes the exported web build for search engines and link previews:
//  - fills %SITE_URL% in dist/index.html (canonical, Open Graph and image URLs need absolute links)
//  - writes dist/<page>/index.html for each public page with its own title, description and canonical
//    (the app is a single-page build, so without this every URL would share the home page's tags)
//  - writes robots.txt and sitemap.xml
//
// The site URL is never hardcoded: SITE_URL wins, then Vercel's production domain
// (VERCEL_PROJECT_PRODUCTION_URL, e.g. mygymly.com), then localhost for local builds.
// Usage: node scripts/seo.js [distDir]
const fs = require('node:fs');
const path = require('node:path');

const TAGLINE = 'Train smarter. Get stronger.';
const HOME_DESCRIPTION =
  'Your personal workout companion. Track workouts, follow structured training programs, and visualize your fitness progress.';

/**
 * Public pages. `title` is the browser tab title; `ogTitle` is the share title, which leaves the brand to
 * og:site_name (Apple TN3156). `canonical` defaults to the page's own path. Every other route keeps the
 * home page's generic tags, so shared links never carry personal data.
 */
const PAGES = [
  { path: '/welcome', title: `Gymly · ${TAGLINE}`, ogTitle: TAGLINE, description: HOME_DESCRIPTION, canonical: '/' },
  { path: '/sign-up', title: 'Create account · Gymly', ogTitle: 'Create your free account', description: 'Create a free Gymly account and start logging your workouts.', sitemap: true },
  { path: '/sign-in', title: 'Sign in · Gymly', ogTitle: 'Sign in', description: 'Sign in to Gymly to log workouts and track your progress.' },
  { path: '/privacy', title: 'Privacy Policy · Gymly', ogTitle: 'Privacy Policy', description: 'What Gymly collects, why, and the choices you have.', sitemap: true },
  { path: '/terms', title: 'Terms of Service · Gymly', ogTitle: 'Terms of Service', description: 'The terms for using Gymly.', sitemap: true },
];

function resolveSiteUrl(env = process.env) {
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return (env.SITE_URL || vercel || 'http://localhost:8081').trim().replace(/\/+$/, '');
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The page's HTML: the home shell with its title, description and URLs swapped in. */
function pageHtml(shell, page, siteUrl) {
  const url = `${siteUrl}${page.canonical ?? page.path}`;
  const title = escapeAttr(page.title);
  const ogTitle = escapeAttr(page.ogTitle ?? page.title);
  const description = escapeAttr(page.description);
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${ogTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${ogTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
}

function sitemapXml(siteUrl) {
  const urls = ['/', ...PAGES.filter((p) => p.sitemap).map((p) => p.path)];
  const entries = urls.map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

const robotsTxt = (siteUrl) => `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

function writeSeoFiles(distDir, siteUrl) {
  const indexPath = path.join(distDir, 'index.html');
  const shell = fs.readFileSync(indexPath, 'utf8').replaceAll('%SITE_URL%', siteUrl);
  fs.writeFileSync(indexPath, shell);
  for (const page of PAGES) {
    const dir = path.join(distDir, page.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(shell, page, siteUrl));
  }
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml(siteUrl));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt(siteUrl));
}

module.exports = { PAGES, resolveSiteUrl, pageHtml, sitemapXml, robotsTxt, writeSeoFiles };

if (require.main === module) {
  const siteUrl = resolveSiteUrl();
  writeSeoFiles(process.argv[2] ?? 'dist', siteUrl);
  console.log(`seo: wrote tags, ${PAGES.length} page shells, sitemap.xml and robots.txt for ${siteUrl}`);
}
