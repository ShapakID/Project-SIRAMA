const prisma = require('../db');
const { parseScheduleExcel } = require('./excelParser');
const { getDayOfWeek, getWitaDateYMD, isWeekend } = require('../utils/timeUtils');

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

async function applyOverride({ roomCode, date, courseName, status, notes, updatedBy, newRoomCode, newStartTime, newEndTime }) {
  return await prisma.scheduleOverride.create({
    data: {
      roomCode,
      date,
      courseName: courseName || null,
      status, // "ONLINE", "RELEASED", "RESCHEDULED", "MOVED_ROOM", "MOVED_TIME"
      newRoomCode: newRoomCode || null,
      newStartTime: newStartTime || null,
      newEndTime: newEndTime || null,
      notes: notes || null,
      updatedBy: updatedBy || null
    }
  });
}

function getWeekDates(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diff);
  const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const res = {};
  days.forEach((name, idx) => {
    const cur = new Date(mon);
    cur.setUTCDate(mon.getUTCDate() + idx);
    res[name] = cur.toISOString().split('T')[0];
  });
  return res;
}

async function getClassSchedules(className, referenceDate) {
  const refDate = referenceDate || getWitaDateYMD();
  const weekDates = getWeekDates(refDate);

  const schedules = await prisma.weeklySchedule.findMany({
    where: {
      courseName: {
        contains: className
      }
    },
    orderBy: [
      { startTime: 'asc' }
    ]
  });

  const datesArray = Object.values(weekDates);
  const overrides = await prisma.scheduleOverride.findMany({
    where: {
      date: { in: datesArray }
    }
  });

  const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const result = days.map(dayName => {
    const dateForDay = weekDates[dayName];
    const dayClasses = schedules.filter(s => s.dayOfWeek === dayName);

    const formattedClasses = dayClasses.map(c => {
      const override = overrides.find(o => o.date === dateForDay && o.courseName === c.courseName);

      let status = 'NORMAL';
      let effectiveRoomCode = c.roomCode;
      let effectiveStartTime = c.startTime;
      let effectiveEndTime = c.endTime;
      let notes = null;

      if (override) {
        status = override.status;
        if (override.status === 'MOVED_ROOM') {
          effectiveRoomCode = override.newRoomCode || c.roomCode;
        } else if (override.status === 'MOVED_TIME') {
          effectiveStartTime = override.newStartTime || c.startTime;
          effectiveEndTime = override.newEndTime || c.endTime;
        }
        notes = override.notes;
      }

      return {
        id: c.id,
        courseName: c.courseName,
        dayOfWeek: c.dayOfWeek,
        date: dateForDay,
        sks: c.sks,
        lecturer: c.lecturer,
        originalRoomCode: c.roomCode,
        effectiveRoomCode,
        originalStartTime: c.startTime,
        originalEndTime: c.endTime,
        effectiveStartTime,
        effectiveEndTime,
        status,
        notes,
        isOverridden: !!override,
        overrideId: override ? override.id : null
      };
    });

    return {
      dayOfWeek: dayName,
      date: dateForDay,
      courses: formattedClasses
    };
  });

  return {
    className,
    referenceDate: refDate,
    weekDates,
    scheduleByDays: result
  };
}

