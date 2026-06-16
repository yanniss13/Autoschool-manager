# Portail Eleve Code Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a student portal with login, read-only planning, local road-code training sessions, progress tracking and a local assistant.

**Architecture:** Keep ProjetRH's existing Express/Twig/Prisma layering. Add student authentication next to employee authentication, add a small local question bank, persist training session summaries, and scope every student-space query by the authenticated student and company.

**Tech Stack:** Node.js, Express 5, Twig, Prisma 6 multi-file schema, SQLite, bcrypt, FullCalendar, existing smoke test.

---

### Task 1: Red Smoke Coverage

**Files:**
- Modify: `test/smoke.cjs`

- [ ] Add a failing smoke path after the existing student creation:

```js
const studentEmail = `eleve${stamp}@test.fr`;
await a('/students', {
  method: 'POST',
  body: { firstName: 'Eleve', lastName: 'Dupont', email: studentEmail, phone: '0612345678', password: 'eleve1234' },
});
```

- [ ] Add failing checks for student login, student-space calendar, training and assistant:

```js
const studentClient = makeClient();
r = await studentClient('/student-login', { method: 'POST', body: { email: studentEmail, password: 'eleve1234' } });
check('Connexion eleve par email + mot de passe', r.status === 302 && r.location === '/student-space', `status=${r.status}`);
r = await studentClient('/student-space');
check('Espace eleve -> 200 avec portail complet', r.status === 200 && /Mon planning/.test(r.text) && /Entrainement code/.test(r.text) && /Assistant code/.test(r.text), `status=${r.status}`);
r = await studentClient('/student-space/events?start=2029-12-01&end=2030-02-01');
check('Events eleve -> JSON avec son creneau', r.status === 200 && /Cours de conduite/.test(r.text), `status=${r.status}`);
r = await studentClient('/student-space/training', { method: 'POST', body: { theme: 'priorites', answers: 'priorites-1:b' } });
check('Session entrainement eleve persistee', r.status === 302 && r.location === '/student-space', `status=${r.status}`);
r = await studentClient('/student-space/assistant', { method: 'POST', body: { message: 'Comment fonctionne une priorite a droite ?' } });
check('Assistant code repond a une question eleve', r.status === 200 && /priorit/i.test(r.text), `status=${r.status}`);
```

- [ ] Run `npm test` and confirm these checks fail because the routes and fields do not exist yet.

### Task 2: Data Model And Validators

**Files:**
- Modify: `prisma/schema/student.prisma`
- Create: `prisma/schema/roadCodeTrainingSession.prisma`
- Modify: `prisma/schema/company.prisma`
- Create migration under `prisma/migrations/`
- Modify: `src/validators/studentValidator.js`
- Create: `src/validators/studentAuthValidator.js`

- [ ] Add `passwordHash String?` to `Student`, plus `trainingSessions RoadCodeTrainingSession[]`.
- [ ] Add `RoadCodeTrainingSession` with `studentId`, `companyId`, `theme`, `score`, `total`, timestamps and indexes.
- [ ] Extend student validation to accept optional password on edit and required password on creation.
- [ ] Add `validateStudentLogin` mirroring employee login validation.
- [ ] Run `npx prisma validate`.

### Task 3: Student Auth And Space

**Files:**
- Modify: `src/controllers/authController.js`
- Modify: `src/routes/authRoutes.js`
- Modify: `src/routes/index.js`
- Modify: `src/services/studentService.js`
- Create: `src/middlewares/requireStudentAuth.js`
- Create: `src/middlewares/loadStudent.js`
- Create: `src/controllers/studentSpaceController.js`
- Create: `src/routes/studentSpaceRoutes.js`
- Create: `views/auth/student-login.twig`
- Create: `views/student-space/index.twig`
- Modify: `views/partials/nav.twig`

- [ ] Add public student login/logout routes.
- [ ] Store `authRole = 'student'`, `studentId`, and no manager or employee id in session.
- [ ] Add `/student-space` protected by student auth.
- [ ] Render student name, progress summary placeholders and FullCalendar container.

### Task 4: Planning Events For Student

**Files:**
- Modify: `src/services/scheduleService.js`
- Modify: `src/controllers/studentSpaceController.js`

- [ ] Add `findByStudentBetween(studentId, rangeStart, rangeEnd)`.
- [ ] Add `GET /student-space/events` using `parseDateRange`.
- [ ] Return FullCalendar event JSON with instructor name in the title.

### Task 5: Local Training And Assistant

**Files:**
- Create: `src/data/roadCodeQuestions.js`
- Create: `src/services/roadCodeTrainingService.js`
- Create: `src/services/roadCodeAssistantService.js`
- Modify: `src/controllers/studentSpaceController.js`

- [ ] Add a local question bank with themes `priorites`, `signalisation`, `vitesse`, `stationnement`, `securite`.
- [ ] Add training scoring from submitted answers.
- [ ] Persist one session summary per submitted training form.
- [ ] Add local assistant responses for priority, speed, signs, parking and safety keywords.

### Task 6: UI And Documentation

**Files:**
- Modify: `views/student-space/index.twig`
- Modify: `views/students/_fields.twig`
- Modify: `public/css/style.css`
- Modify: `README.md`
- Modify: `CONTEXTE.md`

- [ ] Add password fields to student forms.
- [ ] Add compact student portal layout using existing design tokens.
- [ ] Document student portal and training behavior.
- [ ] Run `npx prisma validate`.
- [ ] Run `npm test` and confirm the full smoke passes.
