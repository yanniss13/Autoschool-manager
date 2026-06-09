// Routes CRUD des vehicules + affectation (montees derriere requireAuth + loadCompany).
const express = require('express');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

router.get('/', vehicleController.index);
router.get('/new', vehicleController.newForm);
router.post('/', vehicleController.create);
router.get('/:id/edit', vehicleController.editForm);
router.post('/:id/update', vehicleController.update);
router.post('/:id/delete', vehicleController.destroy);
router.post('/:id/assign', vehicleController.assign);
router.post('/:id/unassign', vehicleController.unassign);

module.exports = router;
