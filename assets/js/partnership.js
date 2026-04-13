document.addEventListener('DOMContentLoaded', () => {
  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('#page-partnership .reveal').forEach(el => revealObserver.observe(el));

  // FAQ accordion
  document.querySelectorAll('#page-partnership .faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');

      // close all
      document.querySelectorAll('#page-partnership .faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-a').style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
});

window.handlePartnershipSubmit = function(e) {
  e.preventDefault();
  const form = document.getElementById('partnership-form');
  const success = document.getElementById('form-success-p');

  const ptypeInput = document.querySelector('#page-partnership input[name="ptype"]:checked');

  // Collect data
  const data = {
    name: document.getElementById('pfname').value + ' ' + document.getElementById('plname').value,
    email: document.getElementById('pemail').value,
    org: document.getElementById('porg').value,
    country: document.getElementById('pcountry').value,
    schools: document.getElementById('pschools').value,
    type: ptypeInput ? ptypeInput.value : 'Not specified',
    message: document.getElementById('pmessage').value
  };

  // Build mailto link
  const subject = encodeURIComponent(`CatalystBox Global Partnership Interest — ${data.org} (${data.country})`);
  const body = encodeURIComponent(
    `New partnership expression of interest:\n\n` +
    `Name: ${data.name}\n` +
    `Email: ${data.email}\n` +
    `Organisation: ${data.org}\n` +
    `Country: ${data.country}\n` +
    `Schools in scope: ${data.schools}\n` +
    `Partner type: ${data.type}\n\n` +
    `Message:\n${data.message}`
  );

  window.location.href = `mailto:hello@catalystbox.in?subject=${subject}&body=${body}`;

  // Show success state
  form.style.display = 'none';
  success.style.display = 'block';
}
