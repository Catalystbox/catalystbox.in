# catalystbox.in

Public CatalystBox website, published by GitHub Pages from `main` at
https://www.catalystbox.in/.

## Develop and verify

Use Node.js 24 and run `npm ci`, `npm test`, and `npm run build`.
ThinkMap's generated `assets/js/thinkmap.bundle.js` is committed because Pages
serves the checkout directly. Commit a rebuilt bundle whenever its source changes.
The Website checks workflow verifies tests and bundle parity on pull requests and
pushes to `main`.

The homepage and shared page shell live in `index.html`; `/about/` has a separate
static entry in `about/index.html`. Shared design styles are in `assets/css/refresh.css`,
brand and loop styles in `assets/css/brand-loop.css`, and About styles in
`assets/css/about-refresh.css`. Update the version on changed CSS/JS references
when releasing to refresh cached assets.

## Release checklist

1. Preserve and classify pending changes; release only the intended files.
2. Pass tests and build. Check desktop/mobile navigation, all five ThinkMap tools,
   direct route refreshes, the interactive loop, and header/footer branding.
3. Merge the reviewed pull request to `main` and wait for GitHub Pages success.
4. Verify the canonical live domain and changed asset contents; a workflow success
   alone does not prove the current page is served.
5. Save a source archive and verified Git bundle outside the public checkout,
   record hashes and the deployed commit, and synchronize the local `main` branch.

For rollback, revert the release merge commit on `main` through a pull request,
then verify Pages and the canonical domain again. Do not reset unrelated work or
place recovery archives in this publicly served repository.
