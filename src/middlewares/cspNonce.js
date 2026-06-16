// Genere un nonce CSP unique par requete, expose aux vues via res.locals.cspNonce.
// Permet d'autoriser les rares scripts inline legitimes (ex. anti-flash du theme)
// sans ouvrir 'unsafe-inline'. Doit etre monte AVANT Helmet (qui lit le nonce).
const crypto = require('crypto');

module.exports = function cspNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
};
