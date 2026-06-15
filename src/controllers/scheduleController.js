// Controleur CRUD des creneaux de planning.
// Protege en amont par requireAuth + loadCompany.
const employeeService = require('../services/employeeService');
const scheduleService = require('../services/scheduleService');
const { validateScheduleSlot } = require('../validators/scheduleValidator');
const { parseId, notFound } = require('../utils/http');
const { formatDateTime, toDateTimeLocal } = require('../utils/dateFormat');

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

// GET /planning
async function index(req, res, next) {
  try {
    const slots = await scheduleService.findAllByCompany(req.company.id);
    res.render('planning/index', {
      title: 'Planning',
      slots: slots.map(decorateSlot),
    });
  } catch (err) {
    next(err);
  }
}

// GET /planning/new
async function newForm(req, res, next) {
  try {
    await renderForm(req, res, 'planning/new', 200, {
      title: 'Nouveau creneau',
      errors: {},
      values: {},
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
