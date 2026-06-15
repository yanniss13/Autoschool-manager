// Controleur CRUD des creneaux de planning.
// Protege en amont par requireAuth + loadCompany.
const employeeService = require('../services/employeeService');
const scheduleService = require('../services/scheduleService');
const { validateScheduleSlot } = require('../validators/scheduleValidator');
const { parseId, notFound } = require('../utils/http');
const {
  formatDateTime,
  toDateTimeLocal,
  startOfWeek,
  addDays,
  toDateInput,
  formatTime,
  formatDuration,
} = require('../utils/dateFormat');

// Palette pastel : la classe CSS slot-color-N est definie dans public/css/style.css.
const PALETTE_SIZE = 8;
const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function slotMinutes(slot) {
  return Math.max(0, Math.round((slot.endsAt - slot.startsAt) / 60000));
}

// Parse ?week=YYYY-MM-DD en date locale ; defaut = aujourd'hui. Renvoie le lundi 00:00.
function resolveWeekStart(weekParam) {
  if (typeof weekParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const [y, m, d] = weekParam.split('-').map(Number);
    return startOfWeek(new Date(y, m - 1, d));
  }
  return startOfWeek(new Date());
}

// Construit la structure de grille rendue par la vue.
function buildWeek(employees, slots, weekStart) {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    days.push({
      dateInput: toDateInput(date),
      weekday: WEEKDAYS[i],
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
    });
  }

  const dayTotals = new Array(7).fill(0); // minutes cumulees par colonne (jour)

  const rows = employees.map((employee) => {
    let weekTotal = 0;
    const cells = days.map((day, dayIndex) => {
      const blocks = slots
        .filter((s) => s.employeeId === employee.id && toDateInput(s.startsAt) === day.dateInput)
        .map((s) => {
          const minutes = slotMinutes(s);
          weekTotal += minutes;
          dayTotals[dayIndex] += minutes;
          return {
            id: s.id,
            startLabel: formatTime(s.startsAt),
            endLabel: formatTime(s.endsAt),
            durationLabel: formatDuration(minutes),
            title: s.title,
          };
        });
      return { dateInput: day.dateInput, blocks };
    });

    return {
      employee,
      colorIndex: employee.id % PALETTE_SIZE,
      cells,
      weekTotalLabel: formatDuration(weekTotal),
    };
  });

  return {
    days,
    rows,
    dayTotalLabels: dayTotals.map((m) => formatDuration(m)),
  };
}

function decorateSlot(slot) {
  return {
    ...slot,
    startsAtLabel: formatDateTime(slot.startsAt),
    endsAtLabel: formatDateTime(slot.endsAt),
    startsAtInput: toDateTimeLocal(slot.startsAt),
    endsAtInput: toDateTimeLocal(slot.endsAt),
  };
}

function valuesFromSlot(slot) {
  return {
    employeeId: String(slot.employeeId),
    title: slot.title,
    startsAt: toDateTimeLocal(slot.startsAt),
    endsAt: toDateTimeLocal(slot.endsAt),
    note: slot.note || '',
  };
}

async function renderForm(req, res, view, status, data) {
  const employees = await employeeService.findAllByCompany(req.company.id);
  return res.status(status).render(view, {
    ...data,
    employees,
  });
}

// GET /planning?week=YYYY-MM-DD
async function index(req, res, next) {
  try {
    const weekStart = resolveWeekStart(req.query.week);
    const weekEnd = addDays(weekStart, 7);
    const employees = await employeeService.findAllByCompany(req.company.id);
    const slots = await scheduleService.findByCompanyBetween(req.company.id, weekStart, weekEnd);

    const grid = buildWeek(employees, slots, weekStart);
    const lastDay = addDays(weekStart, 6);

    res.render('planning/index', {
      title: 'Planning',
      days: grid.days,
      rows: grid.rows,
      dayTotalLabels: grid.dayTotalLabels,
      weekLabel: `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${lastDay.getDate()} ${MONTHS[lastDay.getMonth()]} ${lastDay.getFullYear()}`,
      prevWeek: toDateInput(addDays(weekStart, -7)),
      nextWeek: toDateInput(addDays(weekStart, 7)),
    });
  } catch (err) {
    next(err);
  }
}

// GET /planning/new?employeeId=&date=
async function newForm(req, res, next) {
  try {
    const values = {};
    const { employeeId, date } = req.query;
    if (employeeId) values.employeeId = String(employeeId);
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      values.startsAt = `${date}T09:00`;
      values.endsAt = `${date}T17:00`;
    }
    await renderForm(req, res, 'planning/new', 200, {
      title: 'Nouveau creneau',
      errors: {},
      values,
    });
  } catch (err) {
    next(err);
  }
}

// POST /planning
async function create(req, res, next) {
  try {
    const { isValid, errors, value } = validateScheduleSlot(req.body);
    const formErrors = { ...errors };

    if (isValid) {
      const employee = await employeeService.findOwnedById(req.company.id, value.employeeId);
      if (!employee) formErrors.employeeId = 'Employe introuvable.';
    }

    if (Object.keys(formErrors).length > 0) {
      return renderForm(req, res, 'planning/new', 400, {
        title: 'Nouveau creneau',
        errors: formErrors,
        values: req.body,
      });
    }

    await scheduleService.createForCompany(req.company.id, value);
    req.flash('success', 'Creneau cree avec succes.');
    res.redirect('/planning');
  } catch (err) {
    next(err);
  }
}

// GET /planning/:id/edit
async function editForm(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const slot = await scheduleService.findOwnedById(req.company.id, id);
    if (!slot) return notFound(res);

    return renderForm(req, res, 'planning/edit', 200, {
      title: 'Modifier un creneau',
      errors: {},
      slot: decorateSlot(slot),
      values: valuesFromSlot(slot),
    });
  } catch (err) {
    next(err);
  }
}

// POST /planning/:id/update
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return notFound(res);

  try {
    const slot = await scheduleService.findOwnedById(req.company.id, id);
    if (!slot) return notFound(res);

    const { isValid, errors, value } = validateScheduleSlot(req.body);
    const formErrors = { ...errors };

    if (isValid) {
      const employee = await employeeService.findOwnedById(req.company.id, value.employeeId);
      if (!employee) formErrors.employeeId = 'Employe introuvable.';
    }

    if (Object.keys(formErrors).length > 0) {
      return renderForm(req, res, 'planning/edit', 400, {
        title: 'Modifier un creneau',
        errors: formErrors,
        slot: decorateSlot(slot),
        values: req.body,
      });
    }

    await scheduleService.updateOwned(req.company.id, id, value);
    req.flash('success', 'Creneau mis a jour.');
    res.redirect('/planning');
  } catch (err) {
    next(err);
  }
}

// POST /planning/:id/delete
async function destroy(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const slot = await scheduleService.findOwnedById(req.company.id, id);
    if (!slot) return notFound(res);

    await scheduleService.deleteOwned(req.company.id, id);
    req.flash('success', 'Creneau supprime.');
    res.redirect('/planning');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy };
