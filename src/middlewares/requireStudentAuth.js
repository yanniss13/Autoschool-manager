// Protege l'espace eleve : redirige vers la connexion eleve si necessaire.
module.exports = function requireStudentAuth(req, res, next) {
  const isStudentSession =
    req.session && req.session.authRole === 'student' && req.session.studentId;

  if (!isStudentSession) {
    req.flash('error', 'Veuillez vous connecter à votre espace élève.');
    return res.redirect('/espace-login');
  }

  next();
};
