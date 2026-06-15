// Protection CSRF simple basee sur la session (synchronizer token).
// - genere un jeton unique par session, expose aux vues via res.locals.csrfToken
//   (champ cache _csrf dans les formulaires + balise meta) ;
// - sur les requetes modifiantes (POST/PUT/PATCH/DELETE), verifie que le jeton
//   recu correspond a celui de la session, sinon repond 403.
const crypto = require('crypto');

// Comparaison a temps constant : un !== classique s'arrete au premier caractere
// different (timing side-channel). On verifie d'abord le type et la longueur, car
// crypto.timingSafeEqual leve une exception si les deux buffers different de taille.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = function csrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutating.includes(req.method)) {
    // Le jeton arrive par le champ cache _csrf des formulaires, ou l'en-tete
    // X-CSRF-Token pour d'eventuelles requetes AJAX. Pas via req.query : un jeton
    // passe en URL fuiterait dans les logs serveur et l'en-tete Referer.
    const received = (req.body && req.body._csrf) || req.headers['x-csrf-token'];

    if (!safeEqual(received, req.session.csrfToken)) {
      // Page 403 dediee : le cas courant n'est pas une attaque mais une session
      // expiree ou un formulaire ouvert avant une reconnexion. Message clair plutot
      // que la page d'erreur 500 generique.
      return res.status(403).render('errors/csrf', { title: 'Session expirée' });
    }
  }

  next();
};
