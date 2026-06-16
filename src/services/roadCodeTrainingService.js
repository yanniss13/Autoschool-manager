// Services d'entrainement au code de la route.
const prisma = require('../config/prisma');
const { themes, questionsForTheme } = require('../data/roadCodeQuestions');

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

function scoreTheme(themeId, body) {
  const questions = questionsForTheme(themeId);
  const answers = normalizeAnswers(body);
  let score = 0;

  questions.forEach((question) => {
    if (answers[question.id] === question.correctChoice) score += 1;
  });

  return {
    theme: themeId,
    score,
    total: questions.length,
    answers,
    questions,
  };
}

function createSession(student, result) {
  return prisma.roadCodeTrainingSession.create({
    data: {
      companyId: student.companyId,
      studentId: student.id,
      theme: result.theme,
      score: result.score,
      total: result.total,
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

module.exports = {
  scoreTheme,
  createSession,
  recentSessions,
  progressForStudent,
};
