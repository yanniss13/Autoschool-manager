// Construction des donnees d'agenda hebdomadaire (axe horaire) partagees par la vue
// gerant et la vue employe. Aucune dependance Prisma : pures transformations.
const { startOfWeek, addDays, toDateInput, formatTime, formatDuration } = require('./dateFormat');

const PALETTE_SIZE = 8;
const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Plage horaire affichee : 07h -> 20h (13 lignes d'une heure).
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20;
const DAY_START_MIN = DAY_START_HOUR * 60;
const DAY_SPAN_MIN = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 780

// Couleur stable par employe (classe CSS .slot-color-N).
function colorIndexFor(id) {
  return id % PALETTE_SIZE;
}

// Parse ?week=YYYY-MM-DD en date locale ; defaut = aujourd'hui. Renvoie le lundi 00:00.
function resolveWeekStart(weekParam) {
  if (typeof weekParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const [y, m, d] = weekParam.split('-').map(Number);
    return startOfWeek(new Date(y, m - 1, d));
  }
  return startOfWeek(new Date());
}

// Bornes + libelles de la semaine demandee.
function weekRange(weekParam) {
  const start = resolveWeekStart(weekParam);
  const lastDay = addDays(start, 6);
  return {
    start,
    end: addDays(start, 7),
    weekInput: toDateInput(start),
    weekLabel: `${start.getDate()} ${MONTHS[start.getMonth()]} – ${lastDay.getDate()} ${MONTHS[lastDay.getMonth()]} ${lastDay.getFullYear()}`,
    prevWeek: toDateInput(addDays(start, -7)),
    nextWeek: toDateInput(addDays(start, 7)),
  };
}

// Libelles de l'axe des heures : 07h .. 19h (debut de chaque ligne).
function hourLabels() {
  const labels = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h += 1) {
    labels.push(`${String(h).padStart(2, '0')}h`);
  }
  return labels;
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// Agenda d'UN employe : 7 jours, chacun avec ses blocs positionnes en pourcentage.
function buildAgenda(slots, weekStart) {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    const dateInput = toDateInput(date);

    const blocks = slots
      .filter((s) => toDateInput(s.startsAt) === dateInput)
      .map((s) => {
        const startMin = minutesOfDay(s.startsAt);
        const endMin = s.endsAt > s.startsAt ? minutesOfDay(s.endsAt) : startMin;
        // Position relative a la plage visible, rognee a [0, DAY_SPAN_MIN].
        const top = Math.min(Math.max(startMin - DAY_START_MIN, 0), DAY_SPAN_MIN);
        const bottom = Math.min(Math.max(endMin - DAY_START_MIN, 0), DAY_SPAN_MIN);
        const minutes = Math.max(0, Math.round((s.endsAt - s.startsAt) / 60000));
        return {
          id: s.id,
          title: s.title,
          startLabel: formatTime(s.startsAt),
          endLabel: formatTime(s.endsAt),
          durationLabel: formatDuration(minutes),
          topPct: (top / DAY_SPAN_MIN) * 100,
          heightPct: ((bottom - top) / DAY_SPAN_MIN) * 100,
        };
      })
      // Exclut les creneaux entierement hors de la plage visible.
      .filter((b) => b.heightPct > 0);

    days.push({
      dateInput,
      weekday: WEEKDAYS[i],
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      blocks,
    });
  }
  return days;
}

module.exports = {
  PALETTE_SIZE,
  DAY_START_HOUR,
  DAY_END_HOUR,
  colorIndexFor,
  weekRange,
  hourLabels,
  buildAgenda,
};
