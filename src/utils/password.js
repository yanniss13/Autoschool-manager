// Hachage et verification des mots de passe via bcrypt.
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

// Genere un mot de passe temporaire (12 caracteres hexadecimaux) pour le renvoi
// des identifiants : l'eleve devra le changer a sa prochaine connexion.
function generateTemporary() {
  return crypto.randomBytes(6).toString('hex');
}

// Retourne le hash d'un mot de passe en clair.
function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compare un mot de passe en clair avec un hash existant.
function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare, generateTemporary };
