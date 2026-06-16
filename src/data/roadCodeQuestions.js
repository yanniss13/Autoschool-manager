// Banque locale minimale de questions de code de la route.
// Elle sert de base offline pour les entrainements eleves.
const themes = [
  { id: 'priorites', label: 'Priorites' },
  { id: 'signalisation', label: 'Signalisation' },
  { id: 'vitesse', label: 'Vitesse' },
  { id: 'stationnement', label: 'Stationnement' },
  { id: 'securite', label: 'Securite' },
];

const questions = [
  {
    id: 'priorites-1',
    theme: 'priorites',
    text: 'A une intersection sans panneau ni feu, qui passe en premier ?',
    choices: [
      { id: 'a', text: 'Le vehicule qui arrive le plus vite' },
      { id: 'b', text: 'Le vehicule venant de droite' },
      { id: 'c', text: 'Le vehicule le plus lourd' },
    ],
    correctChoice: 'b',
    explanation: 'Sans signalisation particuliere, la priorite a droite s applique.',
  },
  {
    id: 'priorites-2',
    theme: 'priorites',
    text: 'Un panneau STOP impose de marquer l arret. Que faire ensuite ?',
    choices: [
      { id: 'a', text: 'Repartir sans regarder si la voie semble libre' },
      { id: 'b', text: 'Ceder le passage aux usagers de la route croisee' },
      { id: 'c', text: 'Klaxonner avant de repartir' },
    ],
    correctChoice: 'b',
    explanation: 'Au STOP, l arret est obligatoire puis il faut ceder le passage.',
  },
  {
    id: 'signalisation-1',
    theme: 'signalisation',
    text: 'Un panneau triangulaire a bord rouge annonce generalement...',
    choices: [
      { id: 'a', text: 'Un danger' },
      { id: 'b', text: 'Une obligation' },
      { id: 'c', text: 'Une direction obligatoire' },
    ],
    correctChoice: 'a',
    explanation: 'Les panneaux triangulaires a bord rouge signalent un danger.',
  },
  {
    id: 'vitesse-1',
    theme: 'vitesse',
    text: 'En agglomeration, la vitesse maximale generale est de...',
    choices: [
      { id: 'a', text: '30 km/h' },
      { id: 'b', text: '50 km/h' },
      { id: 'c', text: '80 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'La limitation generale en agglomeration est 50 km/h, sauf indication contraire.',
  },
  {
    id: 'stationnement-1',
    theme: 'stationnement',
    text: 'Une ligne jaune continue le long du trottoir indique...',
    choices: [
      { id: 'a', text: 'Stationnement autorise seulement la nuit' },
      { id: 'b', text: 'Arret et stationnement interdits' },
      { id: 'c', text: 'Stationnement gratuit' },
    ],
    correctChoice: 'b',
    explanation: 'La ligne jaune continue interdit l arret et le stationnement.',
  },
  {
    id: 'securite-1',
    theme: 'securite',
    text: 'La distance de securite minimale sur route se calcule avec...',
    choices: [
      { id: 'a', text: 'Au moins deux secondes avec le vehicule devant' },
      { id: 'b', text: 'La largeur de la route' },
      { id: 'c', text: 'La puissance du vehicule' },
    ],
    correctChoice: 'a',
    explanation: 'La regle des deux secondes aide a conserver une distance suffisante.',
  },
];

function findTheme(themeId) {
  return themes.find((theme) => theme.id === themeId) || themes[0];
}

function questionsForTheme(themeId) {
  return questions.filter((question) => question.theme === themeId);
}

module.exports = { themes, questions, findTheme, questionsForTheme };
