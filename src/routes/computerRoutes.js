// Routes CRUD des ordinateurs + affectation (montees derriere requireAuth + loadCompany).
const express = require('express');
const computerController = require('../controllers/computerController');

const router = express.Router();

router.get('/', computerController.index);
router.get('/new', computerController.newForm);
router.post('/', computerController.create);
router.get('/:id/edit', computerController.editForm);
router.post('/:id/update', computerController.update);
router.post('/:id/delete', computerController.destroy);
router.post('/:id/assign', computerController.assign);
router.post('/:id/unassign', computerController.unassign);

module.exports = router;
