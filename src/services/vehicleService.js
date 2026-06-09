// Acces aux donnees de l'entite Vehicle via Prisma.
// Toutes les methodes sont scopees par companyId (isolation multi-tenant).
const prisma = require('../config/prisma');

// Liste les vehicules d'une entreprise, avec l'employe referent eventuel.
function findAllByCompany(companyId) {
  return prisma.vehicle.findMany({
    where: { companyId },
    include: { employee: true },
    orderBy: { registrationNumber: 'asc' },
  });
}

// Recherche un vehicule par id, uniquement s'il appartient a l'entreprise.
function findOwnedById(companyId, id) {
  return prisma.vehicle.findFirst({
    where: { id, companyId },
    include: { employee: true },
  });
}

// Recherche un vehicule par immatriculation (unique globalement).
function findByRegistration(registrationNumber) {
  return prisma.vehicle.findUnique({ where: { registrationNumber } });
}

// Cree un vehicule pour une entreprise.
function createForCompany(companyId, data) {
  return prisma.vehicle.create({ data: { ...data, companyId } });
}

// Met a jour un vehicule (filtre par companyId).
function updateOwned(companyId, id, data) {
  return prisma.vehicle.updateMany({ where: { id, companyId }, data });
}

// Supprime un vehicule (filtre par companyId).
// La FK etant portee par Vehicle, supprimer le vehicule libere automatiquement
// l'employe qui en etait referent (l'employe n'est pas supprime).
function deleteOwned(companyId, id) {
  return prisma.vehicle.deleteMany({ where: { id, companyId } });
}

// Employes de l'entreprise qui ne sont referents d'aucun vehicule (donc affectables).
function findAssignableEmployees(companyId) {
  return prisma.employee.findMany({
    where: { companyId, vehicle: { is: null } },
    orderBy: { lastName: 'asc' },
  });
}

// Compte total des vehicules d'une entreprise.
function countByCompany(companyId) {
  return prisma.vehicle.count({ where: { companyId } });
}

// Compte des vehicules affectes d'une entreprise.
function countAssignedByCompany(companyId) {
  return prisma.vehicle.count({ where: { companyId, employeeId: { not: null } } });
}

// Affecte un employe a un vehicule, dans une transaction pour garantir la
// coherence (verifications + ecriture appliquees ensemble).
// Retourne { ok: true } ou { ok: false, reason }.
async function assignEmployee(companyId, vehicleId, employeeId) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({ where: { id: vehicleId, companyId } });
    if (!vehicle) return { ok: false, reason: 'vehicle_not_found' };
    if (vehicle.employeeId) return { ok: false, reason: 'vehicle_occupied' };

    const employee = await tx.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { vehicle: true },
    });
    if (!employee) return { ok: false, reason: 'employee_not_found' };
    if (employee.vehicle) return { ok: false, reason: 'employee_busy' };

    await tx.vehicle.update({ where: { id: vehicleId }, data: { employeeId } });
    return { ok: true };
  });
}

// Desaffecte un vehicule : remet employeeId a null (scope par companyId).
function unassignEmployee(companyId, vehicleId) {
  return prisma.vehicle.updateMany({
    where: { id: vehicleId, companyId },
    data: { employeeId: null },
  });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByRegistration,
  createForCompany,
  updateOwned,
  deleteOwned,
  findAssignableEmployees,
  countByCompany,
  countAssignedByCompany,
  assignEmployee,
  unassignEmployee,
};
