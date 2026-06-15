// Controleur du tableau de bord (protege par requireAuth + loadCompany).
// L'entreprise courante est disponible via res.locals.currentCompany.
const employeeService = require('../services/employeeService');
const vehicleService = require('../services/vehicleService');
const studentService = require('../services/studentService');

// GET /dashboard
async function index(req, res, next) {
  try {
    const companyId = req.company.id;
    const [employees, vehicles, assigned, students] = await Promise.all([
      employeeService.countByCompany(companyId),
      vehicleService.countByCompany(companyId),
      vehicleService.countAssignedByCompany(companyId),
      studentService.countByCompany(companyId),
    ]);

    res.render('dashboard/index', {
      title: 'Tableau de bord',
      stats: {
        employees,
        vehicles,
        assigned,
        available: vehicles - assigned,
        students,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
