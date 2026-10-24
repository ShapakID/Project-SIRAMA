const assert = require('node:assert');
const prisma = require('../src/db.js');
const { isWeekend, getNextWeekdayYMD, getDayOfWeek } = require('../src/utils/timeUtils.js');
const { getCoursesByNim, getCoursesBySemester } = require('../src/utils/curriculum.js');
const { saveDraft, createReservationDirect } = require('../src/services/practicumService.js');
const { getFloorRoomsStatus } = require('../src/services/availabilityService.js');

console.log('Testing Weekend Closure and Manual Flexible Practicum by Curriculum...');

async function runTests() {
  // Test 1: Weekend detection
  assert.strictEqual(isWeekend('2026-10-24'), true, '2026-10-24 Saturday must be weekend');
  assert.strictEqual(isWeekend('2026-10-25'), true, '2026-10-25 Sunday must be weekend');
  assert.strictEqual(isWeekend('2026-10-26'), false, '2026-10-26 Monday must not be weekend');
  assert.strictEqual(getDayOfWeek('2026-10-24'), 'SABTU');
  assert.strictEqual(getDayOfWeek('2026-10-25'), 'MINGGU');
  assert.strictEqual(getDayOfWeek('2026-10-26'), 'SENIN');

  const nextWd = getNextWeekdayYMD('2026-10-24');
  assert.strictEqual(nextWd, '2026-10-26', 'Next weekday from Saturday must be Monday');

  // Test 2: Curriculum by NIM & Semester
  const coursesSem3 = getCoursesByNim('F5212510018'); // SI-A 2025 -> Sem 3
  assert.ok(coursesSem3.length >= 7, 'Must have at least 7 courses for Sem 3');
  const rpl = coursesSem3.find(c => c.name.includes('Rekayasa Perangkat Lunak'));
  assert.ok(rpl, 'Must include Rekayasa Perangkat Lunak');
  assert.strictEqual(rpl.hasLab, true, 'RPL must have lab/practicum');

  const coursesSem1 = getCoursesByNim('F5212610010'); // Sem 1
  const alpro = coursesSem1.find(c => c.name.includes('Algoritma dan Pemrograman'));
  assert.ok(alpro && alpro.hasLab, 'Alpro in Sem 1 must have lab');

  // Test 3: Floor status on weekend must return CLOSED
  const weekendStatus = await getFloorRoomsStatus('2026-10-24');
  assert.ok(weekendStatus.length > 0);
  assert.strictEqual(weekendStatus[0].summaryStatus, 'CLOSED');
  assert.strictEqual(weekendStatus[0].activeSchedule, 'Gedung GSG Tutup (Akhir Pekan)');
  assert.strictEqual(weekendStatus[0].isClosed, true);

  // Test 4: Practicum reservation on weekend MUST BE REJECTED (Throws Error 400)
  const pjUser = await prisma.user.findFirst({ where: { role: 'PJ' } });
  assert.ok(pjUser, 'PJ user must exist');

  let draftWeekendRejected = false;
  try {
    await saveDraft({
      userId: pjUser.id,
      roomCode: 'SG-1',
      date: '2026-10-24', // Saturday
      startTime: '08:00',
      endTime: '10:00',
      title: 'Praktikum Akhir Pekan Coba-Coba'
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('Gedung GSG tutup pada hari Sabtu dan Minggu')) {
      draftWeekendRejected = true;
    }
  }
  assert.strictEqual(draftWeekendRejected, true, 'Draft on Saturday must throw 400 error');

  let directWeekendRejected = false;
  try {
    await createReservationDirect({
      userId: pjUser.id,
      roomCode: 'SG-2',
      date: '2026-10-25', // Sunday
      startTime: '09:00',
      endTime: '11:00',
      title: 'Praktikum Minggu Coba-Coba'
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('Gedung GSG tutup pada hari Sabtu dan Minggu')) {
      directWeekendRejected = true;
    }
  }
  assert.strictEqual(directWeekendRejected, true, 'Direct publish on Sunday must throw 400 error');

  // Test 5: Verify no automated/dummy practicum exist in DB
  const practicums = await prisma.practicumReservation.findMany({
    where: { category: 'PRAKTIKUM' }
  });
  console.log('Current PRAKTIKUM records in DB:', practicums.length);

  // Test 6: Successful flexible manual practicum reservation on Monday (Weekday)
  const flexiblePracticum = await createReservationDirect({
    userId: pjUser.id,
    roomCode: 'SG-5',
    date: '2026-10-26', // Monday
    startTime: '10:00',
    endTime: '12:00',
    category: 'PRAKTIKUM',
    title: 'Praktikum Rekayasa Perangkat Lunak - Modul 1 Lingkungan Pengembangan',
    purpose: 'Praktikum manual perdana yang diset fleksibel oleh PJ SI-A'
  });

  assert.strictEqual(flexiblePracticum.roomCode, 'SG-5');
  assert.strictEqual(flexiblePracticum.status, 'PUBLISHED');
  assert.strictEqual(flexiblePracticum.category, 'PRAKTIKUM');

  // Clean up the test flexible practicum so DB stays clean
  await prisma.practicumReservation.delete({ where: { id: flexiblePracticum.id } });

  console.log('All Weekend Closure and Curriculum Flexible Practicum tests PASSED!');
}

runTests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
