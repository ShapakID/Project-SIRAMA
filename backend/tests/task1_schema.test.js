const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

async function testSchemaAndSeed() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  const projectors = await prisma.projector.findMany();
  const rooms = await prisma.room.findMany();

  assert(users.length >= 3, 'Should seed at least 2 PJs and 1 Petugas');
  assert(projectors.length === 11, 'Should seed exactly 11 projectors (01-11)');
  assert(rooms.length >= 5, 'Should seed SG 5, SG 6, SG 7, JTI-1, JTI-2');
  console.log('Task 1 schema and seed test passed.');
  await prisma.$disconnect();
}

testSchemaAndSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
