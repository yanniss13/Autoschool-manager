// Assistant pour les questions de code de la route.
// Par defaut : API Groq (gratuite) si GROQ_API_KEY est definie.
// Repli automatique sur un moteur local par mots-cles si pas de cle ou en cas d'erreur
// (reseau, timeout, HTTP) : la demo reste fonctionnelle hors-ligne.
const groqClient = require('./groqClient');

// Consigne donnee au modele : cantonner les reponses au code de la route francais.
const SYSTEM_PROMPT =
  "Tu es un moniteur d'auto-école français. Tu réponds uniquement aux questions sur le code " +
  'de la route et la conduite en France. Réponds en français, de façon courte, claire et ' +
  'pédagogique (3 à 5 phrases maximum). Si la question est hors sujet, invite poliment ' +
  "l'élève à poser une question sur le code de la route.";

// Base locale de repli : associations mots-cles -> reponse.
const localAnswers = [
  {
    keywords: ['priorite', 'priorites', 'droite', 'intersection', 'ceder'],
    reply:
      'Pour les priorités, retiens la base : sans panneau, feu ou marquage contraire, tu laisses passer le véhicule qui vient de ta droite. Un STOP ou un cédez-le-passage annule cette priorité.',
  },
  {
    keywords: ['vitesse', 'km', 'limitation', 'rapide'],
    reply:
      'La vitesse dépend du lieu et des panneaux. En agglomération, la règle générale est 50 km/h. Hors agglomération, respecte toujours les panneaux, la météo et la visibilité.',
  },
  {
    keywords: ['panneau', 'signalisation', 'triangle', 'rond', 'feu'],
    reply:
      'Les panneaux triangulaires à bord rouge annoncent un danger. Les panneaux ronds indiquent souvent une obligation ou une interdiction selon leur couleur et leur symbole.',
  },
  {
    keywords: ['stationnement', 'arret', 'garer', 'ligne jaune'],
    reply:
      "Pour le stationnement, surveille les panneaux et le marquage au sol. Une ligne jaune continue interdit l'arrêt et le stationnement ; une ligne jaune discontinue interdit le stationnement.",
  },
  {
    keywords: ['securite', 'distance', 'freinage', 'ceinture', 'angle mort'],
    reply:
      "La sécurité commence par l'anticipation : garde au moins deux secondes avec le véhicule devant, adapte ta vitesse et vérifie rétroviseurs + angles morts avant toute manœuvre.",
  },
  {
    keywords: ['alcool', 'alcoolemie', 'drogue', 'telephone', 'portable'],
    reply:
      "Au volant, le taux d'alcool légal est de 0,5 g/L de sang (0,2 g/L en permis probatoire). Le téléphone tenu en main et les stupéfiants sont interdits et fortement sanctionnés.",
  },
  {
    keywords: ['rond-point', 'rond point', 'giratoire', 'carrefour'],
    reply:
      "À un carrefour à sens giratoire, tu cèdes le passage aux usagers déjà engagés sur l'anneau. Mets ton clignotant à droite juste avant de sortir.",
  },
];

// Moteur local : renvoie la meilleure reponse par mots-cles.
function localAnswer(message) {
  const normalized = (message || '').trim().toLowerCase();
  if (!normalized) {
    return 'Pose-moi une question sur les priorités, la signalisation, la vitesse, le stationnement, la sécurité ou les ronds-points.';
  }

  const match = localAnswers.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (match) return match.reply;

  return "Je peux t'aider sur les grands thèmes du code : priorités, panneaux, vitesse, stationnement, sécurité, alcool et ronds-points. Reformule ta question avec l'un de ces thèmes pour une réponse plus précise.";
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
