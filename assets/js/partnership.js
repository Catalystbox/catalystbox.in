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
  const submitBtn = form.querySelector('.submit-btn');

  const ptypeInput = document.querySelector('#page-partnership input[name="ptype"]:checked');

  // Collect data
  const data = {
    name: document.getElementById('pfname').value + ' ' + document.getElementById('plname').value,
    email: document.getElementById('pemail').value,
    organization: document.getElementById('porg').value,
    country: document.getElementById('pcountry').value,
    schools: document.getElementById('pschools').value,
    type: ptypeInput ? ptypeInput.value : 'Not specified',
    message: document.getElementById('pmessage').value,
    _subject: `New Partnership Request: ${document.getElementById('porg').value}`
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
      submitBtn.innerText = "Send Expression of Interest →";
      submitBtn.disabled = false;
  });
}
