// Controleur de l'espace employe en lecture seule.
const scheduleService = require('../services/scheduleService');
const { formatDateTime } = require('../utils/dateFormat');

function decorateSlot(slot) {
  return {
    ...slot,
    startsAtLabel: formatDateTime(slot.startsAt),
    endsAtLabel: formatDateTime(slot.endsAt),
  };
}

// GET /employee-space
async function index(req, res, next) {
  try {
    const slots = await scheduleService.findAllForEmployee(req.employee.id);
    res.render('employee-space/index', {
      title: 'Mon espace',
      employee: req.employee,
      slots: slots.map(decorateSlot),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
