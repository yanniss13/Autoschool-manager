// Routes d'authentification (publiques).
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const passwordResetController = require('../controllers/passwordResetController');
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

// Connexion unifiée employé / élève (email + mot de passe).
const espaceLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/espace-login', {
      title: 'Connexion',
      errors: { global: 'Trop de tentatives de connexion échouées. Réessayez dans 15 minutes.' },
      values: { email: req.body.email },
    });
  },
});

router.get('/register', redirectIfAuth, authController.showRegister);
router.post('/register', registerLimiter, redirectIfAuth, authController.register);

router.get('/login', redirectIfAuth, authController.showLogin);
router.post('/login', loginLimiter, redirectIfAuth, authController.login);

router.get('/espace-login', redirectIfAuth, authController.showEspaceLogin);
router.post('/espace-login', espaceLoginLimiter, redirectIfAuth, authController.espaceLogin);

// Anciennes URL conservées en redirection (liens/bookmarks existants).
// 302 (et non 301) : un 301 serait mis en cache definitivement par le navigateur,
// ce qui figerait ces chemins meme si on voulait les reutiliser plus tard.
router.get('/employee-login', (req, res) => res.redirect(302, '/espace-login'));
router.get('/student-login', (req, res) => res.redirect(302, '/espace-login'));

// Anti-abus : la demande de reset peut declencher un envoi d'email (cout + risque
// d'inondation d'une boite). On limite par IP. Le POST de reset (choix du nouveau
// mot de passe) est aussi limite pour gener le brute-force de jeton.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  limit: 10, // 10 demandes max par IP sur la fenetre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/forgot-password', {
      title: 'Mot de passe oublie',
      errors: { global: 'Trop de demandes. Réessayez plus tard.' },
      values: { email: req.body.email },
      notice: null,
    });
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/reset-password', {
      title: 'Nouveau mot de passe',
      errors: { global: 'Trop de tentatives. Réessayez plus tard.' },
      token: (req.body.token || '').trim(),
      expired: false,
    });
  },
});

router.get('/forgot-password', redirectIfAuth, passwordResetController.showForgot);
router.post('/forgot-password', forgotPasswordLimiter, redirectIfAuth, passwordResetController.forgot);

router.get('/reset-password', redirectIfAuth, passwordResetController.showReset);
router.post('/reset-password', resetPasswordLimiter, redirectIfAuth, passwordResetController.reset);

router.post('/logout', authController.logout);
router.post('/employee-logout', authController.employeeLogout);
router.post('/student-logout', authController.studentLogout);

module.exports = router;
