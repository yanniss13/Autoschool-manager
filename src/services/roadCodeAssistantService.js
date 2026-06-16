// Assistant pour les questions de code de la route.
// Par defaut : API Groq (gratuite) si GROQ_API_KEY est definie.
// Repli automatique sur un moteur local par mots-cles si pas de cle ou en cas d'erreur
// (reseau, timeout, HTTP) : la demo reste fonctionnelle hors-ligne.
const groqClient = require('./groqClient');

// Consigne donnee au modele : cantonner les reponses au code de la route francais.
const SYSTEM_PROMPT =
  "Tu es un moniteur d'auto-ecole francais. Tu reponds uniquement aux questions sur le code " +
  'de la route et la conduite en France. Reponds en francais, de facon courte, claire et ' +
  'pedagogique (3 a 5 phrases maximum). Si la question est hors sujet, invite poliment ' +
  "l'eleve a poser une question sur le code de la route.";

// Base locale de repli : associations mots-cles -> reponse.
const localAnswers = [
  {
    keywords: ['priorite', 'priorites', 'droite', 'intersection', 'ceder'],
    reply:
      'Pour les priorites, retiens la base : sans panneau, feu ou marquage contraire, tu laisses passer le vehicule qui vient de ta droite. Un STOP ou un cedez-le-passage annule cette priorite.',
  },
  {
    keywords: ['vitesse', 'km', 'limitation', 'rapide'],
    reply:
      'La vitesse depend du lieu et des panneaux. En agglomeration, la regle generale est 50 km/h. Hors agglomeration, respecte toujours les panneaux, la meteo et la visibilite.',
  },
  {
    keywords: ['panneau', 'signalisation', 'triangle', 'rond', 'feu'],
    reply:
      'Les panneaux triangulaires a bord rouge annoncent un danger. Les panneaux ronds indiquent souvent une obligation ou une interdiction selon leur couleur et leur symbole.',
  },
  {
    keywords: ['stationnement', 'arret', 'garer', 'ligne jaune'],
    reply:
      'Pour le stationnement, surveille les panneaux et le marquage au sol. Une ligne jaune continue interdit l arret et le stationnement ; une ligne jaune discontinue interdit le stationnement.',
  },
  {
    keywords: ['securite', 'distance', 'freinage', 'ceinture', 'angle mort'],
    reply:
      'La securite commence par l anticipation : garde au moins deux secondes avec le vehicule devant, adapte ta vitesse et verifie retroviseurs + angles morts avant toute manoeuvre.',
  },
  {
    keywords: ['alcool', 'alcoolemie', 'drogue', 'telephone', 'portable'],
    reply:
      "Au volant, le taux d'alcool legal est de 0,5 g/L de sang (0,2 g/L en permis probatoire). Le telephone tenu en main et les stupefiants sont interdits et fortement sanctionnes.",
  },
  {
    keywords: ['rond-point', 'rond point', 'giratoire', 'carrefour'],
    reply:
      'A un carrefour a sens giratoire, tu cedes le passage aux usagers deja engages sur l anneau. Mets ton clignotant a droite juste avant de sortir.',
  },
];

// Moteur local : renvoie la meilleure reponse par mots-cles.
function localAnswer(message) {
  const normalized = (message || '').trim().toLowerCase();
  if (!normalized) {
    return 'Pose-moi une question sur les priorites, la signalisation, la vitesse, le stationnement, la securite ou les ronds-points.';
  }

  const match = localAnswers.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (match) return match.reply;

  return "Je peux t'aider sur les grands themes du code : priorites, panneaux, vitesse, stationnement, securite, alcool et ronds-points. Reformule ta question avec l'un de ces themes pour une reponse plus precise.";
}

// Construit la liste de messages envoyee a Groq : consigne + historique + nouvelle question.
function buildMessages(message, history) {
  const previous = Array.isArray(history) ? history : [];
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...previous.map((entry) => ({ role: entry.role, content: entry.content })),
    { role: 'user', content: message },
  ];
}

// Renvoie une reponse a la question de l'eleve.
// history : echanges precedents [{ role: 'user'|'assistant', content }] pour le contexte.
async function answer(message, history = []) {
  const normalized = (message || '').trim();
  if (!normalized) return localAnswer('');

  if (!groqClient.isConfigured()) {
    return localAnswer(normalized);
  }

  try {
    return await groqClient.chat(buildMessages(normalized, history));
  } catch (err) {
    // Repli silencieux : l'assistant reste utilisable hors-ligne.
    console.warn(`[assistant] repli local (Groq indisponible) : ${err.message}`);
    return localAnswer(normalized);
  }
}

// Indique si l'assistant repondra via Groq (cle configuree) plutot qu'en local.
function isOnline() {
  return groqClient.isConfigured();
}

module.exports = { answer, localAnswer, isOnline };
