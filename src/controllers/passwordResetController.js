// Controleur du flux "mot de passe oublie" pour les eleves (routes publiques).
//
// Securite :
// - reponse generique a la demande (ne revele pas si l'email existe -> anti-enumeration) ;
// - jeton aleatoire fort (32 octets) envoye par email ; seule sa version HACHEE
//   (SHA-256) est stockee en base, avec une expiration courte (1 h), usage unique.
const crypto = require('crypto');
const studentService = require('../services/studentService');
const mailer = require('../services/mailer');
const passwordUtil = require('../utils/password');
const {
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/passwordResetValidator');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure
const GENERIC_NOTICE =
  'Si un compte élève correspond à cet email, un lien de réinitialisation vient de lui être envoyé.';

// Hash du jeton (le jeton brut ne vit que dans l'email/le lien).
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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

    const student = await studentService.findByEmail(value.email);
    // On n'envoie un email que si l'eleve existe ; dans tous les cas la reponse
    // est la meme (anti-enumeration de comptes).
    if (student) {
      const token = crypto.randomBytes(32).toString('hex');
      await studentService.setResetToken(
        student.id,
        hashToken(token),
        new Date(Date.now() + TOKEN_TTL_MS)
      );
      await mailer.sendPasswordReset({
        to: student.email,
        firstName: student.firstName,
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
    const student = token
      ? await studentService.findByResetTokenHash(hashToken(token))
      : null;

    if (!student) {
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

    const student = await studentService.findByResetTokenHash(hashToken(value.token));
    if (!student) {
      return res.status(400).render('auth/reset-password', {
        title: 'Nouveau mot de passe',
        errors: { global: 'Ce lien de réinitialisation est invalide ou a expiré.' },
        token: '',
        expired: true,
      });
    }

    const passwordHash = await passwordUtil.hash(value.password);
    await studentService.applyPasswordReset(student.id, passwordHash);

    req.flash('success', 'Mot de passe mis à jour. Vous pouvez vous connecter.');
    res.redirect('/student-login');
  } catch (err) {
    next(err);
  }
}

module.exports = { showForgot, forgot, showReset, reset };
