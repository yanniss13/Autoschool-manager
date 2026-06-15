// Controleur de l'espace employe en lecture seule (calendrier FullCalendar).
const scheduleService = require('../services/scheduleService');
const { toDateTimeLocal } = require('../utils/dateFormat');
const { parseDateRange } = require('../utils/http');

// GET /employee-space
async function index(req, res, next) {
  try {
    res.render('employee-space/index', {
      title: 'Mon espace',
      employee: req.employee,
    });
  } catch (err) {
    next(err);
  }
}

// GET /employee-space/events?start=&end=  (consomme par FullCalendar, lecture seule)
async function events(req, res, next) {
  try {
    const range = parseDateRange(req.query);
    if (!range) return res.status(400).json({ error: 'Dates invalides.' });

    const slots = await scheduleService.findByEmployeeBetween(req.employee.id, range.start, range.end);
    res.json(
      slots.map((s) => ({
        id: s.id,
        title: s.student ? `${s.title} — ${s.student.lastName} ${s.student.firstName}` : s.title,
        start: toDateTimeLocal(s.startsAt),
        end: toDateTimeLocal(s.endsAt),
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { index, events };
