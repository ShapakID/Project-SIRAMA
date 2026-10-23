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

  // 2. Seed Rooms
  const rooms = [
    { code: 'SG-5', name: 'Gedung Serbaguna Ruang 5', capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-6', name: 'Gedung Serbaguna Ruang 6', capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-7', name: 'Gedung Serbaguna Ruang 7', capacity: 50, facilities: 'AC, Whiteboard, Sound System' },
    { code: 'JTI-1', name: 'Jurusan TI Ruang 1', capacity: 40, facilities: 'AC, Whiteboard' },
    { code: 'JTI-2', name: 'Jurusan TI Ruang 2', capacity: 40, facilities: 'AC, Whiteboard' }
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
