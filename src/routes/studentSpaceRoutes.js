// Routes de l'espace eleve (montees derriere requireStudentAuth + loadStudent).
const express = require('express');
const studentSpaceController = require('../controllers/studentSpaceController');

const router = express.Router();

router.get('/', studentSpaceController.index);
router.get('/events', studentSpaceController.events);
router.post('/training', studentSpaceController.training);
router.post('/assistant', studentSpaceController.assistant);

module.exports = router;
