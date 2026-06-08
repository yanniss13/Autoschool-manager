// Acces aux donnees de l'entite Company via Prisma.
const prisma = require('../config/prisma');

// Cree une nouvelle auto-ecole (le mot de passe est deja hashe).
function createCompany({ businessName, siret, directorName, passwordHash }) {
  return prisma.company.create({
    data: { businessName, siret, directorName, passwordHash },
  });
}

// Recherche une auto-ecole par son SIRET (unique).
function findBySiret(siret) {
  return prisma.company.findUnique({ where: { siret } });
}

// Recherche une auto-ecole par son identifiant.
function findById(id) {
  return prisma.company.findUnique({ where: { id } });
}

module.exports = { createCompany, findBySiret, findById };
