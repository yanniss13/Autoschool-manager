// Controleur CRUD des creneaux de planning.
// Protege en amont par requireAuth + loadCompany.
const employeeService = require('../services/employeeService');
const studentService = require('../services/studentService');
const scheduleService = require('../services/scheduleService');
const { validateScheduleSlot } = require('../validators/scheduleValidator');
const { parseId, parseDateRange, notFound } = require('../utils/http');
const { formatDateTime, toDateTimeLocal } = require('../utils/dateFormat');

// Slot -> evenement FullCalendar (datetime local naif, sans fuseau : FC l'affiche tel quel).
// Le titre inclut l'eleve rattache, ex. "Cours de conduite — Dupont Marie".
function toEvent(slot) {
  const title = slot.student
    ? `${slot.title} — ${slot.student.lastName} ${slot.student.firstName}`
    : slot.title;
  return {
    id: slot.id,
    title,
    start: toDateTimeLocal(slot.startsAt),
    end: toDateTimeLocal(slot.endsAt),
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
    studentId: slot.studentId ? String(slot.studentId) : '',
    title: slot.title,
    startsAt: toDateTimeLocal(slot.startsAt),
    endsAt: toDateTimeLocal(slot.endsAt),
    note: slot.note || '',
  };
}

async function renderForm(req, res, view, status, data) {
  const [employees, students] = await Promise.all([
    employeeService.findAllByCompany(req.company.id),
    studentService.findAllByCompany(req.company.id),
  ]);
  return res.status(status).render(view, {
    ...data,
    employees,
    students,
  });
}

// GET /planning?employeeId=
// Page FullCalendar : selecteur d'employe + conteneur calendrier (donnees via /planning/events).
async function index(req, res, next) {
  try {
    const employees = await employeeService.findAllByCompany(req.company.id);

    // Employe affiche : celui demande (verifie cote entreprise), sinon le premier.
    let selected = null;
    const requestedId = parseId(req.query.employeeId);
    if (requestedId) selected = await employeeService.findOwnedById(req.company.id, requestedId);
    if (!selected && employees.length > 0) selected = employees[0];

    res.render('planning/index', {
      title: 'Planning',
      employees,
      selected,
    });
  } catch (err) {
    next(err);
  }
}

// GET /planning/events?employeeId=&start=&end=  (consomme par FullCalendar)
async function events(req, res, next) {
  try {
    const employeeId = parseId(req.query.employeeId);
    if (!employeeId) return res.json([]);

    // Verifie que l'employe appartient bien a l'entreprise (cloisonnement -> 404 sinon).
    const employee = await employeeService.findOwnedById(req.company.id, employeeId);
    if (!employee) return notFound(res);

    const range = parseDateRange(req.query);
    if (!range) return res.status(400).json({ error: 'Dates invalides.' });

    const slots = await scheduleService.findByEmployeeBetween(employee.id, range.start, range.end);
    res.json(slots.map(toEvent));
  } catch (err) {
    next(err);
  }
}

// POST /planning/:id/move  (drag & drop : nouvelles heures, body urlencode + _csrf)
async function move(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const slot = await scheduleService.findOwnedById(req.company.id, id);
    if (!slot) return notFound(res);

    const start = new Date(req.body.start);
    const end = new Date(req.body.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Dates invalides.' });
    }

    await scheduleService.updateOwned(req.company.id, id, { startsAt: start, endsAt: end });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// GET /planning/new?employeeId=&date=&hour=
async function newForm(req, res, next) {
  try {
    const values = {};
    const { employeeId, date, hour } = req.query;
    if (employeeId) values.employeeId = String(employeeId);
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const startHour = /^\d{1,2}$/.test(hour) && Number(hour) >= 0 && Number(hour) <= 22 ? Number(hour) : 9;
      const endHour = startHour + 1;
      values.startsAt = `${date}T${String(startHour).padStart(2, '0')}:00`;
      values.endsAt = `${date}T${String(endHour).padStart(2, '0')}:00`;
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
      const student = await studentService.findOwnedById(req.company.id, value.studentId);
      if (!student) formErrors.studentId = 'Eleve introuvable.';
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
      const student = await studentService.findOwnedById(req.company.id, value.studentId);
      if (!student) formErrors.studentId = 'Eleve introuvable.';
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

module.exports = { index, events, move, newForm, create, editForm, update, destroy };
