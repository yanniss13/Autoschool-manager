// Agrege tous les routeurs de l'application et applique la protection de session
// sur les routes internes.
const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const employeeRoutes = require('./employeeRoutes');
const computerRoutes = require('./computerRoutes');
const requireAuth = require('../middlewares/requireAuth');
const loadCompany = require('../middlewares/loadCompany');

const router = express.Router();

// Routes publiques (inscription / connexion / deconnexion).
router.use('/', authRoutes);

// Routes protegees : session obligatoire + entreprise courante chargee.
router.use('/dashboard', requireAuth, loadCompany, dashboardRoutes);
router.use('/employees', requireAuth, loadCompany, employeeRoutes);
router.use('/computers', requireAuth, loadCompany, computerRoutes);

module.exports = router;
