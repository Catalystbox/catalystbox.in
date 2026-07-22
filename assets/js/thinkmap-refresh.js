(function () {
  var queryKey = 'thinkmapRoute';
  var path = window.location.pathname
    .replace(/\/index\.html$/i, '')
    .replace(/\/+$/, '') || '/';

  function isAppRoute(value) {
    return /^\/thinkmap(?:\/[a-z0-9-]+)?$/i.test(value);
  }

  // The main site shell reads this value before its router initializes.
  if (path === '/') {
    var target = new URLSearchParams(window.location.search).get(queryKey);
    if (target) {
      target = target.replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      if (isAppRoute(target)) window.__THINKMAP_REFRESH_ROUTE__ = target;
    }
    return;
  }

  // GitHub Pages serves physical ThinkMap HTML files on refresh. Hand the
  // route back to the main shell so its global navbar and page chrome remain.
  if (isAppRoute(path)) {
    window.__THINKMAP_REFRESH_REDIRECTING__ = true;
    window.location.replace('/?' + queryKey + '=' + encodeURIComponent(path));
  }
})();