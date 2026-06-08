// Routes CRUD des employes (montees derriere requireAuth + loadCompany).
const express = require('express');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

router.get('/', employeeController.index);
router.get('/new', employeeController.newForm);
router.post('/', employeeController.create);
router.get('/:id/edit', employeeController.editForm);
router.post('/:id/update', employeeController.update);
router.post('/:id/delete', employeeController.destroy);

module.exports = router;
