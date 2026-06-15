// Charge l'employe connecte et son contexte d'affichage.
// Si la session reference un employe inexistant, elle est detruite.
const employeeService = require('../services/employeeService');

module.exports = async function loadEmployee(req, res, next) {
  try {
    const employee = await employeeService.findByIdWithAccess(req.session.employeeId);

    if (!employee) {
      return req.session.destroy(() => res.redirect('/employee-login'));
    }

    req.employee = employee;
    res.locals.currentEmployee = employee;
    next();
  } catch (err) {
    next(err);
  }
};
