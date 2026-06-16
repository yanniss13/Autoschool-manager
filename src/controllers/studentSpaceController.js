// Controleur de l'espace eleve : planning, entrainement et assistant code.
const scheduleService = require('../services/scheduleService');
const trainingService = require('../services/roadCodeTrainingService');
const assistantService = require('../services/roadCodeAssistantService');
const {
  themes,
  findTheme,
  questionsForTheme,
  questionsByIds,
  randomQuestions,
} = require('../data/roadCodeQuestions');

// Parametres de l'examen blanc (calque l'ETG officiel).
const EXAM = { count: 40, durationMin: 30, pass: 35 };
const { toDateTimeLocal } = require('../utils/dateFormat');
const { parseDateRange } = require('../utils/http');

function eventTitle(slot) {
  const instructor = slot.employee ? `${slot.employee.lastName} ${slot.employee.firstName}` : 'Moniteur';
  return `${slot.title} - ${instructor}`;
}

// Limite la taille du fil garde en session pour ne pas le faire grossir indefiniment.
const MAX_THREAD_MESSAGES = 6;

// Geometrie du graphe SVG de progression (espace utilisateur, marges pour les axes).
const CHART = {
  width: 640,
  height: 260,
  padTop: 22,
  padRight: 18,
  padBottom: 30,
  padLeft: 42,
  gridValues: [0, 25, 50, 75, 100], // lignes horizontales + libelles %
};

const round2 = (n) => Math.round(n * 100) / 100;

// Transforme l'historique (taux par session) en geometrie prete a tracer :
// aire degradee, courbe, points, grille horizontale et libelles d'axes.
function buildCurve(history) {
  if (!history || history.length === 0) return null;

  const { width, height, padTop, padRight, padBottom, padLeft, gridValues } = CHART;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = history.length;

  const xAt = (i) => padLeft + (n > 1 ? (plotW * i) / (n - 1) : plotW / 2);
  const yAt = (rate) => padTop + plotH * (1 - rate / 100);
  const baseY = yAt(0);

  const points = history.map((entry, index) => ({
    x: round2(xAt(index)),
    y: round2(yAt(entry.rate)),
    rate: entry.rate,
    index: index + 1,
  }));

  const linePts = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Aire fermee sous la courbe (jusqu'a la ligne 0 %).
  const first = points[0];
  const last = points[points.length - 1];
  const area = `M ${first.x},${round2(baseY)} L ${linePts.split(' ').join(' L ')} L ${last.x},${round2(baseY)} Z`;

  const grid = gridValues.map((value) => ({ value, y: round2(yAt(value)) }));

  return {
    width,
    height,
    padLeft: round2(padLeft),
    plotRight: round2(width - padRight),
    points,
    polyline: linePts,
    area,
    grid,
    last,
    average: Math.round(history.reduce((sum, e) => sum + e.rate, 0) / n),
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
      title: 'Mon espace eleve',
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
      title: 'Entrainement code',
      student: req.student,
      themes,
      selectedTheme,
      questions: questionsForTheme(selectedTheme.id),
      progress,
      progressCurve: buildCurve(progress.history),
      missedQuestions,
    });
  } catch (err) {
    next(err);
  }
}

// GET /student-space/exam — Examen blanc : tirage aleatoire, reponses cachees, minuteur.
async function examPage(req, res, next) {
  try {
    const questions = randomQuestions(EXAM.count);
    res.render('student-space/exam', {
      title: 'Examen blanc',
      student: req.student,
      questions,
      questionIdsCsv: questions.map((q) => q.id).join(','),
      exam: {
        count: questions.length,
        pass: EXAM.pass,
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

    res.render('student-space/exam-result', {
      title: 'Resultat de l examen',
      student: req.student,
      result,
      passed: result.score >= EXAM.pass,
      pass: EXAM.pass,
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

    req.flash('success', `Session enregistree : ${result.score}/${result.total}.`);
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
};
