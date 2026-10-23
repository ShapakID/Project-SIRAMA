const assert = require('assert');
const { borrowProjector, returnProjector } = require('../src/services/projectorService');
const { submitDamageReport } = require('../src/services/damageReportService');

async function testProjectorAndReports() {
  // 1. Cannot borrow without valid reservation
  let loanRejected = false;
  try {
    await borrowProjector({ projectorCode: '01', reservationId: null, borrowerName: 'Shapak' });
  } catch (err) {
    loanRejected = true;
  }
  assert(loanRejected, 'Borrowing projector without reservation must fail');

  // 2. Damage report creation
  const report = await submitDamageReport({
    targetType: 'PROJECTOR',
    targetCode: '02',
    reporterName: 'Shapak',
    description: 'Lampu proyektor redup dan mati mendadak'
  });
  assert(report.status === 'PENDING', 'New report must have status PENDING');
  console.log('Task 6 Projector and damage report test passed.');
}

testProjectorAndReports().catch(err => {
  console.error(err);
  process.exit(1);
});
