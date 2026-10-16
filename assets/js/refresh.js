/* Small, accessible interactions for the visual refresh. */
(function () {
  const loopDetails = {
    declare: 'A useful connection starts with understanding what matters: the need, the context, and the outcome you are working towards.',
    match: 'Use that context to explore relevant providers and possibilities. A thoughtful match is about fit, not simply finding another option.',
    verify: 'Review what happened against the original need. Carry useful learning into the next decision so each connection has a chance to improve the next.'
  };
  document.querySelectorAll('[data-loop-step]').forEach(button => {
    button.addEventListener('click', () => {
      const step = button.dataset.loopStep;
      document.querySelectorAll('[data-loop-step]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelector('.cb-loop-panel').dataset.loopActive = step;
      document.getElementById('cb-loop-detail').textContent = loopDetails[step];
    });
  });
  const tools = {
    education: { title: 'An education investment.\nA little more perspective.', description: 'Weigh the cost of an education path against possible returns. Make your assumptions visible before you make your next move.', label: 'Try Education ROI', route: 'thinkmap/education-roi', note: 'See the trade-offs.' },
    margin: { title: 'Your business idea.\nMeet the bigger picture.', description: 'Compare a business or self-employment path with a job. Explore costs, assumptions and the trade-offs behind the choice.', label: 'Try Margin', route: 'thinkmap/margin', note: 'Explore both paths.' },
    podium: { title: 'A sporting ambition.\nA thoughtful game plan.', description: 'Explore sporting-career scenarios and the commitments behind them. Give your ambition room for a practical conversation.', label: 'Try Podium', route: 'thinkmap/podium-india', note: 'Think beyond the finish line.' },
    exam: { title: 'Your strengths.\nA direction to explore.', description: 'Think through exam fit against your subject strengths and interests. Use a little structure to explore the options ahead.', label: 'Try Exam Compass', route: 'thinkmap/exam-compass-india', note: 'Find a useful direction.' },
    mind: { title: 'A fresh perspective.\nStarting with yourself.', description: 'Make space to reflect on your thinking and self-image. Explore a different view of the questions you bring to a decision.', label: 'Try Mind Mirror', route: 'thinkmap/mind-mirror', note: 'Make room for reflection.' }
  };
  const drawing = document.querySelector('.cb-tool-art > svg');
  const drawings = {
    education: drawing.innerHTML,
    margin: '<path d="M55 215V45m0 170h350" stroke="#193b31" opacity=".35"/><path d="M55 190c70-130 155 35 345-145" stroke="#193b31" stroke-width="4" fill="none"/><path d="M55 190c95 10 150-75 345-55" stroke="#f8f7f1" stroke-width="3" stroke-dasharray="5 7" fill="none"/><circle cx="400" cy="45" r="7" fill="#193b31"/><circle cx="400" cy="135" r="7" fill="#f8f7f1"/>',
    podium: '<path d="M65 220V180h100v-60h110v35h110v65" fill="#f8f7f1" stroke="#75816d"/><path d="M65 220h320" stroke="#193b31"/><circle cx="220" cy="70" r="32" fill="#e9c8ac" stroke="#193b31" stroke-width="1.5"/><path d="m220 50 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" fill="#193b31"/><path d="m198 42-10-25m54 25 10-25" stroke="#193b31" stroke-width="10"/>',
    exam: '<circle cx="230" cy="132" r="84" stroke="#193b31" opacity=".25"/><circle cx="230" cy="132" r="61" stroke="#193b31"/><path d="m261 88-18 57-44 32 18-58Z" fill="#193b31"/><path d="m261 88-44 31 26 26Z" fill="#f8f7f1"/><circle cx="230" cy="132" r="5" fill="#193b31"/><path d="M230 38V25m0 214v-13M136 132h-13m214 0h-13" stroke="#193b31"/>',
    mind: '<rect x="122" y="36" width="128" height="183" rx="64" fill="#ece5f3" stroke="#86749d" stroke-width="1.5"/><rect x="206" y="56" width="128" height="183" rx="64" fill="#f8f7f1" stroke="#193b31" stroke-width="1.5"/><path d="m270 100 11 31 31 11-31 11-11 31-11-31-31-11 31-11Z" fill="#b8a8d0"/><path d="m159 78 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="#86749d"/>'
  };
  document.querySelectorAll('[data-cb-tool]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.cbTool;
      const tool = tools[key];
      document.querySelectorAll('[data-cb-tool]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.getElementById('cb-tool-title').textContent = tool.title;
      document.getElementById('cb-tool-description').textContent = tool.description;
      const link = document.getElementById('cb-tool-link');
      link.firstChild.textContent = tool.label + ' ';
      link.href = '/' + tool.route;
      link.onclick = event => { event.preventDefault(); showPage(tool.route); };
      document.querySelector('.cb-tool-feature').dataset.toolActive = key;
      document.querySelector('.cb-chart-tag').textContent = tool.note;
      drawing.innerHTML = drawings[key];
    });
  });
  document.addEventListener('click', event => {
    document.querySelectorAll('.cb-platform-menu[open]').forEach(menu => {
      if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.cb-platform-menu[open]').forEach(menu => { menu.open = false; menu.querySelector('summary').focus(); });
      const nav = document.querySelector('.nav-links');
      const wasOpen = nav?.classList.contains('active');
      nav?.classList.remove('active');
      document.querySelector('.mobile-menu-btn')?.setAttribute('aria-expanded', 'false');
      if (wasOpen) document.querySelector('.mobile-menu-btn')?.focus();
    }
  });
  document.querySelector('.cb-skip-link')?.addEventListener('click', event => {
    const target = document.querySelector('.page.active h1') || document.querySelector('.page.active');
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus();
    target.scrollIntoView({ block: 'start' });
  });
})();
