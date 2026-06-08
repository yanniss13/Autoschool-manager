// Hachage et verification des mots de passe via bcrypt.
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Retourne le hash d'un mot de passe en clair.
function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compare un mot de passe en clair avec un hash existant.
function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };
