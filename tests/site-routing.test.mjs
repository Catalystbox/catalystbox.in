import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const scriptSource = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

function createMockEnvironment(initialPath = "/") {
  let currentPath = initialPath;
  let historyEntries = [{ state: null, url: initialPath }];
  let lastPushed = null;
  let lastReplaced = null;

  // Track elements
  const elements = new Map();

  function getOrCreateElement(id, classes = []) {
    if (!elements.has(id)) {
      const classSet = new Set(classes);
      elements.set(id, {
        id,
        classList: {
          add: (cls) => classSet.add(cls),
          remove: (cls) => classSet.delete(cls),
          contains: (cls) => classSet.has(cls),
        },
        style: {},
        closest: () => ({ style: {} }),
        querySelectorAll: () => [],
        querySelector: () => null,
      });
    }
    return elements.get(id);
  }

  // Pre-seed known pages from index.html
  const pageIds = [
    "page-home", "page-solutions", "page-pricing", "page-about",
    "page-thinkmap", "page-contact", "page-privacy", "page-governance",
    "page-cgeb", "page-partnership", "page-careers", "page-higher-education"
  ];
  pageIds.forEach(id => getOrCreateElement(id, id === "page-home" ? ["page", "active"] : ["page"]));

  // Pre-seed nav buttons
  const navIds = [
    "nav-home", "nav-solutions", "nav-school", "nav-partnership",
    "nav-pricing", "nav-higher-education", "nav-thinkmap", "nav-about",
    "nav-careers", "nav-contact"
  ];
  navIds.forEach(id => getOrCreateElement(id, id === "nav-home" ? ["active"] : []));

  const window = {
    location: {
      get pathname() {
        return currentPath;
      },
      set pathname(val) {
        currentPath = val;
      },
      search: "",
    },
    history: {
      pushState(state, title, url) {
        lastPushed = { state, title, url };
        currentPath = url || "/";
        historyEntries.push({ state, url });
      },
      replaceState(state, title, url) {
        lastReplaced = { state, title, url };
        currentPath = url || "/";
        if (historyEntries.length > 0) {
          historyEntries[historyEntries.length - 1] = { state, url };
        }
      },
    },
    scrollTo: () => {},
    addEventListener: () => {},
    dispatchEvent: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
  };

  const document = {
    getElementById: (id) => elements.get(id) || null,
    querySelectorAll: (selector) => {
      if (selector === ".page") {
        return pageIds.map(id => elements.get(id));
      }
      if (selector === ".nav-links button") {
        return navIds.map(id => elements.get(id));
      }
      if (selector.includes(".fade-up")) return [];
      return [];
    },
    querySelector: (selector) => {
      if (selector === ".nav-links") return { classList: { remove: () => {}, toggle: () => {}, contains: () => false } };
      return null;
    },
    addEventListener: () => {},
  };

  const context = {
    window,
    document,
    CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } },
    IntersectionObserver: class IntersectionObserver { constructor() {} observe() {} unobserve() {} disconnect() {} },
    setTimeout: (cb) => cb(),
    console,
  };

  vm.createContext(context);
  vm.runInContext(scriptSource, context);

  return {
    window,
    document,
    context,
    getActivePage: () => pageIds.find(id => elements.get(id).classList.contains("active")),
    getActiveNav: () => navIds.find(id => elements.get(id).classList.contains("active")),
    getLastPushed: () => lastPushed,
    getLastReplaced: () => lastReplaced,
  };
}

test("navigating to /school displays the School page (page-cgeb) with matching /school URL", () => {
  const env = createMockEnvironment("/school");
  assert.equal(env.getActivePage(), "page-cgeb");
  assert.equal(env.getActiveNav(), "nav-school");
  assert.equal(env.getLastReplaced()?.url, "/school");
});

test("navigating to legacy /research canonicalizes URL to /school and displays School tab", () => {
  const env = createMockEnvironment("/research");
  assert.equal(env.getActivePage(), "page-cgeb");
  assert.equal(env.getActiveNav(), "nav-school");
  assert.equal(env.getLastReplaced()?.url, "/school");
});

test("navigating to legacy /cgeb canonicalizes URL to /school and displays School tab", () => {
  const env = createMockEnvironment("/cgeb");
  assert.equal(env.getActivePage(), "page-cgeb");
  assert.equal(env.getActiveNav(), "nav-school");
  assert.equal(env.getLastReplaced()?.url, "/school");
});

test("showPage('school') pushes /school to browser history and activates nav-school", () => {
  const env = createMockEnvironment("/");
  env.context.showPage("school");
  assert.equal(env.getActivePage(), "page-cgeb");
  assert.equal(env.getActiveNav(), "nav-school");
  assert.equal(env.getLastPushed()?.url, "/school");
});

test("showPage('cgeb') seamlessly routes to /school", () => {
  const env = createMockEnvironment("/");
  env.context.showPage("cgeb");
  assert.equal(env.getActivePage(), "page-cgeb");
  assert.equal(env.getActiveNav(), "nav-school");
  assert.equal(env.getLastPushed()?.url, "/school");
});

test("navigating to / or /home displays Home page with / URL", () => {
  const env = createMockEnvironment("/home");
  assert.equal(env.getActivePage(), "page-home");
  assert.equal(env.getActiveNav(), "nav-home");
  assert.equal(env.getLastReplaced()?.url, "/");
});

test("navigating to /higher-ed or /higher-education displays Higher Ed page", () => {
  const env1 = createMockEnvironment("/higher-ed");
  assert.equal(env1.getActivePage(), "page-higher-education");
  assert.equal(env1.getActiveNav(), "nav-higher-education");
  assert.equal(env1.getLastReplaced()?.url, "/higher-education");

  const env2 = createMockEnvironment("/higher-education");
  assert.equal(env2.getActivePage(), "page-higher-education");
  assert.equal(env2.getActiveNav(), "nav-higher-education");
  assert.equal(env2.getLastReplaced()?.url, "/higher-education");
});

test("navigating to /partnership and /partner displays Partnership page", () => {
  const env1 = createMockEnvironment("/partnership");
  assert.equal(env1.getActivePage(), "page-partnership");
  assert.equal(env1.getActiveNav(), "nav-partnership");
  assert.equal(env1.getLastReplaced()?.url, "/partnership");

  const env2 = createMockEnvironment("/partner");
  assert.equal(env2.getActivePage(), "page-partnership");
  assert.equal(env2.getActiveNav(), "nav-partnership");
  assert.equal(env2.getLastReplaced()?.url, "/partnership");
});

test("navigating to /about, /contact, /privacy, /governance matches respective pages and URLs", () => {
  assert.equal(createMockEnvironment("/about").getActivePage(), "page-about");
  assert.equal(createMockEnvironment("/contact").getActivePage(), "page-contact");
  assert.equal(createMockEnvironment("/privacy").getActivePage(), "page-privacy");
  assert.equal(createMockEnvironment("/governance").getActivePage(), "page-governance");
});

test("navigating to /thinkmap/margin preserves full ThinkMap sub-route", () => {
  const env = createMockEnvironment("/thinkmap/margin");
  assert.equal(env.getActivePage(), "page-thinkmap");
  assert.equal(env.getActiveNav(), "nav-thinkmap");
  assert.equal(env.getLastReplaced()?.url, "/thinkmap/margin");
});

test("index.html navbar has School button with showPage('school') and id='nav-school'", () => {
  assert.match(indexHtml, /<button\s+onclick="showPage\('school'\)"\s+id="nav-school">School<\/button>/);
});
