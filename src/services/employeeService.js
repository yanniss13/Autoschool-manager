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

// Recherche un employe par email globalement unique (connexion employe).
function findByEmail(email) {
  return prisma.employee.findUnique({
    where: { email },
    include: { company: true },
  });
}

// Charge un employe connecte avec son entreprise et son vehicule affecte.
function findByIdWithAccess(id) {
  return prisma.employee.findUnique({
    where: { id },
    include: { company: true, vehicle: true },
  });
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

// --- Reinitialisation de mot de passe (flux commun employe/eleve) ---

// Enregistre le hash d'un jeton de reset et son expiration.
function setResetToken(id, resetTokenHash, resetTokenExpiresAt) {
  return prisma.employee.update({
    where: { id },
    data: { resetTokenHash, resetTokenExpiresAt },
  });
}

// Recherche un employe par hash de jeton, uniquement si le jeton n'est pas expire.
function findByResetTokenHash(resetTokenHash) {
  return prisma.employee.findFirst({
    where: { resetTokenHash, resetTokenExpiresAt: { gt: new Date() } },
  });
}

// Applique un nouveau mot de passe et invalide le jeton (usage unique).
function applyPasswordReset(id, passwordHash) {
  return prisma.employee.update({
    where: { id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByEmailInCompany,
  findByEmail,
  findByIdWithAccess,
  createForCompany,
  updateOwned,
  deleteOwned,
  countByCompany,
  setResetToken,
  findByResetTokenHash,
  applyPasswordReset,
};
