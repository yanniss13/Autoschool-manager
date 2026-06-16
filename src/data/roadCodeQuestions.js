// Banque locale de questions de code de la route.
// Elle sert de base offline pour les entrainements eleves (mode revision : reponses visibles).
// Les IDs historiques (theme-1) sont conserves pour la compatibilite du smoke test.
const themes = [
  { id: 'priorites', label: 'Priorités' },
  { id: 'signalisation', label: 'Signalisation' },
  { id: 'vitesse', label: 'Vitesse' },
  { id: 'stationnement', label: 'Stationnement' },
  { id: 'securite', label: 'Sécurité' },
];

const questions = [
  // --- Priorites ---
  {
    id: 'priorites-1',
    theme: 'priorites',
    text: 'À une intersection sans panneau ni feu, qui passe en premier ?',
    choices: [
      { id: 'a', text: 'Le véhicule qui arrive le plus vite' },
      { id: 'b', text: 'Le véhicule venant de droite' },
      { id: 'c', text: 'Le véhicule le plus lourd' },
    ],
    correctChoice: 'b',
    explanation: "Sans signalisation particulière, la priorité à droite s'applique.",
  },
  {
    id: 'priorites-2',
    theme: 'priorites',
    text: "Un panneau STOP impose de marquer l'arrêt. Que faire ensuite ?",
    choices: [
      { id: 'a', text: 'Repartir sans regarder si la voie semble libre' },
      { id: 'b', text: 'Céder le passage aux usagers de la route croisée' },
      { id: 'c', text: 'Klaxonner avant de repartir' },
    ],
    correctChoice: 'b',
    explanation: "Au STOP, l'arrêt est obligatoire puis il faut céder le passage.",
  },
  {
    id: 'priorites-3',
    theme: 'priorites',
    text: 'À un carrefour à sens giratoire, tu dois...',
    choices: [
      { id: 'a', text: "Céder le passage aux véhicules déjà engagés sur l'anneau" },
      { id: 'b', text: 'Avoir la priorité car tu arrives' },
      { id: 'c', text: "T'arrêter systématiquement avant d'entrer" },
    ],
    correctChoice: 'a',
    explanation: "Sur un giratoire, on cède le passage aux usagers déjà sur l'anneau.",
  },
  {
    id: 'priorites-4',
    theme: 'priorites',
    text: 'Un panneau triangulaire avec une flèche verticale et une flèche rouge indique...',
    choices: [
      { id: 'a', text: 'Que tu as la priorité face au véhicule arrivant en sens inverse' },
      { id: 'b', text: 'Que tu dois céder le passage au véhicule arrivant en sens inverse' },
      { id: 'c', text: 'Une interdiction de tourner' },
    ],
    correctChoice: 'a',
    explanation: 'Flèche noire prioritaire sur flèche rouge : tu passes en premier dans le rétrécissement.',
  },
  {
    id: 'priorites-5',
    theme: 'priorites',
    text: "Tu approches d'un feu tricolore en panne (éteint). Tu dois...",
    choices: [
      { id: 'a', text: 'Passer en force, le feu ne marche pas' },
      { id: 'b', text: 'Appliquer la priorité à droite' },
      { id: 'c', text: "T'arrêter définitivement" },
    ],
    correctChoice: 'b',
    explanation: 'Feu en panne : on revient à la règle de la priorité à droite.',
  },
  {
    id: 'priorites-6',
    theme: 'priorites',
    text: 'Un véhicule prioritaire (pompiers, SAMU) arrive en sirène. Tu dois...',
    choices: [
      { id: 'a', text: 'Continuer normalement' },
      { id: 'b', text: 'Te ranger et lui céder le passage en sécurité' },
      { id: 'c', text: 'Freiner brusquement sur place' },
    ],
    correctChoice: 'b',
    explanation: "On facilite le passage des véhicules d'intérêt général prioritaires en se rangeant.",
  },
  {
    id: 'priorites-7',
    theme: 'priorites',
    text: 'Un panneau carré jaune sur pointe (losange) signifie...',
    choices: [
      { id: 'a', text: 'Fin de route prioritaire' },
      { id: 'b', text: 'Route à caractère prioritaire' },
      { id: 'c', text: 'Stationnement réservé' },
    ],
    correctChoice: 'b',
    explanation: 'Le losange jaune indique une route prioritaire ; barré, il en annonce la fin.',
  },
  {
    id: 'priorites-8',
    theme: 'priorites',
    text: 'Tu veux tourner à gauche à une intersection. Un véhicule arrive en face tout droit. Tu dois...',
    choices: [
      { id: 'a', text: 'Le laisser passer avant de tourner' },
      { id: 'b', text: 'Tourner vite avant lui' },
      { id: 'c', text: "Klaxonner pour qu'il ralentisse" },
    ],
    correctChoice: 'a',
    explanation: 'Celui qui tourne à gauche cède le passage à la circulation venant en face.',
  },
  {
    id: 'priorites-9',
    theme: 'priorites',
    text: 'À un passage pour piétons sans feu, un piéton manifeste son intention de traverser. Tu dois...',
    choices: [
      { id: 'a', text: 'Accélérer pour passer avant lui' },
      { id: 'b', text: 'Lui céder le passage' },
      { id: 'c', text: 'Klaxonner' },
    ],
    correctChoice: 'b',
    explanation: 'Le piéton engagé ou manifestant son intention de traverser est prioritaire.',
  },
  {
    id: 'priorites-10',
    theme: 'priorites',
    text: 'Un panneau "Cédez le passage" (triangle pointe en bas) impose...',
    choices: [
      { id: 'a', text: 'Un arrêt total obligatoire' },
      { id: 'b', text: "De céder le passage sans forcément s'arrêter si la voie est libre" },
      { id: 'c', text: 'La priorité sur les autres' },
    ],
    correctChoice: 'b',
    explanation: "Au cédez-le-passage, l'arrêt n'est pas obligatoire si la voie croisée est libre.",
  },

  // --- Signalisation ---
  {
    id: 'signalisation-1',
    theme: 'signalisation',
    text: 'Un panneau triangulaire à bord rouge annonce généralement...',
    choices: [
      { id: 'a', text: 'Un danger' },
      { id: 'b', text: 'Une obligation' },
      { id: 'c', text: 'Une direction obligatoire' },
    ],
    correctChoice: 'a',
    explanation: 'Les panneaux triangulaires à bord rouge signalent un danger.',
  },
  {
    id: 'signalisation-2',
    theme: 'signalisation',
    text: 'Un panneau rond à bord rouge indique le plus souvent...',
    choices: [
      { id: 'a', text: 'Une obligation' },
      { id: 'b', text: 'Une interdiction' },
      { id: 'c', text: 'Une indication' },
    ],
    correctChoice: 'b',
    explanation: 'Les panneaux ronds à bord rouge expriment une interdiction.',
  },
  {
    id: 'signalisation-3',
    theme: 'signalisation',
    text: 'Un panneau rond entièrement bleu indique...',
    choices: [
      { id: 'a', text: 'Une interdiction' },
      { id: 'b', text: 'Une obligation' },
      { id: 'c', text: 'Un danger' },
    ],
    correctChoice: 'b',
    explanation: 'Les panneaux ronds bleus indiquent une obligation (ex. sens obligatoire).',
  },
  {
    id: 'signalisation-4',
    theme: 'signalisation',
    text: 'Au feu tricolore, le feu orange (jaune) fixe signifie...',
    choices: [
      { id: 'a', text: 'Accélère pour passer' },
      { id: 'b', text: 'Arrête-toi si tu peux le faire en sécurité' },
      { id: 'c', text: 'Le feu va passer au vert' },
    ],
    correctChoice: 'b',
    explanation: "À l'orange, on s'arrête sauf si l'arrêt ne peut se faire en sécurité.",
  },
  {
    id: 'signalisation-5',
    theme: 'signalisation',
    text: 'Une ligne blanche continue au centre de la chaussée...',
    choices: [
      { id: 'a', text: 'Peut être franchie pour dépasser' },
      { id: 'b', text: 'Ne doit pas être franchie ni chevauchée' },
      { id: 'c', text: 'Indique une voie de bus' },
    ],
    correctChoice: 'b',
    explanation: 'La ligne continue ne doit être ni franchie ni chevauchée.',
  },
  {
    id: 'signalisation-6',
    theme: 'signalisation',
    text: 'Un panneau rond bleu avec un "30" sur fond bleu indique...',
    choices: [
      { id: 'a', text: 'Une vitesse maximale de 30 km/h' },
      { id: 'b', text: 'Une vitesse minimale obligatoire de 30 km/h' },
      { id: 'c', text: 'Une fin de limitation' },
    ],
    correctChoice: 'b',
    explanation: 'Le panneau rond bleu impose une vitesse minimale ; le rond à bord rouge serait un maximum.',
  },
  {
    id: 'signalisation-7',
    theme: 'signalisation',
    text: 'Un marquage en zigzag jaune le long du trottoir signale...',
    choices: [
      { id: 'a', text: "Un emplacement réservé à l'arrêt des bus" },
      { id: 'b', text: 'Une piste cyclable' },
      { id: 'c', text: 'Une zone de livraison' },
    ],
    correctChoice: 'a',
    explanation: "Les zigzags jaunes marquent un arrêt de bus où l'arrêt et le stationnement sont interdits.",
  },
  {
    id: 'signalisation-8',
    theme: 'signalisation',
    text: 'Un panneau de forme octogonale (8 côtés) rouge correspond à...',
    choices: [
      { id: 'a', text: 'Un cédez-le-passage' },
      { id: 'b', text: 'Un STOP' },
      { id: 'c', text: 'Un sens interdit' },
    ],
    correctChoice: 'b',
    explanation: 'Seul le panneau STOP a cette forme octogonale, pour être reconnu même de dos.',
  },
  {
    id: 'signalisation-9',
    theme: 'signalisation',
    text: 'Un panneau carré à fond bleu sert généralement à...',
    choices: [
      { id: 'a', text: 'Interdire' },
      { id: 'b', text: 'Donner une indication (service, direction)' },
      { id: 'c', text: 'Annoncer un danger' },
    ],
    correctChoice: 'b',
    explanation: "Les panneaux carrés bleus sont des panneaux d'indication.",
  },
  {
    id: 'signalisation-10',
    theme: 'signalisation',
    text: "Une flèche de rabattement peinte au sol t'invite à...",
    choices: [
      { id: 'a', text: 'Accélérer' },
      { id: 'b', text: 'Changer de file car ta voie va disparaître' },
      { id: 'c', text: "T'arrêter" },
    ],
    correctChoice: 'b',
    explanation: 'La flèche de rabattement annonce la fin de la voie : il faut se rabattre à temps.',
  },

  // --- Vitesse ---
  {
    id: 'vitesse-1',
    theme: 'vitesse',
    text: 'En agglomération, la vitesse maximale générale est de...',
    choices: [
      { id: 'a', text: '30 km/h' },
      { id: 'b', text: '50 km/h' },
      { id: 'c', text: '80 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'La limitation générale en agglomération est 50 km/h, sauf indication contraire.',
  },
  {
    id: 'vitesse-2',
    theme: 'vitesse',
    text: 'Sur autoroute par temps sec, la vitesse maximale pour un véhicule léger est de...',
    choices: [
      { id: 'a', text: '110 km/h' },
      { id: 'b', text: '130 km/h' },
      { id: 'c', text: '150 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'Sur autoroute, la vitesse maximale est de 130 km/h par temps sec.',
  },
  {
    id: 'vitesse-3',
    theme: 'vitesse',
    text: 'Sur autoroute sous la pluie, la vitesse maximale passe à...',
    choices: [
      { id: 'a', text: '130 km/h' },
      { id: 'b', text: '110 km/h' },
      { id: 'c', text: '90 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'Par temps de pluie, la vitesse sur autoroute est abaissée à 110 km/h.',
  },
  {
    id: 'vitesse-4',
    theme: 'vitesse',
    text: 'Sur une route à double sens sans séparateur central, la vitesse générale hors agglomération est de...',
    choices: [
      { id: 'a', text: '80 km/h' },
      { id: 'b', text: '90 km/h' },
      { id: 'c', text: '110 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'Depuis 2018, ces routes sont généralement limitées à 80 km/h (parfois 90 selon le département).',
  },
  {
    id: 'vitesse-5',
    theme: 'vitesse',
    text: 'En permis probatoire (jeune conducteur) sur autoroute, tu es limité à...',
    choices: [
      { id: 'a', text: '130 km/h' },
      { id: 'b', text: '110 km/h' },
      { id: 'c', text: '100 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'En période probatoire, la vitesse sur autoroute est limitée à 110 km/h.',
  },
  {
    id: 'vitesse-6',
    theme: 'vitesse',
    text: 'Dans une "zone 30", la vitesse est limitée à...',
    choices: [
      { id: 'a', text: '30 km/h' },
      { id: 'b', text: '50 km/h' },
      { id: 'c', text: '20 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'La zone 30 limite la vitesse à 30 km/h pour protéger les usagers vulnérables.',
  },
  {
    id: 'vitesse-7',
    theme: 'vitesse',
    text: 'Dans une "zone de rencontre", la vitesse est limitée à...',
    choices: [
      { id: 'a', text: '20 km/h' },
      { id: 'b', text: '30 km/h' },
      { id: 'c', text: '50 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'En zone de rencontre, les piétons sont prioritaires et la vitesse est limitée à 20 km/h.',
  },
  {
    id: 'vitesse-8',
    theme: 'vitesse',
    text: 'Rouler nettement en dessous de la vitesse autorisée sans raison...',
    choices: [
      { id: 'a', text: 'Est toujours plus sûr' },
      { id: 'b', text: 'Peut être dangereux et constituer une gêne à la circulation' },
      { id: 'c', text: 'Est obligatoire pour un jeune conducteur' },
    ],
    correctChoice: 'b',
    explanation: 'Une vitesse trop basse injustifiée gêne la circulation et peut être sanctionnée.',
  },
  {
    id: 'vitesse-9',
    theme: 'vitesse',
    text: 'La vitesse maximale est-elle modifiée par la présence de brouillard réduisant la visibilité à moins de 50 m ?',
    choices: [
      { id: 'a', text: 'Non, la limite reste la même' },
      { id: 'b', text: 'Oui, elle est ramenée à 50 km/h sur toutes les routes' },
      { id: 'c', text: 'Oui, mais seulement sur autoroute' },
    ],
    correctChoice: 'b',
    explanation: "Visibilité inférieure à 50 m : la vitesse est limitée à 50 km/h sur l'ensemble du réseau.",
  },
  {
    id: 'vitesse-10',
    theme: 'vitesse',
    text: "À l'approche d'une école avec des enfants, tu dois...",
    choices: [
      { id: 'a', text: 'Maintenir ta vitesse' },
      { id: 'b', text: 'Réduire ta vitesse et redoubler de vigilance' },
      { id: 'c', text: 'Klaxonner pour prévenir' },
    ],
    correctChoice: 'b',
    explanation: "Près des écoles, on adapte sa vitesse à la présence d'enfants, usagers imprévisibles.",
  },

  // --- Stationnement ---
  {
    id: 'stationnement-1',
    theme: 'stationnement',
    text: 'Une ligne jaune continue le long du trottoir indique...',
    choices: [
      { id: 'a', text: 'Stationnement autorisé seulement la nuit' },
      { id: 'b', text: 'Arrêt et stationnement interdits' },
      { id: 'c', text: 'Stationnement gratuit' },
    ],
    correctChoice: 'b',
    explanation: "La ligne jaune continue interdit l'arrêt et le stationnement.",
  },
  {
    id: 'stationnement-2',
    theme: 'stationnement',
    text: 'Une ligne jaune discontinue le long du trottoir indique...',
    choices: [
      { id: 'a', text: 'Stationnement interdit (mais arrêt autorisé)' },
      { id: 'b', text: 'Arrêt et stationnement interdits' },
      { id: 'c', text: 'Stationnement payant' },
    ],
    correctChoice: 'a',
    explanation: "La ligne jaune discontinue interdit le stationnement mais autorise l'arrêt.",
  },
  {
    id: 'stationnement-3',
    theme: 'stationnement',
    text: "Quelle est la différence entre arrêt et stationnement ?",
    choices: [
      { id: 'a', text: 'Aucune, ce sont des synonymes' },
      { id: 'b', text: "L'arrêt est bref, conducteur présent ; le stationnement immobilise le véhicule plus longtemps" },
      { id: 'c', text: 'Le stationnement est toujours plus court' },
    ],
    correctChoice: 'b',
    explanation: "L'arrêt est momentané avec conducteur à proximité ; le stationnement immobilise le véhicule.",
  },
  {
    id: 'stationnement-4',
    theme: 'stationnement',
    text: 'Stationner sur un passage pour piétons est...',
    choices: [
      { id: 'a', text: 'Autorisé quelques minutes' },
      { id: 'b', text: 'Très dangereux et interdit (stationnement très gênant)' },
      { id: 'c', text: 'Autorisé la nuit' },
    ],
    correctChoice: 'b',
    explanation: 'Stationner sur un passage piéton est un stationnement très gênant, lourdement sanctionné.',
  },
  {
    id: 'stationnement-5',
    theme: 'stationnement',
    text: 'En agglomération, sur une route à double sens, le stationnement se fait...',
    choices: [
      { id: 'a', text: 'Toujours à gauche' },
      { id: 'b', text: 'Du côté droit de la chaussée' },
      { id: 'c', text: "N'importe où" },
    ],
    correctChoice: 'b',
    explanation: 'Sur chaussée à double sens, on stationne à droite dans le sens de la marche.',
  },
  {
    id: 'stationnement-6',
    theme: 'stationnement',
    text: "Un emplacement marqué d'un fauteuil roulant est réservé...",
    choices: [
      { id: 'a', text: "À tout le monde si c'est court" },
      { id: 'b', text: "Aux titulaires d'une carte mobilité inclusion stationnement" },
      { id: 'c', text: 'Aux livraisons' },
    ],
    correctChoice: 'b',
    explanation: 'Ces places sont réservées aux personnes munies de la carte mobilité inclusion (stationnement).',
  },
  {
    id: 'stationnement-7',
    theme: 'stationnement',
    text: "Le stationnement est-il autorisé devant une bouche d'incendie ?",
    choices: [
      { id: 'a', text: 'Oui' },
      { id: 'b', text: "Non, c'est interdit (gênant)" },
      { id: 'c', text: 'Oui, mais moins de 5 minutes' },
    ],
    correctChoice: 'b',
    explanation: "Le stationnement devant une bouche ou poteau d'incendie est interdit et gênant.",
  },
  {
    id: 'stationnement-8',
    theme: 'stationnement',
    text: 'En quittant ta place de stationnement, tu dois...',
    choices: [
      { id: 'a', text: 'Démarrer sans regarder, tu es prioritaire' },
      { id: 'b', text: "Céder le passage et contrôler tes angles morts avant de t'insérer" },
      { id: 'c', text: 'Klaxonner et avancer' },
    ],
    correctChoice: 'b',
    explanation: 'En quittant un stationnement, on cède le passage à la circulation et on vérifie les angles morts.',
  },
  {
    id: 'stationnement-9',
    theme: 'stationnement',
    text: 'Stationner à moins de 5 mètres avant un passage piéton (côté circulation) est...',
    choices: [
      { id: 'a', text: 'Autorisé' },
      { id: 'b', text: 'Interdit car cela masque la visibilité des piétons' },
      { id: 'c', text: 'Autorisé seulement de jour' },
    ],
    correctChoice: 'b',
    explanation: "Stationner juste avant un passage piéton masque les piétons : c'est interdit.",
  },
  {
    id: 'stationnement-10',
    theme: 'stationnement',
    text: 'Sur une place de stationnement en épi, tu dois...',
    choices: [
      { id: 'a', text: 'Te garer en biais selon le marquage' },
      { id: 'b', text: "Te garer perpendiculairement quoi qu'il arrive" },
      { id: 'c', text: 'Te garer le long du trottoir' },
    ],
    correctChoice: 'a',
    explanation: "Le stationnement en épi se fait en biais, en suivant le marquage au sol.",
  },

  // --- Securite ---
  {
    id: 'securite-1',
    theme: 'securite',
    text: 'La distance de sécurité minimale sur route se calcule avec...',
    choices: [
      { id: 'a', text: 'Au moins deux secondes avec le véhicule devant' },
      { id: 'b', text: 'La largeur de la route' },
      { id: 'c', text: 'La puissance du véhicule' },
    ],
    correctChoice: 'a',
    explanation: 'La règle des deux secondes aide à conserver une distance suffisante.',
  },
  {
    id: 'securite-2',
    theme: 'securite',
    text: 'Le port de la ceinture de sécurité est...',
    choices: [
      { id: 'a', text: 'Obligatoire pour tous les occupants, avant comme arrière' },
      { id: 'b', text: "Obligatoire seulement à l'avant" },
      { id: 'c', text: 'Facultatif en ville' },
    ],
    correctChoice: 'a',
    explanation: "La ceinture est obligatoire pour tous les occupants, à l'avant comme à l'arrière.",
  },
  {
    id: 'securite-3',
    theme: 'securite',
    text: "Le taux d'alcool maximal autorisé pour un conducteur en permis probatoire est de...",
    choices: [
      { id: 'a', text: '0,5 g/L de sang' },
      { id: 'b', text: '0,2 g/L de sang' },
      { id: 'c', text: '0,8 g/L de sang' },
    ],
    correctChoice: 'b',
    explanation: 'En permis probatoire, la limite est de 0,2 g/L (quasi zéro alcool).',
  },
  {
    id: 'securite-4',
    theme: 'securite',
    text: 'Tenir son téléphone en main au volant est...',
    choices: [
      { id: 'a', text: "Autorisé à l'arrêt à un feu" },
      { id: 'b', text: 'Interdit et sanctionné' },
      { id: 'c', text: 'Autorisé pour le GPS' },
    ],
    correctChoice: 'b',
    explanation: 'Tenir un téléphone en main en conduisant est interdit et verbalisé.',
  },
  {
    id: 'securite-5',
    theme: 'securite',
    text: "Avant de changer de direction, l'angle mort se contrôle...",
    choices: [
      { id: 'a', text: 'Uniquement dans le rétroviseur intérieur' },
      { id: 'b', text: "Par un coup d'œil par-dessus l'épaule" },
      { id: 'c', text: "Ce n'est pas nécessaire avec les rétroviseurs" },
    ],
    correctChoice: 'b',
    explanation: "Les rétroviseurs ne couvrent pas tout : un regard par-dessus l'épaule vérifie l'angle mort.",
  },
  {
    id: 'securite-6',
    theme: 'securite',
    text: 'La distance de freinage augmente surtout avec...',
    choices: [
      { id: 'a', text: 'La couleur du véhicule' },
      { id: 'b', text: "La vitesse et l'état de la chaussée" },
      { id: 'c', text: 'Le nombre de passagers uniquement' },
    ],
    correctChoice: 'b',
    explanation: 'La distance de freinage croît avec la vitesse (au carré) et une chaussée glissante.',
  },
  {
    id: 'securite-7',
    theme: 'securite',
    text: 'Hors agglomération, sur le siège passager, un enfant de moins de 10 ans...',
    choices: [
      { id: 'a', text: 'Doit être attaché dans un dispositif adapté à sa taille' },
      { id: 'b', text: 'Peut voyager sans rehausseur' },
      { id: 'c', text: "Doit toujours être sur les genoux d'un adulte" },
    ],
    correctChoice: 'a',
    explanation: 'Les enfants doivent utiliser un dispositif de retenue homologué adapté à leur morphologie.',
  },
  {
    id: 'securite-8',
    theme: 'securite',
    text: 'En cas de fatigue sur un long trajet, la bonne réaction est...',
    choices: [
      { id: 'a', text: 'Boire un café et continuer plusieurs heures' },
      { id: 'b', text: "S'arrêter régulièrement (toutes les 2 h) pour se reposer" },
      { id: 'c', text: 'Ouvrir la fenêtre et accélérer' },
    ],
    correctChoice: 'b',
    explanation: 'La pause toutes les deux heures est la seule réponse efficace à la fatigue.',
  },
  {
    id: 'securite-9',
    theme: 'securite',
    text: "L'usage des feux de détresse (warning) sert principalement à...",
    choices: [
      { id: 'a', text: 'Signaler un danger ou un arrêt imprévu' },
      { id: 'b', text: 'Stationner en double file tranquillement' },
      { id: 'c', text: 'Rouler plus vite' },
    ],
    correctChoice: 'a',
    explanation: "Les feux de détresse préviennent les autres usagers d'un danger ou d'un ralentissement soudain.",
  },
  {
    id: 'securite-10',
    theme: 'securite',
    text: "En cas d'arrêt d'urgence sur autoroute, après s'être arrêté sur la bande d'arrêt d'urgence, on doit...",
    choices: [
      { id: 'a', text: 'Rester dans le véhicule au volant' },
      { id: 'b', text: 'Mettre le gilet, sortir côté sécurité et se mettre derrière la glissière' },
      { id: 'c', text: 'Traverser pour observer la circulation' },
    ],
    correctChoice: 'b',
    explanation: 'On enfile le gilet, on évacue côté opposé au trafic et on se protège derrière la glissière.',
  },
];

function findTheme(themeId) {
  return themes.find((theme) => theme.id === themeId) || themes[0];
}

function questionsForTheme(themeId) {
  return questions.filter((question) => question.theme === themeId);
}

function questionById(id) {
  return questions.find((question) => question.id === id) || null;
}

// Retourne les questions correspondant a une liste d'ids, dans l'ordre demande.
function questionsByIds(ids) {
  return (ids || []).map((id) => questionById(id)).filter(Boolean);
}

// Melange de Fisher-Yates sur une copie.
function shuffle(items) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// Tire `count` questions au hasard (toutes themes confondues).
function randomQuestions(count) {
  return shuffle(questions).slice(0, Math.min(count, questions.length));
}

// Tirage *pondere par theme* pour l'examen blanc : on prend les questions en
// tourniquet (round-robin) sur les themes melanges, ce qui repartit l'examen le
// plus equitablement possible entre themes (ex. 40 questions sur 5 themes -> 8
// chacun). Un theme epuise est simplement saute ; l'ordre final est melange.
function weightedRandomQuestions(count) {
  const pools = themes.map((theme) => shuffle(questionsForTheme(theme.id)));
  const picked = [];
  let progressed = true;

  while (picked.length < count && progressed) {
    progressed = false;
    for (const pool of pools) {
      if (pool.length > 0 && picked.length < count) {
        picked.push(pool.pop());
        progressed = true;
      }
    }
  }

  return shuffle(picked);
}

module.exports = {
  themes,
  questions,
  findTheme,
  questionsForTheme,
  questionById,
  questionsByIds,
  randomQuestions,
  weightedRandomQuestions,
};
