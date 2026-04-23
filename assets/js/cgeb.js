document.addEventListener('DOMContentLoaded', function() {
  // Progress bar
  const progressBar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    if(!document.getElementById('page-cgeb').classList.contains('active')) return;
    const total = document.body.scrollHeight - window.innerHeight;
    const pct = (window.scrollY / total) * 100;
    if(progressBar) progressBar.style.width = pct + '%';
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('#page-cgeb .reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => revealObserver.observe(el));

  // Side nav active state
  const sideNav = document.getElementById('side-nav');
  const navDots = document.querySelectorAll('#page-cgeb .nav-dot');
  const sections = document.querySelectorAll('#page-cgeb section[id]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navDots.forEach(d => d.classList.remove('active'));
        const active = document.querySelector(`#page-cgeb .nav-dot[data-target="${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // Show side nav after scrolling
  window.addEventListener('scroll', () => {
    if(!document.getElementById('page-cgeb').classList.contains('active')) return;
    if(sideNav) {
        if (window.scrollY > 200) sideNav.classList.add('visible');
        else sideNav.classList.remove('visible');
    }
  });

  // Side nav click
  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      if (target) {
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // TOC click
  const tocLinks = document.querySelectorAll('#page-cgeb .toc-list a');
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // Bar chart animation
  const barChart = document.getElementById('bar-chart');
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('#page-cgeb .bar-fill').forEach(bar => {
          const w = bar.dataset.w;
          bar.style.width = w + '%';
        });
        barObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  if (barChart) barObserver.observe(barChart);
});
