// Validation serveur des donnees d'un eleve.
// Email et telephone sont optionnels ; prenom et nom sont obligatoires.

const NAME_MAX = 100;
const PHONE_MAX = 20;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Telephone permissif : chiffres, espaces et separateurs courants.
function isValidPhone(phone) {
  return /^[\d\s+().-]{6,20}$/.test(phone);
}

// Retourne { isValid, errors, value } avec une value normalisee.
function validateStudent(body) {
  const errors = {};

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();

  if (!firstName) errors.firstName = 'Le prénom est obligatoire.';
  else if (firstName.length > NAME_MAX) errors.firstName = `Le prénom ne doit pas dépasser ${NAME_MAX} caractères.`;

  if (!lastName) errors.lastName = 'Le nom est obligatoire.';
  else if (lastName.length > NAME_MAX) errors.lastName = `Le nom ne doit pas dépasser ${NAME_MAX} caractères.`;

  // Email optionnel : valide le format seulement s'il est fourni.
  if (email && !isValidEmail(email)) {
    errors.email = "L'email n'est pas valide.";
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
      email: email || null,
      phone: phone || null,
    },
  };
}

module.exports = { validateStudent };
