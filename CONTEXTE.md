# ProjetRH — AutoSchool Manager · Contexte de reprise

> Document de passation pour reprendre le projet dans une **nouvelle conversation**.
> À lire en premier. Dernière mise à jour : 2026-06-15.

## 1. Le projet en bref

Application web **interne** de gestion d'une **auto-école**. Le **gérant** crée un compte
(entreprise), se connecte avec son **SIRET + mot de passe**, puis administre depuis un tableau
de bord protégé :

- ses **employés** (moniteurs) — avec connexion employé dédiée et espace en lecture seule ;
- ses **véhicules** — affectables à un employé référent (relation 1-1) ;
- ses **élèves** (fiches : prénom, nom, email/téléphone) ;
- un **planning** hebdomadaire (agenda FullCalendar) où chaque créneau lie un **employé** et
  un **élève**.

**Cloisonnement multi-entreprises strict** : chaque auto-école ne voit que ses propres données
(filtrage par `companyId` issu de la session ; tout accès cross-tenant → **404**).

Détails fonctionnels et techniques complets : **`README.md`**.

## 2. État actuel du dépôt

- Branche **`main`** ; working tree propre (hors `.vscode/`).
- **`main` est local en avance sur `origin/main` (commits NON poussés).**
- ⚠️ **Règle absolue : aucun `push`, aucun changement de remote sans accord explicite.**
  Les commits **locaux** sont OK quand demandés.
- **Smoke test : 79/79 ✅** (`npm test`).
- Point de retour planning « agenda maison » : tag **`agenda-maison-v1`** (voir §4).

## 3. Fonctionnalités en place

**Auth & session**
- Inscription/connexion gérant (SIRET + mot de passe) ; connexion employé (email + mot de
  passe, email unique globalement) ; espace employé en lecture seule (`/employee-space`).

**CRUD (scopés `companyId`)**
- **Employés** (`/employees`), **Véhicules** (`/vehicles`), **Élèves** (`/students`).
- Affectation véhicule ↔ employé référent (1-1).

**Planning (`/planning`) — agenda FullCalendar**
- Vue semaine `timeGridWeek`, **07h–20h**, lundi, locale fr. FullCalendar **auto-hébergé**
  (`public/vendor/fullcalendar/`, offline). Script d'init partagé `public/js/planning-calendar.js`
  (lit les `data-*` de `#calendar`). `base.twig` expose un `{% block scripts %}`.
- **Gérant** : sélecteur d'employé (recharge la page) ; créneaux chargés via
  **`GET /planning/events?employeeId=&start=&end=`** (JSON, scopé entreprise, employé vérifié).
  Clic créneau → `/planning/:id/edit` ; sélection plage vide → `/planning/new?...&hour=` ;
  **glisser-déposer / redimensionnement** → **`POST /planning/:id/move`** (urlencodé `_csrf` +
  `start`/`end`, valide `start < end`, scopé entreprise).
