// Ameliorations UI cote client :
//  - bascule du theme clair/sombre (memorisee en localStorage) ;
//  - compteurs animes des cartes de statistiques du tableau de bord.
// Charge avec "defer" : le DOM est deja pret a l'execution.
(function () {
  'use strict';

  const root = document.documentElement;

  // --- Bascule de theme ---
  // L'etat initial (data-theme) est pose tres tot par un petit script inline
  // dans <head> pour eviter tout clignotement au chargement.
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('asm-theme', next);
      } catch (e) {
        /* mode prive / stockage indisponible : on ignore */
      }
    });
  }

  // --- Compteurs animes ---
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.stat-value').forEach(function (el) {
    const target = parseInt(el.textContent.trim(), 10);
    if (Number.isNaN(target)) return; // valeur non numerique : on n'y touche pas

    // Accessibilite / valeurs nulles : on affiche directement le resultat.
    if (reduced || target === 0) {
      el.textContent = target;
      return;
    }

    const duration = 900; // ms
    let startTime = null;
    el.textContent = '0';

    function step(now) {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target; // valeur exacte garantie en fin d'animation
      }
    }

    requestAnimationFrame(step);
  });

  // --- Confirmation avant envoi (remplace les onsubmit inline, compatible CSP stricte) ---
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });

  // --- Auto-soumission au changement (remplace onchange="this.form.submit()") ---
  document.querySelectorAll('[data-autosubmit]').forEach(function (el) {
    el.addEventListener('change', function () {
      if (el.form) el.form.submit();
    });
  });
})();
