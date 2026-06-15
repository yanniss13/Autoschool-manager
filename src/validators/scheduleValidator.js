// Validation serveur des creneaux de planning.

const TITLE_MAX = 120;
const NOTE_MAX = 500;

function parsePositiveInt(value) {
  const raw = (value != null ? String(value) : '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDateTime(value) {
  const raw = (value || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateScheduleSlot(body) {
  const errors = {};

  const employeeId = parsePositiveInt(body.employeeId);
  const studentId = parsePositiveInt(body.studentId);
  const title = (body.title || '').trim();
  const startsAt = parseDateTime(body.startsAt);
  const endsAt = parseDateTime(body.endsAt);
  const noteRaw = (body.note || '').trim();

  if (!employeeId) errors.employeeId = "L'employe est obligatoire.";
  if (!studentId) errors.studentId = "L'eleve est obligatoire.";

  if (!title) {
    errors.title = 'Le titre est obligatoire.';
  } else if (title.length > TITLE_MAX) {
    errors.title = `Le titre ne doit pas depasser ${TITLE_MAX} caracteres.`;
  }

  if (!startsAt) errors.startsAt = 'La date de debut est obligatoire.';
  if (!endsAt) errors.endsAt = 'La date de fin est obligatoire.';
  if (startsAt && endsAt && endsAt <= startsAt) {
    errors.endsAt = 'La date de fin doit etre apres la date de debut.';
  }

  if (noteRaw.length > NOTE_MAX) {
    errors.note = `La note ne doit pas depasser ${NOTE_MAX} caracteres.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      employeeId,
      studentId,
      title,
      startsAt,
      endsAt,
      note: noteRaw || null,
    },
  };
}

module.exports = { validateScheduleSlot };
