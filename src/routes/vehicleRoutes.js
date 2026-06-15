// Routes CRUD des vehicules + affectation (montees derriere requireAuth + loadCompany).
const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { YEAR_MIN, currentYearMax } = require('../validators/vehicleValidator');

const router = express.Router();

// Bornes d'annee exposees aux formulaires (attributs min/max de l'input <number>).
// Calculees a chaque requete -> coherentes avec la validation serveur, jamais perimees.
router.use((req, res, next) => {
  res.locals.yearMin = YEAR_MIN;
  res.locals.yearMax = currentYearMax();
  next();
});

router.get('/', vehicleController.index);
router.get('/new', vehicleController.newForm);
router.post('/', vehicleController.create);
router.get('/:id/edit', vehicleController.editForm);
router.post('/:id/update', vehicleController.update);
router.post('/:id/delete', vehicleController.destroy);
router.post('/:id/assign', vehicleController.assign);
router.post('/:id/unassign', vehicleController.unassign);

module.exports = router;
