// Instance unique du client Prisma, partagee dans toute l'application.
// On evite ainsi d'ouvrir plusieurs connexions a la base de donnees.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
