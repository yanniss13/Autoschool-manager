// Routes de l'espace eleve (montees derriere requireStudentAuth + loadStudent).
const express = require('express');
const studentSpaceController = require('../controllers/studentSpaceController');

const router = express.Router();

router.get('/', studentSpaceController.index);
router.get('/events', studentSpaceController.events);
router.get('/training', studentSpaceController.trainingPage);
router.get('/training/questions', studentSpaceController.trainingQuestions);
router.post('/training', studentSpaceController.training);
router.get('/assistant', studentSpaceController.assistantPage);
router.post('/assistant', studentSpaceController.assistant);
router.post('/assistant/clear', studentSpaceController.clearAssistant);

module.exports = router;
