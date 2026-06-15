// Controleur CRUD des creneaux de planning.
// Protege en amont par requireAuth + loadCompany.
const employeeService = require('../services/employeeService');
const scheduleService = require('../services/scheduleService');
const { validateScheduleSlot } = require('../validators/scheduleValidator');
const { parseId, notFound } = require('../utils/http');
const { formatDateTime, toDateTimeLocal } = require('../utils/dateFormat');
const planningGrid = require('../utils/planningGrid');

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

// GET /planning?employeeId=&week=YYYY-MM-DD
// Agenda horaire d'un employe selectionne (defaut : le premier de l'entreprise).
async function index(req, res, next) {
  try {
    const employees = await employeeService.findAllByCompany(req.company.id);
    const week = planningGrid.weekRange(req.query.week);

    // Employe affiche : celui demande (verifie cote entreprise), sinon le premier.
    let selected = null;
    const requestedId = parseId(req.query.employeeId);
    if (requestedId) selected = await employeeService.findOwnedById(req.company.id, requestedId);
    if (!selected && employees.length > 0) selected = employees[0];

    let days = [];
    if (selected) {
      const slots = await scheduleService.findByEmployeeBetween(selected.id, week.start, week.end);
      days = planningGrid.buildAgenda(slots, week.start);
    }

    const navSuffix = selected ? `employeeId=${selected.id}&` : '';
    res.render('planning/index', {
      title: 'Planning',
      employees,
      selected,
      employeeId: selected ? selected.id : '',
      colorIndex: selected ? planningGrid.colorIndexFor(selected.id) : 0,
      days,
      hourLabels: planningGrid.hourLabels(),
      readonly: false,
      weekInput: week.weekInput,
      weekLabel: week.weekLabel,
      prevUrl: `/planning?${navSuffix}week=${week.prevWeek}`,
      nextUrl: `/planning?${navSuffix}week=${week.nextWeek}`,
    });
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
