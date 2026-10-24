const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

async function testSchemaAndSeed() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  const projectors = await prisma.projector.findMany();
  const rooms = await prisma.room.findMany();

  const gsgProjectors = projectors.filter(p => p.building === 'GSG');
  const jtiProjectors = projectors.filter(p => p.building === 'JTI');
  const gsgRooms = rooms.filter(r => r.building === 'GSG');
  const jtiRooms = rooms.filter(r => r.building === 'JTI');

  assert(users.length >= 3, 'Should seed at least 2 PJs and 1 Petugas');
  assert(gsgProjectors.length === 11, 'Should seed exactly 11 GSG projectors (01-11)');
  assert(jtiProjectors.length === 3, 'Should seed exactly 3 JTI projectors (JTI-01 to JTI-03)');
  assert(gsgRooms.length === 12, 'Should seed 12 GSG rooms (SG 01-SG 12 / Lab-Komputer)');
  assert(jtiRooms.length === 4, 'Should seed 4 JTI rooms (JTI 1, Lab-JTI, JTI 2, JTI 3)');
  assert(!gsgRooms.some(r => r.code.startsWith('JTI')), 'JTI must not be in GSG rooms');
  console.log('Task 1 schema and seed test passed.');
  await prisma.$disconnect();
}

testSchemaAndSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
