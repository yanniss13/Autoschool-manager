// Quiz d'entrainement au code, affiche une question a la fois.
// L'eleve valide sa reponse, voit immediatement la correction (bonne/mauvaise + explication),
// puis passe a la suivante. Le score affiche ici est indicatif : le serveur reste la source de
// verite (il re-corrige les reponses envoyees au moment de l'enregistrement).
// Le changement de theme recharge les questions en AJAX (sans recharger toute la page).
// Chargement "defer" : le DOM est pret a l'execution.
(function () {
  'use strict';

  const form = document.getElementById('training-quiz');
  if (!form) return;

  const body = form.querySelector('[data-quiz-body]');

  // (Re)initialise le quiz sur le contenu courant de data-quiz-body.
  // Appelee au chargement et apres chaque rechargement AJAX de theme.
  function initQuiz() {
    const questions = Array.from(form.querySelectorAll('.quiz-question'));
    const total = questions.length;

    const currentEl = form.querySelector('[data-quiz-current]');
    const barEl = form.querySelector('[data-quiz-bar]');
    const validateBtn = form.querySelector('[data-quiz-validate]');
    const nextBtn = form.querySelector('[data-quiz-next]');
    const finishBtn = form.querySelector('[data-quiz-finish]');
    const resultEl = form.querySelector('[data-quiz-result]');

    if (!validateBtn || !nextBtn) return;

    let index = 0;
    let score = 0;

    if (total === 0) {
      validateBtn.hidden = true;
      return;
    }

    function showQuestion(i) {
      questions.forEach(function (q, qi) {
        q.hidden = qi !== i;
      });
      if (currentEl) currentEl.textContent = String(i + 1);
      if (barEl) barEl.style.width = ((i + 1) / total) * 100 + '%';
    }

    function validate() {
      const question = questions[index];
      const feedback = question.querySelector('[data-quiz-feedback]');
      const checked = question.querySelector('input[type="radio"]:checked');

      // Pas de choix : on invite a en selectionner un, sans verrouiller.
      if (!checked) {
        if (feedback) {
          feedback.className = 'quiz-feedback is-hint';
          feedback.textContent = 'Choisis une reponse avant de valider.';
          feedback.hidden = false;
        }
        return;
      }

      const correct = question.dataset.correct;
      const isRight = checked.value === correct;
      if (isRight) score += 1;

      // Coloration des reponses (sans desactiver les radios pour qu'ils restent envoyes au POST).
      question.querySelectorAll('.choice-row').forEach(function (row) {
        const choice = row.dataset.choice;
        if (choice === correct) row.classList.add('is-correct');
        else if (choice === checked.value) row.classList.add('is-wrong');
      });
      question.classList.add('is-locked');

      if (feedback) {
        feedback.className = 'quiz-feedback ' + (isRight ? 'is-correct' : 'is-wrong');
        feedback.textContent = isRight ? 'Bonne reponse !' : 'Reponse incorrecte.';
        feedback.hidden = false;
      }

      const explanation = question.querySelector('[data-quiz-explanation]');
      if (explanation) explanation.hidden = false;

      validateBtn.hidden = true;
      if (index < total - 1) {
        nextBtn.hidden = false;
      } else {
        finishBtn.hidden = false;
        if (resultEl) {
          resultEl.textContent = 'Score : ' + score + ' / ' + total + '. Clique sur « Terminer et enregistrer ».';
          resultEl.hidden = false;
        }
      }
    }

    function next() {
      if (index >= total - 1) return;
      index += 1;
      showQuestion(index);
      validateBtn.hidden = false;
      nextBtn.hidden = true;
    }

    validateBtn.addEventListener('click', validate);
    nextBtn.addEventListener('click', next);

    showQuestion(0);
  }

  initQuiz();

  // Selecteur de theme : avec JS, on recharge les questions en AJAX (pas de reload -> pas de saut).
  const themeForm = document.getElementById('quiz-theme-form');
  if (themeForm && body && window.fetch) {
    const select = themeForm.querySelector('select[name="theme"]');
    const questionsUrl = form.dataset.questionsUrl || '/student-space/training/questions';

    if (select) {
      select.addEventListener('change', function () {
        fetch(questionsUrl + '?theme=' + encodeURIComponent(select.value), {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
          })
          .then(function (html) {
            body.innerHTML = html;
            initQuiz();
          })
          .catch(function () {
            themeForm.submit(); // repli : rechargement classique
          });
      });
    }
  }
})();
