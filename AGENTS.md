# SIRAMA Project Specification (Reboot)

## Working Directory
- Local development: `C:\Users\Acer\Documents\shapak\Project\Project`
- Target remote laptop: `C:\Users\Administrator\Desktop\Project` (IP `192.168.100.10`)

## Project Context & Objectives
Sistem peminjaman ruangan Gedung Serbaguna (GSG) Fakultas Teknik Universitas Tadulako dan peminjaman unit proyektor terintegrasi.
Fokus sistem: penguncian hak pakai ruangan secara anti-bentrok dan pelacakan unit fisik proyektor.

## Core Rules & Workflow
1. **Ruangan Terbuka Fisik**:
   - Ruangan tidak dikunci fisik. Siapapun bisa masuk.
   - Sistem berfungsi menentukan hak reservasi dan kepemilikan slot waktu agar tidak terjadi bentrok.
   - Reservasi ruangan instan tanpa perlu persetujuan (approval) petugas gedung.

2. **Peminjaman Proyektor**:
   - Inventaris unit: nomor unit fisik individual (misal: Unit 01 s.d. 11).
   - Status unit: TERSEDIA, DIPINJAM, RUSAK/MAINTENANCE.
   - Syarat pinjam: peminjam wajib memiliki reservasi ruangan aktif/valid pada slot tersebut.
   - Tidak diperbolehkan meminjam proyektor lepas tanpa ruangan.
   - Petugas memantau, memvalidasi serah-terima fisik, dan mencatat pengembalian proyektor.

3. **Laporan Kerusakan Fasilitas**:
   - Objek laporan: Ruangan spesifik (AC, kursi, lampu), Unit Proyektor, atau Fasilitas Umum GSG (toilet, selasar, pintu).
   - Detail laporan: Kategori, deskripsi kerusakan, foto bukti opsional, status penanganan (PENDING, PROSES, SELESAI).
   - Pelapor: Mahasiswa/PJ/Dosen. Petugas memperbarui status perbaikan. Unit/ruangan rusak otomatis diblokir dari daftar ketersediaan jika statusnya membahayakan/tidak layak pakai.

4. **Manajemen Jadwal & Kalender**:
   - Sumber jadwal resmi: File Excel SIGA (`JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx`).
   - Format waktu: Konversi desimal Excel ke jam (contoh: 0.3125 = 07:30, 0.54167 = 13:00).
   - Kolom data: Hari, Jam Mulai, Jam Selesai, Mata Kuliah, SKS, Ruangan (SG 5, SG 6, SG 7, JTI, dll), Dosen.
   - Model Database: `WeeklySchedule` (template mingguan) + `ScheduleOverride` (penimpaan spesifik tanggal untuk kelas online, perubahan jam, lepas ruangan).
   - Jadwal praktikum: Dibuat fleksibel oleh mahasiswa/PJ (fitur draft privat, publish langsung kunci slot ruangan atomik).
   - Dinamika KBM: Sesi kuliah resmi bisa dialihkan (daring/online, geser jadwal, atau lepas ruangan lebih awal saat KBM selesai).

5. **Hak Akses & Peran Pengguna (RBAC)**:
   - **Guest / Mahasiswa Umum**: Read-only. Melihat ketersediaan ruangan real-time dan posisi kelas.
   - **PJ Kelas / Komti**: Akun terdaftar di-seed perwakilan kelas (Shafairunizar Neirabista Ekazura - F5212510018, Moh. Daffa Setiawan - F5212520039). Mengelola reservasi praktikum (draft/publish), dan memperbarui status sesi kuliah kelasnya (online, lepas ruangan).
   - **Dosen**: Read-only. Memantau posisi ruangan kelas binaannya.
   - **Petugas**: Default akun petugas (`petugas` / `petugas123`). Mengelola ketersediaan unit proyektor, mencatat serah-terima/pengembalian fisik, serta memantau dan memperbarui status laporan kerusakan.
