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
      OR: [
        { date: { in: datesArray } },
        { newDate: { in: datesArray } }
      ]
    }
  });

  const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const result = days.map(dayName => {
    const dateForDay = weekDates[dayName];
    const dayClasses = schedules.filter(s => s.dayOfWeek === dayName);

    const formattedClasses = [];

    // 1. Regular weekly classes for this day
    for (const c of dayClasses) {
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
        } else if (override.status === 'RESCHEDULED') {
          if (override.newDate && override.newDate !== dateForDay) {
            status = 'RESCHEDULED_OUT';
            effectiveRoomCode = c.roomCode;
            effectiveStartTime = c.startTime;
            effectiveEndTime = c.endTime;
            notes = override.notes || `Pindah jadwal ke ${override.newDate} (${override.newStartTime || c.startTime}-${override.newEndTime || c.endTime}) di ${override.newRoomCode || c.roomCode}`;
          } else {
            status = 'RESCHEDULED';
            effectiveStartTime = override.newStartTime || c.startTime;
            effectiveEndTime = override.newEndTime || c.endTime;
            effectiveRoomCode = override.newRoomCode || c.roomCode;
            notes = override.notes;
          }
        }
        if (!notes) notes = override.notes;
      }

      formattedClasses.push({
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
        overrideId: override ? override.id : null,
        targetDate: override?.newDate || null
      });
    }

    // 2. Classes rescheduled INTO this day from another day
    const incomingRescheduled = overrides.filter(o =>
      o.status === 'RESCHEDULED' &&
      o.newDate === dateForDay &&
      o.date !== dateForDay &&
      o.courseName &&
      o.courseName.includes(className)
    );

    for (const inc of incomingRescheduled) {
      const orig = schedules.find(s => s.courseName === inc.courseName) || {};
      formattedClasses.push({
        id: inc.id,
        courseName: inc.courseName,
        dayOfWeek: dayName,
        date: dateForDay,
        sks: orig.sks || 3,
        lecturer: orig.lecturer || 'Dosen Pengampu',
        originalRoomCode: inc.roomCode,
        effectiveRoomCode: inc.newRoomCode || inc.roomCode,
        originalStartTime: orig.startTime || '07:30',
        originalEndTime: orig.endTime || '10:00',
        effectiveStartTime: inc.newStartTime || orig.startTime || '07:30',
        effectiveEndTime: inc.newEndTime || orig.endTime || '10:00',
        status: 'RESCHEDULED_IN',
        notes: inc.notes || `Jadwal pengganti dari hari ${getDayOfWeek(inc.date)} (${inc.date})`,
        isOverridden: true,
        overrideId: inc.id,
        sourceDate: inc.date
      });
    }

    // Sort by effectiveStartTime
    formattedClasses.sort((a, b) => (a.effectiveStartTime || '').localeCompare(b.effectiveStartTime || ''));

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

async function applyClassOverride({ courseName, roomCode, date, action, newDate, newRoomCode, newStartTime, newEndTime, notes, updatedBy }) {
  if (action === 'RESET') {
    await prisma.scheduleOverride.deleteMany({
      where: {
        date,
        courseName
      }
    });
    return { success: true, action: 'RESET', courseName, date };
  }

  const targetDate = newDate || date;
  const targetRoom = newRoomCode || roomCode;

  if (action === 'MOVE_ROOM' || action === 'RESCHEDULE' || action === 'MOVE_TIME') {
    const targetRoomCode = action === 'MOVE_ROOM' ? newRoomCode : (newRoomCode || roomCode);
    if (!targetRoomCode) {
      throw new Error('Ruangan tujuan wajib ditentukan');
    }
    const start = newStartTime || '07:30';
    const end = newEndTime || '17:30';

    const availability = await getRoomAvailability(targetRoomCode, targetDate);
    const hasConflict = availability.some(slot => {
      if (slot.status === 'AVAILABLE') return false;
      if (targetRoomCode === roomCode && targetDate === date && slot.courseName === courseName) return false;
      return (start < slot.endTime && end > slot.startTime);
    });
    if (hasConflict) {
      throw new Error(`Ruangan ${targetRoomCode} sedang terpakai pada ${targetDate} jam ${start}-${end}.`);
    }
  }

  await prisma.scheduleOverride.deleteMany({
    where: {
      date,
      courseName
    }
  });

  const status = action === 'MOVE_ROOM' ? 'MOVED_ROOM' :
                 action === 'MOVE_TIME' ? 'MOVED_TIME' :
                 action === 'RESCHEDULE' ? 'RESCHEDULED' : action;

  const override = await prisma.scheduleOverride.create({
    data: {
      date,
      roomCode,
      courseName,
      status,
      newDate: (action === 'RESCHEDULE' && newDate && newDate !== date) ? newDate : (newDate || null),
      newRoomCode: (action === 'MOVE_ROOM' || action === 'RESCHEDULE') ? (newRoomCode || null) : null,
      newStartTime: (action === 'MOVE_TIME' || action === 'MOVE_ROOM' || action === 'RESCHEDULE') ? newStartTime : null,
      newEndTime: (action === 'MOVE_TIME' || action === 'MOVE_ROOM' || action === 'RESCHEDULE') ? newEndTime : null,
      notes: notes || (
        action === 'ONLINE' ? 'KBM Daring / Online' :
        action === 'MOVE_ROOM' ? `Pindah ke ruang ${newRoomCode}` :
        action === 'RESCHEDULE' ? `Ganti jadwal ke ${targetDate} jam ${newStartTime}-${newEndTime}` :
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
      OR: [
        {
          newRoomCode: roomCode,
          date: dateStr,
          newDate: null,
          status: { in: ['MOVED_ROOM', 'RESCHEDULED', 'MOVED_TIME'] }
        },
        {
          newRoomCode: roomCode,
          newDate: dateStr,
          status: { in: ['MOVED_ROOM', 'RESCHEDULED', 'MOVED_TIME'] }
        },
        {
          roomCode: roomCode,
          newDate: dateStr,
          newRoomCode: null,
          status: 'RESCHEDULED'
        }
      ]
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
      } else if (override.status === 'RESCHEDULED') {
        if ((override.newDate && override.newDate !== dateStr) || (override.newRoomCode && override.newRoomCode !== roomCode)) {
          slots.push({
            type: 'CLASS',
            courseName: c.courseName,
            lecturer: c.lecturer,
            startTime: c.startTime,
            endTime: c.endTime,
            status: 'AVAILABLE',
            originalStatus: 'RESCHEDULED',
            notes: override.notes || 'Jadwal dialihkan ke hari/ruangan lain'
          });
        } else {
          slots.push({
            type: 'CLASS',
            courseName: c.courseName,
            lecturer: c.lecturer,
            startTime: override.newStartTime || c.startTime,
            endTime: override.newEndTime || c.endTime,
            status: 'OCCUPIED_CLASS',
            originalStatus: 'RESCHEDULED',
            notes: override.notes
          });
        }
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
