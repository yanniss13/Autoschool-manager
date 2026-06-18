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
  const answeredEl = form.querySelector('[data-exam-answered]');
  const barEl = form.querySelector('[data-exam-bar]');
  const timerEl = form.querySelector('[data-exam-timer]');
  const prevBtn = form.querySelector('[data-exam-prev]');
  const nextBtn = form.querySelector('[data-exam-next]');

  let index = 0;
  let timedOut = false;

  // Nombre de questions ayant une reponse cochee.
  function answeredCount() {
    return questions.filter(function (q) {
      return q.querySelector('input[type="radio"]:checked');
    }).length;
  }

  function refreshAnswered() {
    if (answeredEl) answeredEl.textContent = String(answeredCount());
  }

  form.addEventListener('change', refreshAnswered);
  refreshAnswered();

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

  // --- Demarrage manuel + minuteur ---
  // L'examen (et donc le chrono) ne demarre qu'au clic sur "Demarrer", pour ne pas
  // lancer le compte a rebours des l'arrivee sur la page.
  const startWrap = form.querySelector('[data-exam-start]');
  const startBtn = form.querySelector('[data-exam-start-btn]');
  const examBody = form.querySelector('[data-exam-body]');

  let tick = null;
  let started = false;
  const duration = parseInt(form.dataset.duration, 10);

  function startTimer() {
    // Garde : un seul minuteur a la fois (evite un double compte a rebours).
    if (tick) return;
    if (Number.isNaN(duration) || duration <= 0 || !timerEl) return;
    let remaining = duration;

    const render = function () {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      timerEl.classList.toggle('is-urgent', remaining <= 60);
    };

    render();
    tick = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(tick);
        tick = null;
        render();
        timedOut = true;
        form.submit(); // temps ecoule -> correction immediate (sans confirmation)
        return;
      }
      render();
    }, 1000);
  }

  function startExam() {
    if (started) return; // idempotent : un seul demarrage, meme si re-declenche
    started = true;
    if (startWrap) startWrap.hidden = true;
    if (examBody) examBody.hidden = false;
    show(0);
    refreshAnswered();
    startTimer();
  }

  if (startBtn) {
    startBtn.addEventListener('click', startExam);
  } else {
    startExam(); // pas de bouton (cas limite) : on demarre directement
  }

  // Garde a la soumission manuelle : prevenir si des questions restent vides.
  // (Le temps ecoule passe par form.submit() -> n'emet pas l'evenement, donc pas de confirmation.)
  form.addEventListener('submit', function (event) {
    if (!timedOut && answeredCount() < total) {
      if (!window.confirm('Il reste des questions sans reponse. Terminer l\'examen quand meme ?')) {
        event.preventDefault();
        return;
      }
    }
    if (tick) { clearInterval(tick); tick = null; }
  });
})();
