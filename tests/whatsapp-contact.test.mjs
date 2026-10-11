import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('public WhatsApp entries use the approved phone and main-site enquiry message', () => {
  const html = readFileSync('index.html', 'utf8');
  const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"\s]+)"/g)];
  assert.equal(links.length, 2);
  for (const [, href] of links) {
    const url = new URL(href);
    assert.equal(url.pathname, '/919582441644');
    assert.match(url.searchParams.get('text'), /CatalystBox.*catalystbox\.in.*partnership/);
    assert.doesNotMatch(url.searchParams.get('text'), /Marketplace|Reportcard/);
  }
  assert.doesNotMatch(html, /919015712864/);
});
