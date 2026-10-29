import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const urls = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
test('sitemap pages exist with exact self canonicals and valid JSON-LD', () => {
  for (const url of urls) {
    const route = new URL(url).pathname;
    const html = fs.readFileSync('.' + route + 'index.html', 'utf8');
    assert.ok(html.includes(`rel="canonical" href="${url}"`), route);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(json);
    if (route.startsWith('/thinkmap/')) {
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route);
      assert.ok(html.includes('BreadcrumbList'), route);
      assert.ok(html.includes('Related ThinkMap tools'), route);
      assert.ok(!html.includes('/assets/js/thinkmap-refresh.js'), route);
    }
  }
});
test('review drafts and marketing disclosures do not claim foundation affiliation', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /Fresh Eye Foundation/);
  assert.ok(html.includes('Draft for legal review'));
  assert.ok(html.includes('Google Analytics and Google Ads tags'));
  assert.doesNotMatch(html, /We do not use Google Analytics/);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const org = graph['@graph'].find(x => x['@type'] === 'Organization');
  assert.equal(org.email, 'hello@catalystbox.in');
  assert.equal(org.logo, 'https://www.catalystbox.in/assets/images/catalystbox-logo.png');
  assert.equal(org.parentOrganization, undefined);
});
