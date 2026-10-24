const prisma = require('../db');
const { getRoomAvailability } = require('./availabilityService');
const { isWeekend } = require('../utils/timeUtils');

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

async function saveDraft(data) {
  const { id, pjNim, pjName, roomCode, date, startTime, endTime, title, category, purpose } = data;

  if (date && isWeekend(date)) {
    const err = new Error('Gedung GSG tutup pada hari Sabtu dan Minggu. Silakan pilih hari operasional Senin - Jumat.');
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  if (startTime && endTime && timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    const err = new Error('Invalid timeslot: startTime must be before endTime');
    err.status = 400;
    throw err;
  }

  const reservationCategory = category || 'PRAKTIKUM';
  const reservationPurpose = purpose || null;

  if (id) {
    return await prisma.practicumReservation.update({
      where: { id },
      data: {
        roomCode,
        date,
        startTime,
        endTime,
        title,
        category: reservationCategory,
        purpose: reservationPurpose,
        status: 'DRAFT',
        pjNim: pjNim || 'F5212510018',
        pjName: pjName || 'PJ'
      }
    });
  }

  return await prisma.practicumReservation.create({
    data: {
      roomCode,
      date,
      startTime,
      endTime,
      title,
      category: reservationCategory,
      purpose: reservationPurpose,
      status: 'DRAFT',
      pjNim: pjNim || 'F5212510018',
      pjName: pjName || 'PJ'
    }
  });
}

async function publishReservation(reservationId) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.practicumReservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) {
      const err = new Error('Reservation not found');
      err.status = 404;
      throw err;
    }

    if (isWeekend(reservation.date)) {
      const err = new Error('Gedung GSG tutup pada hari Sabtu dan Minggu. Silakan pilih hari operasional Senin - Jumat.');
      err.status = 400;
      throw err;
    }

    if (timeToMinutes(reservation.startTime) >= timeToMinutes(reservation.endTime)) {
      const err = new Error('Invalid timeslot: startTime must be before endTime');
      err.status = 400;
      throw err;
    }

    // Check collision using availability engine
    const slots = await getRoomAvailability(reservation.roomCode, reservation.date);

    for (const slot of slots) {
      if (slot.status === 'OCCUPIED_CLASS' || (slot.status === 'PRACTICUM' && slot.id !== reservationId)) {
        if (isOverlap(reservation.startTime, reservation.endTime, slot.startTime, slot.endTime)) {
          const err = new Error(`Conflict: Room ${reservation.roomCode} is already occupied by ${slot.courseName || slot.title || 'another session'} at that time.`);
          err.status = 409;
          throw err;
        }
      }
      if (slot.status === 'MAINTENANCE') {
        const err = new Error(`Conflict: Room ${reservation.roomCode} is currently under maintenance.`);
        err.status = 409;
        throw err;
      }
    }

    return await tx.practicumReservation.update({
      where: { id: reservationId },
      data: { status: 'PUBLISHED' }
    });
  });
}

async function getReservations(filter = {}) {
  const where = {};
  if (filter.roomCode) where.roomCode = filter.roomCode;
  if (filter.date) where.date = filter.date;
  if (filter.status) where.status = filter.status;
  if (filter.pjNim) where.pjNim = filter.pjNim;

  const items = await prisma.practicumReservation.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  const resIds = items.map(r => r.id);
  const activeLoans = await prisma.projectorLoan.findMany({
    where: {
      reservationId: { in: resIds },
      status: 'BORROWED'
    }
  });

  const loanMap = new Map();
  activeLoans.forEach(l => loanMap.set(l.reservationId, l));

  return items.map(r => ({
    ...r,
    activeLoan: loanMap.get(r.id) || null
  }));
}

async function cancelReservation(reservationId) {
  return await prisma.practicumReservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' }
  });
}

async function createReservationDirect(data) {
  const draft = await saveDraft(data);
  return await publishReservation(draft.id);
}

module.exports = {
  isOverlap,
  saveDraft,
  publishReservation,
  createReservationDirect,
  getReservations,
  cancelReservation
};
