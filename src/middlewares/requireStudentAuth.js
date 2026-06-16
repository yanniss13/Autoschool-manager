// Protege l'espace eleve : redirige vers la connexion eleve si necessaire.
module.exports = function requireStudentAuth(req, res, next) {
  const isStudentSession =
    req.session && req.session.authRole === 'student' && req.session.studentId;

  if (!isStudentSession) {
    req.flash('error', 'Veuillez vous connecter a votre espace eleve.');
    return res.redirect('/student-login');
  }

  next();
};
