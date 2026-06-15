// Acces aux creneaux de planning.
// Les methodes gerant sont scopees par companyId pour conserver l'isolation.
const prisma = require('../config/prisma');

const slotInclude = {
  employee: {
    include: { vehicle: true },
  },
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

module.exports = {
  findAllByCompany,
  findOwnedById,
  createForCompany,
  updateOwned,
  deleteOwned,
  findAllForEmployee,
};
