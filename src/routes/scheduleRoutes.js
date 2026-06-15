// Routes CRUD des creneaux de planning (montees derriere requireAuth + loadCompany).
const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', scheduleController.index);
router.get('/new', scheduleController.newForm);
router.get('/events', scheduleController.events);
router.post('/', scheduleController.create);
router.get('/:id/edit', scheduleController.editForm);
router.post('/:id/update', scheduleController.update);
router.post('/:id/move', scheduleController.move);
router.post('/:id/delete', scheduleController.destroy);

module.exports = router;
