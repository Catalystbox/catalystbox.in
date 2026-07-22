import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "assets/js/thinkmap-refresh.js"), "utf8");

function runRefresh(pathname, search = "") {
  let replaced = null;
  const window = {
    location: {
      pathname,
      search,
      replace(url) {
        replaced = url;
      },
    },
  };

  vm.runInNewContext(source, { window, URLSearchParams });
  return {
    replaced,
    target: window.__THINKMAP_REFRESH_ROUTE__,
    redirecting: window.__THINKMAP_REFRESH_REDIRECTING__,
  };
}

test("direct ThinkMap refresh hands the route back to the main shell", () => {
  assert.deepEqual(runRefresh("/thinkmap/mind-mirror/index.html"), {
    replaced: "/?thinkmapRoute=%2Fthinkmap%2Fmind-mirror",
    target: undefined,
    redirecting: true,
  });
  assert.equal(runRefresh("/thinkmap").replaced, "/?thinkmapRoute=%2Fthinkmap");
});

test("the main shell restores the requested ThinkMap route before mounting", () => {
  const result = runRefresh("/", "?thinkmapRoute=%2Fthinkmap%2Fmargin");
  assert.equal(result.replaced, null);
  assert.equal(result.target, "/thinkmap/margin");
});

test("guide and unrelated routes are not intercepted", () => {
  assert.equal(runRefresh("/thinkmap/guides/margin").replaced, null);
  assert.equal(runRefresh("/about").replaced, null);
});

test("every physical ThinkMap app entry uses the shared refresh handoff", () => {
  const files = [
    "thinkmap/index.html",
    "thinkmap/education-roi/index.html",
    "thinkmap/margin/index.html",
    "thinkmap/podium-india/index.html",
    "thinkmap/podium-global/index.html",
    "thinkmap/exam-compass-india/index.html",
    "thinkmap/exam-compass-world/index.html",
    "thinkmap/mind-mirror/index.html",
  ];

  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /\/assets\/js\/thinkmap-refresh\.js/, file);
  }
});

test("the main router consumes the restored route and 404 supports future tools", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const router = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");
  const notFound = fs.readFileSync(path.join(root, "404.html"), "utf8");

  assert.match(index, /\/assets\/js\/thinkmap-refresh\.js/);
  assert.match(router, /window\.__THINKMAP_REFRESH_ROUTE__ \|\| window\.location\.pathname/);
  assert.equal(
    (router.match(/window\.__THINKMAP_REFRESH_ROUTE__/g) || []).length,
    1,
    "the one-time refresh route must not override Back/Forward navigation",
  );
  assert.match(notFound, /__THINKMAP_REFRESH_REDIRECTING__/);
});
test("returning through the site navbar resets ThinkMap and every tool has a hub link", () => {
  const router = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");
  const entry = fs.readFileSync(path.join(root, "thinkmap/entry.jsx"), "utf8");

  assert.match(router, /CustomEvent\('thinkmap:navigate'/);
  assert.match(router, /detail: \{ path: '\/' \+ id\.replace/);
  assert.match(entry, /addEventListener\("thinkmap:navigate", handleShellNavigation\)/);
  assert.match(entry, /className="tm-back-link" href="\/thinkmap"/);
  assert.equal((entry.match(/<ToolPage>/g) || []).length, 7);
});
