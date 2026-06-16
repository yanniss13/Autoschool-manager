// Validation serveur du flux "mot de passe oublie".
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // limite bcrypt (octets) : evite toute troncature silencieuse.

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Etape 1 : demande de lien (email seul).
function validateForgotPassword(body) {
  const errors = {};
  const email = (body.email || '').trim().toLowerCase();

  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "L'email n'est pas valide.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { email },
  };
}

// Etape 2 : choix du nouveau mot de passe (jeton + mot de passe + confirmation).
function validateResetPassword(body) {
  const errors = {};
  const token = (body.token || '').trim();
  const password = body.password || '';
  const passwordConfirm = body.passwordConfirm || '';

  if (!token) {
    errors.global = 'Lien de réinitialisation invalide ou expiré.';
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { token, password },
  };
}

// Changement de mot de passe en self-service (espace eleve) : nouveau mot de passe
// + confirmation, sans jeton (l'eleve est deja authentifie).
function validatePasswordChange(body) {
  const errors = {};
  const password = body.password || '';
  const passwordConfirm = body.passwordConfirm || '';

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { password },
  };
}

module.exports = { validateForgotPassword, validateResetPassword, validatePasswordChange };
