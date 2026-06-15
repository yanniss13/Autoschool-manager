// Petits helpers HTTP partages par les controleurs.

// Convertit un parametre d'URL en identifiant numerique decimal strict, ou null.
// On refuse volontairement "1e3", "0x10" et les espaces pour eviter les IDs ambigus.
function parseId(raw) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseDateParam(raw, fallback) {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Parse la plage demandee par FullCalendar. Les bornes absentes gardent un defaut,
// les bornes presentes mais invalides renvoient null pour permettre un 400 propre.
function parseDateRange(query) {
  const start = parseDateParam(query.start, new Date(0));
  const end = parseDateParam(query.end, new Date('2999-01-01'));
  if (!start || !end || start >= end) return null;
  return { start, end };
}

// Repond par la page 404 (ressource inexistante OU hors de l'entreprise courante :
// on ne distingue pas les deux, pour ne pas divulguer l'existence d'une ressource).
function notFound(res) {
  return res.status(404).render('errors/404', { title: 'Introuvable' });
}

module.exports = { parseId, parseDateRange, notFound };
