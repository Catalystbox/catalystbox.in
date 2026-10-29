(function () {
  if (window.location.pathname !== '/') return;
  var target = new URLSearchParams(window.location.search).get('thinkmapRoute');
  if (target && /^\/thinkmap(?:\/[a-z0-9-]+)?\/?$/i.test(target)) {
    window.__THINKMAP_REFRESH_ROUTE__ = target.replace(/\/+$/, '');
  }
})();
