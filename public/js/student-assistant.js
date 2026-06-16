// Assistant code en AJAX : envoie la question sans recharger la page (donc sans saut en haut).
// Repli : si le JS est absent, le formulaire poste normalement et la page se recharge.
// Chargement "defer" : le DOM est pret a l'execution.
(function () {
  'use strict';

  const form = document.getElementById('assistant-form');
  if (!form || !window.fetch) return; // pas de fetch : on garde le POST classique

  const thread = document.querySelector('[data-assistant-thread]');
  const clearForm = document.getElementById('assistant-clear-form');
  const textarea = form.querySelector('textarea[name="message"]');
  const submitBtn = form.querySelector('[data-assistant-submit]');
  const csrf = (form.querySelector('input[name="_csrf"]') || {}).value || '';

  // Cree et ajoute une bulle (auteur + contenu) au fil. textContent => pas d'injection HTML.
  function addBubble(role, content) {
    const bubble = document.createElement('div');
    bubble.className = 'assistant-bubble assistant-bubble--' + role;

    const author = document.createElement('span');
    author.className = 'assistant-bubble__author';
    author.textContent = role === 'user' ? 'Toi' : 'Assistant';

    const p = document.createElement('p');
    p.textContent = content;

    bubble.appendChild(author);
    bubble.appendChild(p);
    thread.appendChild(bubble);
    return bubble;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const message = (textarea.value || '').trim();
    if (!message) return;

    submitBtn.disabled = true;
    if (thread) thread.hidden = false;

    // Bulle de la question + bulle "..." en attente de la reponse.
    addBubble('user', message);
    const pending = addBubble('assistant', '...');
    pending.scrollIntoView({ block: 'nearest' });

    const body = new URLSearchParams({ _csrf: csrf, message: message });

    fetch(form.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrf,
      },
      body: body.toString(),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        pending.querySelector('p').textContent = data.reply || 'Pas de reponse.';
        textarea.value = '';
        if (clearForm) clearForm.hidden = false;
        pending.scrollIntoView({ block: 'nearest' });
      })
      .catch(function () {
        pending.querySelector('p').textContent = 'Erreur : impossible de joindre l\'assistant. Reessaie.';
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  // Effacement du fil en AJAX (sans rechargement).
  if (clearForm) {
    clearForm.addEventListener('submit', function (event) {
      event.preventDefault();
      fetch(clearForm.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrf,
        },
        body: new URLSearchParams({ _csrf: csrf }).toString(),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          if (thread) {
            thread.innerHTML = '';
            thread.hidden = true;
          }
          clearForm.hidden = true;
        })
        .catch(function () {
          clearForm.submit(); // repli : POST classique
        });
    });
  }
})();
