// Controleur de l'espace eleve : planning, entrainement et assistant code.
const scheduleService = require('../services/scheduleService');
const studentService = require('../services/studentService');
const trainingService = require('../services/roadCodeTrainingService');
const assistantService = require('../services/roadCodeAssistantService');
const passwordUtil = require('../utils/password');
const { validatePasswordChange } = require('../validators/passwordResetValidator');
const {
  themes,
  findTheme,
  questionsForTheme,
  questionsByIds,
  weightedRandomQuestions,
} = require('../data/roadCodeQuestions');

// Parametres de l'examen blanc (calque l'ETG officiel : ~87,5 % de reussite).
const EXAM = { count: 40, durationMin: 30, passRatio: 0.875 };

// Seuil de reussite derive du nombre reel de questions (jamais > total).
function examPassThreshold(total) {
  return Math.ceil(total * EXAM.passRatio);
}
const { toDateTimeLocal } = require('../utils/dateFormat');
const { parseDateRange } = require('../utils/http');

function eventTitle(slot) {
  const instructor = slot.employee ? `${slot.employee.lastName} ${slot.employee.firstName}` : 'Moniteur';
  return `${slot.title} - ${instructor}`;
}

// Limite la taille du fil garde en session pour ne pas le faire grossir indefiniment.
const MAX_THREAD_MESSAGES = 6;

// Transforme l'historique en donnees simples pour ApexCharts.
function buildProgressChart(history) {
  if (!history || history.length === 0) return null;

  const points = history.map((entry, index) => ({
    rate: entry.rate,
    index: index + 1,
    label: `Session ${index + 1}`,
  }));

  return {
    points,
    rates: points.map((point) => point.rate),
    last: points[points.length - 1],
    average: Math.round(history.reduce((sum, entry) => sum + entry.rate, 0) / history.length),
  };
}

// Donnees du fil d'assistant pour les vues (fil + etat en ligne/local).
function assistantViewData(req) {
  return {
    assistantThread: (req.session && req.session.assistantThread) || [],
    assistantOnline: assistantService.isOnline ? assistantService.isOnline() : false,
  };
}

// GET /student-space — Accueil : profil, resume de progression, planning.
async function index(req, res, next) {
  try {
    const progress = await trainingService.progressForStudent(req.student.id);
    res.render('student-space/index', {
      title: 'Mon espace élève',
      student: req.student,
      progress,
    });
  } catch (err) {
    next(err);
  }
}

// GET /student-space/training — Entrainement : selecteur de theme, quiz, courbe, stats par theme.
async function trainingPage(req, res, next) {
  try {
    const selectedTheme = findTheme(req.query.theme || themes[0].id);
    const progress = await trainingService.progressForStudent(req.student.id);
    const missedQuestions = await trainingService.recentMissedQuestions(req.student.id);
    res.render('student-space/training', {
      title: 'Entraînement code',
      student: req.student,
      themes,
      selectedTheme,
      questions: questionsForTheme(selectedTheme.id),
      progress,
      progressChart: buildProgressChart(progress.history),
      missedQuestions,
    });
  } catch (err) {
    next(err);
  }
}

