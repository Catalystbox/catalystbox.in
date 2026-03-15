/* ── FORM URLS ── */
var PARTNER_FORM_URL  = "https://docs.google.com/forms/d/e/1FAIpQLSdQn30COlQGDSYYmZJWUd2nswekDJ2tTr13K8e3x-nJZPcP7Q/viewform";
var CONTACT_FORM_URL  = "https://docs.google.com/forms/d/e/1FAIpQLSdV6QmpIYF7dPeFuvmuuE317LbKTRfaZpQX37pGka8j-rTJ5Q/viewform";

function openPartnerForm() { window.open(PARTNER_FORM_URL, '_blank'); }
function openContactForm()  { window.open(CONTACT_FORM_URL, '_blank'); }

/* ── PAGE SWITCHING ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('nav-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(() => {
    document.querySelectorAll('#page-' + id + ' .fade-up').forEach(el => el.classList.remove('visible'));
    setTimeout(() => observeFadeUps(), 60);
  }, 10);
  if (id === 'home') triggerBars();
}

/* ── FADE UP OBSERVER ── */
function observeFadeUps() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        
        // Trigger number counting animation if applicable
        const statNums = e.target.querySelectorAll('.stat-num');
        statNums.forEach(num => {
          if (!num.classList.contains('counted')) {
            animateValue(num);
            num.classList.add('counted');
          }
        });
        
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.page.active .fade-up').forEach(el => obs.observe(el));
}

/* ── NUMBER COUNTING ANIMATION ── */
function animateValue(obj) {
  const text = obj.innerText;
  const target = parseFloat(text.replace(/[^0-9.]/g, ''));
  if (isNaN(target)) return;

  const suffix = text.replace(/[0-9.]/g, ''); // Extract 'M', 'K+', '+', etc.
  const duration = 2000;
  const startTimestamp = performance.now();
  const decimals = text.includes('.') ? 1 : 0;

  const step = (timestamp) => {
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // easeOutQuart
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const current = easeProgress * target;
    
    obj.innerHTML = current.toFixed(decimals) + suffix;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = text; // Ensure exact final text
    }
  };
  window.requestAnimationFrame(step);
}

/* ── INDEX BARS ── */
function triggerBars() {
  setTimeout(() => {
    const barObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.index-bar-fill').forEach(f => { f.style.width = f.dataset.width + '%'; });
          barObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    const idx = document.querySelector('#page-home #index');
    if (idx) barObs.observe(idx);
  }, 100);
}

/* ── SET DASHBOARD TAB ── */
function switchDashTab(tabId) {
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = ['dash-tab-demo', 'dash-tab-dash'];
  
  // Reset all
  tabs.forEach(t => {
    t.classList.remove('active');
    t.style.color = 'var(--muted)';
    t.style.fontWeight = '500';
    t.querySelector('div').style.background = 'transparent';
  });
  panels.forEach(p => {
    document.getElementById(p).style.display = 'none';
  });
  
  // Set active
  const activeBtn = Array.from(tabs).find(t => t.getAttribute('onclick').includes(tabId));
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.color = '#fff';
    activeBtn.style.fontWeight = '600';
    activeBtn.querySelector('div').style.background = 'var(--amber)';
    document.getElementById('dash-tab-' + tabId).style.display = 'flex'; // Wait for block/flex
    
    if (tabId === 'dash') {
      document.getElementById('dash-tab-dash').style.display = 'block';
    }
  }
}

/* ── FAQ ACCORDION ── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  item.closest('.faq-section').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function showCat(id, btn) {
  document.querySelectorAll('.faq-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.cat-list button').forEach(b => b.classList.remove('active'));
  document.getElementById('cat-' + id).classList.add('active');
  btn.classList.add('active');
  const first = document.getElementById('cat-' + id).querySelector('.faq-item');
  if (first) first.classList.add('open');
}

/* ── LIGHT/DARK THEME TOGGLE ── */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('theme-btn');
  if (btn) {
    btn.innerText = isLight ? '🌙' : '☀️';
  }
}

/* ── PARALLAX EFFECT ── */
function initParallax() {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg && scrolled < window.innerHeight) {
      // Subtle shift downwards and slight rotation for standard parallax
      heroBg.style.transform = `translateY(${scrolled * 0.35}px) rotate(${scrolled * 0.02}deg)`;
    }
  });
}

/* ── INIT ── */
(function() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  var home = document.getElementById('page-home');
  if (home) home.classList.add('active');
})();

document.addEventListener('DOMContentLoaded', function() {
  observeFadeUps();
  triggerBars();
  initParallax();
});
