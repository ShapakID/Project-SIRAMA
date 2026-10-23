const prisma = require('../db');
const { parseScheduleExcel } = require('./excelParser');

const DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr);
  return DAY_NAMES[d.getDay()];
}

async function importSchedulesFromExcel(filePath) {
  const parsed = parseScheduleExcel(filePath);
  // Clear existing schedules for clean import
  await prisma.weeklySchedule.deleteMany({});
  for (const item of parsed) {
    await prisma.weeklySchedule.create({
      data: item
    });
  }
  return parsed;
}

async function applyOverride({ roomCode, date, courseName, status, notes, updatedBy }) {
  return await prisma.scheduleOverride.create({
    data: {
      roomCode,
      date,
      courseName: courseName || null,
      status, // "ONLINE", "RELEASED", "RESCHEDULED"
      notes: notes || null,
      updatedBy: updatedBy || null
    }
  });
}

async function getRoomAvailability(roomCode, dateStr) {
  const dayOfWeek = getDayOfWeek(dateStr);

  // 1. Get weekly recurring classes for this room & day
  const classes = await prisma.weeklySchedule.findMany({
    where: {
      roomCode,
      dayOfWeek
    }
  });

  // 2. Get overrides for this room & date
  const overrides = await prisma.scheduleOverride.findMany({
    where: {
      roomCode,
      date: dateStr
    }
  });

  // 3. Get published practicum reservations
  const practicums = await prisma.practicumReservation.findMany({
    where: {
      roomCode,
      date: dateStr,
      status: 'PUBLISHED'
    }
  });

  // 4. Check for room maintenance damage reports
  const maintenanceReports = await prisma.damageReport.findMany({
    where: {
      targetType: 'ROOM',
      targetCode: roomCode,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    }
  });

  const slots = [];

  // Evaluate weekly classes with overrides
  for (const c of classes) {
    const override = overrides.find(o => (!o.courseName || o.courseName === c.courseName));

    if (override) {
      if (override.status === 'ONLINE' || override.status === 'RELEASED') {
        slots.push({
          type: 'CLASS',
          courseName: c.courseName,
          lecturer: c.lecturer,
          startTime: c.startTime,
          endTime: c.endTime,
          status: 'AVAILABLE',
          originalStatus: override.status,
          notes: override.notes || `Kelas dialihkan ke ${override.status.toLowerCase()}`
        });
      } else {
        slots.push({
          type: 'CLASS',
          courseName: c.courseName,
          lecturer: c.lecturer,
          startTime: override.newStartTime || c.startTime,
          endTime: override.newEndTime || c.endTime,
          status: 'OCCUPIED_CLASS',
          originalStatus: override.status,
          notes: override.notes
        });
      }
    } else {
      slots.push({
        type: 'CLASS',
        courseName: c.courseName,
        lecturer: c.lecturer,
        startTime: c.startTime,
        endTime: c.endTime,
        status: 'OCCUPIED_CLASS',
        originalStatus: 'NORMAL'
      });
    }
  }

  // Add practicums
  for (const p of practicums) {
    slots.push({
      type: 'PRACTICUM',
      id: p.id,
      title: p.title,
      pjName: p.pjName,
      pjNim: p.pjNim,
      startTime: p.startTime,
      endTime: p.endTime,
      status: 'PRACTICUM',
      originalStatus: 'PUBLISHED'
    });
  }

  // Add maintenance if exists
  if (maintenanceReports.length > 0) {
    slots.push({
      type: 'MAINTENANCE',
      status: 'MAINTENANCE',
      startTime: '07:00',
      endTime: '22:00',
      notes: maintenanceReports[0].description
    });
  }

  return slots;
}

module.exports = {
  getDayOfWeek,
  importSchedulesFromExcel,
  applyOverride,
  getRoomAvailability
};
