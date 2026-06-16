// Protege l'espace employe : redirige vers la connexion employe si necessaire.
module.exports = function requireEmployeeAuth(req, res, next) {
  const isEmployeeSession =
    req.session && req.session.authRole === 'employee' && req.session.employeeId;

  if (!isEmployeeSession) {
    req.flash('error', 'Veuillez vous connecter à votre espace employé.');
    return res.redirect('/employee-login');
  }

  next();
};
