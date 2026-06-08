// Controleur d'authentification : inscription, connexion, deconnexion.
const companyService = require('../services/companyService');
const { validateRegister, validateLogin } = require('../validators/companyValidator');
const password = require('../utils/password');

// GET /register
function showRegister(req, res) {
  res.render('auth/register', { title: 'Inscription', errors: {}, values: {} });
}

// POST /register
async function register(req, res, next) {
  try {
    const { isValid, errors, value } = validateRegister(req.body);

    if (!isValid) {
      return res.status(400).render('auth/register', {
        title: 'Inscription',
        errors,
        values: {
          businessName: req.body.businessName,
          siret: req.body.siret,
          directorName: req.body.directorName,
        },
      });
    }

    // Verification applicative de l'unicite du SIRET (en plus de la contrainte base).
    const existing = await companyService.findBySiret(value.siret);
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Inscription',
        errors: { siret: 'Ce SIRET est déjà enregistré.' },
        values: {
          businessName: value.businessName,
          siret: value.siret,
          directorName: value.directorName,
        },
      });
    }

    const passwordHash = await password.hash(value.password);
    await companyService.createCompany({
      businessName: value.businessName,
      siret: value.siret,
      directorName: value.directorName,
      passwordHash,
    });

    req.flash('success', 'Inscription réussie. Vous pouvez vous connecter.');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
}

// GET /login
function showLogin(req, res) {
  res.render('auth/login', { title: 'Connexion', errors: {}, values: {} });
}

// POST /login
async function login(req, res, next) {
  try {
    const { isValid, errors, value } = validateLogin(req.body);

    if (!isValid) {
      return res.status(400).render('auth/login', {
        title: 'Connexion',
        errors,
        values: { siret: req.body.siret },
      });
    }

    const company = await companyService.findBySiret(value.siret);
    const passwordOk =
      company && (await password.compare(value.password, company.passwordHash));

    // Message generique pour ne pas distinguer SIRET inconnu / mauvais mot de passe.
    if (!company || !passwordOk) {
      return res.status(401).render('auth/login', {
        title: 'Connexion',
        errors: { global: 'Identifiants invalides' },
        values: { siret: req.body.siret },
      });
    }

    // On ne stocke que l'identifiant de la company connectee en session.
    req.session.companyId = company.id;
    req.flash('success', 'Connexion réussie.');
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

// POST /logout
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { showRegister, register, showLogin, login, logout };
