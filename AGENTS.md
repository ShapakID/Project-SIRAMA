# SIRAMA Project Specification (Reboot)

## Working Directory & Deployment Hosts
- Local development: `C:\Users\Acer\Documents\shapak\Project\Project`
- Primary Deployment Target (Laptop Dev 2): `C:\Users\Administrator\Desktop\Project` (IP `192.168.100.10`, User: `Administrator`, SSH Key: `~/.ssh/id_ed25519`)
  - Status koneksi: Terverifikasi aktif via Port 22 SSH.
  - Runtime remote: Node.js `v22.21.0`, npm `11.6.2`, Git `2.51.1`.
  - Strategi sinkronisasi: Deploy langsung via SSH/SCP/Rsync, migrasi database Prisma SQLite (`dev.db`), instalasi dependensi, dan startup layanan Express (:4000) & Vite (:3000).

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
   - Petugas: Default akun petugas (`petugas` / `petugas123`). Mengelola ketersediaan unit proyektor, mencatat serah-terima/pengembalian fisik, serta memantau dan memperbarui status laporan kerusakan.

   ## Deployment & Remote Operation Runbook
   1. **Sync Source Code**:
    - Transfer file project (tanpa `node_modules` dan `.git`) dari laptop lokal ke remote:
      `scp -i ~/.ssh/id_ed25519 -r <files> Administrator@192.168.100.10:C:/Users/Administrator/Desktop/Project/` atau menggunakan bundel tarball.
   2. **Backend Setup**:
    - `cd C:\Users\Administrator\Desktop\Project\backend`
    - `npm install`
    - `npx prisma db push`
    - `node prisma/seed.js`
   3. **Frontend Setup & Build**:
    - `cd C:\Users\Administrator\Desktop\Project\frontend`
    - `npm install`
    - `npm run build`
   4. **Service Verification**:
    - Jalankan backend test suite dan verifikasi ketersediaan endpoint API di `http://192.168.100.10:4000`.
    - Jalankan frontend dev/preview di `http://192.168.100.10:3000`.
