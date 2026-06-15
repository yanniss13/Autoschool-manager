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

module.exports = { toDateTimeLocal, formatDateTime };
