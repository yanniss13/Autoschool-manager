// Agrege tous les routeurs de l'application et applique la protection de session
// sur les routes internes.
const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const employeeRoutes = require('./employeeRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const studentRoutes = require('./studentRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const employeeSpaceRoutes = require('./employeeSpaceRoutes');
const studentSpaceRoutes = require('./studentSpaceRoutes');
const requireAuth = require('../middlewares/requireAuth');
const loadCompany = require('../middlewares/loadCompany');
const requireEmployeeAuth = require('../middlewares/requireEmployeeAuth');
const loadEmployee = require('../middlewares/loadEmployee');
const requireStudentAuth = require('../middlewares/requireStudentAuth');
const loadStudent = require('../middlewares/loadStudent');

const router = express.Router();

// Routes publiques (inscription / connexion / deconnexion).
router.use('/', authRoutes);

// Routes protegees : session obligatoire + entreprise courante chargee.
router.use('/dashboard', requireAuth, loadCompany, dashboardRoutes);
router.use('/employees', requireAuth, loadCompany, employeeRoutes);
router.use('/vehicles', requireAuth, loadCompany, vehicleRoutes);
router.use('/students', requireAuth, loadCompany, studentRoutes);
router.use('/planning', requireAuth, loadCompany, scheduleRoutes);

// Espace employe en lecture seule.
router.use('/employee-space', requireEmployeeAuth, loadEmployee, employeeSpaceRoutes);

// Espace eleve : planning, entrainement et assistant code.
router.use('/student-space', requireStudentAuth, loadStudent, studentSpaceRoutes);

module.exports = router;
