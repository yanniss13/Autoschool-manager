// Charge l'entreprise courante depuis la session et l'expose aux controleurs/vues.
// Si la session reference une entreprise inexistante, on detruit la session.
const companyService = require('../services/companyService');

module.exports = async function loadCompany(req, res, next) {
  try {
    const company = await companyService.findById(req.session.companyId);

    if (!company) {
      // Session orpheline : l'entreprise n'existe plus en base.
      return req.session.destroy(() => res.redirect('/login'));
    }

    req.company = company;
    res.locals.currentCompany = company;
    next();
  } catch (err) {
    next(err);
  }
};
