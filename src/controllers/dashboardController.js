// Controleur du tableau de bord (protege par requireAuth + loadCompany).
// L'entreprise courante est disponible via res.locals.currentCompany.
const employeeService = require('../services/employeeService');
const computerService = require('../services/computerService');

// GET /dashboard
async function index(req, res, next) {
  try {
    const companyId = req.company.id;
    const [employees, computers, assigned] = await Promise.all([
      employeeService.countByCompany(companyId),
      computerService.countByCompany(companyId),
      computerService.countAssignedByCompany(companyId),
    ]);

    res.render('dashboard/index', {
      title: 'Tableau de bord',
      stats: {
        employees,
        computers,
        assigned,
        available: computers - assigned,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