// GET /student-space/exam — Examen blanc : tirage aleatoire, reponses cachees, minuteur.
async function examPage(req, res, next) {
  try {
    const questions = weightedRandomQuestions(EXAM.count);
    res.render('student-space/exam', {
      title: 'Examen blanc',
      student: req.student,
      questions,
      questionIdsCsv: questions.map((q) => q.id).join(','),
      exam: {
        count: questions.length,
        pass: examPassThreshold(questions.length),
        durationMin: EXAM.durationMin,
        durationSec: EXAM.durationMin * 60,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /student-space/exam — corrige l'examen, persiste, affiche la correction.
async function exam(req, res, next) {
  try {
    const ids = (req.body.questionIds || '').split(',').map((s) => s.trim()).filter(Boolean);
    const questions = questionsByIds(ids);
    const result = trainingService.scoreSet(questions, req.body);
    await trainingService.createSession(req.student, result, 'exam');

    const review = questions.map((q) => ({
      text: q.text,
      explanation: q.explanation,
      choices: q.choices,
      correct: q.correctChoice,
      given: result.answers[q.id] || null,
      ok: result.answers[q.id] === q.correctChoice,
    }));

    const pass = examPassThreshold(result.total);
    res.render('student-space/exam-result', {
      title: "Résultat de l'examen",
      student: req.student,
      result,
      passed: result.score >= pass,
      pass,
      rate: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
      review,
    });
  } catch (err) {
    next(err);
  }
}

// GET /student-space/assistant — Assistant code (chat).
async function assistantPage(req, res, next) {
  try {
    res.render('student-space/assistant', {
      title: 'Assistant code',
      student: req.student,
      ...assistantViewData(req),
    });
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

    req.flash('success', `Session enregistrée : ${result.score}/${result.total}.`);
    res.redirect('/student-space/training');
  } catch (err) {
    next(err);
  }
}

// GET /student-space/training/questions?theme=
// Rend uniquement le corps du quiz pour le theme demande (rechargement AJAX sans reload page).
async function trainingQuestions(req, res, next) {
  try {
    const selectedTheme = findTheme(req.query.theme || themes[0].id);
    res.render('student-space/_training-quiz', {
      selectedTheme,
      questions: questionsForTheme(selectedTheme.id),
    });
  } catch (err) {
    next(err);
  }
}

// POST /student-space/assistant
async function assistant(req, res, next) {
  try {
    const message = (req.body.message || '').trim().slice(0, 500);
    const thread = (req.session && req.session.assistantThread) || [];
    let reply = null;

    if (message) {
      reply = await assistantService.answer(message, thread);
      // On garde un fil court (paires question/reponse) pour le contexte et l'affichage.
      const updated = [...thread, { role: 'user', content: message }, { role: 'assistant', content: reply }];
      req.session.assistantThread = updated.slice(-MAX_THREAD_MESSAGES);
    }

    // Requete AJAX : on renvoie juste la reponse (pas de rechargement -> pas de saut en haut).
    if (req.xhr) {
      return res.json({ message, reply });
    }

    // Repli sans JavaScript : rendu complet de la page assistant.
    res.status(200).render('student-space/assistant', {
      title: 'Assistant code',
      student: req.student,
      ...assistantViewData(req),
    });
  } catch (err) {
    next(err);
  }
}

// POST /student-space/assistant/clear
async function clearAssistant(req, res, next) {
  try {
    if (req.session) req.session.assistantThread = [];
    if (req.xhr) return res.json({ cleared: true });
    res.redirect('/student-space/assistant');
  } catch (err) {
    next(err);
  }
}

// GET /student-space/password — changement de mot de passe (force a la 1re connexion,
// ou volontaire). `forced` => message d'invite + acces verrouille par le middleware.
function passwordPage(req, res) {
  res.render('student-space/password', {
    title: 'Mot de passe',
    errors: {},
    forced: req.student.mustChangePassword,
  });
}

// POST /student-space/password
async function changePassword(req, res, next) {
  try {
    const { isValid, errors, value } = validatePasswordChange(req.body);

    // Refuse un mot de passe identique a l'actuel (sinon le changement est sans effet).
    if (isValid && req.student.passwordHash) {
      const same = await passwordUtil.compare(value.password, req.student.passwordHash);
      if (same) errors.password = "Choisissez un mot de passe different de l'actuel.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('student-space/password', {
        title: 'Mot de passe',
        errors,
        forced: req.student.mustChangePassword,
      });
    }

    const passwordHash = await passwordUtil.hash(value.password);
    await studentService.updatePasswordById(req.student.id, passwordHash, false);
    req.flash('success', 'Mot de passe mis à jour.');
    res.redirect('/student-space');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  trainingPage,
  assistantPage,
  examPage,
  exam,
  events,
  training,
  trainingQuestions,
  assistant,
  clearAssistant,
  passwordPage,
  changePassword,
};
