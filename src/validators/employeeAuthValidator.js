// Validation du formulaire de connexion employe.

function validateEmployeeLogin(body) {
  const errors = {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email) errors.email = "L'email est obligatoire.";
  if (!password) errors.password = 'Le mot de passe est obligatoire.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: { email, password },
  };
}

module.exports = { validateEmployeeLogin };
