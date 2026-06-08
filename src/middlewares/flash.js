// Middleware "flash" minimal.
// Permet de deposer un message lors d'une requete (ex: avant une redirection)
// et de l'afficher a la requete suivante via res.locals.flash dans les vues.
//
// Utilisation dans un controleur :
//   req.flash('success', 'Operation reussie');
//   res.redirect('/dashboard');
module.exports = function flash(req, res, next) {
  // On expose les messages deposes lors de la requete precedente, puis on les vide.
  res.locals.flash = req.session.flash || {};
  req.session.flash = {};

  // Aide pour deposer un message destine a la prochaine requete.
  req.flash = (type, message) => {
    if (!req.session.flash) req.session.flash = {};
    req.session.flash[type] = message;
  };

  next();
};
