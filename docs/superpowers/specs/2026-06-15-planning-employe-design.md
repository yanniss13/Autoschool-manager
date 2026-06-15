# Design - Planning employe et espace employe

## Objectif

Ajouter une premiere V2 simple autour du planning :
- le gerant saisit des creneaux pour ses employes ;
- un employe se connecte avec son email et son mot de passe ;
- l'employe consulte ses creneaux et son vehicule affecte.

Le perimetre reste volontairement limite a des creneaux simples. L'application ne devient pas encore un logiciel complet de gestion de lecons, d'eleves ou d'examens.

## Choix valides

- Connexion employe par email + mot de passe uniquement.
- L'email employe devient unique globalement pour permettre cette connexion sans SIRET.
- Le planning est saisi par le gerant.
- Un creneau est lie a un employe, pas directement a un vehicule.
- Le vehicule affiche cote employe est le vehicule actuellement affecte a cet employe.

## Modele de donnees

Ajouter un modele `ScheduleSlot` :
- `id`
- `title`
- `startsAt`
- `endsAt`
- `note`
- `companyId`
- `employeeId`
- `createdAt`
- `updatedAt`

Relations :
- `Company` possede plusieurs `ScheduleSlot`.
- `Employee` possede plusieurs `ScheduleSlot`.
- chaque creneau est scope par `companyId` pour conserver le cloisonnement multi-entreprises.

Adapter `Employee.email` pour etre unique globalement. Les validations de creation et modification d'employe devront refuser un email deja utilise dans n'importe quelle entreprise.

## Parcours gerant

Ajouter un menu `Planning` dans l'espace gerant.

Pages prevues :
- liste des creneaux de l'entreprise, tries par date de debut ;
- creation d'un creneau ;
- modification d'un creneau ;
- suppression d'un creneau.

Champs de formulaire :
- employe ;
- titre ;
- date et heure de debut ;
- date et heure de fin ;
- note optionnelle.

Le gerant ne choisit pas de vehicule dans le formulaire. Si besoin, la liste peut afficher le vehicule actuellement affecte a l'employe pour donner du contexte.

## Parcours employe

Ajouter une connexion employe separee de la connexion gerant :
- `GET /employee-login`
- `POST /employee-login`
- `POST /employee-logout`

Apres connexion, l'employe arrive sur `GET /employee-space`.

La page employe affiche :
- son identite ;
- son vehicule affecte s'il existe ;
- tous ses creneaux, tries par date de debut.

L'espace employe est en lecture seule pour cette premiere version.

## Architecture

Respecter l'architecture existante :
- routes dediees ;
- controllers dedies ;
- services pour les acces Prisma ;
- validators pour les formulaires ;
- middlewares d'authentification separes pour gerant et employe.

La session stocke un role explicite :
- `authRole = "company"` avec `companyId` pour le gerant ;
- `authRole = "employee"` avec `employeeId` pour l'employe.

Les middlewares refusent les croisements : un employe ne peut pas acceder aux routes gerant, et un gerant ne peut pas acceder a l'espace employe sans connexion employe dediee.

## Securite et validation

Maintenir les protections existantes :
- CSRF sur les formulaires ;
- rate-limiting sur la connexion employe ;
- regeneration de session a la connexion ;
- validation serveur systematique ;
- requetes Prisma scopees par `companyId` pour les routes gerant ;
- acces employe limite a son propre profil et ses propres creneaux.

Validations principales :
- titre obligatoire ;
- employe obligatoire et appartenant a l'entreprise connectee ;
- date de debut valide ;
- date de fin valide ;
- date de fin strictement apres date de debut ;
- note optionnelle bornee en longueur.

## Tests

Etendre le smoke test pour couvrir :
- creation d'un employe avec email globalement unique ;
- refus d'un email employe deja utilise dans une autre entreprise ;
- connexion employe par email + mot de passe ;
- creation d'un creneau par le gerant ;
- affichage du creneau dans l'espace employe ;
- affichage automatique du vehicule affecte ;
- refus d'acces d'un employe aux routes gerant ;
- cloisonnement des creneaux entre entreprises.

## Hors perimetre

Cette version n'inclut pas :
- gestion des eleves ;
- lieux de depart ou d'arrivee ;
- planning par vehicule ;
- detection de chevauchement entre creneaux ;
- annulation ou validation par l'employe ;
- notifications ;
- synchronisation calendrier externe.
