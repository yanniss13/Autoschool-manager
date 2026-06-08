// Empeche un utilisateur deja connecte d'acceder a /login ou /register.
module.exports = function redirectIfAuth(req, res, next) {
  if (req.session && req.session.companyId) {
    return res.redirect('/dashboard');
  }
  next();
};
