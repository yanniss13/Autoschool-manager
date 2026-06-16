// Routes CRUD des eleves (montees derriere requireAuth + loadCompany).
const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', studentController.index);
router.get('/new', studentController.newForm);
router.post('/', studentController.create);
router.get('/:id/edit', studentController.editForm);
router.post('/:id/update', studentController.update);
router.post('/:id/resend-credentials', studentController.resendCredentials);
router.post('/:id/delete', studentController.destroy);

module.exports = router;
