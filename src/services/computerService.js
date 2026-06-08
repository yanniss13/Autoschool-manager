// Acces aux donnees de l'entite Computer via Prisma.
// Toutes les methodes sont scopees par companyId (isolation multi-tenant).
const prisma = require('../config/prisma');

// Liste les ordinateurs d'une entreprise, avec l'employe affecte eventuel.
function findAllByCompany(companyId) {
  return prisma.computer.findMany({
    where: { companyId },
    include: { employee: true },
    orderBy: { macAddress: 'asc' },
  });
}

// Recherche un ordinateur par id, uniquement s'il appartient a l'entreprise.
function findOwnedById(companyId, id) {
  return prisma.computer.findFirst({
    where: { id, companyId },
    include: { employee: true },
  });
}

// Recherche un ordinateur par adresse MAC (unique globalement).
function findByMac(macAddress) {
  return prisma.computer.findUnique({ where: { macAddress } });
}

// Cree un ordinateur pour une entreprise.
function createForCompany(companyId, data) {
  return prisma.computer.create({ data: { ...data, companyId } });
}

// Met a jour un ordinateur (filtre par companyId).
function updateOwned(companyId, id, data) {
  return prisma.computer.updateMany({ where: { id, companyId }, data });
}

// Supprime un ordinateur (filtre par companyId).
// La FK etant portee par Computer, supprimer le poste libere automatiquement
// l'employe qui y etait affecte (l'employe n'est pas supprime).
function deleteOwned(companyId, id) {
  return prisma.computer.deleteMany({ where: { id, companyId } });
}

// Employes de l'entreprise qui n'ont pas encore d'ordinateur (donc affectables).
function findAssignableEmployees(companyId) {
  return prisma.employee.findMany({
    where: { companyId, computer: { is: null } },
    orderBy: { lastName: 'asc' },
  });
}

// Compte total des ordinateurs d'une entreprise.
function countByCompany(companyId) {
  return prisma.computer.count({ where: { companyId } });
}

// Compte des ordinateurs affectes d'une entreprise.
function countAssignedByCompany(companyId) {
  return prisma.computer.count({ where: { companyId, employeeId: { not: null } } });
}

// Affecte un employe a un ordinateur, dans une transaction pour garantir la
// coherence (verifications + ecriture appliquees ensemble).
// Retourne { ok: true } ou { ok: false, reason }.
async function assignEmployee(companyId, computerId, employeeId) {
  return prisma.$transaction(async (tx) => {
    const computer = await tx.computer.findFirst({ where: { id: computerId, companyId } });
    if (!computer) return { ok: false, reason: 'computer_not_found' };
    if (computer.employeeId) return { ok: false, reason: 'computer_occupied' };

    const employee = await tx.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { computer: true },
    });
    if (!employee) return { ok: false, reason: 'employee_not_found' };
    if (employee.computer) return { ok: false, reason: 'employee_busy' };

    await tx.computer.update({ where: { id: computerId }, data: { employeeId } });
    return { ok: true };
  });
}

// Desaffecte un ordinateur : remet employeeId a null (scope par companyId).
function unassignEmployee(companyId, computerId) {
  return prisma.computer.updateMany({
    where: { id: computerId, companyId },
    data: { employeeId: null },
  });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByMac,
  createForCompany,
  updateOwned,
  deleteOwned,
  findAssignableEmployees,
  countByCompany,
  countAssignedByCompany,
  assignEmployee,
  unassignEmployee,
};
