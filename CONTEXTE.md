# ProjetRH — AutoSchool Manager · Contexte de reprise

> Document de passation pour reprendre le projet dans une **nouvelle conversation**.
> À lire en premier. Dernière mise à jour : 2026-06-15.

## 1. Le projet en bref

Application web **interne** de gestion du personnel et des véhicules d'une **auto-école**.
Le **gérant** d'une auto-école crée un compte (entreprise), se connecte avec son **SIRET +
mot de passe**, puis administre **ses employés** et **ses véhicules** depuis un tableau de
bord protégé. Il peut **affecter un véhicule à un employé référent** (relation 1-1 : un
employé n'est référent que d'un seul véhicule). **Cloisonnement multi-entreprises strict** :
chaque auto-école ne voit que ses propres données (filtrage par `companyId` issu de la
session ; tout accès cross-tenant → **404**).

Détails fonctionnels et techniques complets : **`README.md`**.

## 2. État actuel du dépôt

- Branche **`main`**, working tree **modifié** (V2 planning/espace employé en cours de
  finalisation, plus changements préexistants non commités).
- **2 commits locaux EN AVANCE sur `origin/main`, NON poussés** :
  - `b6b921b` — Improve robustness, validation, accessibility and docs
  - `fa89080` — Harden security: CSRF, security headers, rate limiting, session hardening
- ⚠️ **Règle absolue : aucun `push`, aucun changement de remote sans accord explicite.**
  Les commits locaux sont OK quand demandés.
- **Smoke test : 52/52 ✅** (`npm test`).

## 3. Ce qui a été fait récemment (ces 2 commits)

**Sécurité (Tier 1)**
- **CSRF** par jeton de session (synchronizer token) — `src/middlewares/csrf.js`, champ
  `_csrf` dans tous les formulaires + balise meta.
- **Helmet** (en-têtes HTTP), **auto-échappement Twig** (anti-XSS).
- Cookie session `httpOnly` + `sameSite=lax` + `secure` en prod ; **régénération de
  session à la connexion** (anti session-fixation) — `src/controllers/authController.js`.
- **Rate-limiting** sur `/login` et `/register` — `src/routes/authRoutes.js`.
- **Fail-fast** au démarrage si `SESSION_SECRET` absent — `src/server.js` (+ arrêt propre).

**Validation**
- Mot de passe borné à **72 octets** (limite bcrypt) — `companyValidator` + `employeeValidator`.
- Bornes : **âge 14–120**, **année véhicule 1900..année+1**.

**Qualité / a11y / docs**
- `parseId` / `notFound` extraits dans **`src/utils/http.js`** (utilisé par les 2 contrôleurs).
- Lien d'évitement, `:focus-visible`, flash `role=status/alert`, attributs `autocomplete`.
- Smoke test : +3 vérifs (rejet CSRF 403, bornes âge/année) → 44 ; README section Sécurité ;
  `.env.example` ajout `NODE_ENV`.

## 4. Revue de code — points OUVERTS (à traiter, par priorité)

Aucun bug bloquant. Trouvailles réelles de la dernière revue :

1. **CSRF échec → rend `errors/500` avec statut 403** (`src/middlewares/csrf.js`).
   Un jeton légitimement périmé (session expirée, onglet rouvert) donne une page « Erreur »
   opaque. **À corriger en priorité** : message « session expirée, reconnectez-vous » ou
   redirect `/login` avec flash. *(le plus utile)*
2. **`parseId` accepte hex/exponentiel/espaces** (`Number('1e3')`=1000) — `src/utils/http.js`.
   Impact faible (cloisonnement par `companyId`), mais `/employees/1e3/edit` résout un id au
   lieu d'un 404. Durcir : `/^\d+$/` avant `Number`.
3. **`YEAR_MAX` figé au chargement du module** — `src/validators/vehicleValidator.js`.
   Un process tournant après le 1ᵉʳ janvier garde une borne périmée jusqu'au redémarrage.
4. **Test CSRF négatif** — `test/smoke.cjs` : passe même sans cookie de session, donc ne
   vérifie pas vraiment le scénario « session établie » (qualité de test).
5. **Rate-limit par IP** — `src/routes/authRoutes.js` : derrière un NAT partagé, les échecs
   d'un utilisateur consomment le quota des autres (compromis assumé pour un MVP).

## 5. Stack & structure

