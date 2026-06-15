// Protege les routes internes : redirige vers /login si aucune session valide.
module.exports = function requireAuth(req, res, next) {
  const isCompanySession =
    req.session &&
    req.session.companyId &&
    (!req.session.authRole || req.session.authRole === 'company');

  if (!isCompanySession) {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page.');
    return res.redirect('/login');
  }
  next();
};
