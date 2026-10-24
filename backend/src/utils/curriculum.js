// Curriculum data for Sistem Informasi FT UNTAD
const { parseNimMetadata } = require('./timeUtils');

const CURRICULUM_COURSES = {
  1: [
    { name: 'Algoritma dan Pemrograman', hasLab: true, sks: 4 },
    { name: 'Pengantar Sistem Informasi', hasLab: false, sks: 3 },
    { name: 'Logika Diskrit', hasLab: false, sks: 3 },
    { name: 'Matematika Dasar', hasLab: false, sks: 3 },
    { name: 'Manajemen dan Organisasi', hasLab: false, sks: 3 },
    { name: 'Pendidikan Agama', hasLab: false, sks: 2 },
    { name: 'Pendidikan Pancasila', hasLab: false, sks: 2 }
  ],
  3: [
    { name: 'Rekayasa Perangkat Lunak', hasLab: true, sks: 4 },
    { name: 'Kecerdasan Artifisial', hasLab: true, sks: 4 },
    { name: 'Keamanan Sistem Informasi', hasLab: true, sks: 4 },
    { name: 'Analisis dan Perancangan Sistem Informasi', hasLab: true, sks: 4 },
    { name: 'Tata Kelola Teknologi Informasi', hasLab: false, sks: 4 },
    { name: 'Bahasa Inggris', hasLab: false, sks: 2 },
    { name: 'Pendidikan Karakter dan Anti Korupsi', hasLab: false, sks: 2 }
  ],
  5: [
    { name: 'Pemrograman Mobile', hasLab: true, sks: 4 },
    { name: 'Kecerdasan Bisnis', hasLab: true, sks: 4 },
    { name: 'Audit Sistem Informasi', hasLab: false, sks: 4 },
    { name: 'Penjaminan Mutu Sistem Informasi', hasLab: false, sks: 3 },
    { name: 'Transformasi Digital', hasLab: false, sks: 4 },
    { name: 'Metodologi Penelitian dan Penulisan Ilmiah', hasLab: false, sks: 3 },
    { name: 'Mitigasi Bencana', hasLab: false, sks: 2 }
  ],
  7: [
    { name: 'Kerja Praktik / PKL', hasLab: false, sks: 3 },
    { name: 'Proposal Tugas Akhir', hasLab: false, sks: 1 },
    { name: 'Etika Profesi', hasLab: false, sks: 2 },
    { name: 'Kuliah Kerja Nyata (KKN)', hasLab: false, sks: 4 }
  ]
};

function getCoursesBySemester(semester) {
  return CURRICULUM_COURSES[semester] || CURRICULUM_COURSES[3];
}

function getCoursesByNim(nim) {
  const meta = parseNimMetadata(nim);
  const semester = meta ? meta.semester : 3;
  return getCoursesBySemester(semester);
}

module.exports = {
  CURRICULUM_COURSES,
  getCoursesBySemester,
  getCoursesByNim
};
