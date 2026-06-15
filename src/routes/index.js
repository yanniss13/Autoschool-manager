// Agrege tous les routeurs de l'application et applique la protection de session
// sur les routes internes.
const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const employeeRoutes = require('./employeeRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const employeeSpaceRoutes = require('./employeeSpaceRoutes');
const requireAuth = require('../middlewares/requireAuth');
const loadCompany = require('../middlewares/loadCompany');
const requireEmployeeAuth = require('../middlewares/requireEmployeeAuth');
const loadEmployee = require('../middlewares/loadEmployee');

const router = express.Router();

// Routes publiques (inscription / connexion / deconnexion).
router.use('/', authRoutes);

// Routes protegees : session obligatoire + entreprise courante chargee.
router.use('/dashboard', requireAuth, loadCompany, dashboardRoutes);
router.use('/employees', requireAuth, loadCompany, employeeRoutes);
router.use('/vehicles', requireAuth, loadCompany, vehicleRoutes);
router.use('/planning', requireAuth, loadCompany, scheduleRoutes);

// Espace employe en lecture seule.
router.use('/employee-space', requireEmployeeAuth, loadEmployee, employeeSpaceRoutes);

module.exports = router;
