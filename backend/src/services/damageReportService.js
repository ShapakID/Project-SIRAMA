const prisma = require('../db');

async function submitDamageReport({ targetType, targetCode, reporterName, description }) {
  if (!targetType || !targetCode || !description) {
    const err = new Error('targetType, targetCode, and description are required');
    err.status = 400;
    throw err;
  }

  const validTypes = ['ROOM', 'PROJECTOR', 'GENERAL_FACILITY'];
  if (!validTypes.includes(targetType)) {
    const err = new Error(`targetType must be one of ${validTypes.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return await prisma.damageReport.create({
    data: {
      targetType,
      targetCode,
      reporterName: reporterName || 'Anonymous',
      description,
      status: 'PENDING'
    }
  });
}

async function updateReportStatus(reportId, newStatus) {
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
  if (!validStatuses.includes(newStatus)) {
    const err = new Error(`newStatus must be one of ${validStatuses.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return await prisma.damageReport.update({
    where: { id: reportId },
    data: { status: newStatus }
  });
}

async function getDamageReports(filter = {}) {
  const where = {};
  if (filter.status) where.status = filter.status;
  if (filter.targetType) where.targetType = filter.targetType;

  return await prisma.damageReport.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = {
  submitDamageReport,
  updateReportStatus,
  getDamageReports
};
