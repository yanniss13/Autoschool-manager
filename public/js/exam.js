// Examen blanc : navigation question par question + minuteur a rebours.
// A la fin du temps, l'examen se soumet automatiquement (correction cote serveur).
// Chargement "defer" : le DOM est pret a l'execution.
(function () {
  'use strict';

  const form = document.getElementById('exam-form');
  if (!form) return;

  const questions = Array.from(form.querySelectorAll('.exam-question'));
  const total = questions.length;
  if (total === 0) return;

  const currentEl = form.querySelector('[data-exam-current]');
  const barEl = form.querySelector('[data-exam-bar]');
  const timerEl = form.querySelector('[data-exam-timer]');
  const prevBtn = form.querySelector('[data-exam-prev]');
  const nextBtn = form.querySelector('[data-exam-next]');

  let index = 0;

  function show(i) {
    questions.forEach(function (q, qi) {
      q.hidden = qi !== i;
    });
    if (currentEl) currentEl.textContent = String(i + 1);
    if (barEl) barEl.style.width = ((i + 1) / total) * 100 + '%';
    if (prevBtn) prevBtn.hidden = i === 0;
    if (nextBtn) nextBtn.hidden = i === total - 1;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (index < total - 1) { index += 1; show(index); }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (index > 0) { index -= 1; show(index); }
    });
  }

  show(0);

  // --- Minuteur ---
  let remaining = parseInt(form.dataset.duration, 10);
  if (!Number.isNaN(remaining) && remaining > 0 && timerEl) {
    let submitted = false;

    const render = function () {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      timerEl.classList.toggle('is-urgent', remaining <= 60);
    };

    render();
    const tick = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(tick);
        render();
        if (!submitted) { submitted = true; form.submit(); } // temps ecoule -> correction
        return;
      }
      render();
    }, 1000);

    // On evite le double envoi si l'eleve termine manuellement.
    form.addEventListener('submit', function () {
      submitted = true;
      clearInterval(tick);
    });
  }
})();
