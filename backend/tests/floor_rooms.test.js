const assert = require('assert');
const { getFloorRoomsStatus } = require('../src/services/availabilityService');

async function testFloorStatus() {
  const rooms = await getFloorRoomsStatus('2026-10-26');
  assert(Array.isArray(rooms), 'Rooms should be an array');
  assert.strictEqual(rooms.length, 12, 'Must have exactly 12 GSG rooms');

  // Verify Floor 1 rooms
  const floor1 = rooms.filter(r => r.floor === 1);
  assert.strictEqual(floor1.length, 6, 'Floor 1 must have 6 rooms');
  const floor1Codes = floor1.map(r => r.displayCode);
  ['SG 01', 'SG 02', 'SG 03', 'SG 04', 'SG 05', 'SG 06'].forEach(code => {
    assert(floor1Codes.includes(code), `Floor 1 must contain ${code}`);
  });

  // Verify Floor 2 rooms
  const floor2 = rooms.filter(r => r.floor === 2);
  assert.strictEqual(floor2.length, 6, 'Floor 2 must have 6 rooms');
  const floor2Codes = floor2.map(r => r.displayCode);
  ['SG 07', 'SG 08', 'SG 09', 'SG 10', 'SG 11', 'Lab-Komputer'].forEach(code => {
    assert(floor2Codes.includes(code), `Floor 2 must contain ${code}`);
  });

  // Verify no JTI rooms
  assert(!rooms.some(r => r.code.includes('JTI')), 'JTI must not exist in GSG rooms');

  console.log('Floor rooms status test passed successfully.');
}

testFloorStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
