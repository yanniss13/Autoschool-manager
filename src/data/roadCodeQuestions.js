// Banque locale de questions de code de la route.
// Elle sert de base offline pour les entrainements eleves (mode revision : reponses visibles).
// Les IDs historiques (theme-1) sont conserves pour la compatibilite du smoke test.
const themes = [
  { id: 'priorites', label: 'Priorites' },
  { id: 'signalisation', label: 'Signalisation' },
  { id: 'vitesse', label: 'Vitesse' },
  { id: 'stationnement', label: 'Stationnement' },
  { id: 'securite', label: 'Securite' },
];

const questions = [
  // --- Priorites ---
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
    id: 'priorites-3',
    theme: 'priorites',
    text: 'A un carrefour a sens giratoire, tu dois...',
    choices: [
      { id: 'a', text: 'Ceder le passage aux vehicules deja engages sur l anneau' },
      { id: 'b', text: 'Avoir la priorite car tu arrives' },
      { id: 'c', text: 'T arreter systematiquement avant d entrer' },
    ],
    correctChoice: 'a',
    explanation: 'Sur un giratoire, on cede le passage aux usagers deja sur l anneau.',
  },
  {
    id: 'priorites-4',
    theme: 'priorites',
    text: 'Un panneau triangulaire avec une fleche verticale et une fleche rouge indique...',
    choices: [
      { id: 'a', text: 'Que tu as la priorite face au vehicule arrivant en sens inverse' },
      { id: 'b', text: 'Que tu dois ceder le passage au vehicule arrivant en sens inverse' },
      { id: 'c', text: 'Une interdiction de tourner' },
    ],
    correctChoice: 'a',
    explanation: 'Fleche noire prioritaire sur fleche rouge : tu passes en premier dans le retrecissement.',
  },
  {
    id: 'priorites-5',
    theme: 'priorites',
    text: 'Tu approches d un feu tricolore en panne (eteint). Tu dois...',
    choices: [
      { id: 'a', text: 'Passer en force, le feu ne marche pas' },
      { id: 'b', text: 'Appliquer la priorite a droite' },
      { id: 'c', text: 'T arreter definitivement' },
    ],
    correctChoice: 'b',
    explanation: 'Feu en panne : on revient a la regle de la priorite a droite.',
  },
  {
    id: 'priorites-6',
    theme: 'priorites',
    text: 'Un vehicule prioritaire (pompiers, SAMU) arrive en sirene. Tu dois...',
    choices: [
      { id: 'a', text: 'Continuer normalement' },
      { id: 'b', text: 'Te ranger et lui ceder le passage en securite' },
      { id: 'c', text: 'Freiner brusquement sur place' },
    ],
    correctChoice: 'b',
    explanation: 'On facilite le passage des vehicules d interet general prioritaires en se rangeant.',
  },
  {
    id: 'priorites-7',
    theme: 'priorites',
    text: 'Un panneau carre jaune sur pointe (losange) signifie...',
    choices: [
      { id: 'a', text: 'Fin de route prioritaire' },
      { id: 'b', text: 'Route a caractere prioritaire' },
      { id: 'c', text: 'Stationnement reserve' },
    ],
    correctChoice: 'b',
    explanation: 'Le losange jaune indique une route prioritaire ; barre, il en annonce la fin.',
  },
  {
    id: 'priorites-8',
    theme: 'priorites',
    text: 'Tu veux tourner a gauche a une intersection. Un vehicule arrive en face tout droit. Tu dois...',
    choices: [
      { id: 'a', text: 'Le laisser passer avant de tourner' },
      { id: 'b', text: 'Tourner vite avant lui' },
      { id: 'c', text: 'Klaxonner pour qu il ralentisse' },
    ],
    correctChoice: 'a',
    explanation: 'Celui qui tourne a gauche cede le passage a la circulation venant en face.',
  },
  {
    id: 'priorites-9',
    theme: 'priorites',
    text: 'A un passage pour pietons sans feu, un pieton manifeste son intention de traverser. Tu dois...',
    choices: [
      { id: 'a', text: 'Accelerer pour passer avant lui' },
      { id: 'b', text: 'Lui ceder le passage' },
      { id: 'c', text: 'Klaxonner' },
    ],
    correctChoice: 'b',
    explanation: 'Le pieton engage ou manifestant son intention de traverser est prioritaire.',
  },
  {
    id: 'priorites-10',
    theme: 'priorites',
    text: 'Un panneau "Cedez le passage" (triangle pointe en bas) impose...',
    choices: [
      { id: 'a', text: 'Un arret total obligatoire' },
      { id: 'b', text: 'De ceder le passage sans forcement s arreter si la voie est libre' },
      { id: 'c', text: 'La priorite sur les autres' },
    ],
    correctChoice: 'b',
    explanation: 'Au cedez-le-passage, l arret n est pas obligatoire si la voie croisee est libre.',
  },

  // --- Signalisation ---
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
    id: 'signalisation-2',
    theme: 'signalisation',
    text: 'Un panneau rond a bord rouge indique le plus souvent...',
    choices: [
      { id: 'a', text: 'Une obligation' },
      { id: 'b', text: 'Une interdiction' },
      { id: 'c', text: 'Une indication' },
    ],
    correctChoice: 'b',
    explanation: 'Les panneaux ronds a bord rouge expriment une interdiction.',
  },
  {
    id: 'signalisation-3',
    theme: 'signalisation',
    text: 'Un panneau rond entierement bleu indique...',
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
      { id: 'a', text: 'Accelere pour passer' },
      { id: 'b', text: 'Arrete-toi si tu peux le faire en securite' },
      { id: 'c', text: 'Le feu va passer au vert' },
    ],
    correctChoice: 'b',
    explanation: 'A l orange, on s arrete sauf si l arret ne peut se faire en securite.',
  },
  {
    id: 'signalisation-5',
    theme: 'signalisation',
    text: 'Une ligne blanche continue au centre de la chaussee...',
    choices: [
      { id: 'a', text: 'Peut etre franchie pour depasser' },
      { id: 'b', text: 'Ne doit pas etre franchie ni chevauchee' },
      { id: 'c', text: 'Indique une voie de bus' },
    ],
    correctChoice: 'b',
    explanation: 'La ligne continue ne doit etre ni franchie ni chevauchee.',
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
    explanation: 'Le panneau rond bleu impose une vitesse minimale ; le rond a bord rouge serait un maximum.',
  },
  {
    id: 'signalisation-7',
    theme: 'signalisation',
    text: 'Un marquage en zigzag jaune le long du trottoir signale...',
    choices: [
      { id: 'a', text: 'Un emplacement reserve a l arret des bus' },
      { id: 'b', text: 'Une piste cyclable' },
      { id: 'c', text: 'Une zone de livraison' },
    ],
    correctChoice: 'a',
    explanation: 'Les zigzags jaunes marquent un arret de bus ou l arret et le stationnement sont interdits.',
  },
  {
    id: 'signalisation-8',
    theme: 'signalisation',
    text: 'Un panneau de forme octogonale (8 cotes) rouge correspond a...',
    choices: [
      { id: 'a', text: 'Un cedez-le-passage' },
      { id: 'b', text: 'Un STOP' },
      { id: 'c', text: 'Un sens interdit' },
    ],
    correctChoice: 'b',
    explanation: 'Seul le panneau STOP a cette forme octogonale, pour etre reconnu meme de dos.',
  },
  {
    id: 'signalisation-9',
    theme: 'signalisation',
    text: 'Un panneau carre a fond bleu sert generalement a...',
    choices: [
      { id: 'a', text: 'Interdire' },
      { id: 'b', text: 'Donner une indication (service, direction)' },
      { id: 'c', text: 'Annoncer un danger' },
    ],
    correctChoice: 'b',
    explanation: 'Les panneaux carres bleus sont des panneaux d indication.',
  },
  {
    id: 'signalisation-10',
    theme: 'signalisation',
    text: 'Une fleche de rabattement peinte au sol t invite a...',
    choices: [
      { id: 'a', text: 'Accelerer' },
      { id: 'b', text: 'Changer de file car ta voie va disparaitre' },
      { id: 'c', text: 'T arreter' },
    ],
    correctChoice: 'b',
    explanation: 'La fleche de rabattement annonce la fin de la voie : il faut se rabattre a temps.',
  },

  // --- Vitesse ---
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
    id: 'vitesse-2',
    theme: 'vitesse',
    text: 'Sur autoroute par temps sec, la vitesse maximale pour un vehicule leger est de...',
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
    text: 'Sur autoroute sous la pluie, la vitesse maximale passe a...',
    choices: [
      { id: 'a', text: '130 km/h' },
      { id: 'b', text: '110 km/h' },
      { id: 'c', text: '90 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'Par temps de pluie, la vitesse sur autoroute est abaissee a 110 km/h.',
  },
  {
    id: 'vitesse-4',
    theme: 'vitesse',
    text: 'Sur une route a double sens sans separateur central, la vitesse generale hors agglomeration est de...',
    choices: [
      { id: 'a', text: '80 km/h' },
      { id: 'b', text: '90 km/h' },
      { id: 'c', text: '110 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'Depuis 2018, ces routes sont generalement limitees a 80 km/h (parfois 90 selon le departement).',
  },
  {
    id: 'vitesse-5',
    theme: 'vitesse',
    text: 'En permis probatoire (jeune conducteur) sur autoroute, tu es limite a...',
    choices: [
      { id: 'a', text: '130 km/h' },
      { id: 'b', text: '110 km/h' },
      { id: 'c', text: '100 km/h' },
    ],
    correctChoice: 'b',
    explanation: 'En periode probatoire, la vitesse sur autoroute est limitee a 110 km/h.',
  },
  {
    id: 'vitesse-6',
    theme: 'vitesse',
    text: 'Dans une "zone 30", la vitesse est limitee a...',
    choices: [
      { id: 'a', text: '30 km/h' },
      { id: 'b', text: '50 km/h' },
      { id: 'c', text: '20 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'La zone 30 limite la vitesse a 30 km/h pour proteger les usagers vulnerables.',
  },
  {
    id: 'vitesse-7',
    theme: 'vitesse',
    text: 'Dans une "zone de rencontre", la vitesse est limitee a...',
    choices: [
      { id: 'a', text: '20 km/h' },
      { id: 'b', text: '30 km/h' },
      { id: 'c', text: '50 km/h' },
    ],
    correctChoice: 'a',
    explanation: 'En zone de rencontre, les pietons sont prioritaires et la vitesse est limitee a 20 km/h.',
  },
  {
    id: 'vitesse-8',
    theme: 'vitesse',
    text: 'Rouler nettement en dessous de la vitesse autorisee sans raison...',
    choices: [
      { id: 'a', text: 'Est toujours plus sur' },
      { id: 'b', text: 'Peut etre dangereux et constituer une gene a la circulation' },
      { id: 'c', text: 'Est obligatoire pour un jeune conducteur' },
    ],
    correctChoice: 'b',
    explanation: 'Une vitesse trop basse injustifiee gene la circulation et peut etre sanctionnee.',
  },
  {
    id: 'vitesse-9',
    theme: 'vitesse',
    text: 'La vitesse maximale est-elle modifiee par la presence de brouillard reduisant la visibilite a moins de 50 m ?',
    choices: [
      { id: 'a', text: 'Non, la limite reste la meme' },
      { id: 'b', text: 'Oui, elle est ramenee a 50 km/h sur toutes les routes' },
      { id: 'c', text: 'Oui, mais seulement sur autoroute' },
    ],
    correctChoice: 'b',
    explanation: 'Visibilite inferieure a 50 m : la vitesse est limitee a 50 km/h sur l ensemble du reseau.',
  },
  {
    id: 'vitesse-10',
    theme: 'vitesse',
    text: 'A l approche d une ecole avec des enfants, tu dois...',
    choices: [
      { id: 'a', text: 'Maintenir ta vitesse' },
      { id: 'b', text: 'Reduire ta vitesse et redoubler de vigilance' },
      { id: 'c', text: 'Klaxonner pour prevenir' },
    ],
    correctChoice: 'b',
    explanation: 'Pres des ecoles, on adapte sa vitesse a la presence d enfants, usagers imprevisibles.',
  },

  // --- Stationnement ---
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
    id: 'stationnement-2',
    theme: 'stationnement',
    text: 'Une ligne jaune discontinue le long du trottoir indique...',
    choices: [
      { id: 'a', text: 'Stationnement interdit (mais arret autorise)' },
      { id: 'b', text: 'Arret et stationnement interdits' },
      { id: 'c', text: 'Stationnement payant' },
    ],
    correctChoice: 'a',
    explanation: 'La ligne jaune discontinue interdit le stationnement mais autorise l arret.',
  },
  {
    id: 'stationnement-3',
    theme: 'stationnement',
    text: 'Quelle est la difference entre arret et stationnement ?',
    choices: [
      { id: 'a', text: 'Aucune, ce sont des synonymes' },
      { id: 'b', text: "L arret est bref, conducteur present ; le stationnement immobilise le vehicule plus longtemps" },
      { id: 'c', text: 'Le stationnement est toujours plus court' },
    ],
    correctChoice: 'b',
    explanation: 'L arret est momentane avec conducteur a proximite ; le stationnement immobilise le vehicule.',
  },
  {
    id: 'stationnement-4',
    theme: 'stationnement',
    text: 'Stationner sur un passage pour pietons est...',
    choices: [
      { id: 'a', text: 'Autorise quelques minutes' },
      { id: 'b', text: 'Tres dangereux et interdit (stationnement tres genant)' },
      { id: 'c', text: 'Autorise la nuit' },
    ],
    correctChoice: 'b',
    explanation: 'Stationner sur un passage pieton est un stationnement tres genant, lourdement sanctionne.',
  },
  {
    id: 'stationnement-5',
    theme: 'stationnement',
    text: 'En agglomeration, sur une route a double sens, le stationnement se fait...',
    choices: [
      { id: 'a', text: 'Toujours a gauche' },
      { id: 'b', text: 'Du cote droit de la chaussee' },
      { id: 'c', text: 'N importe ou' },
    ],
    correctChoice: 'b',
    explanation: 'Sur chaussee a double sens, on stationne a droite dans le sens de la marche.',
  },
  {
    id: 'stationnement-6',
    theme: 'stationnement',
    text: 'Un emplacement marque d un fauteuil roulant est reserve...',
    choices: [
      { id: 'a', text: 'A tout le monde si c est court' },
      { id: 'b', text: 'Aux titulaires d une carte mobilite inclusion stationnement' },
      { id: 'c', text: 'Aux livraisons' },
    ],
    correctChoice: 'b',
    explanation: 'Ces places sont reservees aux personnes munies de la carte mobilite inclusion (stationnement).',
  },
  {
    id: 'stationnement-7',
    theme: 'stationnement',
    text: 'Le stationnement est-il autorise devant une bouche d incendie ?',
    choices: [
      { id: 'a', text: 'Oui' },
      { id: 'b', text: 'Non, c est interdit (genant)' },
      { id: 'c', text: 'Oui, mais moins de 5 minutes' },
    ],
    correctChoice: 'b',
    explanation: 'Le stationnement devant une bouche ou poteau d incendie est interdit et genant.',
  },
  {
    id: 'stationnement-8',
    theme: 'stationnement',
    text: 'En quittant ta place de stationnement, tu dois...',
    choices: [
      { id: 'a', text: 'Demarrer sans regarder, tu es prioritaire' },
      { id: 'b', text: 'Ceder le passage et controler tes angles morts avant de t inserer' },
      { id: 'c', text: 'Klaxonner et avancer' },
    ],
    correctChoice: 'b',
    explanation: 'En quittant un stationnement, on cede le passage a la circulation et on verifie les angles morts.',
  },
  {
    id: 'stationnement-9',
    theme: 'stationnement',
    text: 'Stationner a moins de 5 metres avant un passage pieton (cote circulation) est...',
    choices: [
      { id: 'a', text: 'Autorise' },
      { id: 'b', text: 'Interdit car cela masque la visibilite des pietons' },
      { id: 'c', text: 'Autorise seulement de jour' },
    ],
    correctChoice: 'b',
    explanation: 'Stationner juste avant un passage pieton masque les pietons : c est interdit.',
  },
  {
    id: 'stationnement-10',
    theme: 'stationnement',
    text: 'Sur une place de stationnement en epi, tu dois...',
    choices: [
      { id: 'a', text: 'Te garer en biais selon le marquage' },
      { id: 'b', text: 'Te garer perpendiculairement quoi qu il arrive' },
      { id: 'c', text: 'Te garer le long du trottoir' },
    ],
    correctChoice: 'a',
    explanation: 'Le stationnement en epi se fait en biais, en suivant le marquage au sol.',
  },

  // --- Securite ---
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
  {
    id: 'securite-2',
    theme: 'securite',
    text: 'Le port de la ceinture de securite est...',
    choices: [
      { id: 'a', text: 'Obligatoire pour tous les occupants, avant comme arriere' },
      { id: 'b', text: 'Obligatoire seulement a l avant' },
      { id: 'c', text: 'Facultatif en ville' },
    ],
    correctChoice: 'a',
    explanation: 'La ceinture est obligatoire pour tous les occupants, a l avant comme a l arriere.',
  },
  {
    id: 'securite-3',
    theme: 'securite',
    text: 'Le taux d alcool maximal autorise pour un conducteur en permis probatoire est de...',
    choices: [
      { id: 'a', text: '0,5 g/L de sang' },
      { id: 'b', text: '0,2 g/L de sang' },
      { id: 'c', text: '0,8 g/L de sang' },
    ],
    correctChoice: 'b',
    explanation: 'En permis probatoire, la limite est de 0,2 g/L (quasi zero alcool).',
  },
  {
    id: 'securite-4',
    theme: 'securite',
    text: 'Tenir son telephone en main au volant est...',
    choices: [
      { id: 'a', text: 'Autorise a l arret a un feu' },
      { id: 'b', text: 'Interdit et sanctionne' },
      { id: 'c', text: 'Autorise pour le GPS' },
    ],
    correctChoice: 'b',
    explanation: 'Tenir un telephone en main en conduisant est interdit et verbalise.',
  },
  {
    id: 'securite-5',
    theme: 'securite',
    text: 'Avant de changer de direction, l angle mort se controle...',
    choices: [
      { id: 'a', text: 'Uniquement dans le retroviseur interieur' },
      { id: 'b', text: 'Par un coup d oeil par-dessus l epaule' },
      { id: 'c', text: 'Ce n est pas necessaire avec les retroviseurs' },
    ],
    correctChoice: 'b',
    explanation: 'Les retroviseurs ne couvrent pas tout : un regard par-dessus l epaule verifie l angle mort.',
  },
  {
    id: 'securite-6',
    theme: 'securite',
    text: 'La distance de freinage augmente surtout avec...',
    choices: [
      { id: 'a', text: 'La couleur du vehicule' },
      { id: 'b', text: 'La vitesse et l etat de la chaussee' },
      { id: 'c', text: 'Le nombre de passagers uniquement' },
    ],
    correctChoice: 'b',
    explanation: 'La distance de freinage croit avec la vitesse (au carre) et une chaussee glissante.',
  },
  {
    id: 'securite-7',
    theme: 'securite',
    text: 'Hors agglomeration, sur le siege passager, un enfant de moins de 10 ans...',
    choices: [
      { id: 'a', text: 'Doit etre attache dans un dispositif adapte a sa taille' },
      { id: 'b', text: 'Peut voyager sans rehausseur' },
      { id: 'c', text: 'Doit toujours etre sur les genoux d un adulte' },
    ],
    correctChoice: 'a',
    explanation: 'Les enfants doivent utiliser un dispositif de retenue homologue adapte a leur morphologie.',
  },
  {
    id: 'securite-8',
    theme: 'securite',
    text: 'En cas de fatigue sur un long trajet, la bonne reaction est...',
    choices: [
      { id: 'a', text: 'Boire un cafe et continuer plusieurs heures' },
      { id: 'b', text: 'S arreter regulierement (toutes les 2 h) pour se reposer' },
      { id: 'c', text: 'Ouvrir la fenetre et accelerer' },
    ],
    correctChoice: 'b',
    explanation: 'La pause toutes les deux heures est la seule reponse efficace a la fatigue.',
  },
  {
    id: 'securite-9',
    theme: 'securite',
    text: 'L usage des feux de detresse (warning) sert principalement a...',
    choices: [
      { id: 'a', text: 'Signaler un danger ou un arret imprevu' },
      { id: 'b', text: 'Stationner en double file tranquillement' },
      { id: 'c', text: 'Rouler plus vite' },
    ],
    correctChoice: 'a',
    explanation: 'Les feux de detresse previennent les autres usagers d un danger ou d un ralentissement soudain.',
  },
  {
    id: 'securite-10',
    theme: 'securite',
    text: 'En cas d arret d urgence sur autoroute, apres s etre arrete sur la bande d arret d urgence, on doit...',
    choices: [
      { id: 'a', text: 'Rester dans le vehicule au volant' },
      { id: 'b', text: 'Mettre le gilet, sortir cote securite et se mettre derriere la glissiere' },
      { id: 'c', text: 'Traverser pour observer la circulation' },
    ],
    correctChoice: 'b',
    explanation: 'On enfile le gilet, on evacue cote oppose au trafic et on se protege derriere la glissiere.',
  },
];

function findTheme(themeId) {
  return themes.find((theme) => theme.id === themeId) || themes[0];
}

function questionsForTheme(themeId) {
  return questions.filter((question) => question.theme === themeId);
}

module.exports = { themes, questions, findTheme, questionsForTheme };
