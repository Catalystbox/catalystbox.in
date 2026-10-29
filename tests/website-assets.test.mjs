import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('the published homepage and About page reference existing local assets and SVG symbols', () => {
  for (const file of ['index.html', 'about/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const match of html.matchAll(/<(script|link|img|use)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) {
      const [, tag, url] = match;
      if (tag === 'use' && url.startsWith('#')) {
        assert.ok(ids.has(url.slice(1)), `${file}: missing SVG symbol ${url}`);
      } else if (url.startsWith('/assets/')) {
        const asset = url.split(/[?#]/)[0].slice(1);
        assert.ok(fs.existsSync(path.resolve(asset)), `${file}: missing asset ${asset}`);
      }
    }
  }
});

test('every ThinkMap chooser destination has a physical refresh entry for GitHub Pages', () => {
  const script = fs.readFileSync('assets/js/refresh.js', 'utf8');
  const routes = [...script.matchAll(/route: '(thinkmap\/[^']+)'/g)].map(match => match[1]);
  assert.equal(routes.length, 5);
  for (const route of routes) {
    const entry = fs.readFileSync(`${route}/index.html`, 'utf8');
    assert.ok(entry.includes('/assets/js/thinkmap.bundle.js'), `${route}: missing interactive bundle`);
    assert.match(entry, /<h1[ >]/);
    assert.ok(!entry.includes('/assets/js/thinkmap-refresh.js'), `${route}: must not bounce to the homepage`);
  }
});
