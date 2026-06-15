// Acces aux creneaux de planning.
// Les methodes gerant sont scopees par companyId pour conserver l'isolation.
const prisma = require('../config/prisma');

const slotInclude = {
  employee: {
    include: { vehicle: true },
  },
  student: true,
};

function findAllByCompany(companyId) {
  return prisma.scheduleSlot.findMany({
    where: { companyId },
    include: slotInclude,
    orderBy: { startsAt: 'asc' },
  });
}

function findOwnedById(companyId, id) {
  return prisma.scheduleSlot.findFirst({
    where: { id, companyId },
    include: slotInclude,
  });
}

// Creneaux chevauchant [rangeStart, rangeEnd) : commencent avant la fin de fenetre
// ET finissent apres le debut de fenetre. Scope companyId pour l'isolation.
function findByCompanyBetween(companyId, rangeStart, rangeEnd) {
  return prisma.scheduleSlot.findMany({
    where: {
      companyId,
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
    include: slotInclude,
    orderBy: { startsAt: 'asc' },
  });
}

function createForCompany(companyId, data) {
  return prisma.scheduleSlot.create({
    data: { ...data, companyId },
  });
}

function updateOwned(companyId, id, data) {
  return prisma.scheduleSlot.updateMany({
    where: { id, companyId },
    data,
  });
}

function deleteOwned(companyId, id) {
  return prisma.scheduleSlot.deleteMany({
    where: { id, companyId },
  });
}

function findAllForEmployee(employeeId) {
  return prisma.scheduleSlot.findMany({
    where: { employeeId },
    orderBy: { startsAt: 'asc' },
  });
}

// Creneaux d'un employe chevauchant la fenetre [rangeStart, rangeEnd).
function findByEmployeeBetween(employeeId, rangeStart, rangeEnd) {
  return prisma.scheduleSlot.findMany({
    where: {
      employeeId,
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
    include: { student: true },
    orderBy: { startsAt: 'asc' },
  });
}

module.exports = {
  findAllByCompany,
  findOwnedById,
  findByCompanyBetween,
  createForCompany,
  updateOwned,
  deleteOwned,
  findAllForEmployee,
  findByEmployeeBetween,
};
