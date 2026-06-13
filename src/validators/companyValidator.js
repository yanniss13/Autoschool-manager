// Validation serveur des donnees d'inscription et de connexion d'une auto-ecole.

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt ignore au-dela de 72 octets : on refuse explicitement.

// Normalise un SIRET : ne conserve que les chiffres.
function normalizeSiret(value) {
  return (value || '').replace(/\D/g, '');
}

// Valide les donnees du formulaire d'inscription.
// Retourne { isValid, errors, value } avec une value deja normalisee.
function validateRegister(body) {
  const errors = {};

  const businessName = (body.businessName || '').trim();
  const siret = normalizeSiret(body.siret);
  const directorName = (body.directorName || '').trim();
  const password = body.password || '';
  const passwordConfirm = body.passwordConfirm || '';

  if (!businessName) {
    errors.businessName = 'La raison sociale est obligatoire.';
  }

  if (!siret) {
    errors.siret = 'Le SIRET est obligatoire.';
  } else if (siret.length !== 14) {
    errors.siret = 'Le SIRET doit contenir 14 chiffres.';
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
  }

  if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      businessName,
      siret,
      directorName: directorName || null,
      password,
    },
  };
}

// Valide les donnees du formulaire de connexion.
function validateLogin(body) {
  const errors = {};

  const siret = normalizeSiret(body.siret);
  const password = body.password || '';

  if (!siret) {
    errors.siret = 'Le SIRET est obligatoire.';
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { siret, password },
  };
}

module.exports = { validateRegister, validateLogin, normalizeSiret };
