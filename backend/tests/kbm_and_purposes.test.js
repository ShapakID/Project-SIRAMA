const assert = require('assert');
const prisma = require('../src/db');
const { getWitaDateYMD, getWitaTimeHM, getDayOfWeek, parseNimMetadata } = require('../src/utils/timeUtils');
const { getRoomAvailability, getFloorRoomsStatus } = require('../src/services/availabilityService');
const { saveDraft, publishReservation } = require('../src/services/practicumService');

async function runTests() {
  console.log('Testing WITA KBM Auto-Reservation & Multi-Purpose Bookings...');

  // 1. Test WITA utilities
  const witaDate = getWitaDateYMD();
  const witaTime = getWitaTimeHM();
  assert.match(witaDate, /^\d{4}-\d{2}-\d{2}$/, 'WITA date must be YYYY-MM-DD');
  assert.match(witaTime, /^\d{2}:\d{2}$/, 'WITA time must be HH:mm');
  assert.strictEqual(getDayOfWeek('2026-10-26'), 'SENIN', '2026-10-26 must be SENIN');

  // 2. Test NIM Parser
  const pjA = parseNimMetadata('F5212510018');
  assert.strictEqual(pjA.angkatan, 2025);
  assert.strictEqual(pjA.kelas, 'A');
  assert.strictEqual(pjA.semester, 3);
  assert.strictEqual(pjA.className, 'SI-A 2025');

  const pjB = parseNimMetadata('F5212610050');
  assert.strictEqual(pjB.angkatan, 2026);
  assert.strictEqual(pjB.kelas, 'B');
  assert.strictEqual(pjB.semester, 1);

  const pjC = parseNimMetadata('F5212410090');
  assert.strictEqual(pjC.angkatan, 2024);
  assert.strictEqual(pjC.kelas, 'C');
  assert.strictEqual(pjC.semester, 5);

  // 3. Test Automatic KBM Occupancy on SENIN (Monday)
  // SG-1 on SENIN has 'Kecerdasan Artifisial (SI-A 2025)' 07:30-10:00
  const mondayDate = '2026-10-26'; // Monday
  const slotsSG1 = await getRoomAvailability('SG-1', mondayDate);
  const kbmSlot = slotsSG1.find(s => s.courseName && s.courseName.includes('Kecerdasan Artifisial'));
  assert.ok(kbmSlot, 'SG-1 on Monday must automatically contain KBM class');
  assert.strictEqual(kbmSlot.status, 'OCCUPIED_CLASS');
  assert.strictEqual(kbmSlot.startTime, '07:30');
  assert.strictEqual(kbmSlot.endTime, '10:00');

  // Check Floor Status summary for Monday
  const floorStatus = await getFloorRoomsStatus(mondayDate);
  const sg1Status = floorStatus.find(r => r.code === 'SG-1');
  assert.strictEqual(sg1Status.summaryStatus, 'OCCUPIED');
  assert.ok(sg1Status.activeSchedule.includes('Kecerdasan Artifisial'));

  // 4. Test Anti-Collision: Trying to book during KBM hours MUST be rejected!
  const conflictDraft = await saveDraft({
    roomCode: 'SG-1',
    date: mondayDate,
    startTime: '08:00',
    endTime: '09:30',
    title: 'Bentrok Test Booking',
    category: 'PRAKTIKUM',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar'
  });

  let collisionCaught = false;
  try {
    await publishReservation(conflictDraft.id);
  } catch (err) {
    collisionCaught = true;
    assert.strictEqual(err.status, 409);
    assert.ok(err.message.includes('Conflict'));
  }
  assert.strictEqual(collisionCaught, true, 'Reservation conflicting with KBM must throw 409');
  await prisma.practicumReservation.delete({ where: { id: conflictDraft.id } });

  // 5. Test HIMA / Ormawa Non-KBM Reservation on an open slot
  // On SENIN, SG-1 is free between 13:00 - 15:30
  const himaDraft = await saveDraft({
    roomCode: 'SG-1',
    date: mondayDate,
    startTime: '13:00',
    endTime: '15:00',
    title: 'Rapat Kerja HIMA SIFOR',
    category: 'HIMA_ORMAWA',
    purpose: 'Persiapan Informatics Festival dan Dies Natalis',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar'
  });
  assert.strictEqual(himaDraft.category, 'HIMA_ORMAWA');
  assert.strictEqual(himaDraft.purpose, 'Persiapan Informatics Festival dan Dies Natalis');

  const publishedHima = await publishReservation(himaDraft.id);
  assert.strictEqual(publishedHima.status, 'PUBLISHED');

  // Verify availability reflects HIMA booking
  const updatedSlots = await getRoomAvailability('SG-1', mondayDate);
  const himaSlot = updatedSlots.find(s => s.id === publishedHima.id);
  assert.ok(himaSlot);
  assert.strictEqual(himaSlot.category, 'HIMA_ORMAWA');
  assert.strictEqual(himaSlot.purpose, 'Persiapan Informatics Festival dan Dies Natalis');

  // Cleanup test reservation
  await prisma.practicumReservation.delete({ where: { id: himaDraft.id } });

  console.log('All WITA KBM and purpose reservation tests PASSED successfully.');
}

runTests()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