Node.js · **Express 5** · **Twig** (rendu serveur, autoescape ON) · **Prisma 6** · **SQLite** ·
**bcrypt** · express-session · helmet · express-rate-limit.

Architecture en couches : `routes → controllers → services`, avec `validators` et
`middlewares` isolés. Toutes les requêtes Prisma sont **scopées par `companyId` de session**.

Repères : `prisma/schema.prisma` (Company / Employee / Vehicle), `src/app.js` (câblage),
`test/smoke.cjs` (parcours complet de bout en bout).

## 6. Conventions du projet

- **Commentaires en français** ; **messages de commit en anglais** (impératif) terminés par
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- `.vscode/` **non commité**.
- **Pas de push / remote sans accord explicite.** Commits **locaux** OK quand demandés.
- Cette conversation/ce dépôt = **ProjetRH uniquement**. `MonoblocLivre` et le projet
  auto-école (job board) sont des projets **séparés** — ne pas les modifier depuis ici.

## 7. Démarrer & vérifier

```bash
npm install
# .env déjà présent (SESSION_SECRET requis) ; sinon : copier .env.example en .env
npm run prisma:migrate   # base SQLite + client Prisma
npm run dev              # ou npm start
npm test                 # smoke test (doit afficher 52/52)
```

Pas de compte de démo pré-créé : créer une auto-école via **`/register`**, puis se connecter
sur **`/login`** (SIRET + mot de passe).

## 8. V2 planning / espace employé

- Spec de design ajoutée : `docs/superpowers/specs/2026-06-15-planning-employe-design.md`.
- Plan ajouté : `docs/superpowers/plans/2026-06-15-planning-employe.md`.
- Implémenté : modèle `ScheduleSlot`, CRUD gérant `/planning`, connexion employé
  `/employee-login`, espace employé `/employee-space`.
- Choix appliqués : connexion employé par email + mot de passe, email employé unique globalement,
  créneau lié à un employé, véhicule affiché automatiquement depuis l'affectation actuelle.
- Correctif UX : l'espace employé affiche tous ses créneaux, y compris ceux passés, pour éviter
  qu'un créneau créé par le gérant disparaisse s'il n'est plus strictement futur.
- Migration ajoutée : `20260615104500_add_schedule_slots_employee_space`.

### Grille planning hebdomadaire (style Skello)

- Spec : `docs/superpowers/specs/2026-06-15-planning-grille-hebdo-design.md` ;
  plan : `docs/superpowers/plans/2026-06-15-planning-grille-hebdo.md`.
- `/planning` n'affiche plus une liste mais une **grille hebdomadaire** : lignes = employés,
  colonnes = 7 jours (lundi→dimanche), créneaux en **blocs colorés** (`09:00 - 10:00` + durée),
  **total par employé** (colonne droite) et **total par jour** (pied « Heures travaillées »).
- Navigation semaine via `?week=YYYY-MM-DD` (flèches ‹ ›, défaut = semaine courante).
- **Cellule vide cliquable** → `/planning/new?employeeId=&date=` (création pré-remplie 09:00–17:00) ;
  **bloc cliquable** → `/planning/:id/edit`.
- Sans migration ni nouveau champ. Nouveaux helpers `startOfWeek`/`addDays`/`toDateInput`/
  `formatTime`/`formatDuration` dans `src/utils/dateFormat.js` ; service `findByCompanyBetween`
  (créneaux chevauchant une fenêtre, scopé `companyId`) ; construction de la grille dans
  `scheduleController.buildWeek`. Couleur stable par employé (`employee.id % 8` → `.slot-color-N`).
- Rattachement d'un créneau au **jour de `startsAt`** (choix MVP pour les créneaux à cheval).

### État git

- Travaux livrés sur la **branche locale `feature/planning-grille-hebdo`** (créée depuis `main`) :
  commit baseline « Add V2 planning and employee space » + docs + grille (helpers, service,
  controller, vue, CSS, smoke). **Aucun push** (règle projet).
- `.vscode/` reste **non commité** (non versionné).
- Statut : implémenté et vérifié par `npm test` → **61/61** ✅.

## 9. Pistes pour la suite

- Corriger le **point #1** de la revue (UX d'erreur CSRF).
- Éventuellement #2 / #3 (durcissements mineurs).
- V2 possibles hors planning : CSP stricte (retirer les `onsubmit` inline),
  pagination/recherche/tri sur les listes, tests unitaires des validators, avatar employé,
  statut véhicule « en maintenance ».
