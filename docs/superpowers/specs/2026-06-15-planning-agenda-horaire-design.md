# Design — Agenda hebdomadaire à axe horaire (07h–20h)

> Spec de design. Date : 2026-06-15.
> Remplace la grille « employés × jours » par un agenda à axe horaire, côté gérant ET employé.

## 1. Objectif

Afficher le planning comme un **agenda** : **heures en lignes** (07h→20h), **jours en
colonnes** (lundi→dimanche), créneaux en **blocs positionnés proportionnellement** à leur
heure de début et de durée. Rendu identique côté gérant et côté employé.

## 2. Périmètre

- **Côté gérant** (`/planning`) : agenda d'**un employé** sélectionné via un **menu
  déroulant** (`?employeeId=X&week=YYYY-MM-DD`). Blocs cliquables → édition ; clic sur une
  zone horaire vide → création pré-remplie (`/planning/new?employeeId=&date=&hour=HH`).
- **Côté employé** (`/employee-space`) : même agenda, **lecture seule**, ses propres
  créneaux. Cartes Profil / Véhicule conservées.
- Navigation de semaine ‹ › des deux côtés.

Exclus (MVP assumé) :
- Pas de répartition côte-à-côte des créneaux qui se chevauchent (ils se superposent).
- Créneau rattaché au **jour de `startsAt`** ; rogné à la plage 07–20h.
- Pas de drag & drop, pas de FullCalendar (choix : rester server-rendered, sans build front).

Contraintes : aucune migration ; isolation `companyId` préservée (gérant : l'employé
sélectionné est vérifié `findOwnedById`) ; commentaires FR ; style cohérent.

## 3. Module partagé `src/utils/planningGrid.js`

Constantes : `WEEKDAYS`, `MONTHS`, `PALETTE_SIZE = 8`, `DAY_START_HOUR = 7`,
`DAY_END_HOUR = 20` (donc 13 lignes d'heures, `DAY_SPAN_MIN = 780`).

- `colorIndexFor(id)` → `id % PALETTE_SIZE`.
- `weekRange(weekParam)` → `{ start, end, weekInput, weekLabel, prevWeek, nextWeek }`
  (semaine lundi→dimanche ; défaut = semaine courante ; `start`/`end` bornent la requête).
- `hourLabels()` → `['07h', …, '19h']` (13 libellés, début de chaque ligne).
- `buildAgenda(slots, weekStart)` → tableau de 7 `day` :
  `{ dateInput, weekday, label, blocks[] }`. Chaque bloc :
  `{ id, title, startLabel, endLabel, durationLabel, topPct, heightPct }` où
  `topPct`/`heightPct` situent le bloc dans la plage visible (clamp à `[0, 780]` min ;
  blocs entièrement hors plage exclus).

## 4. Service

`findByEmployeeBetween(employeeId, rangeStart, rangeEnd)` : créneaux d'un employé
chevauchant la fenêtre, `orderBy startsAt`. (On garde `findByCompanyBetween` même si la
vue gérant agenda ne l'utilise plus directement.)

## 5. Partial `views/partials/planning-agenda.twig`

Contexte attendu : `days`, `hourLabels`, `colorIndex`, `readonly`, `prevUrl`, `nextUrl`,
`weekLabel`, et (si `not readonly`) `employeeId`.

Structure : un `display:grid` à 8 colonnes (`52px` + 7 jours).
- Ligne 1 : coin + 7 entêtes de jour.
- Ligne 2 : colonne des heures (13 libellés) + 7 corps de jour.
- Corps de jour (`position:relative`, hauteur = 13 × hauteur de ligne) : 13 cellules
  horaires (cliquables → création si `not readonly`, sinon inertes) + blocs absolus
  positionnés par `top`/`height` en %.
- Blocs : `<a>` (édition) si gérant, `<div>` si lecture seule.

## 6. Controllers

**`scheduleController.index`** : charge les employés ; `weekRange` ; détermine l'employé
sélectionné (`?employeeId` vérifié par `findOwnedById`, défaut = 1ᵉʳ employé) ; charge ses
créneaux via `findByEmployeeBetween` ; `buildAgenda` ; construit `prevUrl`/`nextUrl` (avec
`employeeId`). Si aucun employé → message. Retire `buildWeek`/constantes (déplacées dans
`planningGrid`).

**`scheduleController.newForm`** : accepte `hour` (00–23) ; défaut 09 ; `endsAt = début+1h`.

**`employeeSpaceController.index`** : `weekRange` ; `findByEmployeeBetween(req.employee.id)` ;
`buildAgenda` ; `colorIndex` de l'employé ; `prevUrl`/`nextUrl` (`/employee-space?week=`).

## 7. CSS (`public/css/style.css`)

Bloc `.agenda-*` : grille, colonne d'heures, corps de jour `position:relative`, cellules
horaires avec lignes, blocs absolus (`.agenda-block`, réutilise `.slot-color-N`). Variable
`--agenda-row` pour la hauteur de ligne.

## 8. Tests (`test/smoke.cjs`)

- Gérant : `/planning?employeeId=<e1>&week=2029-12-31` → 200, contient `07h`, `09:00`,
  `Cours de conduite`, et un lien `/planning/new?employeeId=`.
- Employé : `/employee-space?week=2029-12-31` → 200, contient `Cours de conduite`,
  l'immatriculation affectée, et `07h`.
- Employé : `/employee-space?week=2019-12-30` → contient `Ancien creneau visible`
  (les créneaux passés restent consultables par navigation de semaine).
- Le reste du smoke test reste vert.

## 9. Note CSP

Le sélecteur d'employé utilise `onchange="this.form.submit()"` (JS inline), cohérent avec
les `onsubmit` inline déjà présents. À nettoyer le jour où une CSP stricte sera mise en place
(piste déjà notée dans CONTEXTE §9).
