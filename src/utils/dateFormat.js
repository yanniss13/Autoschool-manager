function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocal(date) {
  if (!date) return '';
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
}

function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

// Lundi 00:00 de la semaine contenant `date` (semaine lundi -> dimanche).
function startOfWeek(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Nouvelle date decalee de `n` jours (n peut etre negatif).
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// "YYYY-MM-DD" en heure locale (pour les liens de creation).
function toDateInput(date) {
  if (!date) return '';
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

// "HH:MM" en heure locale.
function formatTime(date) {
  if (!date) return '';
  return pad(date.getHours()) + ':' + pad(date.getMinutes());
}

// Duree en minutes -> "8h", "3h30", "0h".
function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hours}h` : `${hours}h${pad(mins)}`;
}

module.exports = {
  toDateTimeLocal,
  formatDateTime,
  startOfWeek,
  addDays,
  toDateInput,
  formatTime,
  formatDuration,
};
