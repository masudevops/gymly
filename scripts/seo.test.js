const { pageHtml, resolveSiteUrl, robotsTxt, sitemapXml } = require('./seo');

describe('resolveSiteUrl', () => {
  it('prefers SITE_URL, then the Vercel production domain, then localhost', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://example.com/', VERCEL_PROJECT_PRODUCTION_URL: 'other.com' })).toBe('https://example.com');
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'mygymly.com' })).toBe('https://mygymly.com');
    expect(resolveSiteUrl({})).toBe('http://localhost:8081');
  });
});

describe('pageHtml', () => {
  const shell = [
    '<title>Home</title>',
    '<meta name="description" content="Home description" />',
    '<meta property="og:title" content="Home" />',
    '<meta property="og:description" content="Home description" />',
    '<meta name="twitter:title" content="Home" />',
    '<meta name="twitter:description" content="Home description" />',
    '<meta property="og:url" content="https://site.test/" />',
    '<link rel="canonical" href="https://site.test/" />',
  ].join('\n');

  it('swaps in the page title, description and URLs', () => {
    const html = pageHtml(shell, { path: '/privacy', title: 'Privacy · Gymly', ogTitle: 'Privacy', description: 'What we "collect" & why' }, 'https://site.test');
    expect(html).toContain('<title>Privacy · Gymly</title>');
    expect(html).toContain('<meta property="og:title" content="Privacy" />');
    expect(html).toContain('<meta name="twitter:title" content="Privacy" />');
    expect(html).toContain('<meta name="twitter:description" content="What we &quot;collect&quot; &amp; why" />');
    expect(html).toContain('<meta name="description" content="What we &quot;collect&quot; &amp; why" />');
    expect(html).toContain('<meta property="og:url" content="https://site.test/privacy" />');
    expect(html).toContain('<link rel="canonical" href="https://site.test/privacy" />');
  });

  it('honours a custom canonical', () => {
    expect(pageHtml(shell, { path: '/welcome', title: 'T', description: 'D', canonical: '/' }, 'https://site.test')).toContain(
      '<link rel="canonical" href="https://site.test/" />',
    );
  });
});

describe('sitemap and robots', () => {
  it('lists the home page and public pages under the site URL', () => {
    const xml = sitemapXml('https://site.test');
    expect(xml).toContain('<loc>https://site.test/</loc>');
    expect(xml).toContain('<loc>https://site.test/privacy</loc>');
    expect(xml).not.toContain('/sign-in<');
    expect(robotsTxt('https://site.test')).toContain('Sitemap: https://site.test/sitemap.xml');
  });
});
