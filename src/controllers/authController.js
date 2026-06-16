// Controleur d'authentification : inscription, connexion, deconnexion.
const companyService = require('../services/companyService');
const employeeService = require('../services/employeeService');
const studentService = require('../services/studentService');
const { validateRegister, validateLogin } = require('../validators/companyValidator');
const { validateEmployeeLogin } = require('../validators/employeeAuthValidator');
const { validateStudentLogin } = require('../validators/studentAuthValidator');
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

    // Anti session-fixation : on regenere l'ID de session a la connexion, pour
    // qu'un identifiant de session pose AVANT l'authentification (ex. fixe par un
    // attaquant) ne reste pas valable une fois la company connectee.
    req.session.regenerate((err) => {
      if (err) return next(err);
      // On ne stocke que l'identifiant de la company connectee en session.
      req.session.authRole = 'company';
      req.session.companyId = company.id;
      req.session.employeeId = null;
      req.session.studentId = null;
      req.flash('success', 'Connexion réussie.');
      res.redirect('/dashboard');
    });
  } catch (err) {
    next(err);
  }
}

// GET /employee-login
function showEmployeeLogin(req, res) {
  res.render('auth/employee-login', {
    title: 'Connexion employe',
    errors: {},
    values: {},
  });
}

// GET /student-login
function showStudentLogin(req, res) {
  res.render('auth/student-login', {
    title: 'Connexion eleve',
    errors: {},
    values: {},
  });
}

// POST /employee-login
async function employeeLogin(req, res, next) {
  try {
    const { isValid, errors, value } = validateEmployeeLogin(req.body);

    if (!isValid) {
      return res.status(400).render('auth/employee-login', {
        title: 'Connexion employe',
        errors,
        values: { email: req.body.email },
      });
    }

    const employee = await employeeService.findByEmail(value.email);
    const passwordOk =
      employee && (await password.compare(value.password, employee.passwordHash));

    if (!employee || !passwordOk) {
      return res.status(401).render('auth/employee-login', {
        title: 'Connexion employe',
        errors: { global: 'Identifiants invalides' },
        values: { email: req.body.email },
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.authRole = 'employee';
      req.session.employeeId = employee.id;
      req.session.companyId = null;
      req.session.studentId = null;
      req.flash('success', 'Connexion employe reussie.');
      res.redirect('/employee-space');
    });
  } catch (err) {
    next(err);
  }
}

// POST /student-login
async function studentLogin(req, res, next) {
  try {
    const { isValid, errors, value } = validateStudentLogin(req.body);

    if (!isValid) {
      return res.status(400).render('auth/student-login', {
        title: 'Connexion eleve',
        errors,
        values: { email: req.body.email },
      });
    }

    const student = await studentService.findByEmail(value.email);
    const passwordOk =
      student && student.passwordHash && (await password.compare(value.password, student.passwordHash));

    if (!student || !passwordOk) {
      return res.status(401).render('auth/student-login', {
        title: 'Connexion eleve',
        errors: { global: 'Identifiants invalides' },
        values: { email: req.body.email },
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.authRole = 'student';
      req.session.studentId = student.id;
      req.session.employeeId = null;
      req.session.companyId = null;
      req.flash('success', 'Connexion eleve reussie.');
      res.redirect('/student-space');
    });
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

// POST /employee-logout
function employeeLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/employee-login');
  });
}

// POST /student-logout
function studentLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/student-login');
  });
}

module.exports = {
  showRegister,
  register,
  showLogin,
  login,
  showEmployeeLogin,
  employeeLogin,
  showStudentLogin,
  studentLogin,
  logout,
  employeeLogout,
  studentLogout,
};
