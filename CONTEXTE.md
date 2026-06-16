# ProjetRH — AutoSchool Manager · Contexte de reprise

> Document de passation pour reprendre le projet dans une **nouvelle conversation**.
> À lire en premier. Dernière mise à jour : 2026-06-16.

## 1. Le projet en bref

Application web **interne** de gestion d'une **auto-école**. Le **gérant** crée un compte
(entreprise), se connecte avec son **SIRET + mot de passe**, puis administre depuis un tableau
de bord protégé :

- ses **employés** (moniteurs) — avec connexion employé dédiée et espace en lecture seule ;
- ses **véhicules** — affectables à un employé référent (relation 1-1) ;
- ses **élèves** (fiches : prénom, nom, email obligatoire, mot de passe, téléphone) ;
- un **planning** hebdomadaire (agenda FullCalendar) où chaque créneau lie un **employé** et
  un **élève**.
- un **espace élève** : planning personnel, entraînement au code de la route et assistant local.

**Cloisonnement multi-entreprises strict** : chaque auto-école ne voit que ses propres données
(filtrage par `companyId` issu de la session ; tout accès cross-tenant → **404**).

Détails fonctionnels et techniques complets : **`README.md`**.

## 2. État actuel du dépôt

- Branche **`main`** ; le decoupage du schema Prisma en fichiers separes, **la refonte CSS
  « SaaS admin » + le theme clair/sombre**, des **durcissements securite** et le **portail
  eleve + code de la route** (cf. §3) sont desormais **commites en local** (hors `.vscode/`
  et `.superpowers/`, non suivis).
- **`main` est local en avance sur `origin/main` (commits NON poussés).**
- ⚠️ **Règle absolue : aucun `push`, aucun changement de remote sans accord explicite.**
  Les commits **locaux** sont OK quand demandés.
- **Smoke test : 85/85 ✅** (`npm test`).
- Point de retour planning « agenda maison » : tag **`agenda-maison-v1`** (voir §4).

## 3. Fonctionnalités en place

**Auth & session**
- Inscription/connexion gérant (SIRET + mot de passe) ; connexion employé (email + mot de
  passe, email unique globalement) ; espace employé en lecture seule (`/employee-space`).
- Connexion élève (email + mot de passe) ; espace élève dédié (`/student-space`).

**CRUD (scopés `companyId`)**
- **Employés** (`/employees`), **Véhicules** (`/vehicles`), **Élèves** (`/students`).
- Les élèves ont maintenant un email obligatoire et un mot de passe haché. À l'édition, le
  mot de passe est optionnel : vide = hash conservé.
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
- **Élève** : calendrier **lecture seule** via **`GET /student-space/events`**, filtré par
  `studentId` de session.
