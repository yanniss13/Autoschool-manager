// Empeche un utilisateur deja connecte d'acceder a /login ou /register.
module.exports = function redirectIfAuth(req, res, next) {
  if (req.session && req.session.employeeId && req.session.authRole === 'employee') {
    return res.redirect('/employee-space');
  }

  if (req.session && req.session.companyId) {
    return res.redirect('/dashboard');
  }
  next();
};
