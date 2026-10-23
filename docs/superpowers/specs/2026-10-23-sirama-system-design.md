# Design Specification: SIRAMA (Sistem Informasi Reservasi dan Manajemen Ruangan)

**Date**: 2026-10-23  
**Status**: Finalized & Approved  
**Target Repository**: `C:\Users\Acer\Documents\shapak\Project\Project`

---

## 1. Intent & The Why
Mahasiswa, dosen, dan staf Gedung Serbaguna (GSG) Fakultas Teknik Universitas Tadulako menghadapi ketidakjelasan status penggunaan ruangan dan inventaris proyektor. Karena ruangan fisik tidak dikunci, masalah yang kerap muncul adalah perebutan ruangan tanpa status legal, bentrok jadwal dadakan, serta proyektor hilang atau tidak tercatat rapi saat serah-terima. 

Tujuan sistem ini adalah menyediakan single source of truth untuk ketersediaan ruangan secara real-time, mengunci slot hak pakai secara instan tanpa birokrasi kunci fisik, menghubungkan peminjaman proyektor dengan reservasi ruangan valid, dan menyediakan jalur pelaporan kerusakan fasilitas GSG.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Mengimpor jadwal kuliah resmi mingguan dari Excel SIGA UNTAD (`JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx`) sebagai jadwal pemblokir otomatis.
- Memungkinkan penyesuaian dinamis status KBM (kelas daring/online, perubahan jam, pelepasan ruangan lebih cepat jika kelas selesai duluan) oleh PJ Kelas/Komti.
- Reservasi mandiri slot praktikum berbasis sistem draft (bisa disimpan dan diedit sewaktu-waktu sebelum dikunci).
- Peminjaman unit proyektor bernomor (Unit 01–11) yang terikat langsung pada reservasi ruangan valid, dengan pencatatan status fisik oleh petugas.
- Pelaporan kerusakan fasilitas (kelas, proyektor, fasilitas umum GSG) dengan pelacakan status penanganan (Pending, Proses, Selesai).
- Role-based Access Control (Guest/Mahasiswa, PJ Kelas/Komti, Dosen, Petugas).

### Non-Goals
- Integrasi API real-time dua arah ke database produksi SIGA UNTAD (karena batasan izin kampus; cukup impor statis file Excel/CSV).
- Sistem kunci pintu elektronik/IoT (ruangan diasumsikan terbuka secara fisik).
- Pembayaran sewa gedung komersial (sistem murni untuk keperluan akademik dan kegiatan mahasiswa/dosen FT UNTAD).

### Anti-Goals
- Sistem approval berlapis untuk ruangan fisik (jangan membuat antrean persetujuan manual petugas untuk ruangan terbuka, karena bertentangan dengan kebutuhan cepat mahasiswa; sistem mengunci siapa cepat dia dapat untuk slot yang kosong).
- Peminjaman proyektor tanpa ruangan (jangan izinkan peminjaman proyektor lepas di luar agenda ruangan terdaftar).

---

## 3. Constraints
- **Platform & Host**: Pengembangan di laptop lokal Windows (`192.168.100.10`), dengan rencana migrasi masa depan ke shared hosting/cPanel atau PaaS/Cloud.
- **Portabilitas Database**: Menggunakan Prisma ORM dengan SQLite untuk dev lokal tanpa instalasi server DBMS terpisah, dan dapat beralih ke PostgreSQL/MySQL cloud melalui perubahan environment string.
- **Keamanan & Peran**: Hanya PJ Kelas terdaftar yang memiliki otoritas mengubah status kelas kuliah atau mem-publish reservasi praktikum. Tamu dan mahasiswa umum hanya berstatus read-only untuk mencegah vandalisme jadwal.

---

## 4. Approaches Considered

### Approach 1: Client-Server REST API (Vite React SPA + Express.js + Prisma SQLite) [TERPILIH]
- **Deskripsi**: Folder terpisah `frontend/` (React, Vite, Tailwind CSS) dan `backend/` (Node.js, Express, Prisma ORM, SQLite).
- **Trade-offs**: Butuh 2 proses saat dev lokal, namun sangat fleksibel saat deploy hosting (frontend statis bisa ke cPanel/Vercel/Pages, backend bisa ke Node runner mana saja). Skema database terstruktur rapi via Prisma.

