const assert = require('assert');
const { authenticateUser } = require('../src/services/authService');
const { borrowProjector, returnProjector } = require('../src/services/projectorService');
const { saveDraft, publishReservation } = require('../src/services/practicumService');
const prisma = require('../src/db');

async function testFixes() {
  console.log('--- Testing Final Review Fixes ---');

  // Clean up any test data from previous runs
  await prisma.projectorLoan.deleteMany({
    where: { borrowerName: 'Tester' }
  });
  await prisma.practicumReservation.deleteMany({
    where: { title: { in: ['Draft Res', 'Invalid Times'] } }
  });

  // Fix 1: Empty password must fail
  let emptyPassFailed = false;
  try {
    await authenticateUser('petugas', '');
  } catch (err) {
    emptyPassFailed = true;
  }
  assert(emptyPassFailed, 'Empty password must be rejected');

  // Fix 2: Inverted reservation time (14:00 to 10:00) must fail
  let invertedFailed = false;
  try {
    await saveDraft({
      roomCode: 'SG-1',
      date: '2026-10-30',
      startTime: '14:00',
      endTime: '10:00',
      title: 'Invalid Times'
    });
  } catch (err) {
    invertedFailed = true;
  }
  assert(invertedFailed, 'Inverted timeslot must be rejected');

  // Fix 3: Borrow projector with DRAFT reservation must fail
  const draftRes = await saveDraft({
    roomCode: 'SG-2',
    date: '2026-10-30',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Draft Res'
  });

  let borrowDraftFailed = false;
  try {
    await borrowProjector({
      projectorCode: '03',
      reservationId: draftRes.id,
      borrowerName: 'Tester'
    });
  } catch (err) {
    borrowDraftFailed = true;
  }
  assert(borrowDraftFailed, 'Borrowing with DRAFT reservation must fail');

  // Fix 4: Projector condition notes "Kondisi baik, tidak rusak" should NOT mark as BROKEN
  // Publish a reservation first
  const pubRes = await publishReservation(draftRes.id);
  const loan = await borrowProjector({
    projectorCode: '04',
    reservationId: pubRes.id,
    borrowerName: 'Tester'
  });
  await returnProjector(loan.id, 'Kondisi baik, tidak rusak', false);
  const prj = await prisma.projector.findUnique({ where: { code: '04' } });
  assert.strictEqual(prj.status, 'AVAILABLE', 'Projector with isDamaged=false must be AVAILABLE');

  console.log('All final review fix tests passed.');
  await prisma.$disconnect();
}

testFixes().catch(err => {
  console.error(err);
  process.exit(1);
});
