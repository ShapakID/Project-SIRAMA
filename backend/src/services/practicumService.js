const prisma = require('../db');
const { getRoomAvailability } = require('./availabilityService');

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

async function saveDraft(data) {
  const { id, pjNim, pjName, roomCode, date, startTime, endTime, title } = data;

  if (id) {
    return await prisma.practicumReservation.update({
      where: { id },
      data: {
        roomCode,
        date,
        startTime,
        endTime,
        title,
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
      status: 'DRAFT',
      pjNim: pjNim || 'F5212510018',
      pjName: pjName || 'PJ'
    }
  });
}

async function publishReservation(reservationId) {
  const reservation = await prisma.practicumReservation.findUnique({
    where: { id: reservationId }
  });

  if (!reservation) {
    const err = new Error('Reservation not found');
    err.status = 404;
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

  return await prisma.practicumReservation.update({
    where: { id: reservationId },
    data: { status: 'PUBLISHED' }
  });
}

async function getReservations(filter = {}) {
  const where = {};
  if (filter.roomCode) where.roomCode = filter.roomCode;
  if (filter.date) where.date = filter.date;
  if (filter.status) where.status = filter.status;
  if (filter.pjNim) where.pjNim = filter.pjNim;

  return await prisma.practicumReservation.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

async function cancelReservation(reservationId) {
  return await prisma.practicumReservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' }
  });
}

module.exports = {
  isOverlap,
  saveDraft,
  publishReservation,
  getReservations,
  cancelReservation
};
