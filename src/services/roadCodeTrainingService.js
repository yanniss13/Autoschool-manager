// Services d'entrainement au code de la route.
const prisma = require('../config/prisma');
const { themes, questionsForTheme, questionsByIds } = require('../data/roadCodeQuestions');

function normalizeAnswers(body) {
  const answers = {};

  // Format compact utilise par le smoke test : "questionId:choice,questionId:choice".
  if (typeof body.answers === 'string') {
    body.answers.split(',').forEach((entry) => {
      const [questionId, choiceId] = entry.split(':').map((part) => (part || '').trim());
      if (questionId && choiceId) answers[questionId] = choiceId;
    });
  }

  Object.keys(body).forEach((key) => {
    if (key.startsWith('answer_')) {
      const questionId = key.slice('answer_'.length);
      answers[questionId] = body[key];
    }
  });

  return answers;
}

// Corrige un ensemble de questions a partir des reponses du corps de requete.
// Renvoie le score, le detail et la liste des ids rates (non repondu = rate).
function scoreSet(questions, body) {
  const answers = normalizeAnswers(body);
  const missed = [];
  let score = 0;

  questions.forEach((question) => {
    const given = answers[question.id];
    if (given === question.correctChoice) score += 1;
    else missed.push(question.id);
  });

  return { score, total: questions.length, answers, missedIds: missed, questions };
}

function scoreTheme(themeId, body) {
  return { theme: themeId, ...scoreSet(questionsForTheme(themeId), body) };
}

// Persiste un resume de session (entrainement ou examen) avec les questions ratees.
function createSession(student, result, mode = 'training') {
  return prisma.roadCodeTrainingSession.create({
    data: {
      companyId: student.companyId,
      studentId: student.id,
      theme: result.theme || mode,
      score: result.score,
      total: result.total,
      mode,
      missedIds: result.missedIds && result.missedIds.length ? result.missedIds.join(',') : null,
    },
  });
}

function recentSessions(studentId, take = 5) {
  return prisma.roadCodeTrainingSession.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

// Compte les jours consecutifs (en partant d'aujourd'hui) avec au moins une session.
function computeStreak(sessions) {
  if (sessions.length === 0) return 0;

  const dayKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const days = new Set(sessions.map((session) => dayKey(session.createdAt)));
  let streak = 0;
  const cursor = new Date();
  // On tolere une serie qui demarre hier si rien aujourd'hui.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function progressForStudent(studentId) {
  const sessions = await prisma.roadCodeTrainingSession.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  // Serie chronologique (ancien -> recent) des taux par session, pour tracer la courbe.
  const history = [...sessions]
    .reverse()
    .map((session) => ({
      theme: session.theme,
      rate: session.total > 0 ? Math.round((session.score / session.total) * 100) : 0,
      createdAt: session.createdAt,
    }));

  const totals = sessions.reduce(
    (acc, session) => {
      acc.score += session.score;
      acc.total += session.total;
      acc.byTheme[session.theme] = acc.byTheme[session.theme] || { score: 0, total: 0 };
      acc.byTheme[session.theme].score += session.score;
      acc.byTheme[session.theme].total += session.total;
      return acc;
    },
    { score: 0, total: 0, byTheme: {} }
  );

  const themeStats = themes.map((theme) => {
    const stat = totals.byTheme[theme.id] || { score: 0, total: 0 };
    const rate = stat.total > 0 ? Math.round((stat.score / stat.total) * 100) : 0;
    return { ...theme, score: stat.score, total: stat.total, rate };
  });

  return {
    sessions,
    recent: sessions.slice(0, 5),
    history,
    sessionCount: sessions.length,
    streak: computeStreak(sessions),
    totalScore: totals.score,
    totalQuestions: totals.total,
    successRate: totals.total > 0 ? Math.round((totals.score / totals.total) * 100) : 0,
    themeStats,
  };
}

// Agrege les questions ratees sur les dernieres sessions (dedupliquees, recentes d'abord).
async function recentMissedQuestions(studentId, take = 12) {
  const sessions = await prisma.roadCodeTrainingSession.findMany({
    where: { studentId, missedIds: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const seen = new Set();
  const orderedIds = [];
  sessions.forEach((session) => {
    (session.missedIds || '').split(',').forEach((id) => {
      const trimmed = id.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        orderedIds.push(trimmed);
      }
    });
  });

  return questionsByIds(orderedIds.slice(0, take));
}

module.exports = {
  scoreSet,
  scoreTheme,
  createSession,
  recentSessions,
  progressForStudent,
  recentMissedQuestions,
};