- Chaque créneau (`ScheduleSlot`) lie **un employé** (requis) et **un élève** (requis par le
  validateur ; colonne `studentId` nullable en base pour compat. mais jamais vide via l'UI).
  Le titre d'événement affiche l'élève : `Cours de conduite — Dupont Marie`.
  Supprimer un élève **supprime ses créneaux** (`onDelete: Cascade`).

**Espace élève & code de la route**
- `/student-login` : connexion par email + mot de passe ; session `authRole = 'student'`,
  `studentId`, sans `companyId` gérant.
- `/student-space` : affiche le profil, le planning FullCalendar, les dernières sessions et
  la progression par thème.
- `/student-space/training` : corrige une session d'entraînement locale et persiste un résumé
  (`RoadCodeTrainingSession`) avec `studentId` + `companyId`.
- `/student-space/assistant` : assistant local par mots-clés (priorités, signalisation,
  vitesse, stationnement, sécurité). Pas d'API externe branchée pour l'instant.

**Sécurité en place** (durci, à préserver)
- **CSRF** par jeton de session (champ `_csrf` + meta + en-tête `X-CSRF-Token` pour l'AJAX),
  **comparaison à temps constant** (`crypto.timingSafeEqual`), jeton **non lu en query** ;
  échec → page **`errors/csrf` en 403** — `src/middlewares/csrf.js`. **Helmet** (CSP désactivée
  volontairement, cf. §5/§10). **Auto-échappement Twig**. Cookie session
  `httpOnly`+`sameSite=lax`+`secure` en prod ; **régénération de session à la connexion**.
  **Rate-limiting** : `/login` **20 échecs / 15 min / IP** (`skipSuccessfulRequests` → les
  connexions réussies ne comptent pas), `/register` 20 / h. **Fail-fast** si `SESSION_SECRET`
  absent.
- Validation : mot de passe borné à **72 octets** (bcrypt) ; **âge 14–120** ; **année véhicule
  1900..année+1**, borne haute **recalculée à chaque requête** (`currentYearMax()`).

**UI / Thème (refonte « SaaS admin »)**
- Feuille de style unique `public/css/style.css`, **design tokens en variables CSS** (couleurs,
  rayons, ombres, espacements). Les vues utilisent déjà ses classes (`navbar`, `page-header`,
  `data-table`, `stat-card`, `badge`, `form-card`, `hero`, `summary-card`…).
- **Thème clair/sombre** : attribut `data-theme` sur `<html>`, bouton ☾/☀ dans la navbar
  (`#theme-toggle`), choix mémorisé en `localStorage` (`asm-theme`), suit la préférence système
  au 1ᵉʳ chargement. Un **petit script inline dans `<head>`** (base.twig) pose le thème avant le
  rendu (anti-flash). Le sombre **redéfinit seulement les variables** (`:root[data-theme="dark"]`).
- **Animations d'ouverture** : compteurs du dashboard (count-up) + apparition en cascade des
  cartes/lignes (keyframe `asm-rise`) ; **navbar verre dépoli** (`backdrop-filter`). Tout est
  **neutralisé si `prefers-reduced-motion`**.
- JS client : `public/js/ui.js` (bascule de thème + compteurs), chargé en `defer` dans base.twig
  **hors `{% block scripts %}`** (donc présent sur toutes les pages).

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

1. ✅ **Réglé** : CSRF échec → page **`errors/csrf` en 403** (« session expirée ») au lieu de
   `errors/500` ; comparaison du jeton **en temps constant** ; jeton **non lu en query** —
   `src/middlewares/csrf.js`.
2. ✅ **Réglé** : `parseId` durci (`/^\d+$/`, rejette `1e3`/`0x10`/espaces) et endpoints
   `events` validés via `parseDateRange` (400 sur dates invalides) — `src/utils/http.js`.
3. ✅ **Réglé** : `YEAR_MAX` n'est plus figé au chargement — `currentYearMax()` recalcule à
   chaque appel (exporté et exposé à la vue véhicule via `res.locals` du routeur) —
   `src/validators/vehicleValidator.js`.
4. **JS inline** : `onchange="this.form.submit()"` (planning), `onsubmit="confirm(...)"`
   (suppressions) **et le script anti-flash de thème** dans `<head>` (base.twig) — tous à
   traiter avant une **CSP stricte** (cf. §10).
5. **Rate-limit par IP** — derrière un NAT partagé, quota mutualisé ; **atténué côté login**
   (`skipSuccessfulRequests` : seuls les échecs comptent, 20 / 15 min).

## 6. Stack & structure

Node.js · **Express 5** · **Twig** (rendu serveur, autoescape ON) · **Prisma 6** · **SQLite** ·
**bcrypt** · express-session · helmet · express-rate-limit · **FullCalendar** (vendored).

Architecture en couches : `routes → controllers → services`, avec `validators` et
`middlewares` isolés. Toutes les requêtes Prisma sont **scopées par `companyId` de session**.

Repères :
- `prisma/schema/` : schema Prisma multi-fichiers (`base.prisma` + un fichier par modele :
  **Company / Employee / Vehicle / Student / ScheduleSlot / RoadCodeTrainingSession**). Les
  scripts `prisma:*` pointent explicitement vers ce dossier.
- `prisma.config.ts` charge `.env`, indique a Prisma d'utiliser `prisma/schema/` et garde les
  migrations dans `prisma/migrations`.
- `.env.example` utilise `DATABASE_URL="file:../dev.db"` car le schema est dans
  `prisma/schema/` ; cela pointe vers `prisma/dev.db`.
- `src/app.js` (câblage), `src/routes/index.js` (montage des routeurs).
- `public/vendor/fullcalendar/` (lib), `public/js/planning-calendar.js` (init agenda),
  `public/js/ui.js` (thème clair/sombre + compteurs animés).
- `src/data/roadCodeQuestions.js`, `src/services/roadCodeTrainingService.js` et
  `src/services/roadCodeAssistantService.js` portent la V1 locale du code de la route.
- `public/css/style.css` (design system « SaaS admin » + thème sombre, cf. §3).
- `test/smoke.cjs` (parcours complet de bout en bout, 85/85).

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
npm test                 # smoke test (doit afficher 85/85)
```

Pas de compte de démo pré-créé : créer une auto-école via **`/register`**, puis se connecter
sur **`/login`** (SIRET + mot de passe). Le gérant crée ensuite les employés et les élèves.
Un élève se connecte sur **`/student-login`**.

## 9. État git

- `main` = **FullCalendar + module élève + portail élève/code route + schema Prisma
  multi-fichiers**, `npm test` → **85/85** ✅ après verification, non commite (hors `.vscode/`).
- Branches conservées comme historique / points de retour : `feature/planning-grille-hebdo`,
  `feature/planning-agenda-horaire` (+ tag `agenda-maison-v1`), `feature/planning-fullcalendar`,
  `feature/eleves` (toutes fusionnées dans `main`, supprimables sauf besoin de retour).
- **Aucun push** effectué (origin intact).

## 10. Pistes pour la suite

- **CSP stricte** : retirer les `onchange`/`onsubmit` inline (planning + suppressions) et
  **externaliser le script anti-flash de thème** du `<head>` (ou le couvrir par un nonce),
  autoriser `public/vendor` et `public/js`, réactiver Helmet `contentSecurityPolicy`.
- **Police hors-ligne** : `style.css` charge *Public Sans* via `@import` Google Fonts (repli
  `system-ui` si pas de réseau) — l'auto-héberger dans `public/fonts/` pour un offline complet
  comme FullCalendar.
- Confort : pagination/recherche/tri sur les listes, tests unitaires des validators,
  affichage du téléphone élève au survol d'un créneau, statut véhicule « en maintenance ».
