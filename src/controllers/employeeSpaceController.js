// Controleur de l'espace employe en lecture seule (calendrier FullCalendar).
const scheduleService = require('../services/scheduleService');
const { toDateTimeLocal } = require('../utils/dateFormat');

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
    const start = req.query.start ? new Date(req.query.start) : new Date(0);
    const end = req.query.end ? new Date(req.query.end) : new Date('2999-01-01');
    const slots = await scheduleService.findByEmployeeBetween(req.employee.id, start, end);
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
