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

  // --- Menu « berger » (detection du retour a la ligne) ---
  // Le bouton n'apparait que lorsque les liens ne tiennent plus sur une ligne :
  // on mesure le debordement reel de la navbar (liens en flex:0 0 auto nowrap)
  // puis on bascule en mode replie (.nav-collapsed) -> panneau deroulant.
  const navbar = document.querySelector('.navbar');
  const navToggle = document.getElementById('navbar-toggle');
  const navLinks = document.getElementById('primary-nav');

  if (navbar && navToggle && navLinks) {
    function closeNav() {
      navbar.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    }

    function openNav() {
      navbar.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Fermer le menu');
    }

    // Decide si la navbar doit passer en mode replie. La mesure est synchrone
    // (on retire la classe, on lit, on la repose) : aucun clignotement visible.
    function updateNav() {
      navbar.classList.remove('nav-collapsed');
      const overflowing = navbar.scrollWidth > navbar.clientWidth + 1;
      if (overflowing) {
        navbar.classList.add('nav-collapsed');
      } else {
        // En mode etendu, le panneau n'a plus de sens : on le referme.
        closeNav();
      }
    }

    navToggle.addEventListener('click', function () {
      if (navbar.classList.contains('nav-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Fermeture sur clic d'un lien du panneau.
    navLinks.addEventListener('click', function (event) {
      if (event.target.closest('a, button')) closeNav();
    });

    // Fermeture sur clic en dehors de la navbar.
    document.addEventListener('click', function (event) {
      if (!navbar.contains(event.target)) closeNav();
    });

    // Fermeture au clavier (Echap).
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    // Re-mesure a chaque changement de taille de la navbar.
    if ('ResizeObserver' in window) {
      new ResizeObserver(updateNav).observe(navbar);
    } else {
      window.addEventListener('resize', updateNav);
    }
    updateNav();

    // La police auto-hebergee peut arriver apres ce script et modifier la
    // largeur des liens : on re-mesure une fois les polices pretes.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateNav);
    }
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
