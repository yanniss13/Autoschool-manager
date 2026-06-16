# Guide du code — AutoSchool Manager (de A à Z)

> Ce document explique **tout le code du projet**, en partant du principe que tu ne connais
> rien au développement web. On va du concept général jusqu'au détail de chaque fichier.
> Prends ton temps, lis dans l'ordre : chaque section s'appuie sur la précédente.

---

## Table des matières

1. [Qu'est-ce que cette application ?](#1-quest-ce-que-cette-application-)
2. [Comment marche une appli web (les bases)](#2-comment-marche-une-appli-web-les-bases)
3. [Les technologies utilisées (et pourquoi)](#3-les-technologies-utilisées-et-pourquoi)
4. [L'architecture en couches](#4-larchitecture-en-couches)
5. [L'arborescence des fichiers](#5-larborescence-des-fichiers)
6. [Le modèle de données (la base)](#6-le-modèle-de-données-la-base)
7. [Le démarrage de l'application](#7-le-démarrage-de-lapplication)
8. [Le cycle de vie d'une requête (exemple concret)](#8-le-cycle-de-vie-dune-requête-exemple-concret)
9. [L'authentification et les sessions](#9-lauthentification-et-les-sessions)
10. [Le cloisonnement multi-entreprises](#10-le-cloisonnement-multi-entreprises)
11. [Les modules, un par un](#11-les-modules-un-par-un)
12. [Le planning (FullCalendar)](#12-le-planning-fullcalendar)
13. [La sécurité](#13-la-sécurité)
14. [Les vues (Twig)](#14-les-vues-twig)
15. [Le test automatique](#15-le-test-automatique)
16. [Recette : ajouter une nouvelle fonctionnalité](#16-recette-ajouter-une-nouvelle-fonctionnalité)
17. [Glossaire](#17-glossaire)

---

## 1. Qu'est-ce que cette application ?

**AutoSchool Manager** est une application web **interne** pour gérer une **auto-école**.

Trois types de personnes/objets :
- Le **gérant** de l'auto-école : il crée un compte (= une « entreprise »), se connecte, et gère tout.
- Les **employés** (moniteurs) : créés par le gérant ; ils peuvent se connecter à un espace en **lecture seule** pour voir leur planning.
- Les **élèves** et **véhicules** : des fiches que le gérant gère ; un **créneau de planning** relie un employé, un élève et un horaire.

Règle d'or : **chaque auto-école ne voit QUE ses propres données.** C'est le « cloisonnement multi-entreprises » (section 10).

---

## 2. Comment marche une appli web (les bases)

Avant le code, le vocabulaire de base.

- **Client / navigateur** : Chrome, Firefox… Le programme qui affiche les pages côté utilisateur.
- **Serveur** : un programme qui tourne en permanence, **attend des demandes** et **renvoie des réponses**. Ici, c'est notre code Node.js.
- **Requête HTTP (request)** : ce que le navigateur envoie. Elle a :
  - une **méthode** : `GET` (lire une page), `POST` (envoyer des données, ex. un formulaire) ;
  - une **URL / chemin** : `/login`, `/students/5/edit`… ;
  - éventuellement un **corps (body)** : les champs d'un formulaire.
- **Réponse HTTP (response)** : ce que le serveur renvoie. Elle a :
  - un **code de statut** : `200` (OK), `302` (redirection), `400` (données invalides), `401` (non authentifié), `403` (interdit), `404` (introuvable), `500` (erreur serveur) ;
  - un **corps** : en général une page **HTML**.
- **Rendu côté serveur (server-side rendering)** : ici, le serveur **fabrique le HTML** puis l'envoie tout prêt au navigateur. (Par opposition aux apps « React » où le navigateur fabrique le HTML lui-même.) C'est important : presque tout se passe côté serveur dans ce projet.

Le schéma mental, pour chaque page :

```
Navigateur  --- requête GET /students --->  Serveur (notre code)
                                              ↳ cherche les élèves en base
                                              ↳ fabrique le HTML de la liste
Navigateur  <--- réponse 200 + HTML --------  Serveur
```

---

## 3. Les technologies utilisées (et pourquoi)

Liste dans [package.json](package.json). Chacune en une phrase « pour les nuls » :

| Techno | C'est quoi | Pourquoi ici |
|--------|-----------|--------------|
| **Node.js** | Permet d'exécuter du JavaScript **en dehors du navigateur** (côté serveur). | C'est le moteur qui fait tourner tout le code serveur. |
| **Express** (v5) | Une **bibliothèque** qui simplifie l'écriture d'un serveur web (router les URLs, lire les requêtes…). | Le squelette de l'application. |
| **Twig** | Un **moteur de templates** : des fichiers HTML avec des trous (`{{ variable }}`) que le serveur remplit. | Pour fabriquer les pages HTML. |
| **Prisma** (v6) | Un **ORM** : on parle à la base de données en JavaScript (`prisma.student.findMany()`) au lieu d'écrire du SQL à la main. | Toute la lecture/écriture en base. |
| **SQLite** | Une base de données **dans un simple fichier** (`prisma/dev.db`), sans serveur séparé. | Base simple, parfaite pour un projet/MVP. |
| **bcrypt** | Une fonction qui **hache** les mots de passe (les transforme en empreinte illisible). | On ne stocke JAMAIS un mot de passe en clair. |
| **express-session** | Gère les **sessions** : se souvenir qu'un utilisateur est connecté entre deux requêtes. | Connexion gérant/employé. |
| **helmet** | Ajoute des **en-têtes HTTP de sécurité** automatiquement. | Durcissement sécurité. |
| **express-rate-limit** | **Limite le nombre de requêtes** par IP (anti brute-force). | Protège `/login` et `/register`. |
| **FullCalendar** | Une **librairie JavaScript** d'agenda (vue semaine, glisser-déposer). Tourne dans le navigateur. | Affiche le planning. C'est la **seule** grosse brique côté navigateur. |

> **À retenir :** tout est en JavaScript (serveur ET le peu de code navigateur), avec Node comme moteur. Le seul morceau qui s'exécute dans le navigateur est FullCalendar + son script d'init.

---

## 4. L'architecture en couches

Le projet suit un découpage **en couches**. Chaque couche a **une seule responsabilité** et ne parle qu'à la couche suivante. C'est la clé pour s'y retrouver.

```
Navigateur
   │  requête (ex: POST /students)
   ▼
[ROUTES]         "Quelle URL appelle quelle fonction ?"          src/routes/
   ▼
[MIDDLEWARES]    contrôles transverses avant le contrôleur       src/middlewares/
   ▼             (es-tu connecté ? jeton CSRF valide ? …)
[CONTROLLERS]    le chef d'orchestre : lit la requête,           src/controllers/
   │             appelle validator + service, choisit la réponse
   ├──► [VALIDATORS]  vérifient/nettoient les données reçues     src/validators/
   ├──► [SERVICES]    parlent à la base de données (Prisma)      src/services/
   │                                                              ▼
   │                                                          [BASE SQLite]
   ▼
[VIEWS]          fabriquent le HTML à renvoyer                    views/
   ▼
Navigateur  ◄── réponse (HTML ou redirection)
```

Couches transverses :
- **utils/** : petites fonctions réutilisables (hacher un mot de passe, formater une date, parser un id…).
- **config/** : configuration partagée (l'unique connexion Prisma).

**Pourquoi ce découpage ?** Pour que chaque fichier reste petit et compréhensible. Si tu veux changer « comment on cherche les élèves en base », tu touches **uniquement** le service. Si tu veux changer « quelle URL », tu touches **uniquement** la route. Rien ne se mélange.

---

## 5. L'arborescence des fichiers

```
ProjetRH/
├── prisma/
│   ├── schema.prisma         ← définition des tables (le modèle de données)
│   ├── migrations/           ← l'historique des changements de structure de la base
│   └── dev.db                ← le fichier SQLite (la base, non versionné)
├── public/                   ← fichiers servis tels quels au navigateur
│   ├── css/style.css         ← les styles
│   ├── js/planning-calendar.js  ← init de FullCalendar (côté navigateur)
│   └── vendor/fullcalendar/  ← la librairie FullCalendar (auto-hébergée)
├── src/
│   ├── server.js             ← POINT D'ENTRÉE : démarre le serveur
│   ├── app.js                ← configure Express (middlewares, vues, routes)
│   ├── config/prisma.js      ← connexion unique à la base
│   ├── routes/               ← URL → fonction
│   ├── controllers/          ← logique de chaque page
│   ├── services/             ← accès base de données
│   ├── validators/           ← validation des données reçues
│   ├── middlewares/          ← contrôles avant les contrôleurs
│   └── utils/                ← petites fonctions outils
├── views/                    ← templates Twig (le HTML)
│   ├── layouts/base.twig     ← le squelette commun de toutes les pages
│   ├── partials/             ← morceaux réutilisés (nav, flash, agenda)
│   ├── auth/ dashboard/ employees/ vehicles/ students/ planning/ employee-space/ errors/
├── test/smoke.cjs            ← test automatique de bout en bout
├── package.json              ← dépendances + commandes (npm test, npm run dev…)
└── .env                      ← secrets/config locale (non versionné)
```

---

## 6. Le modèle de données (la base)

Tout est défini dans [prisma/schema.prisma](prisma/schema.prisma). Une « table » = un type d'objet stocké. On a **5 tables** :

- **Company** (= une auto-école / un compte gérant) : `businessName`, `siret` (unique), `directorName`, `passwordHash`.
- **Employee** (un moniteur) : `firstName`, `lastName`, `email` (unique au niveau global), `passwordHash`, `age`, `gender`.
- **Vehicle** (un véhicule) : `registrationNumber` (immatriculation, unique), `brand`, `model`, `year`, `transmission`.
- **Student** (un élève) : `firstName`, `lastName`, `email`, `phone`.
- **ScheduleSlot** (un créneau de planning) : `title`, `startsAt`, `endsAt`, `note`.

### Les relations (qui est lié à qui)

```
Company (1) ───< (N) Employee        une entreprise a plusieurs employés
Company (1) ───< (N) Vehicle         … plusieurs véhicules
Company (1) ───< (N) Student         … plusieurs élèves
Company (1) ───< (N) ScheduleSlot    … plusieurs créneaux

Employee (1) ──── (0..1) Vehicle     un employé est référent d'AU PLUS un véhicule (relation 1-1)
Employee (1) ───< (N) ScheduleSlot   un employé a plusieurs créneaux
Student  (1) ───< (N) ScheduleSlot   un élève a plusieurs créneaux
```

Notions clés visibles dans le schéma :
- **`companyId`** : presque chaque table porte une colonne `companyId`. C'est **la clé du cloisonnement** (section 10) : toute donnée appartient à une entreprise.
- **`@unique`** : empêche les doublons (un SIRET, un email employé, une immatriculation).
- **`onDelete: Cascade`** : si on supprime le parent, les enfants suivent. Ex. supprimer une entreprise supprime ses employés/véhicules/élèves/créneaux ; supprimer un **élève** supprime ses **créneaux**.
- **`onDelete: SetNull`** : sur `Vehicle.employee`, si l'employé référent disparaît, le véhicule n'est pas supprimé, son `employeeId` repasse simplement à `null`.
- Le lien **créneau → élève** (`studentId`) est **nullable en base** (pour ne pas casser d'anciens créneaux) mais **rendu obligatoire par le validateur** : via l'interface, on ne peut pas créer un créneau sans élève.

### Les migrations

Chaque fois qu'on change `schema.prisma` (ajout d'une table/colonne), on lance `npm run prisma:migrate`. Prisma crée un fichier SQL dans `prisma/migrations/` qui décrit le changement et l'applique à la base. C'est **l'historique versionné** de la structure de la base.

---

## 7. Le démarrage de l'application

Deux fichiers : `server.js` (démarre) et `app.js` (configure).

### [src/server.js](src/server.js) — le point d'entrée
1. Charge les variables du fichier `.env` (avec `dotenv`).
2. **Fail-fast** : si `SESSION_SECRET` est absent, on **arrête tout** avec un message clair, AVANT de charger le reste. Pourquoi ? Sans secret de session fiable, les cookies de connexion seraient falsifiables. Mieux vaut refuser de démarrer que démarrer en mode dangereux.
3. Charge `app.js` et démarre l'écoute sur un port (`3000` par défaut).
4. Gère l'**arrêt propre** (Ctrl+C) : ferme le serveur puis coupe la connexion à la base.

### [src/app.js](src/app.js) — la configuration d'Express
C'est ici qu'on **branche les middlewares dans l'ordre**. **L'ordre compte** : une requête les traverse de haut en bas.

1. `helmet({ contentSecurityPolicy: false })` → en-têtes de sécurité (la CSP est désactivée volontairement pour l'instant, cf. section 13).
2. Moteur de vues = Twig, avec **auto-échappement activé** (anti-XSS, cf. section 13).
3. `express.urlencoded()` → sait **lire les formulaires** envoyés en POST (remplit `req.body`).
4. `express.static('public')` → sert les fichiers de `public/` (CSS, JS, FullCalendar) tels quels.
5. `session(...)` → active les sessions (cookie `httpOnly`, `sameSite=lax`, `secure` en prod).
6. `flash` → messages éphémères (« Élève créé avec succès ») affichés une fois.
7. `csrf` → protection CSRF (génère/vérifie un jeton, cf. section 13).
8. Les **routes** (`app.use(routes)`).
9. Un **404** final (aucune route n'a matché).
10. Un **gestionnaire d'erreurs** (capte les erreurs → page 500).

---

## 8. Le cycle de vie d'une requête (exemple concret)

Suivons **« le gérant crée un élève »** du début à la fin. C'est LE parcours type ; tous les autres y ressemblent.

1. Le gérant est sur `/students/new`, remplit le formulaire, clique « Créer ».
2. Le navigateur envoie **`POST /students`** avec dans le body : `firstName`, `lastName`, `email`, `phone`, `_csrf`.
3. **Middlewares globaux** (app.js) : la session est lue, le **jeton CSRF est vérifié** (sinon `403`).
4. **Routeur** [src/routes/index.js](src/routes/index.js) : `/students` est protégé par `requireAuth` puis `loadCompany`, puis délègue à [src/routes/studentRoutes.js](src/routes/studentRoutes.js).
   - `requireAuth` : « y a-t-il une session gérant ? » sinon → redirection `/login`.
   - `loadCompany` : charge l'entreprise depuis `req.session.companyId` et la pose dans `req.company`.
5. `studentRoutes` voit `POST /` → appelle `studentController.create`.
6. **Contrôleur** [src/controllers/studentController.js](src/controllers/studentController.js), fonction `create` :
   - appelle le **validateur** `validateStudent(req.body)` ;
   - si invalide → re-render le formulaire avec les erreurs et un statut `400` ;
   - si valide → appelle le **service** `studentService.createForCompany(req.company.id, value)`.
7. **Service** [src/services/studentService.js](src/services/studentService.js) : `prisma.student.create({ data: { ...value, companyId } })` → écrit en base, **avec le `companyId` de la session** (jamais celui du formulaire !).
8. Le contrôleur dépose un message flash (« Élève créé avec succès ») et renvoie une **redirection `302` vers `/students`**.
9. Le navigateur suit la redirection → **`GET /students`** → la liste s'affiche avec le nouvel élève.

```
POST /students
  → [csrf] → [requireAuth] → [loadCompany] → studentController.create
       → validateStudent()        (validators)
       → studentService.create()  (services → Prisma → SQLite)
       → flash + redirect 302 /students
GET /students
  → studentController.index → studentService.findAllByCompany → render 'students/index'
```

---

## 9. L'authentification et les sessions

### Le problème
HTTP est « sans mémoire » : chaque requête est isolée. Comment le serveur se souvient-il que tu es connecté ? → avec une **session**.

### Comment ça marche ici
- À la connexion, le serveur range un peu d'info dans `req.session` (côté serveur) et envoie au navigateur un **cookie** contenant un identifiant de session signé.
- À chaque requête suivante, le navigateur renvoie ce cookie → le serveur retrouve la session.
- Le cookie est `httpOnly` (illisible en JS, anti-vol), `sameSite=lax` (anti-CSRF), `secure` en production (HTTPS only).

### Ce qu'on stocke en session
Voir [authController.js](src/controllers/authController.js) :
- `authRole` : `'company'` (gérant) ou `'employee'` (employé).
- `companyId` **ou** `employeeId` selon le rôle.
- `csrfToken` (posé par le middleware csrf), `flash` (messages).

### Deux connexions distinctes
- **Gérant** : `POST /login` avec **SIRET + mot de passe**. Le contrôleur cherche l'entreprise par SIRET, compare le mot de passe avec `bcrypt`, et si OK : **régénère la session** puis stocke `authRole='company'` + `companyId`.
- **Employé** : `POST /employee-login` avec **email + mot de passe**. Pareil mais stocke `authRole='employee'` + `employeeId`.

> **`req.session.regenerate(...)` = anti session-fixation.** On change l'identifiant de session **au moment** de la connexion, pour qu'un identifiant qu'un attaquant aurait posé AVANT ne reste pas valable APRÈS.

### Les 5 middlewares de session ([src/middlewares/](src/middlewares/))
- `requireAuth` : exige une session **gérant**, sinon → `/login`.
- `loadCompany` : charge l'entreprise en base → `req.company`. Si elle n'existe plus, détruit la session.
- `requireEmployeeAuth` : exige une session **employé**, sinon → `/employee-login`.
- `loadEmployee` : charge l'employé (+ son entreprise + son véhicule) → `req.employee`.
- `redirectIfAuth` : empêche un connecté d'aller sur `/login`/`/register` (le renvoie vers son tableau de bord/espace).

### Déconnexion
`POST /logout` (ou `/employee-logout`) → `req.session.destroy()` → redirection vers la page de connexion.

---

## 10. Le cloisonnement multi-entreprises

**Le concept le plus important du projet.** Plusieurs auto-écoles utilisent la même appli, mais aucune ne doit voir les données d'une autre. C'est le **multi-tenant** (« plusieurs locataires »).

**Comment c'est garanti :** toute requête en base passe par un service qui **filtre par `companyId` issu de la session**, jamais d'une valeur fournie par l'utilisateur.

Exemple — modifier un employé (service) :
```js
function updateOwned(companyId, id, data) {
  return prisma.employee.updateMany({ where: { id, companyId }, data });
}
```
Si l'entreprise B tente de modifier l'employé `5` de l'entreprise A, le `where: { id: 5, companyId: B }` ne trouve **rien** → le contrôleur répond **404** (« introuvable »), exactement comme si l'objet n'existait pas. On ne révèle même pas son existence.

On retrouve ce motif partout : `findOwnedById`, `updateOwned`, `deleteOwned`, `findAllByCompany`… **tous scopés `companyId`.** C'est testé dans le smoke test (section 15 : « CLOISONNEMENT MULTI-ENTREPRISES »).

---

## 11. Les modules, un par un

Chaque module = un quadruplet **route → controller → service → vues** (+ validator). Tous protégés par `requireAuth + loadCompany` (sauf l'espace employé).

### Auth ([authController.js](src/controllers/authController.js), [authRoutes.js](src/routes/authRoutes.js))
Inscription (`/register`), connexion gérant (`/login`), connexion employé (`/employee-login`), déconnexions. Les routes POST sont protégées par un **rate-limiter** (max ~20 tentatives échouées par IP / 15 min) pour freiner le brute-force.

### Dashboard ([dashboardController.js](src/controllers/dashboardController.js))
Affiche `/dashboard` avec des **compteurs** : nombre d'employés, de véhicules, de véhicules affectés/disponibles, d'élèves. Il appelle les `countByCompany(...)` des services (en parallèle avec `Promise.all`).

### Employés ([employeeController.js](src/controllers/employeeController.js))
CRUD classique (liste/créer/éditer/supprimer). Particularités :
- L'**email est unique globalement** (car il sert d'identifiant de connexion employé sans SIRET).
- Le mot de passe est **haché avec bcrypt** ; à l'édition, s'il est laissé vide, on ne le change pas.

### Véhicules ([vehicleController.js](src/controllers/vehicleController.js), [vehicleService.js](src/services/vehicleService.js))
CRUD + **affectation à un employé référent** (relation 1-1). Points intéressants :
- L'immatriculation est **normalisée** au format `AB-123-CD` par le validateur (`xx123yy` → rejeté, `ab123cd` → `AB-123-CD`).
- L'affectation `assignEmployee` se fait dans une **transaction** Prisma (`$transaction`) : on vérifie « le véhicule existe et est libre » ET « l'employé existe et n'a pas déjà un véhicule » ET on écrit, le tout de façon **atomique** (tout réussit ou rien). Évite les incohérences si deux actions arrivent en même temps.
- Supprimer un véhicule **libère** automatiquement l'employé (la clé étrangère est portée par `Vehicle`).

### Élèves ([studentController.js](src/controllers/studentController.js), [studentService.js](src/services/studentService.js))
CRUD calqué sur les employés mais **sans mot de passe** (les élèves ne se connectent pas). Email et téléphone sont **optionnels** ; prénom et nom obligatoires. Supprimer un élève supprime ses créneaux (cascade).

### Planning ([scheduleController.js](src/controllers/scheduleController.js))
Le plus riche → section 12.

### Espace employé ([employeeSpaceController.js](src/controllers/employeeSpaceController.js))
En **lecture seule**. L'employé connecté voit son **planning** (même calendrier, non modifiable) + son profil et son véhicule affecté.

---

## 12. Le planning (FullCalendar)

C'est le seul endroit avec du **JavaScript côté navigateur**. Le principe :

1. La page `/planning` ([views/planning/index.twig](views/planning/index.twig)) affiche surtout un conteneur vide :
   ```html
   <div id="calendar" data-events-url="/planning/events?employeeId=5" data-editable="true" ...></div>
   ```
   plus un **menu déroulant** pour choisir quel employé afficher.
2. Le script [public/js/planning-calendar.js](public/js/planning-calendar.js) lit ces attributs `data-*` et démarre **FullCalendar** (vue semaine, 07h–20h, lundi, français).
3. FullCalendar **demande les créneaux en JSON** au serveur : `GET /planning/events?employeeId=…&start=…&end=…`. Le contrôleur (`events`) renvoie un tableau d'événements `{ id, title, start, end }`. Le **titre inclut l'élève** : `"Cours de conduite — Dupont Marie"`.
4. **Interactions** (uniquement côté gérant, car `editable` = true) :
   - **clic sur un créneau** → va vers la page d'édition `/planning/:id/edit` ;
   - **sélection d'une plage vide** → va vers `/planning/new?employeeId=…&date=…&hour=…` (formulaire pré-rempli) ;
   - **glisser-déposer / redimensionner** → envoie `POST /planning/:id/move` en AJAX (en arrière-plan) avec les nouvelles heures + le jeton CSRF. Si le serveur refuse, le créneau **revient à sa place** (`info.revert()`).

Côté **employé**, c'est le même calendrier mais `editable=false` : pas de menu, pas de drag, pas de création. Il lit `GET /employee-space/events`.

Côté serveur, les données passent par :
- `scheduleService.findByEmployeeBetween(employeeId, start, end)` (créneaux d'un employé dans une fenêtre de dates) ;
- `parseDateRange` / `parseId` dans [src/utils/http.js](src/utils/http.js) qui **valident** les paramètres reçus (un `start`/`end` invalide → `400`, un id non décimal → rejeté) ;
- la mise à jour `move` utilise `updateOwned(companyId, id, { startsAt, endsAt })` → toujours **scopé entreprise**.

> **Pourquoi des endpoints JSON ?** Parce que FullCalendar navigue de semaine en semaine **sans recharger la page** : à chaque changement de semaine, il redemande juste les événements de la nouvelle période au serveur.

> **Historique** : avant FullCalendar, le planning avait été fait « à la main » en HTML/CSS (agenda maison). Cette version reste accessible via le tag git `agenda-maison-v1` (voir CONTEXTE.md). FullCalendar a été choisi pour le glisser-déposer.

---

## 13. La sécurité

Le projet est volontairement **durci**. Les mécanismes en place :

- **Hachage des mots de passe (bcrypt)** — [utils/password.js](src/utils/password.js) : on stocke une empreinte, jamais le mot de passe. `compare()` vérifie sans jamais « déchiffrer ».
- **CSRF** (Cross-Site Request Forgery) — [middlewares/csrf.js](src/middlewares/csrf.js) : un **jeton secret** est généré par session et placé dans chaque formulaire (champ caché `_csrf`) + une balise `<meta>`. Toute requête modifiante (POST/PUT/PATCH/DELETE) doit présenter ce jeton (dans le body **ou** l'en-tête `X-CSRF-Token` pour l'AJAX du drag&drop), sinon **403** (page « session expirée »). Ça empêche un autre site de soumettre des actions en ton nom.
- **XSS** (injection de scripts) : Twig est configuré avec **auto-échappement**. Toute `{{ variable }}` est neutralisée (`<script>` devient du texte affiché, pas exécuté).
- **En-têtes HTTP (helmet)** : `X-Content-Type-Options`, `Referrer-Policy`, HSTS, etc. *(La CSP — Content-Security-Policy — est désactivée pour l'instant : elle bloquerait le JS « inline » comme `onchange="this.form.submit()"`. La rendre stricte est une amélioration prévue.)*
- **Sessions durcies** : cookie `httpOnly`+`sameSite`+`secure`, et **régénération à la connexion** (anti session-fixation).
- **Rate-limiting** sur les connexions/inscriptions (anti brute-force).
- **Validation serveur systématique** : on ne fait **jamais** confiance aux données du navigateur. Chaque formulaire passe par un validateur (`src/validators/`) qui nettoie et borne (ex. âge 14–120, année véhicule 1900..an+1, mot de passe ≥ 8 et ≤ 72 octets, email au bon format).
- **Cloisonnement `companyId`** (section 10) : isolation stricte entre entreprises.
- **`parseId` strict** : seuls des identifiants décimaux (`^\d+$`) sont acceptés (refuse `1e3`, `0x10`, espaces).

---

## 14. Les vues (Twig)

Les pages HTML sont dans `views/`. Mécanismes Twig à connaître :

- **Héritage** : [views/layouts/base.twig](views/layouts/base.twig) est le **squelette** (le `<head>`, la barre de nav, le pied de page, le bloc `{% block content %}` et `{% block scripts %}`). Chaque page fait `{% extends 'layouts/base.twig' %}` et ne remplit que `content` (et parfois `scripts`).
- **Partials (morceaux réutilisés)** : `partials/nav.twig` (la barre de navigation, qui change selon qu'on est gérant/employé/visiteur), `partials/flash.twig` (les messages éphémères).
- **`_fields.twig`** : chaque module a un fichier de **champs de formulaire partagés** entre « créer » et « éditer » (ex. `students/_fields.twig`), pour ne pas dupliquer le HTML.
- **Variables fournies par le contrôleur** : `res.render('students/index', { students })` → dans le template, on boucle `{% for s in students %}`.
- **Le jeton CSRF** est disponible partout via `{{ csrfToken }}` (posé par le middleware dans `res.locals`), idem `currentCompany` / `currentEmployee` / `flash`.

---

## 15. Le test automatique

[test/smoke.cjs](test/smoke.cjs), lancé par `npm test`, est un **« smoke test »** : il **rejoue tout le parcours de l'appli** de bout en bout et affiche un ✅/❌ par étape.

Comment il marche :
1. Il démarre un **vrai serveur** sur un port dédié (3100, pour ne pas gêner ton `npm run dev`).
2. Il fait de **vraies requêtes HTTP** (inscription, connexion, créer un employé, un véhicule, un élève, un créneau, déplacer un créneau…), en gérant cookie de session + jeton CSRF comme un navigateur.
3. Il vérifie aussi certaines données **directement en base** via Prisma (ex. « le mot de passe est bien haché », « le créneau est bien supprimé en cascade »).
4. Il **nettoie ses données** à la fin (supprime les entreprises de test → cascade).
5. Il sort avec un code 0 si tout passe, 1 sinon.

Au moment d'écrire ce guide : **79/79 ✅**. C'est le filet de sécurité : si une modification casse quelque chose, `npm test` le révèle.

---

## 16. Recette : ajouter une nouvelle fonctionnalité

Disons que tu veux ajouter une entité « Leçon type » (juste pour l'exemple). La marche à suivre suit toujours les couches :

1. **Base** : ajoute le modèle dans [prisma/schema.prisma](prisma/schema.prisma), avec `companyId` + relation à `Company`. Puis `npm run prisma:migrate --name add_lessons`.
   *(Sous Windows : arrête `npm run dev` avant la migration, sinon erreur de fichier verrouillé.)*
2. **Validator** : `src/validators/lessonValidator.js` — vérifie/nettoie les champs.
3. **Service** : `src/services/lessonService.js` — `findAllByCompany`, `findOwnedById`, `createForCompany`, `updateOwned`, `deleteOwned` (tous **scopés `companyId`**).
4. **Controller** : `src/controllers/lessonController.js` — `index/new/create/edit/update/destroy`, qui appellent validator + service et rendent les vues.
5. **Routes** : `src/routes/lessonRoutes.js`, puis monte-les dans [src/routes/index.js](src/routes/index.js) avec `requireAuth, loadCompany`.
6. **Vues** : `views/lessons/{index,new,edit,_fields}.twig` (copie le module `students` comme modèle).
7. **Nav** : ajoute un lien dans [views/partials/nav.twig](views/partials/nav.twig).
8. **Test** : ajoute une section dans [test/smoke.cjs](test/smoke.cjs) (création, validation, isolation B→A) et lance `npm test`.

En copiant le module **élève** ou **véhicule** comme patron, tu as 90 % du travail.

---

## 17. Glossaire

- **Route** : association « URL + méthode » → une fonction. Ex. `POST /students` → `studentController.create`.
- **Controller (contrôleur)** : la fonction qui traite une requête : lit les données, appelle validator/service, choisit la réponse (page ou redirection).
- **Service** : la couche qui parle à la base de données (via Prisma). Aucune logique HTTP dedans.
- **Validator** : vérifie et nettoie les données reçues avant de les utiliser.
- **Middleware** : une fonction qui s'exécute **avant** le contrôleur et peut laisser passer (`next()`), rediriger ou bloquer. Ex. `requireAuth`, `csrf`.
- **Session** : mémoire côté serveur d'un utilisateur connecté, reliée au navigateur par un cookie.
- **ORM (Prisma)** : outil qui traduit du code JS en requêtes base de données.
- **Migration** : un fichier qui décrit un changement de structure de la base, appliqué et versionné.
- **CRUD** : Create, Read, Update, Delete — les 4 opérations de base sur une entité.
- **Rendu côté serveur** : le serveur fabrique le HTML complet et l'envoie au navigateur.
- **Multi-tenant / cloisonnement** : plusieurs clients (auto-écoles) sur la même appli, chacun isolé via `companyId`.
- **CSRF / XSS** : deux familles d'attaques web (soumission d'action frauduleuse / injection de script), contrées ici (section 13).
- **bcrypt / hachage** : transformation irréversible d'un mot de passe en empreinte, pour ne jamais le stocker en clair.
- **Flash** : message affiché une seule fois après une action (ex. « Élève créé »).
- **Endpoint** : une URL côté serveur qui répond à des requêtes (ici, `/planning/events` renvoie du JSON).

---

> **Pour aller plus loin** : `README.md` (présentation + démarrage) et `CONTEXTE.md` (état d'avancement, historique des décisions, pistes). Pour lancer : `npm install`, `npm run prisma:migrate`, `npm run dev`, et `npm test` pour vérifier que tout fonctionne.
