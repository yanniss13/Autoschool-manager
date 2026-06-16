// Assistant local pour les questions courantes de code de la route.
// V1 volontairement offline : aucune dependance API externe pour la soutenance.
const answers = [
  {
    keywords: ['priorite', 'priorites', 'droite', 'intersection'],
    reply:
      'Pour les priorites, retiens la base : sans panneau, feu ou marquage contraire, tu laisses passer le vehicule qui vient de ta droite. Un STOP ou un ceddez-le-passage annule cette priorite.',
  },
  {
    keywords: ['vitesse', 'km', 'limitation'],
    reply:
      'La vitesse depend du lieu et des panneaux. En agglomeration, la regle generale est 50 km/h. Hors agglomeration, respecte toujours les panneaux, la meteo et la visibilite.',
  },
  {
    keywords: ['panneau', 'signalisation', 'triangle', 'rond'],
    reply:
      'Les panneaux triangulaires a bord rouge annoncent un danger. Les panneaux ronds indiquent souvent une obligation ou une interdiction selon leur couleur et leur symbole.',
  },
  {
    keywords: ['stationnement', 'arret', 'garer', 'ligne jaune'],
    reply:
      'Pour le stationnement, surveille les panneaux et le marquage au sol. Une ligne jaune continue interdit l arret et le stationnement ; une ligne jaune discontinue interdit le stationnement.',
  },
  {
    keywords: ['securite', 'distance', 'freinage', 'ceinture'],
    reply:
      'La securite commence par l anticipation : garde au moins deux secondes avec le vehicule devant, adapte ta vitesse et verifie retroviseurs + angles morts avant toute manoeuvre.',
  },
];

function answer(message) {
  const normalized = (message || '').trim().toLowerCase();
  if (!normalized) {
    return "Pose-moi une question sur les priorites, la signalisation, la vitesse, le stationnement ou la securite.";
  }

  const match = answers.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (match) return match.reply;

  return "Je peux t'aider sur les grands themes du code : priorites, panneaux, vitesse, stationnement et securite. Reformule ta question avec l'un de ces themes pour une reponse plus precise.";
}

module.exports = { answer };
