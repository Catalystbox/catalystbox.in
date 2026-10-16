import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const about = fs.readFileSync('about/index.html', 'utf8');

test('brand identity includes the wider offering in visible and machine-readable content', () => {
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const org = graph['@graph'].find(x => x['@type'] === 'Organization');
  const website = graph['@graph'].find(x => x['@type'] === 'WebSite');
  assert.equal(org.name, 'CatalystBox');
  assert.equal(org.url, 'https://www.catalystbox.in/');
  assert.equal(org.telephone, '+919582441644');
  assert.equal(org.sameAs.length, 4);
  assert.equal(website.publisher['@id'], org['@id']);
  for (const product of ['Reportcard', 'Marketplace', 'ThinkMap']) {
    assert.ok(org.description.includes(product));
    assert.ok(about.includes(product));
  }
  assert.match(html, /<h1>See the signals\./);
  assert.match(html, /aria-label="CatalystBox home"/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /href="\/about\/"/);
  assert.match(about, /<link rel="canonical" href="https:\/\/www\.catalystbox\.in\/about\/"/);
});

test('SPA routes retain their own canonical and descriptions when navigating back home', () => {
  const values = new Map();
  const context = {
    window: {},
    document: { title: '', querySelector: key => ({ setAttribute: (name, value) => values.set(key + ':' + name, value) }) }
  };
  vm.runInNewContext(fs.readFileSync('assets/js/seo.js', 'utf8'), context);
  context.window.updateRouteMetadata('thinkmap/margin');
  assert.equal(values.get('link[rel="canonical"]:href'), 'https://www.catalystbox.in/thinkmap/margin/');
  assert.ok(context.document.title.includes('ThinkMap'));
  context.window.updateRouteMetadata('');
  assert.equal(values.get('link[rel="canonical"]:href'), 'https://www.catalystbox.in/');
  assert.ok(context.document.title.startsWith('CatalystBox'));
  assert.ok(values.get('meta[name="description"]:content').includes('ThinkMap'));
});

test('crawl discovery identifies the official About and product hub', () => {
  assert.match(fs.readFileSync('robots.txt', 'utf8'), /Sitemap: https:\/\/www\.catalystbox\.in\/sitemap\.xml/);
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.match(sitemap, /<loc>https:\/\/www\.catalystbox\.in\/about\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.catalystbox\.in\/thinkmap\/<\/loc>/);
});
