const assert = require('assert');
const prisma = require('../src/db');
const { saveDraft, publishReservation } = require('../src/services/practicumService');

async function testPracticum() {
  // Clean up previous test runs
  await prisma.practicumReservation.deleteMany({
    where: { roomCode: 'SG-5', date: '2026-10-27' }
  });

  const draft = await saveDraft({
    userId: 'pj-1',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar',
    roomCode: 'SG-5',
    date: '2026-10-27',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Praktikum RPL'
  });
  assert(draft.status === 'DRAFT', 'Newly created reservation should be DRAFT');

  const published = await publishReservation(draft.id);
  assert(published.status === 'PUBLISHED', 'Reservation should be PUBLISHED');

  // Second publish on same slot must throw 409 conflict
  let collided = false;
  try {
    const draft2 = await saveDraft({
      userId: 'pj-2',
      pjNim: 'F5212520039',
      pjName: 'Moh. Daffa',
      roomCode: 'SG-5',
      date: '2026-10-27',
      startTime: '11:00',
      endTime: '13:00',
      title: 'Praktikum Bentrok'
    });
    await publishReservation(draft2.id);
  } catch (err) {
    collided = err.status === 409 || err.message.includes('Conflict');
  }
  assert(collided, 'Overlapping publish must be rejected with Conflict');
  console.log('Task 5 Practicum draft & publish test passed.');
  await prisma.$disconnect();
}

testPracticum().catch(err => {
  console.error(err);
  process.exit(1);
});
