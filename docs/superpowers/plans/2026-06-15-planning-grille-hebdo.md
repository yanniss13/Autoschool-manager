# Grille planning hebdomadaire (style Skello) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'affichage liste de `/planning` par une grille hebdomadaire (employés en lignes, jours en colonnes, blocs colorés + totaux) cliquable, sans migration ni nouveau champ.

**Architecture:** Helpers de date purs dans `dateFormat.js` → méthode service `findByCompanyBetween` → controller `index` qui construit une structure de grille prête à rendre → vue Twig + CSS. Les formulaires `new`/`edit` existants sont réutilisés, le clic sur une cellule pré-remplit la création via query string.

**Tech Stack:** Node.js, Express 5, Twig (autoescape), Prisma 6 (SQLite). Tests : `test/smoke.cjs` (intégration HTTP + assertions sur fonctions pures), lancé par `npm test`.

Spec de référence : `docs/superpowers/specs/2026-06-15-planning-grille-hebdo-design.md`.

---

### Task 1: Helpers de date et de durée

**Files:**
- Modify: `src/utils/dateFormat.js`
- Test: `test/smoke.cjs` (nouvelle section d'assertions sur fonctions pures)

- [ ] **Step 1: Écrire les assertions qui échouent**

Dans `test/smoke.cjs`, ajouter en haut du fichier (après les `require` existants, vers la ligne 28) l'import :

```js
const dateFormat = require('../src/utils/dateFormat');
```

Puis, dans `runTests()`, ajouter une nouvelle section **juste avant** `section('AUTHENTIFICATION & SESSION');` :

```js
  section('HELPERS DATE & DURÉE (unitaire)');
  check('formatDuration(480) = "8h"', dateFormat.formatDuration(480) === '8h', dateFormat.formatDuration(480));
  check('formatDuration(210) = "3h30"', dateFormat.formatDuration(210) === '3h30', dateFormat.formatDuration(210));
  check('formatDuration(0) = "0h"', dateFormat.formatDuration(0) === '0h', dateFormat.formatDuration(0));
  // 2030-01-02 est un mercredi -> lundi de la semaine = 2029-12-31
  check('startOfWeek(mercredi) = lundi', dateFormat.toDateInput(dateFormat.startOfWeek(new Date('2030-01-02T15:00'))) === '2029-12-31', dateFormat.toDateInput(dateFormat.startOfWeek(new Date('2030-01-02T15:00'))));
  check('addDays(+7) avance d\'une semaine', dateFormat.toDateInput(dateFormat.addDays(new Date('2030-01-02T00:00'), 7)) === '2030-01-09', dateFormat.toDateInput(dateFormat.addDays(new Date('2030-01-02T00:00'), 7)));
  check('formatTime(09:05) = "09:05"', dateFormat.formatTime(new Date('2030-01-02T09:05')) === '09:05', dateFormat.formatTime(new Date('2030-01-02T09:05')));
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npm test`
Expected: ÉCHEC — `dateFormat.formatDuration is not a function` (ou assertions ❌), le test crash/affiche des ❌ pour la nouvelle section.

- [ ] **Step 3: Implémenter les helpers**

Dans `src/utils/dateFormat.js`, ajouter ces fonctions et les exporter. Le fichier complet devient :

```js
function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocal(date) {
  if (!date) return '';
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
}

function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

// Lundi 00:00 de la semaine contenant `date` (semaine lundi -> dimanche).
function startOfWeek(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Nouvelle date decalee de `n` jours (n peut etre negatif).
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// "YYYY-MM-DD" en heure locale (pour les liens de creation).
function toDateInput(date) {
  if (!date) return '';
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

// "HH:MM" en heure locale.
function formatTime(date) {
  if (!date) return '';
  return pad(date.getHours()) + ':' + pad(date.getMinutes());
}

// Duree en minutes -> "8h", "3h30", "0h".
function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hours}h` : `${hours}h${pad(mins)}`;
}

