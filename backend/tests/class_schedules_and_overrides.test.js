const assert = require('assert');
const {
  getClassSchedules,
  applyClassOverride,
  getRoomAvailability
} = require('../src/services/availabilityService');
const prisma = require('../src/db');

async function runTests() {
  console.log('Testing Class-Centric Schedule and PJ Overrides...');

  // 1. Verify class schedules query for SI-A 2025
  const result = await getClassSchedules('SI-A 2025', '2026-10-26');
  assert.strictEqual(result.className, 'SI-A 2025');
  assert.strictEqual(result.scheduleByDays.length, 5);

  const senin = result.scheduleByDays.find(d => d.dayOfWeek === 'SENIN');
  assert.ok(senin, 'SENIN must exist in schedule');
  assert.strictEqual(senin.courses.length, 2, 'SENIN for SI-A 2025 must have 2 courses (AI and KSI)');

  const ai = senin.courses.find(c => c.courseName.includes('Kecerdasan Artifisial'));
  assert.ok(ai, 'Kecerdasan Artifisial must exist on SENIN');
  assert.strictEqual(ai.effectiveRoomCode, 'JTI-1');
  assert.strictEqual(ai.status, 'NORMAL');

  // 2. Test PJ action: ONLINE (Lepas Ruangan)
  const testDate = '2026-10-26';
  const ksiCourse = 'Keamanan Sistem Informasi (SI-A 2025)';
  const ksiRoom = 'SG-7';

  // Apply online override
  await applyClassOverride({
    courseName: ksiCourse,
    roomCode: ksiRoom,
    date: testDate,
    action: 'ONLINE',
    notes: 'KBM Daring via Zoom',
    updatedBy: 'F5212510018'
  });

  // Verify class schedule reflects ONLINE status
  const afterOnline = await getClassSchedules('SI-A 2025', testDate);
  const seninAfterOnline = afterOnline.scheduleByDays.find(d => d.dayOfWeek === 'SENIN');
  const ksiSlot = seninAfterOnline.courses.find(c => c.courseName === ksiCourse);
  assert.strictEqual(ksiSlot.status, 'ONLINE');
  assert.strictEqual(ksiSlot.isOverridden, true);

  // Verify SG-7 is now AVAILABLE in room availability (so others can book)
  const sg7Slots = await getRoomAvailability(ksiRoom, testDate);
  const sg7Ksi = sg7Slots.find(s => s.courseName === ksiCourse);
  assert.ok(sg7Ksi, 'SG-7 should have the slot');
  assert.strictEqual(sg7Ksi.status, 'AVAILABLE', 'SG-7 must become AVAILABLE when class is ONLINE');

  // 3. Test PJ action: MOVE_ROOM
  const rabuDate = '2026-10-28';
  const rplCourse = 'Rekayasa Perangkat Lunak (SI-A 2025)';
  const originalRoom = 'SG-3';
  const targetRoom = 'SG-5';

  await applyClassOverride({
    courseName: rplCourse,
    roomCode: originalRoom,
    date: rabuDate,
    action: 'MOVE_ROOM',
    newRoomCode: targetRoom,
    newStartTime: '10:00',
    newEndTime: '12:30',
    notes: 'Pindah ke ruang SG-5',
    updatedBy: 'F5212510018'
  });

  // Verify class schedule shows new room
  const afterMove = await getClassSchedules('SI-A 2025', rabuDate);
  const rabuAfterMove = afterMove.scheduleByDays.find(d => d.dayOfWeek === 'RABU');
  const rplSlot = rabuAfterMove.courses.find(c => c.courseName === rplCourse);
  assert.strictEqual(rplSlot.status, 'MOVED_ROOM');
  assert.strictEqual(rplSlot.effectiveRoomCode, targetRoom);
  assert.strictEqual(rplSlot.originalRoomCode, originalRoom);

  // Original room SG-3 should be AVAILABLE
  const sg3Slots = await getRoomAvailability(originalRoom, rabuDate);
  const sg3Rpl = sg3Slots.find(s => s.courseName === rplCourse);
  assert.strictEqual(sg3Rpl.status, 'AVAILABLE', 'Original room SG-3 must be AVAILABLE after move');

  // Target room SG-5 should now be OCCUPIED by RPL
  const sg5Slots = await getRoomAvailability(targetRoom, rabuDate);
  const sg5Moved = sg5Slots.find(s => s.courseName === rplCourse);
  assert.ok(sg5Moved, 'Target room SG-5 must contain the moved class slot');
  assert.strictEqual(sg5Moved.status, 'OCCUPIED_CLASS', 'Target room SG-5 must be OCCUPIED_CLASS');

  // 4. Test PJ action: RESCHEDULE (Ganti Jadwal / Pindah Hari)
  const jumatDate = '2026-10-30';
  await applyClassOverride({
    courseName: ksiCourse,
    roomCode: ksiRoom,
    date: testDate,
    action: 'RESCHEDULE',
    newDate: jumatDate,
    newRoomCode: ksiRoom,
    newStartTime: '14:00',
    newEndTime: '16:30',
    notes: 'Pindah hari ke Jumat sore',
    updatedBy: 'F5212510018'
  });

  const afterReschedule = await getClassSchedules('SI-A 2025', testDate);
  const seninResched = afterReschedule.scheduleByDays.find(d => d.dayOfWeek === 'SENIN');
  const ksiOut = seninResched.courses.find(c => c.courseName === ksiCourse);
  assert.strictEqual(ksiOut.status, 'RESCHEDULED_OUT', 'SENIN must show RESCHEDULED_OUT');

  // Verify SG-7 on SENIN is now AVAILABLE
  const sg7SlotsResched = await getRoomAvailability(ksiRoom, testDate);
  const sg7KsiOut = sg7SlotsResched.find(s => s.courseName === ksiCourse);
  assert.strictEqual(sg7KsiOut.status, 'AVAILABLE', 'SG-7 on original date must be AVAILABLE');

  // Verify JUMAT now has the incoming rescheduled course
  const jumatResched = afterReschedule.scheduleByDays.find(d => d.dayOfWeek === 'JUMAT');
  const ksiIn = jumatResched.courses.find(c => c.courseName === ksiCourse);
  assert.ok(ksiIn, 'JUMAT must contain incoming rescheduled course');
  assert.strictEqual(ksiIn.status, 'RESCHEDULED_IN');
  assert.strictEqual(ksiIn.effectiveStartTime, '14:00');
  assert.strictEqual(ksiIn.effectiveEndTime, '16:30');

  // Verify SG-7 on JUMAT is OCCUPIED by this class
  const sg7JumatSlots = await getRoomAvailability(ksiRoom, jumatDate);
  const sg7JumatOccupied = sg7JumatSlots.find(s => s.courseName === ksiCourse);
  assert.ok(sg7JumatOccupied, 'SG-7 on target date must have the course');
  assert.strictEqual(sg7JumatOccupied.status, 'OCCUPIED_CLASS');

  // 5. Test PJ action: RESET (Kembali ke default SIGA)
  await applyClassOverride({
    courseName: ksiCourse,
    roomCode: ksiRoom,
    date: testDate,
    action: 'RESET'
  });
  await applyClassOverride({
    courseName: rplCourse,
    roomCode: originalRoom,
    date: rabuDate,
    action: 'RESET'
  });

  // Verify reset
  const afterReset = await getClassSchedules('SI-A 2025', testDate);
  const ksiReset = afterReset.scheduleByDays.find(d => d.dayOfWeek === 'SENIN').courses.find(c => c.courseName === ksiCourse);
  assert.strictEqual(ksiReset.status, 'NORMAL');
  assert.strictEqual(ksiReset.isOverridden, false);

  const sg7SlotsReset = await getRoomAvailability(ksiRoom, testDate);
  const sg7KsiReset = sg7SlotsReset.find(s => s.courseName === ksiCourse);
  assert.strictEqual(sg7KsiReset.status, 'OCCUPIED_CLASS', 'SG-7 must be OCCUPIED_CLASS after reset');

  console.log('All Class-Centric Schedule and PJ Override tests PASSED!');
}

runTests()
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
