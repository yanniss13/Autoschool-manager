# Design — Grille planning hebdomadaire (style Skello)

> Spec de design. Date : 2026-06-15.
> Remplace l'affichage liste de `/planning` par une grille semaine type Skello.

## 1. Objectif

Afficher le planning sous forme de **grille hebdomadaire** : employés en lignes, jours
en colonnes, créneaux représentés par des **blocs colorés** (`09:00 - 17:00` + durée),
avec **total d'heures par employé** (colonne droite) et **total par jour** (ligne basse).

Référence visuelle : capture Skello fournie par l'utilisateur.

## 2. Périmètre

Inclus :
- Grille semaine (lignes employés, colonnes jours, blocs colorés).
- Navigation semaine précédente / suivante.
- Totaux par employé (semaine) et par jour.
- Cellule vide cliquable → formulaire de création pré-rempli (employé + jour).
- Bloc cliquable → formulaire d'édition existant.

Exclus (confirmé avec l'utilisateur) :
- Champ « heures contractuelles » et écart hebdo (« 35h » / « -5h »).
- Bouton « Publier le planning » et statut brouillon/publié.
- Drag & drop, toolbar IA, duplication de semaine.

Contraintes projet :
- Aucune migration ni nouveau champ : le modèle `ScheduleSlot` actuel suffit.
- Isolation multi-entreprises préservée (scope `companyId` de session).
- Réutiliser les formulaires `planning/new` et `planning/edit` existants.

## 3. Données & calcul

### 3.1 Service (`scheduleService`)
Ajouter une méthode pour récupérer les créneaux **chevauchant** une fenêtre de dates :

```
findByCompanyBetween(companyId, rangeStart, rangeEnd)
  -> scheduleSlot.findMany scoped companyId,
     where startsAt < rangeEnd AND endsAt > rangeStart,
     include employee+vehicle, orderBy startsAt asc
```

Un créneau « chevauche » la semaine s'il commence avant la fin de fenêtre et finit
après le début de fenêtre (gère les créneaux à cheval sur deux jours).

### 3.2 Helpers de date (`src/utils/dateFormat.js`)
Ajouter, à côté des fonctions existantes :
- `startOfWeek(date)` → lundi 00:00 de la semaine de `date` (semaine **lundi→dimanche**).
- `addDays(date, n)` → nouvelle date décalée de `n` jours.
- `formatDuration(minutes)` → `"8h"`, `"3h30"`, `"0h"` (minutes restantes sur 2 chiffres,
  omises si nulles).
- `toDateInput(date)` → `"YYYY-MM-DD"` (pour les liens de création).

### 3.3 Controller (`scheduleController.index`)
1. Lire `?week=YYYY-MM-DD` (défaut : date du jour). Calculer `weekStart = startOfWeek`,
   `weekEnd = addDays(weekStart, 7)`.
2. Charger `employees = employeeService.findAllByCompany(companyId)`.
3. Charger `slots = scheduleService.findByCompanyBetween(companyId, weekStart, weekEnd)`.
4. Construire la structure de rendu :
   - `days` : tableau de 7 entrées `{ date, label (n° du mois), weekday (lun..dim) }`.
   - `rows` : pour chaque employé `{ employee, color, cells[7], weekTotalLabel }`
     où chaque `cell` = `{ dateInput, blocks[] }` et chaque bloc
     `{ id, startLabel ("09:00"), endLabel ("17:00"), durationLabel, ... }`.
   - `dayTotals[7]` : libellé du total d'heures travaillées par jour.
5. **Couleur par employé** : `color = PALETTE[employee.id % PALETTE.length]` (palette
   pastel d'au moins 8 teintes, définie côté serveur → classe CSS `slot-color-N`).
6. **Rattachement d'un créneau à un jour** : par `startsAt` (le jour où le créneau
   commence). La durée comptée = `endsAt - startsAt` en minutes.

Tout le calcul (durées, totaux, libellés, couleurs) est fait dans le controller ; la vue
ne fait que présenter.

## 4. Vue `planning/index.twig`

- **Barre supérieure** : titre, libellé de semaine (ex. « 9 – 15 juin 2026 »),
  flèches `‹` / `›` (liens `/planning?week=<lundi semaine ±7j>`), bouton
  « + Nouveau créneau » (vers `/planning/new`).
- **Grille** (`<table class="planning-grid">`) :
  - `thead` : cellule vide (coin) + 7 colonnes jour (`weekday` + `label`) + colonne `Total`.
  - `tbody` : une ligne par employé. 1ʳᵉ cellule = nom (`lastName firstName`).
    7 cellules jour ; dernière cellule = total semaine.
  - `tfoot` : ligne « Heures travaillées » + 7 totaux jour.
- **Cellule jour** :
  - Si elle contient des blocs : chaque bloc est un lien `<a class="slot slot-color-N"
    href="/planning/{id}/edit">` affichant `start - end` et la durée.
  - Cellule cliquable pour créer : lien englobant ou bouton « + » vers
    `/planning/new?employeeId={employee.id}&date={cell.dateInput}`.
- **État vide** : si aucun employé, message `muted` invitant à créer un employé.

## 5. Pré-remplissage (`scheduleController.newForm`)

Lire `req.query.employeeId` et `req.query.date` :
- Si présents, initialiser `values = { employeeId, startsAt: "<date>T09:00",
  endsAt: "<date>T17:00" }` (heures par défaut raisonnables).
- Sinon, comportement actuel (`values = {}`).

Validation et POST `/planning` inchangés. Les valeurs par défaut ne sont qu'un confort
de saisie ; l'utilisateur ajuste avant d'enregistrer.

## 6. CSS (`public/css/style.css`)

Ajouter un bloc `.planning-grid` :
- Table à colonnes régulières, en-têtes de jour centrés, 1ʳᵉ colonne (employé) mise en avant.
- `.slot` : bloc arrondi, padding, heure en gras + durée en petit à droite.
- `.slot-color-0..N` : fond pastel + texte lisible (palette alignée sur celle du controller).
- Ligne `tfoot` (totaux jour) distincte ; colonne Total à droite distincte.
- Cellule vide : zone cliquable discrète (apparition d'un `+` au survol).

## 7. Routes

Aucune nouvelle route. `GET /planning` accepte désormais `?week=`,
`GET /planning/new` accepte `?employeeId=&date=`. Les routes restent montées derrière
`requireAuth + loadCompany`.

## 8. Tests (`test/smoke.cjs`)

Le smoke test doit rester vert (actuellement 52/52). Ajouts :
1. `GET /planning` → 200 et contient la grille (présence de « Heures travaillées »).
2. Après création d'un créneau sur un jour de la semaine courante, `GET /planning`
   (semaine de ce créneau) contient l'horaire du créneau dans la grille.

## 9. Risques / points d'attention

- **Créneaux à cheval sur deux jours** : rattachés au jour de `startsAt` ; la durée totale
  est comptée sur ce jour (choix assumé pour un MVP).
- **Fuseau horaire** : calculs en heure locale serveur, cohérents avec `toDateTimeLocal`
  et `formatDateTime` existants.
- **Semaine** : lundi→dimanche (7 colonnes), conforme à l'usage FR et à la maquette.
- **Performance** : une requête par semaine, scope `companyId` indexé
  (`@@index([companyId, startsAt])`) — suffisant.
