const prisma = require('../db');
const { getWitaDateYMD } = require('../utils/timeUtils');

async function getProjectors(building = 'GSG') {
  const where = {};
  if (building && building !== 'ALL') {
    where.building = building;
  }

  const projectors = await prisma.projector.findMany({
    where,
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

  // Validate schedule date: Projector can only be borrowed approaching the event (within 3 days or on the day of reservation)
  const todayStr = getWitaDateYMD();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const resDate = new Date(reservation.date + 'T00:00:00');
  const diffDays = Math.round((resDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 3) {
    const err = new Error(`Proyektor hanya dapat dipinjam mendekati hari H pelaksanaan (${reservation.date}). Peminjaman dibuka H-3 atau pada hari H.`);
    err.status = 400;
    throw err;
  }
  if (diffDays < 0) {
    const err = new Error(`Jadwal reservasi ini (${reservation.date}) sudah lewat.`);
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

  // Validate building match between room and projector
  const room = await prisma.room.findUnique({
    where: { code: reservation.roomCode }
  });
  if (room && room.building !== projector.building) {
    const err = new Error(`Ruangan ${room.name} berada di ${room.building === 'JTI' ? 'JTI' : 'SG'}. Tidak dapat meminjam proyektor milik ${projector.building === 'JTI' ? 'JTI' : 'SG'}.`);
    err.status = 400;
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

async function returnProjector(loanId, conditionNotes, isDamaged = false, releaseReservation = true) {
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

  // Release linked reservation if requested (default: true)
  let reservationReleased = false;
  if (releaseReservation && loan.reservationId) {
    await prisma.practicumReservation.update({
      where: { id: loan.reservationId },
      data: { status: 'COMPLETED' }
    });
    reservationReleased = true;
  }

  return {
    ...updatedLoan,
    reservationReleased
  };
}

async function returnProjectorByCode(projectorCode, conditionNotes, isDamaged = false, releaseReservation = true) {
  const activeLoan = await prisma.projectorLoan.findFirst({
    where: { projectorCode, status: 'BORROWED' },
    orderBy: { borrowedAt: 'desc' }
  });

  if (!activeLoan) {
    const err = new Error(`Tidak ditemukan peminjaman aktif untuk unit proyektor ${projectorCode}`);
    err.status = 404;
    throw err;
  }

  return await returnProjector(activeLoan.id, conditionNotes, isDamaged, releaseReservation);
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
  returnProjectorByCode,
  getLoans
};