- **Employé** : même calendrier **lecture seule** via **`GET /employee-space/events`**.
- Chaque créneau (`ScheduleSlot`) lie **un employé** (requis) et **un élève** (requis par le
  validateur ; colonne `studentId` nullable en base pour compat. mais jamais vide via l'UI).
  Le titre d'événement affiche l'élève : `Cours de conduite — Dupont Marie`.
  Supprimer un élève **supprime ses créneaux** (`onDelete: Cascade`).

**Sécurité en place** (durci, à préserver)
- **CSRF** par jeton de session (champ `_csrf` + meta + en-tête `X-CSRF-Token` pour l'AJAX) —
  `src/middlewares/csrf.js`. **Helmet** (CSP désactivée volontairement, cf. §5/§10).
  **Auto-échappement Twig**. Cookie session `httpOnly`+`sameSite=lax`+`secure` en prod ;
  **régénération de session à la connexion**. **Rate-limiting** sur `/login` et `/register`.
  **Fail-fast** si `SESSION_SECRET` absent.
- Validation : mot de passe borné à **72 octets** (bcrypt) ; **âge 14–120** ;
  **année véhicule 1900..année+1**.

## 4. Historique du planning (3 versions successives)

Le planning a évolué en 3 temps ; **la version actuelle est FullCalendar**. Les versions
précédentes restent accessibles par branche/tag comme point de retour :

1. **Grille « Skello »** (employés × jours) — branche `feature/planning-grille-hebdo`.
2. **Agenda maison** (axe horaire, CSS/Twig, server-rendered) — tag **`agenda-maison-v1`** +
   branche `feature/planning-agenda-horaire`. *(retour facile si FullCalendar pose problème)*
3. **FullCalendar** (retenu, sur `main`). A retiré les fichiers de l'agenda maison
   (`src/utils/planningGrid.js`, `views/partials/planning-agenda.twig`, CSS `.agenda-*`).

Sur la question « pourquoi pas Google Calendar » : écarté (perte de l'isolation `companyId` et
de l'intégration employé/véhicule/élève). FullCalendar = le vrai raccourci UI tout en gardant
les données en local.

## 5. Revue de code — points OUVERTS (par priorité)

Aucun bug bloquant connu. Trouvailles encore valables :

1. **CSRF échec → rend `errors/csrf` avec statut 403** : OK pour l'UX (message « session
   expirée »), mais vérifier que tous les cas tombent bien sur cette page et pas sur 500.
2. ✅ **Réglé** : `parseId` durci (`/^\d+$/`, rejette `1e3`/`0x10`/espaces) et endpoints
   `events` validés via `parseDateRange` (400 sur dates invalides) — `src/utils/http.js`.
3. **`YEAR_MAX` figé au chargement du module** — `src/validators/vehicleValidator.js`
   (borne périmée si le process tourne après le 1ᵉʳ janvier).
4. **JS inline** : `onchange="this.form.submit()"` (sélecteur d'employé du planning) et
   `onsubmit="confirm(...)"` (suppressions) — bloqueront une **CSP stricte** (cf. §10).
5. **Rate-limit par IP** — derrière un NAT partagé, quota mutualisé (compromis MVP assumé).

## 6. Stack & structure

Node.js · **Express 5** · **Twig** (rendu serveur, autoescape ON) · **Prisma 6** · **SQLite** ·
**bcrypt** · express-session · helmet · express-rate-limit · **FullCalendar** (vendored).

Architecture en couches : `routes → controllers → services`, avec `validators` et
`middlewares` isolés. Toutes les requêtes Prisma sont **scopées par `companyId` de session**.

Repères :
- `prisma/schema.prisma` : **Company / Employee / Vehicle / Student / ScheduleSlot**.
- `src/app.js` (câblage), `src/routes/index.js` (montage des routeurs).
- `public/vendor/fullcalendar/` (lib), `public/js/planning-calendar.js` (init agenda).
- `test/smoke.cjs` (parcours complet de bout en bout, 79/79).

## 7. Conventions du projet

- **Commentaires en français** ; **messages de commit en anglais** (impératif) terminés par
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- `.vscode/` **non commité** (présent en working tree, jamais stagé).
- **Pas de push / remote sans accord explicite.** Commits **locaux** OK quand demandés.
- Ce dépôt = **ProjetRH uniquement**. `MonoblocLivre` et le projet auto-école (job board) sont
  des projets **séparés** — ne pas les modifier depuis ici.
- Sous Windows : `npm run dev` (`node --watch`) **verrouille la DLL Prisma** ; il faut l'arrêter
  avant `prisma migrate`/`generate` (sinon EPERM), puis le relancer.

## 8. Démarrer & vérifier

```bash
npm install
# .env déjà présent (SESSION_SECRET requis) ; sinon : copier .env.example en .env
npm run prisma:migrate   # base SQLite + client Prisma
npm run dev              # ou npm start
npm test                 # smoke test (doit afficher 79/79)
```

Pas de compte de démo pré-créé : créer une auto-école via **`/register`**, puis se connecter
sur **`/login`** (SIRET + mot de passe).

## 9. État git

- `main` = **FullCalendar + module élève**, `npm test` → **79/79** ✅, propre (hors `.vscode/`).
- Branches conservées comme historique / points de retour : `feature/planning-grille-hebdo`,
  `feature/planning-agenda-horaire` (+ tag `agenda-maison-v1`), `feature/planning-fullcalendar`,
  `feature/eleves` (toutes fusionnées dans `main`, supprimables sauf besoin de retour).
- **Aucun push** effectué (origin intact).

## 10. Pistes pour la suite

- **CSP stricte** : retirer les `onchange`/`onsubmit` inline (planning + suppressions),
  autoriser `public/vendor` et `public/js`, réactiver Helmet `contentSecurityPolicy`.
- Durcissements mineurs : points #2 / #3 de la revue.
- Confort : pagination/recherche/tri sur les listes, tests unitaires des validators,
  affichage du téléphone élève au survol d'un créneau, statut véhicule « en maintenance ».
