import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

test('public content does not restore retired credentials or absolute privacy claims', () => {
  for (const claim of [
    '100% Anonymous Feedback', 'Startup India Recognized',
    'Registered NGO with 12A and 80G', 'Independent Non-Profit Organization',
    'registered as a One Person Company', 'GDPR-aligned in every market',
    'identifying who submitted a response is architecturally impossible',
    'no standardized infrastructure for capturing',
    'already deployed across India', "CGEB's validated framework",
    '~65 lakh', '~6.5 lakh', '1.56M+', '290M+',
  ]) assert.ok(!html.includes(claim), `Retired claim returned: ${claim}`);
});

test('context, proposed status and personal-disclosure limits remain explicit', () => {
  for (const text of [
    'AISHE 2021–22', 'OECD PISA 2022 indices',
    'not committed sources of funding',
    'Free text, small groups and contextual details',
    'Reportcard and Marketplace have their own notices',
    'subject to agreed pilot terms', 'Proposed methodology',
  ]) assert.ok(html.includes(text), `Missing qualification: ${text}`);
});

test('the sample score agrees with the published stakeholder weights', () => {
  const sample = html.match(/<div class="index-score">([\d.]+)<\/div>/);
  assert.ok(sample, 'Sample score must remain discoverable');
  assert.equal(Number(sample[1]), Number((85 * .45 + 78 * .30 + 72 * .25).toFixed(2)));
  assert.ok(html.includes('Parent Trust<br/>Index · 25%'));
  assert.ok(!html.includes('Parent Engagement<br/>Index'));
});
