// Validation serveur des donnees d'un employe.

// Liste controlee des genres acceptes (le champ reste optionnel).
const GENDERS = ['homme', 'femme', 'autre'];

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // limite bcrypt (octets) : evite toute troncature silencieuse.
const AGE_MIN = 14;
const AGE_MAX = 120;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Valide les donnees d'un employe.
// options.isCreate : true => le mot de passe est obligatoire.
// Retourne { isValid, errors, value } avec une value normalisee.
function validateEmployee(body, { isCreate }) {
  const errors = {};

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const ageRaw = (body.age != null ? String(body.age) : '').trim();
  const gender = (body.gender || '').trim();

  if (!firstName) errors.firstName = 'Le prénom est obligatoire.';
  if (!lastName) errors.lastName = 'Le nom est obligatoire.';

  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "L'email n'est pas valide.";
  }

  // Mot de passe : requis a la creation, optionnel a l'edition. Borne haute = limite
  // bcrypt (72 octets) pour eviter toute troncature silencieuse.
  if (isCreate || password) {
    if (!password) {
      errors.password = 'Le mot de passe est obligatoire.';
    } else if (password.length < PASSWORD_MIN) {
      errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
    } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
      errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
    }
  }

  // Age optionnel : entier dans une plage plausible si fourni.
  let age = null;
  if (ageRaw !== '') {
    const n = Number(ageRaw);
    if (!Number.isInteger(n) || n < AGE_MIN || n > AGE_MAX) {
      errors.age = `L'âge doit être un entier compris entre ${AGE_MIN} et ${AGE_MAX}.`;
    } else {
      age = n;
    }
  }

  // Genre optionnel : restreint a la liste controlee.
  let genderValue = null;
  if (gender) {
    if (!GENDERS.includes(gender)) {
      errors.gender = 'Genre invalide.';
    } else {
      genderValue = gender;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { firstName, lastName, email, password, age, gender: genderValue },
  };
}

module.exports = { validateEmployee, GENDERS };