module.exports = {
  toDateTimeLocal,
  formatDateTime,
  startOfWeek,
  addDays,
  toDateInput,
  formatTime,
  formatDuration,
};
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `npm test`
Expected: la section « HELPERS DATE & DURÉE » affiche 6 ✅, le reste du test reste vert.

- [ ] **Step 5: Commit** (uniquement si l'utilisateur l'a demandé — règle projet : pas de commit non sollicité)

```bash
git add src/utils/dateFormat.js test/smoke.cjs
git commit -m "Add week and duration date helpers"
```

---

### Task 2: Méthode service — créneaux d'une fenêtre de dates

**Files:**
- Modify: `src/services/scheduleService.js`
- Test: `test/smoke.cjs` (vérifié indirectement par la grille en Task 6 ; pas d'assertion isolée ici)

- [ ] **Step 1: Implémenter `findByCompanyBetween`**

Dans `src/services/scheduleService.js`, ajouter la fonction (après `findOwnedById`) et l'exporter :

```js
// Creneaux chevauchant [rangeStart, rangeEnd) : commencent avant la fin de fenetre
// ET finissent apres le debut de fenetre. Scope companyId pour l'isolation.
function findByCompanyBetween(companyId, rangeStart, rangeEnd) {
  return prisma.scheduleSlot.findMany({
    where: {
      companyId,
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
    include: slotInclude,
    orderBy: { startsAt: 'asc' },
  });
}
```

Ajouter `findByCompanyBetween` à l'objet `module.exports`.

- [ ] **Step 2: Vérifier que rien n'est cassé**

Run: `npm test`
Expected: toujours vert (la fonction n'est pas encore appelée, mais le module doit charger sans erreur).

- [ ] **Step 3: Commit** (si demandé)

```bash
git add src/services/scheduleService.js
git commit -m "Add schedule slot lookup by date range"
```

---

### Task 3: Controller `index` (grille) + pré-remplissage `newForm`

**Files:**
- Modify: `src/controllers/scheduleController.js`

- [ ] **Step 1: Définir la palette et le constructeur de grille**

Dans `src/controllers/scheduleController.js`, mettre à jour les imports en tête de fichier :

```js
const {
  formatDateTime,
  toDateTimeLocal,
  startOfWeek,
  addDays,
  toDateInput,
  formatTime,
  formatDuration,
} = require('../utils/dateFormat');
```

Ajouter, sous les imports, la palette et les helpers de construction :

```js
// Palette pastel : la classe CSS slot-color-N est definie dans public/css/style.css.
const PALETTE_SIZE = 8;
const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function slotMinutes(slot) {
  return Math.max(0, Math.round((slot.endsAt - slot.startsAt) / 60000));
}

// Parse ?week=YYYY-MM-DD en date locale ; defaut = aujourd'hui. Renvoie le lundi 00:00.
function resolveWeekStart(weekParam) {
  if (typeof weekParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const [y, m, d] = weekParam.split('-').map(Number);
    return startOfWeek(new Date(y, m - 1, d));
  }
  return startOfWeek(new Date());
}

// Construit la structure de grille rendue par la vue.
function buildWeek(employees, slots, weekStart) {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    days.push({
      dateInput: toDateInput(date),
      weekday: WEEKDAYS[i],
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
    });
  }

  const dayTotals = new Array(7).fill(0); // minutes cumulees par colonne (jour)

  const rows = employees.map((employee) => {
    let weekTotal = 0;
    const cells = days.map((day, dayIndex) => {
      const blocks = slots
        .filter((s) => s.employeeId === employee.id && toDateInput(s.startsAt) === day.dateInput)
        .map((s) => {
          const minutes = slotMinutes(s);
          weekTotal += minutes;
          dayTotals[dayIndex] += minutes;
          return {
            id: s.id,
            startLabel: formatTime(s.startsAt),
            endLabel: formatTime(s.endsAt),
            durationLabel: formatDuration(minutes),
            title: s.title,
          };
        });
      return { dateInput: day.dateInput, blocks };
    });

    return {
      employee,
      colorIndex: employee.id % PALETTE_SIZE,
      cells,
      weekTotalLabel: formatDuration(weekTotal),
    };
  });

  return {
    days,
    rows,
    dayTotalLabels: dayTotals.map((m) => formatDuration(m)),
  };
}
```

- [ ] **Step 2: Réécrire l'action `index`**

Remplacer la fonction `index` existante par :

```js
// GET /planning?week=YYYY-MM-DD
async function index(req, res, next) {
  try {
    const weekStart = resolveWeekStart(req.query.week);
    const weekEnd = addDays(weekStart, 7);
    const employees = await employeeService.findAllByCompany(req.company.id);
    const slots = await scheduleService.findByCompanyBetween(req.company.id, weekStart, weekEnd);

    const grid = buildWeek(employees, slots, weekStart);
    const lastDay = addDays(weekStart, 6);

    res.render('planning/index', {
      title: 'Planning',
      days: grid.days,
      rows: grid.rows,
      dayTotalLabels: grid.dayTotalLabels,
      weekLabel: `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${lastDay.getDate()} ${MONTHS[lastDay.getMonth()]} ${lastDay.getFullYear()}`,
      prevWeek: toDateInput(addDays(weekStart, -7)),
      nextWeek: toDateInput(addDays(weekStart, 7)),
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Pré-remplir `newForm` depuis la query**

Remplacer la fonction `newForm` existante par :

```js
// GET /planning/new?employeeId=&date=
async function newForm(req, res, next) {
  try {
    const values = {};
    const { employeeId, date } = req.query;
    if (employeeId) values.employeeId = String(employeeId);
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      values.startsAt = `${date}T09:00`;
      values.endsAt = `${date}T17:00`;
    }
    await renderForm(req, res, 'planning/new', 200, {
      title: 'Nouveau creneau',
      errors: {},
      values,
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Lancer le test, vérifier que rien n'est cassé**

Run: `npm test`
Expected: toujours vert (la vue n'est pas encore mise à jour ; voir Task 4. Si la vue actuelle référence `slots`, le rendu de `/planning` peut afficher une grille vide sans erreur — c'est attendu jusqu'à Task 4).

- [ ] **Step 5: Commit** (si demandé)

```bash
git add src/controllers/scheduleController.js
git commit -m "Build weekly planning grid in schedule controller"
```

---

### Task 4: Vue grille `planning/index.twig`

**Files:**
- Modify: `views/planning/index.twig` (remplacement complet)

- [ ] **Step 1: Réécrire la vue**

Remplacer tout le contenu de `views/planning/index.twig` par :

```twig
{% extends 'layouts/base.twig' %}

{% block content %}
  <section class="page-header planning-header">
    <div class="planning-week-nav">
      <a href="/planning?week={{ prevWeek }}" class="btn btn-small" aria-label="Semaine précédente">‹</a>
      <span class="planning-week-label">{{ weekLabel }}</span>
      <a href="/planning?week={{ nextWeek }}" class="btn btn-small" aria-label="Semaine suivante">›</a>
    </div>
    <a href="/planning/new" class="btn btn-primary">+ Nouveau creneau</a>
  </section>

  {% if rows|length > 0 %}
    <div class="planning-scroll">
      <table class="planning-grid">
        <thead>
          <tr>
            <th class="planning-corner">Employé</th>
            {% for day in days %}
              <th><span class="planning-weekday">{{ day.weekday }}</span><span class="planning-daynum">{{ day.label }}</span></th>
            {% endfor %}
            <th class="planning-total-col">Total</th>
          </tr>
        </thead>
        <tbody>
          {% for row in rows %}
            <tr>
              <th class="planning-employee">{{ row.employee.lastName }} {{ row.employee.firstName }}</th>
              {% for cell in row.cells %}
                <td class="planning-cell">
                  {% for block in cell.blocks %}
                    <a class="slot slot-color-{{ row.colorIndex }}" href="/planning/{{ block.id }}/edit" title="{{ block.title }}">
                      <span class="slot-time">{{ block.startLabel }} - {{ block.endLabel }}</span>
                      <span class="slot-duration">{{ block.durationLabel }}</span>
                    </a>
                  {% endfor %}
                  <a class="slot-add" href="/planning/new?employeeId={{ row.employee.id }}&date={{ cell.dateInput }}" aria-label="Ajouter un créneau">+</a>
                </td>
              {% endfor %}
              <td class="planning-cell planning-total-col">{{ row.weekTotalLabel }}</td>
            </tr>
          {% endfor %}
        </tbody>
        <tfoot>
          <tr>
            <th class="planning-employee">Heures travaillées</th>
            {% for label in dayTotalLabels %}
              <td class="planning-cell planning-dayfoot">{{ label }}</td>
            {% endfor %}
            <td class="planning-cell planning-total-col"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  {% else %}
    <p class="muted">Aucun employé. <a href="/employees/new">Créez un employé</a> pour commencer à planifier.</p>
  {% endif %}
{% endblock %}
```

- [ ] **Step 2: Vérifier le rendu manuellement (optionnel mais recommandé)**

Run: `npm run dev` puis ouvrir `/planning` après connexion (ou se fier au smoke test Task 6).
Expected: une grille s'affiche avec les jours en colonnes ; les créneaux apparaissent comme blocs colorés.

- [ ] **Step 3: Lancer le test**

Run: `npm test`
Expected: toujours vert (les checks spécifiques arrivent en Task 6).

- [ ] **Step 4: Commit** (si demandé)

```bash
git add views/planning/index.twig
git commit -m "Render planning as weekly Skello-style grid"
```

---

### Task 5: Styles de la grille

**Files:**
- Modify: `public/css/style.css` (ajout en fin de fichier)

> Avant d'écrire, ouvrir `public/css/style.css` pour réutiliser les variables/couleurs existantes (ex. variables CSS `--…`, classes `.btn`). Si une palette de variables existe, aligner les teintes ci-dessous dessus ; sinon, utiliser les valeurs littérales fournies.

- [ ] **Step 1: Ajouter le bloc CSS**

Ajouter à la fin de `public/css/style.css` :

```css
/* ===== Grille planning (style Skello) ===== */
.planning-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.planning-week-nav { display: flex; align-items: center; gap: 0.5rem; }
.planning-week-label { font-weight: 600; }

.planning-scroll { overflow-x: auto; }
.planning-grid { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 0.85rem; }
.planning-grid th, .planning-grid td { border: 1px solid #e5e7eb; padding: 4px; vertical-align: top; }
.planning-grid thead th { text-align: center; background: #f9fafb; font-weight: 600; padding: 8px 4px; }
.planning-weekday { display: block; font-size: 0.75rem; color: #6b7280; }
.planning-daynum { display: block; font-size: 1rem; }
.planning-corner, .planning-employee { width: 160px; text-align: left; background: #f9fafb; font-weight: 600; }
.planning-total-col { width: 70px; text-align: center; font-weight: 600; background: #f9fafb; }
.planning-cell { height: 56px; position: relative; }
.planning-dayfoot { text-align: center; font-weight: 600; background: #f9fafb; }

.slot { display: block; border-radius: 6px; padding: 4px 6px; margin-bottom: 4px; text-decoration: none; color: #1f2937; }
.slot-time { display: block; font-weight: 600; }
.slot-duration { display: block; font-size: 0.7rem; color: #4b5563; text-align: right; }

/* Bouton "+" discret, visible au survol de la cellule. */
.slot-add { position: absolute; top: 2px; right: 4px; opacity: 0; color: #9ca3af; text-decoration: none; font-weight: 700; line-height: 1; }
.planning-cell:hover .slot-add { opacity: 1; }
.slot-add:focus-visible { opacity: 1; }

/* Palette pastel (8 teintes) alignee sur slot-color-N du controller. */
.slot-color-0 { background: #dbeafe; }
.slot-color-1 { background: #ede9fe; }
.slot-color-2 { background: #dcfce7; }
.slot-color-3 { background: #fed7aa; }
.slot-color-4 { background: #fce7f3; }
.slot-color-5 { background: #cffafe; }
.slot-color-6 { background: #fef9c3; }
.slot-color-7 { background: #e0f2fe; }
```

- [ ] **Step 2: Vérifier le rendu**

Run: `npm run dev`, ouvrir `/planning`.
Expected: blocs colorés arrondis, totaux en pied/à droite, « + » au survol des cellules.

- [ ] **Step 3: Commit** (si demandé)

```bash
git add public/css/style.css
git commit -m "Style the weekly planning grid"
```

---

### Task 6: Vérifications smoke test de la grille

**Files:**
- Modify: `test/smoke.cjs` (section « PLANNING & ESPACE EMPLOYE »)

- [ ] **Step 1: Ajouter les checks HTTP de la grille**

Dans `test/smoke.cjs`, juste après le check `'Creneau persiste en base'` (vers la ligne 257), ajouter :

```js
  // La grille hebdomadaire affiche le creneau dans la bonne semaine.
  // slotStart = '2030-01-02T09:00' -> semaine du lundi 2029-12-31.
  r = await a('/planning?week=2029-12-31');
  check('Grille planning -> 200 avec en-tete', r.status === 200 && /Heures travaillées/.test(r.text), `status=${r.status}`);
  check('Grille affiche le creneau (09:00 - 10:00)', /09:00 - 10:00/.test(r.text), 'horaire absent de la grille');
  check('Grille propose la creation par cellule', /\/planning\/new\?employeeId=/.test(r.text), 'lien de creation absent');
```

- [ ] **Step 2: Lancer le test, vérifier le succès**

Run: `npm test`
Expected: les 3 nouveaux checks passent ✅. Total attendu : 52 (existants) + 6 (Task 1) + 3 (Task 6) = **61/61** ✅, 0 ❌.

> Si le total diffère, vérifier qu'aucun check existant n'a régressé (ex. la vue planning ne casse pas le rendu employee-space, qui utilise un autre template).

- [ ] **Step 3: Commit** (si demandé)

```bash
git add test/smoke.cjs
git commit -m "Cover weekly planning grid in smoke test"
```

---

### Task 7: Mise à jour de CONTEXTE.md

**Files:**
- Modify: `CONTEXTE.md`

- [ ] **Step 1: Documenter le changement**

Mettre à jour la section « 8. V2 planning / espace employé » (et la date de dernière mise à jour en tête) pour mentionner :
- `/planning` affiche désormais une **grille hebdomadaire** (lignes employés, colonnes jours, blocs colorés, totaux par employé et par jour) avec navigation `?week=`.
- Cellule vide cliquable → création pré-remplie ; bloc → édition.
- Nouveaux helpers `startOfWeek`/`addDays`/`toDateInput`/`formatTime`/`formatDuration` dans `src/utils/dateFormat.js` ; méthode service `findByCompanyBetween`.
- Pas de migration ni nouveau champ. Smoke test mis à jour (nouveau total).

- [ ] **Step 2: Commit** (si demandé)

```bash
git add CONTEXTE.md
git commit -m "Document weekly planning grid in handoff doc"
```

---

## Notes d'exécution

- **Règle projet (override) :** aucun `commit`/`push` sans accord explicite de l'utilisateur. Les étapes « Commit » ne sont exécutées que si l'utilisateur le demande ; sinon, regrouper le travail et proposer un commit à la fin.
- **Commentaires en français**, style cohérent avec l'existant.
- **Isolation `companyId`** préservée : `findByCompanyBetween` est scopé, les routes restent derrière `requireAuth + loadCompany`.
- Rattachement d'un créneau au **jour de `startsAt`** (créneaux à cheval comptés sur le jour de début) — choix MVP assumé.
