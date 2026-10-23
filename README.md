# SIRAMA (Sistem Informasi Reservasi & Manajemen Ruangan)
### Gedung Serbaguna (GSG) Fakultas Teknik Universitas Tadulako

SIRAMA adalah sistem operasional cerdas berbasis web yang dirancang khusus untuk pengelolaan, pemantauan jadwal kuliah, reservasi praktikum bebas bentrok (*anti-collision*), tata kelola 11 unit proyektor, dan pelaporan insiden fasilitas di lingkungan Gedung Serbaguna (GSG) Fakultas Teknik Universitas Tadulako.

---

## 🌟 Fitur Utama

1. **Denah Interaktif 2D GSG (Lantai 1 & Lantai 2)**
   - Visualisasi tata letak arsitektural 12 ruang GSG:
     - **Lantai 1:** Kolom Kiri (`SG 03`, `SG 02`, `SG 01`), Kolom Kanan (`SG 06`, `SG 05`, `SG 04`), Bawah (`Pintu Masuk Utama`).
     - **Lantai 2:** Kolom Kiri (`SG 09`, `SG 08`, `SG 07`), Kolom Kanan (`Lab-Komputer` [SG 12], `SG 11`, `SG 10`), Bawah (`Tangga Akses & Void`).
   - Indikator ketersediaan ruangan real-time (*Tersedia, Kuliah Resmi, Praktikum Terjadwal, Perbaikan*).
   - Filter tanggal fleksibel untuk mengecek status slot waktu per hari.

2. **Diferensiasi Peran Terarah**
   - **Petugas GSG (`PETUGAS`)**:
     - Pusat pemantauan (*monitoring live feed*) seluruh pengajuan dan reservasi ruangan oleh PJ Kelas / Mahasiswa.
     - Kontrol intervensi dan pembatalan reservasi jika menyalahi aturan atau kondisi darurat.
     - Otoritas tunggal serah-terima pengembalian 11 unit proyektor.
     - Penanganan dan verifikasi tindak lanjut laporan kerusakan fasilitas.
   - **Penanggung Jawab Kelas (`PJ SI-A 2025`)**:
     - Pengajuan draft dan penerbitan langsung (*one-click publish*) reservasi praktikum.
     - Pengajuan peminjaman unit proyektor GSG yang terikat secara valid ke sesi reservasi aktif.
     - Pelaporan insiden fasilitas rusak langsung ke petugas.

3. **Mesin Anti-Bentrok Waktu & Validasi Transaksional**
   - Menggunakan `prisma.$transaction` untuk menjamin reservasi ruangan bersifat atomik dan bebas *race-condition*.
   - Sinkronisasi jadwal kuliah resmi semesteran via parser Excel SIGA (otomatis memetakan ruangan GSG dan mengabaikan ruang non-GSG).

4. **Desain Modern Once UI Magic Portfolio**
   - Antarmuka *dark glassmorphism* bertaraf industri (`zinc-950`, border `white/10`, ambient glow, font Geist).
   - Responsif untuk desktop, tablet, dan *mobile web*.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** SQLite (`prisma/dev.db`)
- **Public Tunneling:** Ngrok CLI Integration

---

## 🚀 Panduan Menjalankan Sistem

### Persyaratan
- Node.js v18+ atau v22+
- npm v9+

### Instalasi & Setup Lokal

1. **Clone Repositori:**
   ```bash
   git clone git@github.com:ShapakID/Project-SIRAMA.git
   cd Project-SIRAMA
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   npx prisma db push
   node prisma/seed.js
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

4. **Jalankan Otomatis (Windows Launcher):**
   Cukup klik dua kali `start-sirama.bat` di root direktori untuk menjalankan backend Express, frontend Vite, dan tunnel publik Ngrok secara simultan.

---

## 🔑 Kredensial Default (Testing / Seeding)

| Peran | Username / NIM | Password | Catatan |
|---|---|---|---|
| **Petugas GSG** | `petugas` | `password123` | Akses Pusat Kendali & Monitoring |
| **PJ SI-A 2025** | `F5212510018` | `password123` | Akses Pengajuan Praktikum & Proyektor |
| **PJ SI-A 2025** | `F5212520039` | `password123` | Akun Cadangan PJ Kelas |

---

## 🧪 Pengujian Unit & Integrasi

Semua modul backend dan frontend telah diuji secara menyeluruh:

```bash
# Uji Backend (Prisma, Auth, Ketersediaan, Reservasi, Proyektor, Denah)
cd backend && npm test

# Uji Frontend (Vite Build, Integrasi Dashboard, Arsitektur Denah 2D)
cd ../frontend && npm test
```

---

Dikelola untuk operasional **Gedung Serbaguna Fakultas Teknik Universitas Tadulako (GSG FT-UNTAD)**.
