// Controleur de l'espace employe en lecture seule (agenda horaire).
const scheduleService = require('../services/scheduleService');
const planningGrid = require('../utils/planningGrid');

// GET /employee-space?week=YYYY-MM-DD
async function index(req, res, next) {
  try {
    const week = planningGrid.weekRange(req.query.week);
    const slots = await scheduleService.findByEmployeeBetween(req.employee.id, week.start, week.end);
    const days = planningGrid.buildAgenda(slots, week.start);

    res.render('employee-space/index', {
      title: 'Mon espace',
      employee: req.employee,
      days,
      colorIndex: planningGrid.colorIndexFor(req.employee.id),
      hourLabels: planningGrid.hourLabels(),
      readonly: true,
      weekLabel: week.weekLabel,
      prevUrl: `/employee-space?week=${week.prevWeek}`,
      nextUrl: `/employee-space?week=${week.nextWeek}`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
