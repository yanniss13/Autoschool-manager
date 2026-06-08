// Validation serveur des donnees d'un employe.

// Liste controlee des genres acceptes (le champ reste optionnel).
const GENDERS = ['homme', 'femme', 'autre'];

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

  // Mot de passe : requis a la creation, optionnel a l'edition.
  if (isCreate) {
    if (!password) {
      errors.password = 'Le mot de passe est obligatoire.';
    } else if (password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
  } else if (password && password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
  }

  // Age optionnel : entier strictement positif si fourni.
  let age = null;
  if (ageRaw !== '') {
    const n = Number(ageRaw);
    if (!Number.isInteger(n) || n <= 0) {
      errors.age = "L'âge doit être un entier positif.";
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
