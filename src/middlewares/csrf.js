// Protection CSRF simple basee sur la session (synchronizer token).
// - genere un jeton unique par session, expose aux vues via res.locals.csrfToken
//   (champ cache _csrf dans les formulaires + balise meta) ;
// - sur les requetes modifiantes (POST/PUT/PATCH/DELETE), verifie que le jeton
//   recu correspond a celui de la session, sinon repond 403.
const crypto = require('crypto');

module.exports = function csrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutating.includes(req.method)) {
    const received =
      (req.body && req.body._csrf) ||
      req.query._csrf ||
      req.headers['x-csrf-token'];

    if (received !== req.session.csrfToken) {
      return res.status(403).render('errors/500', { title: 'Erreur' });
    }
  }

  next();
};
