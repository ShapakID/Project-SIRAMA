// Master recurring weekly schedule for 12 classes (Angkatan 2023-2026, Kelas A, B, C)
// All times in WITA (UTC+8). SG 01 - SG 12 / Lab-Komputer.

const MASTER_SCHEDULES = [
  // --- ANGKATAN 2025 (SEMESTER 3) ---
  // SI-A 2025 (Sesuai SIGA Excel asli + jadwal tambahan)
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '15:30', courseName: 'Keamanan Sistem Informasi (SI-A 2025)', sks: 4, roomCode: 'SG-7', lecturer: 'Rizka Ardiansyah, S.Kom., M.Kom.' },
  { dayOfWeek: 'SELASA', startTime: '13:00', endTime: '15:30', courseName: 'Analisis & Perancangan SI (SI-A 2025)', sks: 4, roomCode: 'SG-6', lecturer: 'Syahrullah, M.Kom.' },
  { dayOfWeek: 'KAMIS', startTime: '13:00', endTime: '14:20', courseName: 'Bahasa Inggris (SI-A 2025)', sks: 2, roomCode: 'SG-5', lecturer: 'Oktaviani, S.Pd., M.Pd.' },
  { dayOfWeek: 'SENIN', startTime: '07:30', endTime: '10:00', courseName: 'Kecerdasan Artifisial (SI-A 2025)', sks: 4, roomCode: 'SG-1', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'RABU', startTime: '10:00', endTime: '12:30', courseName: 'Rekayasa Perangkat Lunak (SI-A 2025)', sks: 4, roomCode: 'SG-3', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'JUMAT', startTime: '07:30', endTime: '10:00', courseName: 'Tata Kelola TI (SI-A 2025)', sks: 4, roomCode: 'SG-2', lecturer: 'Hariyanto, S.Kom., M.Cs.' },

  // SI-B 2025 (Sem 3)
  { dayOfWeek: 'SENIN', startTime: '07:30', endTime: '10:00', courseName: 'Keamanan Sistem Informasi (SI-B 2025)', sks: 4, roomCode: 'SG-2', lecturer: 'Rizka Ardiansyah, S.Kom., M.Kom.' },
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Kecerdasan Artifisial (SI-B 2025)', sks: 4, roomCode: 'SG-1', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'SELASA', startTime: '07:30', endTime: '10:00', courseName: 'Analisis & Perancangan SI (SI-B 2025)', sks: 4, roomCode: 'SG-4', lecturer: 'Syahrullah, M.Kom.' },
  { dayOfWeek: 'RABU', startTime: '13:00', endTime: '15:30', courseName: 'Rekayasa Perangkat Lunak (SI-B 2025)', sks: 4, roomCode: 'SG-3', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'KAMIS', startTime: '07:30', endTime: '09:10', courseName: 'Bahasa Inggris (SI-B 2025)', sks: 2, roomCode: 'SG-5', lecturer: 'Oktaviani, S.Pd., M.Pd.' },
  { dayOfWeek: 'JUMAT', startTime: '13:30', endTime: '16:00', courseName: 'Tata Kelola TI (SI-B 2025)', sks: 4, roomCode: 'SG-2', lecturer: 'Hariyanto, S.Kom., M.Cs.' },

  // SI-C 2025 (Sem 3)
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Keamanan Sistem Informasi (SI-C 2025)', sks: 4, roomCode: 'SG-2', lecturer: 'Rizka Ardiansyah, S.Kom., M.Kom.' },
  { dayOfWeek: 'SELASA', startTime: '10:15', endTime: '12:45', courseName: 'Kecerdasan Artifisial (SI-C 2025)', sks: 4, roomCode: 'SG-1', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'RABU', startTime: '07:30', endTime: '10:00', courseName: 'Analisis & Perancangan SI (SI-C 2025)', sks: 4, roomCode: 'SG-4', lecturer: 'Syahrullah, M.Kom.' },
  { dayOfWeek: 'KAMIS', startTime: '10:15', endTime: '12:45', courseName: 'Rekayasa Perangkat Lunak (SI-C 2025)', sks: 4, roomCode: 'SG-3', lecturer: 'Anita Ahmad Kasim, S.Kom., M.Cs.' },
  { dayOfWeek: 'KAMIS', startTime: '15:00', endTime: '16:40', courseName: 'Bahasa Inggris (SI-C 2025)', sks: 2, roomCode: 'SG-5', lecturer: 'Oktaviani, S.Pd., M.Pd.' },
  { dayOfWeek: 'JUMAT', startTime: '07:30', endTime: '10:00', courseName: 'Tata Kelola TI (SI-C 2025)', sks: 4, roomCode: 'SG-8', lecturer: 'Hariyanto, S.Kom., M.Cs.' },

  // --- ANGKATAN 2026 (SEMESTER 1) ---
  // SI-A 2026
  { dayOfWeek: 'SENIN', startTime: '07:30', endTime: '10:00', courseName: 'Algoritma & Pemrograman (SI-A 2026)', sks: 4, roomCode: 'Lab-Komputer', lecturer: 'Fadlan, S.Kom., M.Cs.' },
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Pengantar Sistem Informasi (SI-A 2026)', sks: 3, roomCode: 'SG-3', lecturer: 'Dr. Supriyanto, S.Kom., M.T.' },
  { dayOfWeek: 'SELASA', startTime: '07:30', endTime: '10:00', courseName: 'Matematika Dasar (SI-A 2026)', sks: 3, roomCode: 'SG-1', lecturer: 'Drs. Usman, M.Si.' },
  { dayOfWeek: 'RABU', startTime: '07:30', endTime: '10:00', courseName: 'Logika Diskrit (SI-A 2026)', sks: 3, roomCode: 'SG-2', lecturer: 'Ir. Ahmad Syafiq, M.T.' },
  { dayOfWeek: 'KAMIS', startTime: '07:30', endTime: '10:00', courseName: 'Manajemen & Organisasi (SI-A 2026)', sks: 3, roomCode: 'SG-1', lecturer: 'Dra. Nur Indah, M.M.' },

  // SI-B 2026
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Algoritma & Pemrograman (SI-B 2026)', sks: 4, roomCode: 'Lab-Komputer', lecturer: 'Fadlan, S.Kom., M.Cs.' },
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '15:30', courseName: 'Pengantar Sistem Informasi (SI-B 2026)', sks: 3, roomCode: 'SG-3', lecturer: 'Dr. Supriyanto, S.Kom., M.T.' },
  { dayOfWeek: 'SELASA', startTime: '10:15', endTime: '12:45', courseName: 'Matematika Dasar (SI-B 2026)', sks: 3, roomCode: 'SG-2', lecturer: 'Drs. Usman, M.Si.' },
  { dayOfWeek: 'RABU', startTime: '10:15', endTime: '12:45', courseName: 'Logika Diskrit (SI-B 2026)', sks: 3, roomCode: 'SG-2', lecturer: 'Ir. Ahmad Syafiq, M.T.' },
  { dayOfWeek: 'KAMIS', startTime: '10:15', endTime: '12:45', courseName: 'Manajemen & Organisasi (SI-B 2026)', sks: 3, roomCode: 'SG-1', lecturer: 'Dra. Nur Indah, M.M.' },

  // SI-C 2026
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '15:30', courseName: 'Algoritma & Pemrograman (SI-C 2026)', sks: 4, roomCode: 'Lab-Komputer', lecturer: 'Fadlan, S.Kom., M.Cs.' },
  { dayOfWeek: 'SELASA', startTime: '07:30', endTime: '10:00', courseName: 'Pengantar Sistem Informasi (SI-C 2026)', sks: 3, roomCode: 'SG-3', lecturer: 'Dr. Supriyanto, S.Kom., M.T.' },
  { dayOfWeek: 'RABU', startTime: '13:00', endTime: '15:30', courseName: 'Matematika Dasar (SI-C 2026)', sks: 3, roomCode: 'SG-1', lecturer: 'Drs. Usman, M.Si.' },
  { dayOfWeek: 'KAMIS', startTime: '13:00', endTime: '15:30', courseName: 'Logika Diskrit (SI-C 2026)', sks: 3, roomCode: 'SG-2', lecturer: 'Ir. Ahmad Syafiq, M.T.' },
  { dayOfWeek: 'JUMAT', startTime: '07:30', endTime: '10:00', courseName: 'Manajemen & Organisasi (SI-C 2026)', sks: 3, roomCode: 'SG-4', lecturer: 'Dra. Nur Indah, M.M.' },

  // --- ANGKATAN 2024 (SEMESTER 5) ---
  // SI-A 2024
  { dayOfWeek: 'SENIN', startTime: '07:30', endTime: '10:00', courseName: 'Pemrograman Mobile (SI-A 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Rahman Pratama, S.Kom., M.T.' },
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Kecerdasan Bisnis (SI-A 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Dr. Hendra Saputra, M.Kom.' },
  { dayOfWeek: 'SELASA', startTime: '07:30', endTime: '10:00', courseName: 'Transformasi Digital (SI-A 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Ir. Maya Safitri, M.T.' },
  { dayOfWeek: 'RABU', startTime: '07:30', endTime: '10:00', courseName: 'Audit Sistem Informasi (SI-A 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Bambang Irawan, M.Kom.' },
  { dayOfWeek: 'KAMIS', startTime: '07:30', endTime: '10:00', courseName: 'Penjaminan Mutu SI (SI-A 2024)', sks: 3, roomCode: 'SG-8', lecturer: 'Dian Permata, S.Kom., M.Cs.' },

  // SI-B 2024
  { dayOfWeek: 'SENIN', startTime: '10:15', endTime: '12:45', courseName: 'Pemrograman Mobile (SI-B 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Rahman Pratama, S.Kom., M.T.' },
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '15:30', courseName: 'Kecerdasan Bisnis (SI-B 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Dr. Hendra Saputra, M.Kom.' },
  { dayOfWeek: 'SELASA', startTime: '10:15', endTime: '12:45', courseName: 'Transformasi Digital (SI-B 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Ir. Maya Safitri, M.T.' },
  { dayOfWeek: 'RABU', startTime: '10:15', endTime: '12:45', courseName: 'Audit Sistem Informasi (SI-B 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Bambang Irawan, M.Kom.' },
  { dayOfWeek: 'KAMIS', startTime: '10:15', endTime: '12:45', courseName: 'Penjaminan Mutu SI (SI-B 2024)', sks: 3, roomCode: 'SG-8', lecturer: 'Dian Permata, S.Kom., M.Cs.' },

  // SI-C 2024
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '15:30', courseName: 'Pemrograman Mobile (SI-C 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Rahman Pratama, S.Kom., M.T.' },
  { dayOfWeek: 'SELASA', startTime: '13:00', endTime: '15:30', courseName: 'Transformasi Digital (SI-C 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Ir. Maya Safitri, M.T.' },
  { dayOfWeek: 'RABU', startTime: '13:00', endTime: '15:30', courseName: 'Kecerdasan Bisnis (SI-C 2024)', sks: 4, roomCode: 'SG-8', lecturer: 'Dr. Hendra Saputra, M.Kom.' },
  { dayOfWeek: 'KAMIS', startTime: '13:00', endTime: '15:30', courseName: 'Audit Sistem Informasi (SI-C 2024)', sks: 4, roomCode: 'SG-9', lecturer: 'Bambang Irawan, M.Kom.' },
  { dayOfWeek: 'JUMAT', startTime: '13:30', endTime: '16:00', courseName: 'Penjaminan Mutu SI (SI-C 2024)', sks: 3, roomCode: 'SG-8', lecturer: 'Dian Permata, S.Kom., M.Cs.' },

  // --- ANGKATAN 2023 (SEMESTER 7) ---
  { dayOfWeek: 'SENIN', startTime: '07:30', endTime: '09:10', courseName: 'Etika Profesi (SI-A 2023)', sks: 2, roomCode: 'SG-10', lecturer: 'Dr. Ir. Wahyudi, M.Sc.' },
  { dayOfWeek: 'SENIN', startTime: '09:30', endTime: '11:10', courseName: 'Etika Profesi (SI-B 2023)', sks: 2, roomCode: 'SG-10', lecturer: 'Dr. Ir. Wahyudi, M.Sc.' },
  { dayOfWeek: 'SENIN', startTime: '13:00', endTime: '14:40', courseName: 'Etika Profesi (SI-C 2023)', sks: 2, roomCode: 'SG-10', lecturer: 'Dr. Ir. Wahyudi, M.Sc.' },
  { dayOfWeek: 'SELASA', startTime: '08:00', endTime: '11:00', courseName: 'Seminar Proposal Tugas Akhir (SI-A 2023)', sks: 1, roomCode: 'SG-11', lecturer: 'Tim Pembimbing TA' },
  { dayOfWeek: 'RABU', startTime: '08:00', endTime: '11:00', courseName: 'Seminar Proposal Tugas Akhir (SI-B 2023)', sks: 1, roomCode: 'SG-11', lecturer: 'Tim Pembimbing TA' },
  { dayOfWeek: 'KAMIS', startTime: '08:00', endTime: '11:00', courseName: 'Seminar Proposal Tugas Akhir (SI-C 2023)', sks: 1, roomCode: 'SG-11', lecturer: 'Tim Pembimbing TA' }
];

module.exports = {
  MASTER_SCHEDULES
};
