// Routes de l'espace eleve (montees derriere requireStudentAuth + loadStudent).
const express = require('express');
const rateLimit = require('express-rate-limit');
const studentSpaceController = require('../controllers/studentSpaceController');
const enforceStudentPasswordChange = require('../middlewares/enforceStudentPasswordChange');

const router = express.Router();

// Tant que l'eleve n'a pas change son mot de passe initial, tout l'espace renvoie
// vers la page de changement (sauf cette page). Monte en tete du routeur.
router.use(enforceStudentPasswordChange);

// Anti-abus : limite les questions a l'assistant (chaque message peut declencher
// un appel a l'API Groq -> cout et abus possibles). Repond en JSON sur requete AJAX,
// sinon redirige avec un message flash.
const assistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 25, // 25 messages max par IP sur la fenetre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const message = 'Trop de questions envoyées. Patiente quelques minutes avant de réessayer.';
    if (req.xhr) return res.status(429).json({ error: message });
    if (req.flash) req.flash('error', message);
    res.redirect('/student-space/assistant');
  },
});

router.get('/', studentSpaceController.index);
router.get('/events', studentSpaceController.events);
router.get('/training', studentSpaceController.trainingPage);
router.get('/training/questions', studentSpaceController.trainingQuestions);
router.post('/training', studentSpaceController.training);
router.get('/exam', studentSpaceController.examPage);
router.post('/exam', studentSpaceController.exam);
router.get('/assistant', studentSpaceController.assistantPage);
router.post('/assistant', assistantLimiter, studentSpaceController.assistant);
router.post('/assistant/clear', studentSpaceController.clearAssistant);
router.get('/password', studentSpaceController.passwordPage);
router.post('/password', studentSpaceController.changePassword);

module.exports = router;
