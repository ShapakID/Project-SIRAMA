const assert = require('assert');
const prisma = require('../src/db');
const { getFloorRoomsStatus, getRoomAvailability } = require('../src/services/availabilityService');
const {
  getProjectors,
  borrowProjector,
  returnProjector,
  returnProjectorByCode
} = require('../src/services/projectorService');
const { createReservationDirect } = require('../src/services/practicumService');

async function runJtiAndReturnFlowTests() {
  console.log('Testing JTI Building Isolation & Projector Return Flow with Room Release...');

  // Pre-cleanup any leftover test reservations
  await prisma.practicumReservation.deleteMany({
    where: {
      title: {
        in: [
          'Praktikum GSG Testing Cross-Building',
          'Praktikum JTI Testing Cross-Building',
          'Praktikum Jauh Hari'
        ]
      }
    }
  });

  // 1. Verify Rooms and Projectors in JTI
  const jtiRooms = await prisma.room.findMany({ where: { building: 'JTI' }, orderBy: { code: 'asc' } });
  assert.strictEqual(jtiRooms.length, 4, 'Must have 4 JTI rooms');
  const expectedCodes = ['JTI-1', 'JTI-2', 'JTI-3', 'Lab-JTI'];
  for (const c of expectedCodes) {
    assert.ok(jtiRooms.some(r => r.code === c), `Missing room ${c} in JTI`);
  }

  const jtiProjectors = await getProjectors('JTI');
  assert.strictEqual(jtiProjectors.length, 3, 'Must have 3 JTI projectors');
  assert.deepStrictEqual(jtiProjectors.map(p => p.code), ['JTI-01', 'JTI-02', 'JTI-03']);

  // 2. Floor Status for JTI
  const floorJti = await getFloorRoomsStatus('2026-10-26', 'JTI');
  assert.strictEqual(floorJti.length, 4, 'Floor status JTI must return 4 rooms');
  assert.ok(floorJti.every(r => r.building === 'JTI'));

  // 3. Test Cross-Building Borrowing Constraint
  // Create a reservation in GSG room (SG-10) and JTI room (JTI-3)
  const gsgRes = await createReservationDirect({
    roomCode: 'SG-10',
    date: '2026-10-27',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Praktikum GSG Testing Cross-Building',
    category: 'PRAKTIKUM',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar'
  });

  const jtiRes = await createReservationDirect({
    roomCode: 'JTI-3',
    date: '2026-10-27',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Praktikum JTI Testing Cross-Building',
    category: 'PRAKTIKUM',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar'
  });

  // Attempt 1: GSG Room tries to borrow JTI projector -> MUST FAIL
  let crossFailed1 = false;
  try {
    await borrowProjector({
      projectorCode: 'JTI-01',
      reservationId: gsgRes.id,
      borrowerName: 'Shafairunizar',
      borrowerNim: 'F5212510018'
    });
  } catch (err) {
    crossFailed1 = true;
    assert.ok(err.message.includes('Gedung JTI'), 'Error should specify building mismatch');
  }
  assert.ok(crossFailed1, 'GSG room must not be allowed to borrow JTI projector');

  // Attempt 2: JTI Room tries to borrow GSG projector -> MUST FAIL
  let crossFailed2 = false;
  try {
    await borrowProjector({
      projectorCode: '02',
      reservationId: jtiRes.id,
      borrowerName: 'Shafairunizar',
      borrowerNim: 'F5212510018'
    });
  } catch (err) {
    crossFailed2 = true;
    assert.ok(err.message.includes('Gedung GSG') || err.message.includes('Gedung JTI'));
  }
  assert.ok(crossFailed2, 'JTI room must not be allowed to borrow GSG projector');

  // 3b. Test H-3 borrowing rule: borrow attempt > 3 days before reservation must be rejected
  const farFutureRes = await createReservationDirect({
    roomCode: 'JTI-3',
    date: '2026-11-16',
    startTime: '08:00',
    endTime: '10:00',
    category: 'PRAKTIKUM',
    title: 'Praktikum Jauh Hari',
    pjNim: 'F5212510018',
    pjName: 'Shafairunizar'
  });

  let h3Rejected = false;
  try {
    await borrowProjector({
      projectorCode: 'JTI-01',
      reservationId: farFutureRes.id,
      borrowerName: 'Shafairunizar',
      borrowerNim: 'F5212510018'
    });
  } catch (err) {
    h3Rejected = true;
    assert.ok(err.message.includes('mendekati hari H') || err.message.includes('H-3'), 'Error message must specify H-3 constraint');
  }
  assert.ok(h3Rejected, 'Borrowing projector > 3 days before reservation date must be rejected');
  await prisma.practicumReservation.delete({ where: { id: farFutureRes.id } });

  // 4. Valid Borrowing for JTI (within H-3)
  const validLoan = await borrowProjector({
    projectorCode: 'JTI-01',
    reservationId: jtiRes.id,
    borrowerName: 'Shafairunizar',
    borrowerNim: 'F5212510018'
  });
  assert.strictEqual(validLoan.status, 'BORROWED');
  assert.strictEqual(validLoan.projectorCode, 'JTI-01');

  // Verify projector status is IN_USE
  const projAfterBorrow = await prisma.projector.findUnique({ where: { code: 'JTI-01' } });
  assert.strictEqual(projAfterBorrow.status, 'IN_USE');

  // 5. Test Integrated Return & Room Release:
  // User directive: "biasa nya sih klo kembalikan proyektor biasanya itu sekalian sama lepas reservasi ruangan."
  const returnRes = await returnProjectorByCode('JTI-01', 'Kondisi mulus, pemakaian selesai', false, true);
  assert.strictEqual(returnRes.status, 'RETURNED');
  assert.strictEqual(returnRes.reservationReleased, true);

  // Verify projector status returned to AVAILABLE
  const projAfterReturn = await prisma.projector.findUnique({ where: { code: 'JTI-01' } });
  assert.strictEqual(projAfterReturn.status, 'AVAILABLE');

  // Verify reservation status changed to COMPLETED
  const resAfterReturn = await prisma.practicumReservation.findUnique({ where: { id: jtiRes.id } });
  assert.strictEqual(resAfterReturn.status, 'COMPLETED');

  // Room JTI-3 should now be free from this reservation in getRoomAvailability!
  const slotsJTI3 = await getRoomAvailability('JTI-3', '2026-10-27');
  const stillOccupied = slotsJTI3.some(s => s.id === jtiRes.id);
  assert.strictEqual(stillOccupied, false, 'Completed reservation must no longer occupy the room slot');

  // Cleanup test reservations
  await prisma.projectorLoan.deleteMany({ where: { id: validLoan.id } });
  await prisma.practicumReservation.deleteMany({ where: { id: { in: [gsgRes.id, jtiRes.id] } } });

  console.log('All JTI Building and Return Flow with Room Release tests PASSED successfully!');
  await prisma.$disconnect();
}

runJtiAndReturnFlowTests().catch(err => {
  console.error(err);
  process.exit(1);
});
