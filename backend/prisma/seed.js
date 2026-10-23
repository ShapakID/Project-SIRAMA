const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial SIRAMA data...');

  // 1. Seed Users
  const users = [
    {
      nim: 'F5212510018',
      name: 'Shafairunizar Neirabista Ekazura',
      role: 'PJ',
      password: 'password123'
    },
    {
      nim: 'F5212520039',
      name: 'Moh. Daffa Setiawan',
      role: 'PJ',
      password: 'password123'
    },
    {
      nim: 'petugas',
      name: 'Petugas GSG',
      role: 'PETUGAS',
      password: 'password123'
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { nim: u.nim },
      update: u,
      create: u
    });
  }

  // 2. Clean old JTI rooms and seed 12 GSG Rooms (SG 01 - SG 12 / Lab-Komputer)
  await prisma.room.deleteMany({
    where: { code: { in: ['JTI-1', 'JTI-2'] } }
  });
  await prisma.weeklySchedule.deleteMany({
    where: { roomCode: { in: ['JTI-1', 'JTI-2'] } }
  });

  const rooms = [
    // Lantai 1
    { code: 'SG-1', name: 'Ruang SG 01', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-2', name: 'Ruang SG 02', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-3', name: 'Ruang SG 03', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-4', name: 'Ruang SG 04', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-5', name: 'Ruang SG 05', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-6', name: 'Ruang SG 06', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    // Lantai 2
    { code: 'SG-7', name: 'Ruang SG 07', floor: 2, capacity: 50, facilities: 'AC, Whiteboard, Sound System' },
    { code: 'SG-8', name: 'Ruang SG 08', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-9', name: 'Ruang SG 09', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-10', name: 'Ruang SG 10', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-11', name: 'Ruang SG 11', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'Lab-Komputer', name: 'Lab Komputer GSG (SG 12)', floor: 2, capacity: 40, facilities: 'AC, PC Workstation, Whiteboard, Proyektor Fixed' }
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { code: r.code },
      update: r,
      create: r
    });
  }

  // 3. Seed 11 Projectors
  for (let i = 1; i <= 11; i++) {
    const code = String(i).padStart(2, '0');
    await prisma.projector.upsert({
      where: { code },
      update: { status: 'AVAILABLE' },
      create: {
        code,
        status: 'AVAILABLE',
        notes: `Unit Proyektor GSG No. ${code}`
      }
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
