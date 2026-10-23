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

async function getFloorRoomsStatus(dateStr) {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  });

  const results = [];
  for (const r of rooms) {
    const slots = await getRoomAvailability(r.code, dateStr);
    let summaryStatus = 'AVAILABLE';
    let activeSchedule = null;

    if (slots.some(s => s.status === 'MAINTENANCE')) {
      summaryStatus = 'MAINTENANCE';
      activeSchedule = 'Perbaikan Fasilitas';
    } else if (slots.some(s => s.status === 'PRACTICUM')) {
      const p = slots.find(s => s.status === 'PRACTICUM');
      summaryStatus = 'PRACTICUM';
      activeSchedule = `${p.title} (${p.startTime}-${p.endTime})`;
    } else if (slots.some(s => s.status === 'OCCUPIED_CLASS')) {
      const c = slots.find(s => s.status === 'OCCUPIED_CLASS');
      summaryStatus = 'OCCUPIED';
      activeSchedule = `${c.courseName} (${c.startTime}-${c.endTime})`;
    }

    let displayCode = r.code;
    const match = r.code.match(/^SG-(\d+)$/);
    if (match) {
      displayCode = `SG ${match[1].padStart(2, '0')}`;
    } else if (r.code === 'Lab-Komputer') {
      displayCode = 'Lab-Komputer';
    }

    results.push({
      id: r.id,
      code: r.code,
      displayCode,
      name: r.name,
      floor: r.floor,
      capacity: r.capacity,
      facilities: r.facilities,
      summaryStatus,
      activeSchedule,
      slotsCount: slots.length,
      slots
    });
  }

  return results;
}

module.exports = {
  getDayOfWeek,
  importSchedulesFromExcel,
  applyOverride,
  getRoomAvailability,
  getFloorRoomsStatus
};
