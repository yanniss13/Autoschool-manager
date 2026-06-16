// Controleur de l'espace eleve : planning, entrainement et assistant code.
const scheduleService = require('../services/scheduleService');
const trainingService = require('../services/roadCodeTrainingService');
const assistantService = require('../services/roadCodeAssistantService');
const { themes, findTheme, questionsForTheme } = require('../data/roadCodeQuestions');
const { toDateTimeLocal } = require('../utils/dateFormat');
const { parseDateRange } = require('../utils/http');

function eventTitle(slot) {
  const instructor = slot.employee ? `${slot.employee.lastName} ${slot.employee.firstName}` : 'Moniteur';
  return `${slot.title} - ${instructor}`;
}

async function buildViewData(req, extra = {}) {
  const bodyTheme = req.body && req.body.theme;
  const selectedTheme = findTheme(extra.selectedTheme || bodyTheme || req.query.theme || themes[0].id);
  const progress = await trainingService.progressForStudent(req.student.id);

  return {
    title: 'Mon espace eleve',
    student: req.student,
    themes,
    selectedTheme,
    questions: questionsForTheme(selectedTheme.id),
    progress,
    assistant: extra.assistant || null,
    trainingResult: extra.trainingResult || null,
  };
}

// GET /student-space
async function index(req, res, next) {
  try {
    res.render('student-space/index', await buildViewData(req));
  } catch (err) {
    next(err);
  }
}

// GET /student-space/events?start=&end=
async function events(req, res, next) {
  try {
    const range = parseDateRange(req.query);
    if (!range) return res.status(400).json({ error: 'Dates invalides.' });

    const slots = await scheduleService.findByStudentBetween(req.student.id, range.start, range.end);
    res.json(
      slots.map((slot) => ({
        id: slot.id,
        title: eventTitle(slot),
        start: toDateTimeLocal(slot.startsAt),
        end: toDateTimeLocal(slot.endsAt),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// POST /student-space/training
async function training(req, res, next) {
  try {
    const selectedTheme = findTheme(req.body.theme || themes[0].id);
    const result = trainingService.scoreTheme(selectedTheme.id, req.body);
    await trainingService.createSession(req.student, result);

    req.flash('success', `Session enregistree : ${result.score}/${result.total}.`);
    res.redirect('/student-space');
  } catch (err) {
    next(err);
  }
}

// POST /student-space/assistant
async function assistant(req, res, next) {
  try {
    const message = (req.body.message || '').trim();
    const reply = assistantService.answer(message);
    res.status(200).render(
      'student-space/index',
      await buildViewData(req, {
        assistant: { message, reply },
      })
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { index, events, training, assistant };
