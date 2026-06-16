// Validation serveur des donnees d'un eleve.
// Email et telephone sont optionnels ; prenom et nom sont obligatoires.

const NAME_MAX = 100;
const PHONE_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // limite bcrypt (octets) : evite toute troncature silencieuse.

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Telephone permissif : chiffres, espaces et separateurs courants.
function isValidPhone(phone) {
  return /^[\d\s+().-]{6,20}$/.test(phone);
}

// Retourne { isValid, errors, value } avec une value normalisee.
// options.isCreate : true => le mot de passe est obligatoire.
function validateStudent(body, { isCreate } = { isCreate: false }) {
  const errors = {};

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const password = body.password || '';

  if (!firstName) errors.firstName = 'Le prénom est obligatoire.';
  else if (firstName.length > NAME_MAX) errors.firstName = `Le prénom ne doit pas dépasser ${NAME_MAX} caractères.`;

  if (!lastName) errors.lastName = 'Le nom est obligatoire.';
  else if (lastName.length > NAME_MAX) errors.lastName = `Le nom ne doit pas dépasser ${NAME_MAX} caractères.`;

  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "L'email n'est pas valide.";
  }

  // Mot de passe : requis a la creation, optionnel a l'edition.
  if (isCreate || password) {
    if (!password) {
      errors.password = 'Le mot de passe est obligatoire.';
    } else if (password.length < PASSWORD_MIN) {
      errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caracteres.`;
    } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
      errors.password = `Le mot de passe ne doit pas depasser ${PASSWORD_MAX} caracteres.`;
    }
  }

  // Telephone optionnel.
  if (phone && (phone.length > PHONE_MAX || !isValidPhone(phone))) {
    errors.phone = 'Le téléphone n\'est pas valide.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      password,
    },
  };
}

module.exports = { validateStudent };
