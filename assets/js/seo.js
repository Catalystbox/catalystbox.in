/* Route metadata mirrors the visible page; no tracking or personal data. */
(function () {
  var base = 'https://www.catalystbox.in';
  var pages = {"":{"title":"CatalystBox | Education Intelligence, Solutions & ThinkMap","description":"CatalystBox brings education intelligence, institutional improvement and decision tools together. Explore Reportcard, Marketplace, ThinkMap and education AI solutions."},"about":{"title":"About CatalystBox | Reportcard, Marketplace, ThinkMap & AI Solutions","description":"CatalystBox is an education intelligence and improvement platform. Reportcard provides institution directories and privacy-protected aggregate feedback. Marketplace connects institutional needs with relevant providers. ThinkMap offers free practical decision tools. We also work with education institutions on analytics, AI consulting, custom AI solutions and research or board partnerships."},"school":{"title":"CatalystBox | School Feedback & Education Benchmarking","description":"Explore the CatalystBox school feedback and benchmarking framework for institutional improvement."},"higher-education":{"title":"CatalystBox | Higher Education Feedback & Benchmarks","description":"Explore higher education feedback and benchmarking for students, faculty, alumni, recruiters and institutions."},"partnership":{"title":"CatalystBox | Education Partnerships & AI Solutions","description":"Work with CatalystBox on education intelligence, institutional improvement, research and AI solutions."},"thinkmap":{"title":"ThinkMap by CatalystBox | Free Practical Decision Tools","description":"Explore Education ROI, Margin, Podium, Exam Compass and Mind Mirror: free decision tools by CatalystBox."}};
  pages.privacy = { title: 'CatalystBox | Privacy Policy', description: 'How CatalystBox handles feedback, enquiries and account information, with participation choices and privacy contact details.' };
  pages.governance = { title: 'CatalystBox | Data Governance', description: 'Data minimisation, aggregate reporting, authorised access and human review in the CatalystBox institutional feedback framework.' };
  window.updateRouteMetadata = function (route) {
    var key = (route || '').replace(/^\/+|\/+$/g, '');
    var info = pages[key] || (key.indexOf('thinkmap/') === 0 ? pages.thinkmap : pages['']);
    document.title = info.title;
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', info.description);
    var url = base + '/' + (key ? key + '/' : '');
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
    [['og:title',info.title],['og:description',info.description],['og:url',url]].forEach(function (item) {
      var el = document.querySelector('meta[property="' + item[0] + '"]');
      if (el) el.setAttribute('content',item[1]);
    });
  };
})();
