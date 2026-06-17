// Controleur du flux "mot de passe oublie", commun aux employes ET aux eleves
// (routes publiques). Le role est auto-detecte par l'email (forgot) ou par le
// jeton (reset), en cherchant cote employe d'abord puis cote eleve.
//
// Securite :
// - reponse generique a la demande (ne revele pas si l'email existe -> anti-enumeration) ;
// - jeton aleatoire fort (32 octets) envoye par email ; seule sa version HACHEE
//   (SHA-256) est stockee en base, avec une expiration courte (1 h), usage unique.
const crypto = require('crypto');
const employeeService = require('../services/employeeService');
const studentService = require('../services/studentService');
const mailer = require('../services/mailer');
const passwordUtil = require('../utils/password');
const {
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/passwordResetValidator');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure
const GENERIC_NOTICE =
  'Si un compte correspond à cet email, un lien de réinitialisation vient de lui être envoyé.';

// Hash du jeton (le jeton brut ne vit que dans l'email/le lien).
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Trouve le titulaire d'un email (employe d'abord, puis eleve) et renvoie le
// service associe pour la suite du flux. null si aucun compte.
async function findOwnerByEmail(email) {
  const employee = await employeeService.findByEmail(email);
  if (employee) return { service: employeeService, user: employee };
  const student = await studentService.findByEmail(email);
  if (student) return { service: studentService, user: student };
  return null;
}

// Idem mais a partir du hash d'un jeton de reset (valide et non expire).
async function findOwnerByTokenHash(tokenHash) {
  const employee = await employeeService.findByResetTokenHash(tokenHash);
  if (employee) return { service: employeeService, user: employee };
  const student = await studentService.findByResetTokenHash(tokenHash);
  if (student) return { service: studentService, user: student };
  return null;
}

// GET /forgot-password
function showForgot(req, res) {
  res.render('auth/forgot-password', {
    title: 'Mot de passe oublie',
    errors: {},
    values: {},
    notice: null,
  });
}

// POST /forgot-password
async function forgot(req, res, next) {
  try {
    const { isValid, errors, value } = validateForgotPassword(req.body);
    if (!isValid) {
      return res.status(400).render('auth/forgot-password', {
        title: 'Mot de passe oublie',
        errors,
        values: { email: req.body.email },
        notice: null,
      });
    }

    const owner = await findOwnerByEmail(value.email);
    // On n'envoie un email que si un compte existe ; dans tous les cas la reponse
    // est la meme (anti-enumeration de comptes).
    if (owner) {
      const token = crypto.randomBytes(32).toString('hex');
      await owner.service.setResetToken(
        owner.user.id,
        hashToken(token),
        new Date(Date.now() + TOKEN_TTL_MS)
      );
      await mailer.sendPasswordReset({
        to: owner.user.email,
        firstName: owner.user.firstName,
        token,
      });
    }

    res.render('auth/forgot-password', {
      title: 'Mot de passe oublie',
      errors: {},
      values: {},
      notice: GENERIC_NOTICE,
    });
  } catch (err) {
    next(err);
  }
}

// GET /reset-password?token=...
async function showReset(req, res, next) {
  try {
    const token = (req.query.token || '').trim();
    const owner = token ? await findOwnerByTokenHash(hashToken(token)) : null;

    if (!owner) {
      return res.status(400).render('auth/reset-password', {
        title: 'Nouveau mot de passe',
        errors: { global: 'Ce lien de réinitialisation est invalide ou a expiré.' },
        token: '',
        expired: true,
      });
    }

    res.render('auth/reset-password', {
      title: 'Nouveau mot de passe',
      errors: {},
      token,
      expired: false,
    });
  } catch (err) {
    next(err);
  }
}

// POST /reset-password
async function reset(req, res, next) {
  try {
    const { isValid, errors, value } = validateResetPassword(req.body);
    if (!isValid) {
      return res.status(400).render('auth/reset-password', {
        title: 'Nouveau mot de passe',
        errors,
        token: (req.body.token || '').trim(),
        expired: false,
      });
    }

    const owner = await findOwnerByTokenHash(hashToken(value.token));
    if (!owner) {
      return res.status(400).render('auth/reset-password', {
        title: 'Nouveau mot de passe',
        errors: { global: 'Ce lien de réinitialisation est invalide ou a expiré.' },
        token: '',
        expired: true,
      });
    }

    const passwordHash = await passwordUtil.hash(value.password);
    await owner.service.applyPasswordReset(owner.user.id, passwordHash);

    req.flash('success', 'Mot de passe mis à jour. Vous pouvez vous connecter.');
    res.redirect('/espace-login');
  } catch (err) {
    next(err);
  }
}

module.exports = { showForgot, forgot, showReset, reset };
