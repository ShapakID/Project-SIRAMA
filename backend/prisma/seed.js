const { PrismaClient } = require('@prisma/client');
const { MASTER_SCHEDULES } = require('./schedules_data');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial SIRAMA data...');

  // 1. Seed Users (12 PJ Kelas SI Untad + Petugas GSG)
  const users = [
    // Angkatan 2026 (Semester 1)
    { nim: 'F5212610010', name: 'PJ SI-A 2026', role: 'PJ', password: 'password123' },
    { nim: 'F5212610050', name: 'PJ SI-B 2026', role: 'PJ', password: 'password123' },
    { nim: 'F5212610090', name: 'PJ SI-C 2026', role: 'PJ', password: 'password123' },

    // Angkatan 2025 (Semester 3)
    { nim: 'F5212510018', name: 'Shafairunizar Neirabista Ekazura (PJ SI-A 2025)', role: 'PJ', password: 'password123' },
    { nim: 'F5212520039', name: 'Moh. Daffa Setiawan (PJ SI-A 2025)', role: 'PJ', password: 'password123' },
    { nim: 'F5212510050', name: 'PJ SI-B 2025', role: 'PJ', password: 'password123' },
    { nim: 'F5212510090', name: 'PJ SI-C 2025', role: 'PJ', password: 'password123' },

    // Angkatan 2024 (Semester 5)
    { nim: 'F5212410010', name: 'PJ SI-A 2024', role: 'PJ', password: 'password123' },
    { nim: 'F5212410050', name: 'PJ SI-B 2024', role: 'PJ', password: 'password123' },
    { nim: 'F5212410090', name: 'PJ SI-C 2024', role: 'PJ', password: 'password123' },

    // Angkatan 2023 (Semester 7)
    { nim: 'F5212310010', name: 'PJ SI-A 2023', role: 'PJ', password: 'password123' },
    { nim: 'F5212310050', name: 'PJ SI-B 2023', role: 'PJ', password: 'password123' },
    { nim: 'F5212310090', name: 'PJ SI-C 2023', role: 'PJ', password: 'password123' },

    // Petugas GSG
    { nim: 'petugas', name: 'Petugas GSG FT UNTAD', role: 'PETUGAS', password: 'password123' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { nim: u.nim },
      update: u,
      create: u
    });
  }

  // 2. Seed Rooms (12 GSG Rooms & 4 JTI Rooms)
  const rooms = [
    // Gedung GSG - Lantai 1
    { code: 'SG-1', name: 'Ruang SG 01', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-2', name: 'Ruang SG 02', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-3', name: 'Ruang SG 03', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-4', name: 'Ruang SG 04', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-5', name: 'Ruang SG 05', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-6', name: 'Ruang SG 06', building: 'GSG', floor: 1, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    // Gedung GSG - Lantai 2
    { code: 'SG-7', name: 'Ruang SG 07', building: 'GSG', floor: 2, capacity: 50, facilities: 'AC, Whiteboard, Sound System' },
    { code: 'SG-8', name: 'Ruang SG 08', building: 'GSG', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-9', name: 'Ruang SG 09', building: 'GSG', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-10', name: 'Ruang SG 10', building: 'GSG', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'SG-11', name: 'Ruang SG 11', building: 'GSG', floor: 2, capacity: 45, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'Lab-Komputer', name: 'Lab Komputer GSG (SG 12)', building: 'GSG', floor: 2, capacity: 40, facilities: 'AC, PC Workstation, Whiteboard, Proyektor Fixed' },
    // Gedung JTI (Jurusan Teknologi Informasi)
    // Lantai 1: JTI 1 & Lab Komputer JTI
    { code: 'JTI-1', name: 'Ruang JTI 01', building: 'JTI', floor: 1, capacity: 40, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'Lab-JTI', name: 'Lab Komputer JTI', building: 'JTI', floor: 1, capacity: 35, facilities: 'AC, PC Workstation, Whiteboard' },
    // Lantai 2: JTI 2 & JTI 3
    { code: 'JTI-2', name: 'Ruang JTI 02', building: 'JTI', floor: 2, capacity: 40, facilities: 'AC, Whiteboard, Speaker' },
    { code: 'JTI-3', name: 'Ruang JTI 03', building: 'JTI', floor: 2, capacity: 40, facilities: 'AC, Whiteboard, Speaker' }
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { code: r.code },
      update: r,
      create: r
    });
  }

  // 3. Seed 54 Master Schedules for 12 classes (WITA)
  // First clear old schedules to ensure clean sync
  await prisma.weeklySchedule.deleteMany({});
  for (const s of MASTER_SCHEDULES) {
    await prisma.weeklySchedule.create({
      data: s
    });
  }
  console.log(`Seeded ${MASTER_SCHEDULES.length} weekly KBM schedules (WITA).`);

  // 4. Seed 11 GSG Projectors
  for (let i = 1; i <= 11; i++) {
    const code = String(i).padStart(2, '0');
    await prisma.projector.upsert({
      where: { code },
      update: { status: 'AVAILABLE', building: 'GSG' },
      create: {
        code,
        building: 'GSG',
        status: 'AVAILABLE',
        notes: `Unit Proyektor GSG No. ${code}`
      }
    });
  }

  // 5. Seed 3 JTI Projectors
  const jtiProjectors = ['JTI-01', 'JTI-02', 'JTI-03'];
  for (const code of jtiProjectors) {
    await prisma.projector.upsert({
      where: { code },
      update: { status: 'AVAILABLE', building: 'JTI' },
      create: {
        code,
        building: 'JTI',
        status: 'AVAILABLE',
        notes: `Unit Proyektor Gedung JTI No. ${code}`
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
