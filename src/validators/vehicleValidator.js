// Validation serveur des donnees d'un vehicule.

// Boites de vitesses acceptees (champ optionnel).
const TRANSMISSIONS = ['manual', 'automatic'];

// Plaque francaise SIV (compactee) : 2 lettres, 3 chiffres, 2 lettres.
function isValidPlate(compact) {
  return /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(compact);
}

// Retire separateurs/espaces et met en majuscules -> ex. "AB123CD".
function compactPlate(value) {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Valide les donnees d'un vehicule.
// Retourne { isValid, errors, value } avec une immatriculation normalisee AB-123-CD.
function validateVehicle(body) {
  const errors = {};

  const compact = compactPlate(body.registrationNumber);
  const brand = (body.brand || '').trim();
  const model = (body.model || '').trim();
  const yearRaw = (body.year != null ? String(body.year) : '').trim();
  const transmission = (body.transmission || '').trim();

  let registrationNumber = null;
  if (!compact) {
    errors.registrationNumber = "L'immatriculation est obligatoire.";
  } else if (!isValidPlate(compact)) {
    errors.registrationNumber = "L'immatriculation n'est pas valide (format attendu : AB-123-CD).";
  } else {
    registrationNumber = `${compact.slice(0, 2)}-${compact.slice(2, 5)}-${compact.slice(5, 7)}`;
  }

  if (!brand) errors.brand = 'La marque est obligatoire.';
  if (!model) errors.model = 'Le modèle est obligatoire.';

  // Annee optionnelle : entier strictement positif si fournie.
  let year = null;
  if (yearRaw !== '') {
    const n = Number(yearRaw);
    if (!Number.isInteger(n) || n <= 0) {
      errors.year = "L'année doit être un entier positif.";
    } else {
      year = n;
    }
  }

  // Boite optionnelle : restreinte a la liste controlee.
  let transmissionValue = null;
  if (transmission) {
    if (!TRANSMISSIONS.includes(transmission)) {
      errors.transmission = 'Boîte de vitesses invalide.';
    } else {
      transmissionValue = transmission;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { registrationNumber, brand, model, year, transmission: transmissionValue },
  };
}

module.exports = { validateVehicle, TRANSMISSIONS };
