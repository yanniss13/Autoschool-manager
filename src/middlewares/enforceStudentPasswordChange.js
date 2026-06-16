// Force le changement de mot de passe a la 1re connexion de l'eleve.
// Monte DANS le routeur /student-space (donc req.path est relatif : '/password', '/training'...).
// Tant que `mustChangePassword` est vrai, tout l'espace eleve redirige vers la page
// de changement de mot de passe (sauf la page elle-meme). L'eleve peut toujours se
// deconnecter (route /student-logout, hors de ce routeur).
module.exports = function enforceStudentPasswordChange(req, res, next) {
  if (req.student && req.student.mustChangePassword && req.path !== '/password') {
    return res.redirect('/student-space/password');
  }
  next();
};
