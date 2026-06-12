// Routes d'authentification (publiques).
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const redirectIfAuth = require('../middlewares/redirectIfAuth');

const router = express.Router();

// Anti brute-force : limite les tentatives de connexion par IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 tentatives max par IP sur la fenetre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      title: 'Connexion',
      errors: { global: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
      values: { siret: req.body.siret },
    });
  },
});

router.get('/register', redirectIfAuth, authController.showRegister);
router.post('/register', redirectIfAuth, authController.register);

router.get('/login', redirectIfAuth, authController.showLogin);
router.post('/login', loginLimiter, redirectIfAuth, authController.login);

router.post('/logout', authController.logout);

module.exports = router;