async function applyClassOverride({ courseName, roomCode, date, action, newRoomCode, newStartTime, newEndTime, notes, updatedBy }) {
  if (action === 'RESET') {
    await prisma.scheduleOverride.deleteMany({
      where: {
        date,
        courseName
      }
    });
    return { success: true, action: 'RESET', courseName, date };
  }

  if (action === 'MOVE_ROOM') {
    if (!newRoomCode) {
      throw new Error('Ruangan tujuan (newRoomCode) wajib ditentukan');
    }
    const availability = await getRoomAvailability(newRoomCode, date);
    const start = newStartTime || '07:30';
    const end = newEndTime || '17:30';
    const hasConflict = availability.some(slot => {
      if (slot.status === 'AVAILABLE') return false;
      return (start < slot.endTime && end > slot.startTime);
    });
    if (hasConflict) {
      throw new Error(`Ruangan ${newRoomCode} sedang terpakai pada jam ${start}-${end}.`);
    }
  }

  await prisma.scheduleOverride.deleteMany({
    where: {
      date,
      courseName
    }
  });

  const status = action === 'MOVE_ROOM' ? 'MOVED_ROOM' : (action === 'MOVE_TIME' ? 'MOVED_TIME' : action);

  const override = await prisma.scheduleOverride.create({
    data: {
      date,
      roomCode,
      courseName,
      status,
      newRoomCode: action === 'MOVE_ROOM' ? newRoomCode : null,
      newStartTime: (action === 'MOVE_TIME' || action === 'MOVE_ROOM') ? newStartTime : null,
      newEndTime: (action === 'MOVE_TIME' || action === 'MOVE_ROOM') ? newEndTime : null,
      notes: notes || (
        action === 'ONLINE' ? 'KBM Daring / Online' :
        action === 'MOVE_ROOM' ? `Pindah ke ruang ${newRoomCode}` :
        action === 'MOVE_TIME' ? `Geser jam ke ${newStartTime}-${newEndTime}` : null
      ),
      updatedBy: updatedBy || null
    }
  });

  return override;
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

  // 2b. Get target incoming overrides (classes moved INTO this room on dateStr)
  const incomingOverrides = await prisma.scheduleOverride.findMany({
    where: {
      newRoomCode: roomCode,
      date: dateStr,
      status: 'MOVED_ROOM'
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
      if (override.status === 'ONLINE' || override.status === 'RELEASED' || override.status === 'MOVED_ROOM') {
        slots.push({
          type: 'CLASS',
          courseName: c.courseName,
          lecturer: c.lecturer,
          startTime: c.startTime,
          endTime: c.endTime,
          status: 'AVAILABLE',
          originalStatus: override.status,
          notes: override.notes || (override.status === 'ONLINE' ? 'KBM Online / Daring' : `Dipindahkan ke ${override.newRoomCode || 'ruang lain'}`)
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

  // Add incoming moved classes to this room
  for (const inc of incomingOverrides) {
    slots.push({
      type: 'CLASS',
      courseName: inc.courseName,
      lecturer: 'Kuliah Pindahan',
      startTime: inc.newStartTime || '07:30',
      endTime: inc.newEndTime || '10:00',
      status: 'OCCUPIED_CLASS',
      originalStatus: 'MOVED_IN',
      notes: inc.notes || `Pindahan dari ruang ${inc.roomCode}`
    });
  }

  // Add practicums
  for (const p of practicums) {
    slots.push({
      type: 'PRACTICUM',
      id: p.id,
      title: p.title,
      category: p.category || 'PRAKTIKUM',
      purpose: p.purpose || null,
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

async function getFloorRoomsStatus(dateStr, building = 'GSG') {
  const isWknd = isWeekend(dateStr);
  const where = { isActive: true };
  if (building && building !== 'ALL') {
    where.building = building;
  }

  const rooms = await prisma.room.findMany({
    where,
    orderBy: { code: 'asc' }
  });

  const results = [];
  for (const r of rooms) {
    let displayCode = r.code;
    const match = r.code.match(/^SG-(\d+)$/);
    if (match) {
      displayCode = `SG ${match[1].padStart(2, '0')}`;
    } else if (r.code === 'Lab-Komputer') {
      displayCode = 'Lab-Komputer';
    } else if (r.code.startsWith('JTI-')) {
      displayCode = r.code.replace('JTI-', 'JTI ');
    } else if (r.code === 'Lab-JTI') {
      displayCode = 'Lab Komputer JTI';
    }

    const bld = r.building || (r.code.startsWith('JTI') || r.code === 'Lab-JTI' ? 'JTI' : 'GSG');
    const closedText = bld === 'JTI' ? 'Gedung JTI Tutup (Akhir Pekan)' : 'Gedung SG Tutup (Akhir Pekan)';

    if (isWknd) {
      results.push({
        id: r.id,
        code: r.code,
        displayCode,
        name: r.name,
        building: bld,
        floor: r.floor,
        capacity: r.capacity,
        facilities: r.facilities,
        summaryStatus: 'CLOSED',
        activeSchedule: closedText,
        isClosed: true,
        slotsCount: 0,
        slots: []
      });
      continue;
    }

    const slots = await getRoomAvailability(r.code, dateStr);
    let summaryStatus = 'AVAILABLE';
    let activeSchedule = null;

    if (slots.some(s => s.status === 'MAINTENANCE')) {
      summaryStatus = 'MAINTENANCE';
      activeSchedule = 'Perbaikan Fasilitas';
    } else if (slots.some(s => s.status === 'PRACTICUM')) {
      const p = slots.find(s => s.status === 'PRACTICUM');
      const catPrefix = p.category === 'HIMA_ORMAWA' ? '[HIMA] ' : (p.category === 'LAINNYA' ? '[Kegiatan] ' : '[Praktikum] ');
      summaryStatus = 'PRACTICUM';
      activeSchedule = `${catPrefix}${p.title} (${p.startTime}-${p.endTime})`;
    } else if (slots.some(s => s.status === 'OCCUPIED_CLASS')) {
      const c = slots.find(s => s.status === 'OCCUPIED_CLASS');
      summaryStatus = 'OCCUPIED';
      activeSchedule = `${c.courseName} (${c.startTime}-${c.endTime})`;
    }

    results.push({
      id: r.id,
      code: r.code,
      displayCode,
      name: r.name,
      building: bld,
      floor: r.floor,
      capacity: r.capacity,
      facilities: r.facilities,
      summaryStatus,
      activeSchedule,
      isClosed: false,
      slotsCount: slots.length,
      slots
    });
  }

  return results;
}

module.exports = {
  getDayOfWeek,
  getWeekDates,
  importSchedulesFromExcel,
  applyOverride,
  applyClassOverride,
  getClassSchedules,
  getRoomAvailability,
  getFloorRoomsStatus
};
