// Acces aux donnees de l'entite Employee via Prisma.
// Toutes les methodes sont scopees par companyId pour garantir l'isolation
// entre auto-ecoles (multi-tenant).
const prisma = require('../config/prisma');

// Liste les employes d'une entreprise.
function findAllByCompany(companyId) {
  return prisma.employee.findMany({
    where: { companyId },
    orderBy: { lastName: 'asc' },
  });
}

// Recherche un employe par id, uniquement s'il appartient a l'entreprise.
function findOwnedById(companyId, id) {
  return prisma.employee.findFirst({ where: { id, companyId } });
}

// Recherche un employe par email au sein d'une entreprise (controle d'unicite).
function findByEmailInCompany(companyId, email) {
  return prisma.employee.findFirst({ where: { companyId, email } });
}

// Cree un employe pour une entreprise.
function createForCompany(companyId, data) {
  return prisma.employee.create({ data: { ...data, companyId } });
}

// Met a jour un employe (filtre par companyId : aucune fuite inter-entreprises).
function updateOwned(companyId, id, data) {
  return prisma.employee.updateMany({ where: { id, companyId }, data });
}

// Supprime un employe (filtre par companyId).
function deleteOwned(companyId, id) {
  return prisma.employee.deleteMany({ where: { id, companyId } });
}

// Compte total des employes d'une entreprise.
function countByCompany(companyId) {
  return prisma.employee.count({ where: { companyId } });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByEmailInCompany,
  createForCompany,
  updateOwned,
  deleteOwned,
  countByCompany,
};