### Approach 2: Monolitik Fullstack Framework (Next.js App Router + Prisma SQLite) [DITOLAK]
- **Trade-offs**: Lebih simpel saat dev lokal (satu proses), namun serverless di cloud hosting bentrok dengan SQLite file, konsumsi RAM dev tinggi, dan pemisahan dokumentasi REST API untuk laporan RPL menjadi lebih rumit.

### Approach 3: Minimalist Express + Native Better-SQLite3 [DITOLAK]
- **Trade-offs**: Sangat ringan tanpa ORM, tetapi migrasi skema dan validasi relasi data harus ditulis manual tanpa type-safety.

---

## 5. Architectural & Detailed Design Decided

### 5.1 Aktor dan Hak Akses (RBAC)
1. **Guest / Mahasiswa Umum**: Read-only. Melihat kalender jadwal ruangan real-time, status ketersediaan sekarang, dan lokasi kelas berlangsung.
2. **PJ Kelas / Komti**: Akun terautentikasi per matkul/kelas.
   - Dapat mengubah status sesi jadwal kelasnya (Online, Selesai Lebih Cepat/Lepas Ruangan, Ganti Waktu).
   - Dapat membuat draft jadwal praktikum, mengedit waktu/durasi, dan mengunci reservasi.
   - Mengajukan peminjaman unit proyektor untuk jadwal kelas/praktikumnya.
3. **Dosen**: Read-only dashboard pemantauan posisi mahasiswa/kelas binaannya.
4. **Petugas Gedung**: 
   - Memantau permohonan proyektor dan mencatat serah-terima serta pengembalian unit fisik (Unit 01 s.d. 11).
   - Memantau tiket laporan kerusakan fasilitas dan memperbarui status perbaikannya.
   - Admin upload master Excel jadwal kuliah semester.

### 5.2 Alur Data & State Ketersediaan Ruangan
- Status slot ruangan dihitung berdasarkan prioritas:
  1. `OFFICIAL_SESSION`: Kelas kuliah resmi aktif dari SIGA (jika status normal).
  2. `RELEASED` / `ONLINE`: Jika PJ menandai daring atau melepas lebih awal, slot langsung berstatus `AVAILABLE` untuk mahasiswa lain.
  3. `PRACTICUM_BOOKED`: Slot praktikum yang sudah dikunci oleh PJ.
  4. `MAINTENANCE`: Ruangan rusak atau sedang perbaikan berdasarkan laporan petugas.
  5. `AVAILABLE`: Slot bebas yang bisa dipesan.

### 5.3 Akun PJ dan Provisioning
- Akun PJ di-seed otomatis untuk kelas Sistem Informasi - A (Angkatan 2025):
  1. Shafairunizar Neirabista Ekazura (NIM: `F5212510018`)
  2. Moh. Daffa Setiawan (NIM: `F5212520039`)
- Role PJ terikat pada seluruh matkul semester aktif SI-A 2025 yang tercantum di file Excel SIGA.
- Default akun Petugas: `petugas` / `petugas123` untuk verifikasi fisik proyektor dan status fasilitas.

### 5.4 Kalender & Logika Ketersediaan
- **Model Kalender**: `WeeklySchedule` (template mingguan dari Excel) + `ScheduleOverride` (penimpaan spesifik tanggal untuk kelas Daring, Pindah Ruang, atau Selesai Lebih Cepat).
- **Draft Praktikum**: Disimpan privat per PJ (`status: DRAFT`). Draft tidak memblokir ruangan. Penguncian ruangan atomik terjadi saat status diubah menjadi `PUBLISHED`.
- **Impor Jadwal**: Parsing file Excel menggantikan jadwal mingguan semester kelas secara transaksional.

### 5.5 Modul Proyektor & Laporan Kerusakan
- **Proyektor**: Tabel unit `Projector` (code: '01' - '11', status: 'AVAILABLE', 'IN_USE', 'BROKEN'). Relasi transaksi `ProjectorLoan` terikat pada `roomId` dan `scheduleId`/`bookingId`.
- **Laporan Kerusakan**: Tabel `DamageReport` (targetType: 'ROOM' | 'PROJECTOR' | 'GENERAL_FACILITY', targetId, reporterName, description, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED', createdAt).

---

## 6. What is Left to the Builder
- Pemilihan library UI (shadcn/ui vs Lucide-react + Tailwind murni).
- Implementasi session management (JWT vs Cookie-session).
- Parser formula waktu Excel (konversi pecahan hari desimal ke string format `HH:mm`).
