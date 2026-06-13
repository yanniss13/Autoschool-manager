// Petits helpers HTTP partages par les controleurs.

// Convertit un parametre d'URL en identifiant numerique valide, ou null.
// (Number.isInteger ecarte "abc", "1.5", "" et les valeurs negatives.)
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Repond par la page 404 (ressource inexistante OU hors de l'entreprise courante :
// on ne distingue pas les deux, pour ne pas divulguer l'existence d'une ressource).
function notFound(res) {
  return res.status(404).render('errors/404', { title: 'Introuvable' });
}

module.exports = { parseId, notFound };
