// Validation serveur des donnees d'un ordinateur (poste informatique).

// Accepte une MAC en 12 caracteres hexa, avec ou sans separateurs ':' ou '-'.
function isValidMacRaw(value) {
  return (
    /^[0-9a-fA-F]{12}$/.test(value) ||
    /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/.test(value)
  );
}

// Normalise une MAC vers le format canonique AA:BB:CC:DD:EE:FF.
function normalizeMac(value) {
  return value
    .replace(/[:-]/g, '')
    .toUpperCase()
    .match(/.{2}/g)
    .join(':');
}

// Valide les donnees d'un ordinateur.
// Retourne { isValid, errors, value } avec une MAC normalisee.
function validateComputer(body) {
  const errors = {};
  const macRaw = (body.macAddress || '').trim();
  let macAddress = null;

  if (!macRaw) {
    errors.macAddress = "L'adresse MAC est obligatoire.";
  } else if (!isValidMacRaw(macRaw)) {
    errors.macAddress = "L'adresse MAC n'est pas valide (format attendu : AA:BB:CC:DD:EE:FF).";
  } else {
    macAddress = normalizeMac(macRaw);
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { macAddress },
  };
}

module.exports = { validateComputer, normalizeMac };
