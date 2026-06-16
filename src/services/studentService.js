// Acces aux donnees de l'entite Student via Prisma.
// Toutes les methodes sont scopees par companyId pour garantir l'isolation
// entre auto-ecoles (multi-tenant).
const prisma = require('../config/prisma');

// Liste les eleves d'une entreprise.
function findAllByCompany(companyId) {
  return prisma.student.findMany({
    where: { companyId },
    orderBy: { lastName: 'asc' },
  });
}

// Recherche un eleve par id, uniquement s'il appartient a l'entreprise.
function findOwnedById(companyId, id) {
  return prisma.student.findFirst({ where: { id, companyId } });
}

// Recherche un eleve par email globalement unique (connexion eleve).
function findByEmail(email) {
  return prisma.student.findUnique({
    where: { email },
    include: { company: true },
  });
}

// Charge un eleve connecte avec son entreprise.
function findByIdWithAccess(id) {
  return prisma.student.findUnique({
    where: { id },
    include: { company: true },
  });
}

// Cree un eleve pour une entreprise.
function createForCompany(companyId, data) {
  return prisma.student.create({ data: { ...data, companyId } });
}

// Met a jour un eleve (filtre par companyId : aucune fuite inter-entreprises).
function updateOwned(companyId, id, data) {
  return prisma.student.updateMany({ where: { id, companyId }, data });
}

// Supprime un eleve (filtre par companyId).
function deleteOwned(companyId, id) {
  return prisma.student.deleteMany({ where: { id, companyId } });
}

// Compte total des eleves d'une entreprise.
function countByCompany(companyId) {
  return prisma.student.count({ where: { companyId } });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByEmail,
  findByIdWithAccess,
  createForCompany,
  updateOwned,
  deleteOwned,
  countByCompany,
};
