// Utility functions for WITA (UTC+8 / Asia/Makassar) time and date calculations

const DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

function getWitaDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
}

function getWitaDateYMD() {
  const d = getWitaDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWitaTimeHM() {
  const d = getWitaDate();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr) {
  if (!dateStr) {
    return DAY_NAMES[getWitaDate().getDay()];
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d, 12, 0, 0);
    return DAY_NAMES[dateObj.getDay()];
  }
  const fallback = new Date(dateStr);
  return DAY_NAMES[fallback.getDay()];
}

function parseNimMetadata(nim) {
  if (!nim) return null;
  const match = String(nim).trim().toUpperCase().match(/^F521(\d{2})(\d+)/);
  if (!match) return null;

  const angkatan = 2000 + parseInt(match[1], 10);
  const remaining = match[2];
  const seq = parseInt(remaining.slice(-3), 10);

  let kelas = 'A';
  if (seq >= 41 && seq <= 80) kelas = 'B';
  else if (seq >= 81 && seq <= 120) kelas = 'C';

  let semester = 1;
  if (angkatan === 2026) semester = 1;
  else if (angkatan === 2025) semester = 3;
  else if (angkatan === 2024) semester = 5;
  else if (angkatan === 2023) semester = 7;
  else semester = Math.max(1, (2026 - angkatan) * 2 + 1);

  return {
    angkatan,
    semester,
    seq,
    kelas,
    className: `SI-${kelas} ${angkatan}`
  };
}

module.exports = {
  DAY_NAMES,
  getWitaDate,
  getWitaDateYMD,
  getWitaTimeHM,
  getDayOfWeek,
  parseNimMetadata
};
