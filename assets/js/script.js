/* ── FEATURE TOGGLES ── */
var CONFIG = {
  enableSolutions: false, // Set to true to activate the Solutions page
  enableCareers: false,   // Set to true to activate the Careers page
  enablePricing: false    // Set to true to activate the Pricing page
};

/* ── PAGE VISIBILITY CONFIG APPLIER ── */
function applyPageVisibilityConfig() {
  if (!CONFIG.enableSolutions) {
    const navBtn = document.getElementById('nav-solutions');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = 'none';
      else navBtn.style.display = 'none';
    }
    document.querySelectorAll("button[onclick*='solutions'], a[onclick*='solutions']").forEach(el => {
      el.style.display = 'none';
    });
  } else {
    const navBtn = document.getElementById('nav-solutions');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = '';
      else navBtn.style.display = '';
    }
    document.querySelectorAll("button[onclick*='solutions'], a[onclick*='solutions']").forEach(el => {
      el.style.display = '';
    });
  }

  if (!CONFIG.enableCareers) {
    const navBtn = document.getElementById('nav-careers');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = 'none';
      else navBtn.style.display = 'none';
    }
    document.querySelectorAll("button[onclick*='careers'], a[onclick*='careers']").forEach(el => {
      el.style.display = 'none';
    });
  } else {
    const navBtn = document.getElementById('nav-careers');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = '';
      else navBtn.style.display = '';
    }
    document.querySelectorAll("button[onclick*='careers'], a[onclick*='careers']").forEach(el => {
      el.style.display = '';
    });
  }

  if (!CONFIG.enablePricing) {
    const navBtn = document.getElementById('nav-pricing');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = 'none';
      else navBtn.style.display = 'none';
    }
    document.querySelectorAll("button[onclick*='pricing'], a[onclick*='pricing']").forEach(el => {
      el.style.display = 'none';
    });
  } else {
    const navBtn = document.getElementById('nav-pricing');
    if (navBtn) {
      const parentLi = navBtn.closest('li');
      if (parentLi) parentLi.style.display = '';
      else navBtn.style.display = '';
    }
    document.querySelectorAll("button[onclick*='pricing'], a[onclick*='pricing']").forEach(el => {
      el.style.display = '';
    });
  }
}

/* ── MOBILE MENU ── */
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.toggle('active');
}

/* ── FORM URLS ── */
var PARTNER_FORM_URL  = "https://docs.google.com/forms/d/e/1FAIpQLSdQn30COlQGDSYYmZJWUd2nswekDJ2tTr13K8e3x-nJZPcP7Q/viewform";
var CONTACT_FORM_URL  = "https://docs.google.com/forms/d/e/1FAIpQLSdV6QmpIYF7dPeFuvmuuE317LbKTRfaZpQX37pGka8j-rTJ5Q/viewform";

function openPartnerForm() { window.open(PARTNER_FORM_URL, '_blank'); }
function openContactForm()  { window.open(CONTACT_FORM_URL, '_blank'); }

/* ── PAGE SWITCHING ── */
function showPage(id, pushHistory) {
  if (pushHistory === undefined) pushHistory = true;

  // Intercept and redirect if page is disabled
  if (id === 'solutions' && !CONFIG.enableSolutions) {
    showPage('home', pushHistory);
    return;
  }
  if (id === 'careers' && !CONFIG.enableCareers) {
    showPage('home', pushHistory);
    return;
  }
  if (id === 'pricing' && !CONFIG.enablePricing) {
    showPage('home', pushHistory);
    return;
  }
  if (id === 'faq') {
    showPage('about', pushHistory);
    setTimeout(() => {
      const el = document.getElementById('about-faqs');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  var navBtn = document.getElementById('nav-' + id);
  if (navBtn) navBtn.classList.add('active');
  
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
  
  if (pushHistory) {
    let route = id;
    if (id === 'cgeb') route = 'research';
    if (id === 'home') route = '';
    try {
      window.history.pushState({ page: id }, '', '/' + route);
    } catch (e) {
      console.warn("History API failed:", e);
    }
  }

  setTimeout(() => {
    document.querySelectorAll('#page-' + id + ' .fade-up').forEach(el => el.classList.remove('visible'));
    setTimeout(() => observeFadeUps(), 60);
  }, 10);
  if (id === 'home') triggerBars();
}

window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    showPage(e.state.page, false);
  } else {
    showPage('home', false);
  }
});

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
  // Apply page visibility configuration
  applyPageVisibilityConfig();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  let path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  let targetId = path || 'home';
  if (targetId === 'research') targetId = 'cgeb';
  
  // Route fallback if page is disabled
  if (targetId === 'solutions' && !CONFIG.enableSolutions) {
    targetId = 'home';
  }
  if (targetId === 'careers' && !CONFIG.enableCareers) {
    targetId = 'home';
  }
  if (targetId === 'pricing' && !CONFIG.enablePricing) {
    targetId = 'home';
  }
  
  let shouldScrollToFaq = false;
  if (targetId === 'faq') {
    targetId = 'about';
    shouldScrollToFaq = true;
  }

  var initialPage = document.getElementById('page-' + targetId);
  if (!initialPage) {
    targetId = 'home';
  }
  
  let route = targetId;
  if (targetId === 'cgeb') route = 'research';
  if (targetId === 'home') route = '';
  
  try {
    window.history.replaceState({ page: targetId }, '', '/' + route);
  } catch (e) {
    console.warn("History API replace failed:", e);
  }

  showPage(targetId, false);
  if (shouldScrollToFaq) {
    setTimeout(() => {
      const el = document.getElementById('about-faqs');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  applyPageVisibilityConfig();
  observeFadeUps();
  triggerBars();
  initParallax();

  // Prevent form submission when pressing Enter key in input fields for colleges form
  const cForm = document.getElementById('colleges-form');
  if (cForm) {
    cForm.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    });
  }

  // Smooth scroll for Higher Education page anchor links
  const heLinks = document.querySelectorAll('#page-higher-education a[href^="#"]');
  heLinks.forEach(link => {
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
});

/* ── HIGHER EDUCATION HELPER FUNCTIONS ── */
window.scrollToHigherEdForm = function() {
  showPage('higher-education');
  setTimeout(() => {
    const target = document.getElementById('he-express-interest');
    if (target) {
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, 150);
};

window.handleCollegesSubmit = function(e) {
  e.preventDefault();
  const form = document.getElementById('colleges-form');
  const success = document.getElementById('form-success-he');
  const submitBtn = form.querySelector('.btn-submit');

  // Collect data
  const data = {
    name: document.getElementById('he-fname').value + ' ' + document.getElementById('he-lname').value,
    email: document.getElementById('he-email').value,
    institution: document.getElementById('he-inst').value,
    type: document.getElementById('he-type').value,
    role: document.getElementById('he-role').value,
    message: document.getElementById('he-message').value,
    _subject: `New Higher Ed Expression of Interest: ${document.getElementById('he-inst').value}`
  };

  submitBtn.innerText = "Sending...";
  submitBtn.disabled = true;

  fetch("https://formsubmit.co/ajax/hello@catalystbox.in", {
      method: "POST",
      headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
      form.style.display = 'none';
      success.style.display = 'block';
  })
  .catch(error => {
      alert("There was an error sending your request. Please try again.");
      submitBtn.innerText = "Submit Expression of Interest →";
      submitBtn.disabled = false;
  });
};

