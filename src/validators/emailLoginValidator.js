// Validation de la connexion par email + mot de passe (employé OU élève).
// Page de connexion unifiée : le rôle est ensuite déterminé côté serveur par
// recherche de l'email (employé d'abord, puis élève).
const PASSWORD_MAX = 72; // limite bcrypt (octets).

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmailLogin(body) {
  const errors = {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "L'email n'est pas valide.";
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { email, password },
  };
}

module.exports = { validateEmailLogin };
