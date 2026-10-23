const prisma = require('../db');

async function getProjectors() {
  const projectors = await prisma.projector.findMany({
    orderBy: { code: 'asc' }
  });

  const enriched = await Promise.all(
    projectors.map(async (p) => {
      const activeLoan = await prisma.projectorLoan.findFirst({
        where: { projectorCode: p.code, status: 'BORROWED' },
        orderBy: { borrowedAt: 'desc' }
      });

      const recentHistory = await prisma.projectorLoan.findMany({
        where: { projectorCode: p.code },
        orderBy: { borrowedAt: 'desc' },
        take: 5
      });

      return {
        ...p,
        isUsed: p.status === 'IN_USE',
        currentLoan: activeLoan ? {
          id: activeLoan.id,
          borrowerName: activeLoan.borrowerName,
          borrowerNim: activeLoan.borrowerNim,
          roomCode: activeLoan.roomCode,
          borrowedAt: activeLoan.borrowedAt,
          reservationId: activeLoan.reservationId
        } : null,
        history: recentHistory.map((h) => ({
          id: h.id,
          borrowerName: h.borrowerName,
          borrowerNim: h.borrowerNim,
          roomCode: h.roomCode,
          status: h.status,
          borrowedAt: h.borrowedAt,
          returnedAt: h.returnedAt,
          returnNotes: h.returnNotes
        }))
      };
    })
  );

  return enriched;
}

async function getProjectorHistory(code) {
  return await prisma.projectorLoan.findMany({
    where: { projectorCode: code },
    orderBy: { borrowedAt: 'desc' },
    take: 10
  });
}

async function borrowProjector({ projectorCode, reservationId, borrowerName, borrowerNim }) {
  if (!reservationId) {
    const err = new Error('Borrowing a projector requires an active room reservation');
    err.status = 400;
    throw err;
  }

  // Verify reservation exists and is active/published
  const reservation = await prisma.practicumReservation.findUnique({
    where: { id: reservationId }
  });

  if (!reservation || reservation.status !== 'PUBLISHED') {
    const err = new Error('Borrowing a projector requires an active, published room reservation');
    err.status = 400;
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

async function returnProjector(loanId, conditionNotes, isDamaged = false) {
  const loan = await prisma.projectorLoan.findUnique({
    where: { id: loanId }
  });

  if (!loan) {
    const err = new Error('Loan record not found');
    err.status = 404;
    throw err;
  }

  if (loan.status === 'RETURNED') {
    const err = new Error('Projector has already been returned');
    err.status = 400;
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

  // Check if damaged explicitly via boolean flag or explicit defect keyword
  const markedBroken = isDamaged === true || (typeof isDamaged === 'string' && isDamaged === 'true');
  await prisma.projector.update({
    where: { code: loan.projectorCode },
    data: { status: markedBroken ? 'BROKEN' : 'AVAILABLE' }
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
  getProjectorHistory,
  borrowProjector,
  returnProjector,
  getLoans
};
