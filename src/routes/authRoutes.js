// Routes d'authentification (publiques).
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const redirectIfAuth = require('../middlewares/redirectIfAuth');

const router = express.Router();

// Anti brute-force : limite les tentatives de connexion ECHOUEES par IP.
// skipSuccessfulRequests : les connexions reussies ne sont pas comptees, pour ne
// pas bloquer une IP partagee (NAT d'auto-ecole) ou plusieurs gerants legitimes
// se connectent dans la meme fenetre.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 tentatives echouees max par IP sur la fenetre
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      title: 'Connexion',
      errors: { global: 'Trop de tentatives de connexion échouées. Réessayez dans 15 minutes.' },
      values: { siret: req.body.siret },
    });
  },
});

// Anti-abus : limite la creation de comptes par IP (creation massive de comptes).
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  limit: 20, // 20 inscriptions max par IP sur la fenetre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/register', {
      title: 'Inscription',
      errors: { global: "Trop de tentatives d'inscription. Réessayez plus tard." },
      values: {
        businessName: req.body.businessName,
        siret: req.body.siret,
        directorName: req.body.directorName,
      },
    });
  },
});

const employeeLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/employee-login', {
      title: 'Connexion employe',
      errors: { global: 'Trop de tentatives de connexion echouees. Reessayez dans 15 minutes.' },
      values: { email: req.body.email },
    });
  },
});

router.get('/register', redirectIfAuth, authController.showRegister);
router.post('/register', registerLimiter, redirectIfAuth, authController.register);

router.get('/login', redirectIfAuth, authController.showLogin);
router.post('/login', loginLimiter, redirectIfAuth, authController.login);

router.get('/employee-login', redirectIfAuth, authController.showEmployeeLogin);
router.post('/employee-login', employeeLoginLimiter, redirectIfAuth, authController.employeeLogin);

router.post('/logout', authController.logout);
router.post('/employee-logout', authController.employeeLogout);

module.exports = router;
