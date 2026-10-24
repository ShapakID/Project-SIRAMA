const assert = require('assert');
const path = require('path');
const prisma = require('../src/db');
const { parseScheduleExcel } = require('../src/services/excelParser');
const { getRoomAvailability, applyOverride } = require('../src/services/availabilityService');

async function testAvailability() {
  // Clean up any existing overrides for test date
  const dateStr = '2026-10-26';
  await prisma.scheduleOverride.deleteMany({
    where: { roomCode: 'SG-7', date: dateStr }
  });

  // Ensure weekly schedules are populated from Excel if not already
  const count = await prisma.weeklySchedule.count();
  if (count === 0) {
    const excelPath = path.resolve(__dirname, '../../JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx');
    const items = parseScheduleExcel(excelPath);
    for (const item of items) {
      await prisma.weeklySchedule.create({ data: item });
    }
  }

  // 2026-10-26 is a Monday (SENIN)
  const before = await getRoomAvailability('SG-7', dateStr);
  assert(before.some(s => s.status === 'OCCUPIED_CLASS'), 'Should show official class on SG-7');

  await applyOverride({ roomCode: 'SG-7', date: dateStr, status: 'RELEASED' });
  const after = await getRoomAvailability('SG-7', dateStr);
  const releasedSlot = after.find(s => s.status === 'AVAILABLE' && s.originalStatus === 'RELEASED');
  assert(releasedSlot, 'Released class slot must become AVAILABLE');

  // Clean up test override to keep database pristine
  await prisma.scheduleOverride.deleteMany({ where: { roomCode: 'SG-7', date: dateStr } });

  console.log('Task 4 Availability & Override test passed.');
  await prisma.$disconnect();
}

testAvailability().catch(err => {
  console.error(err);
  process.exit(1);
});
