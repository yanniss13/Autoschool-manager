# Planning Employe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first employee space where the manager creates simple schedule slots and employees log in by email/password to view their own schedule and assigned vehicle.

**Architecture:** Follow the existing Express/Twig/Prisma layers. Add a `ScheduleSlot` model scoped by `companyId`, manager CRUD under `/planning`, and separate employee auth/session routes for read-only `/employee-space`.

**Tech Stack:** Node.js, Express 5, Twig, Prisma 6, SQLite, bcrypt, express-session, express-rate-limit, custom CSS.

---

### Task 1: Smoke Test Coverage

**Files:**
- Modify: `test/smoke.cjs`

- [ ] **Step 1: Add failing end-to-end checks**

Extend the smoke test with checks for global employee email uniqueness, employee login, schedule creation, employee space display, manager route protection, and schedule tenant isolation.

- [ ] **Step 2: Run test to verify RED**

Run: `npm test`

Expected before implementation: fails because routes/models for `/employee-login`, `/employee-space`, `/planning`, and `scheduleSlot` do not exist.

### Task 2: Prisma Data Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `ScheduleSlot` and email uniqueness**

Add `Company.scheduleSlots`, `Employee.scheduleSlots`, `Employee.email @unique`, and the `ScheduleSlot` model with `title`, `startsAt`, `endsAt`, optional `note`, `companyId`, and `employeeId`.

- [ ] **Step 2: Generate/apply Prisma client**

Run: `npx prisma migrate dev --name add_schedule_slots_employee_space`

Expected after implementation: SQLite schema and Prisma client know `scheduleSlot`.

### Task 3: Services And Validators

**Files:**
- Modify: `src/services/employeeService.js`
- Create: `src/services/scheduleService.js`
- Create: `src/validators/employeeAuthValidator.js`
- Create: `src/validators/scheduleValidator.js`

- [ ] **Step 1: Add lookup helpers**

Add employee lookup by global email and employee lookup with vehicle/company for employee space.

- [ ] **Step 2: Add schedule service**

Add scoped methods for listing, finding, creating, updating, deleting manager schedule slots, plus listing all slots for one employee.

- [ ] **Step 3: Add validators**

Validate employee login email/password and schedule form fields: employee, title, start, end, end after start, optional note length.

### Task 4: Auth And Access Control

**Files:**
- Modify: `src/controllers/authController.js`
- Modify: `src/routes/authRoutes.js`
- Modify: `src/routes/index.js`
- Modify: `src/middlewares/requireAuth.js`
- Modify: `src/middlewares/redirectIfAuth.js`
- Create: `src/middlewares/requireEmployeeAuth.js`
- Create: `src/middlewares/loadEmployee.js`

- [ ] **Step 1: Store explicit session roles**

Manager login sets `authRole = "company"` and `companyId`; employee login sets `authRole = "employee"` and `employeeId`.

- [ ] **Step 2: Add employee auth**

Add GET/POST `/employee-login` and POST `/employee-logout` with rate limiting and session regeneration.

- [ ] **Step 3: Separate protected areas**

Manager routes require `authRole = "company"`; employee routes require `authRole = "employee"`.

### Task 5: Planning And Employee Controllers

**Files:**
- Create: `src/controllers/scheduleController.js`
- Create: `src/controllers/employeeSpaceController.js`
- Create: `src/routes/scheduleRoutes.js`
- Create: `src/routes/employeeSpaceRoutes.js`

- [ ] **Step 1: Add manager planning CRUD**

Implement list, new, create, edit, update, delete for company-owned schedule slots.

- [ ] **Step 2: Add employee space**

Render the connected employee identity, assigned vehicle, and all schedule slots.

### Task 6: Twig Views And Styles

**Files:**
- Modify: `views/partials/nav.twig`
- Create: `views/auth/employee-login.twig`
- Create: `views/planning/index.twig`
- Create: `views/planning/new.twig`
- Create: `views/planning/edit.twig`
- Create: `views/planning/_fields.twig`
- Create: `views/employee-space/index.twig`
- Modify: `public/css/style.css`

- [ ] **Step 1: Add manager and employee navigation**

Show Planning for managers, employee space/logout for employees, and public links for guests.

- [ ] **Step 2: Add forms and tables**

Add schedule form and list views in the same dense, readable style as employees/vehicles.

- [ ] **Step 3: Add employee space view**

Show a compact read-only overview with vehicle and schedule slots.

### Task 7: Documentation And Verification

**Files:**
- Modify: `CONTEXTE.md`
- Modify: `README.md`

- [ ] **Step 1: Update docs**

Mark the V2 as implemented, document routes and test coverage.

- [ ] **Step 2: Run verification**

Run: `npm test`

Expected after implementation: smoke test passes with added checks.

- [ ] **Step 3: No push or commit unless requested**

Leave changes in the working tree for review.
