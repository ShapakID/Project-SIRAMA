const prisma = require('../db');

async function getProjectors() {
  const projectors = await prisma.projector.findMany({
    orderBy: { code: 'asc' }
  });
  return projectors;
}

async function borrowProjector({ projectorCode, reservationId, borrowerName, borrowerNim }) {
  if (!reservationId) {
    const err = new Error('Borrowing a projector requires an active room reservation');
    err.status = 400;
    throw err;
  }

  // Verify reservation exists
  const reservation = await prisma.practicumReservation.findUnique({
    where: { id: reservationId }
  });

  if (!reservation) {
    const err = new Error('Reservation not found');
    err.status = 404;
    throw err;
  }

  // Check projector status
  const projector = await prisma.projector.findUnique({
    where: { code: projectorCode }
  });

  if (!projector) {
    const err = new Error(`Projector unit ${projectorCode} not found`);
    err.status = 404;
    throw err;
  }

  if (projector.status !== 'AVAILABLE') {
    const err = new Error(`Projector unit ${projectorCode} is currently ${projector.status}`);
    err.status = 400;
    throw err;
  }

  // Create loan and update projector status
  const loan = await prisma.projectorLoan.create({
    data: {
      projectorCode,
      roomCode: reservation.roomCode,
      reservationId,
      borrowerName,
      borrowerNim: borrowerNim || reservation.pjNim,
      status: 'BORROWED'
    }
  });

  await prisma.projector.update({
    where: { code: projectorCode },
    data: { status: 'IN_USE' }
  });

  return loan;
}

async function returnProjector(loanId, conditionNotes) {
  const loan = await prisma.projectorLoan.findUnique({
    where: { id: loanId }
  });

  if (!loan) {
    const err = new Error('Loan record not found');
    err.status = 404;
    throw err;
  }

  const updatedLoan = await prisma.projectorLoan.update({
    where: { id: loanId },
    data: {
      status: 'RETURNED',
      returnedAt: new Date(),
      returnNotes: conditionNotes || null
    }
  });

  // Check if damaged
  const isDamaged = conditionNotes && conditionNotes.toLowerCase().includes('rusak');
  await prisma.projector.update({
    where: { code: loan.projectorCode },
    data: { status: isDamaged ? 'BROKEN' : 'AVAILABLE' }
  });

  return updatedLoan;
}

async function getLoans(status) {
  const where = {};
  if (status) where.status = status;
  return await prisma.projectorLoan.findMany({
    where,
    orderBy: { borrowedAt: 'desc' }
  });
}

module.exports = {
  getProjectors,
  borrowProjector,
  returnProjector,
  getLoans
};
