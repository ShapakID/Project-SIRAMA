// Frontend WITA (UTC+8 / Asia/Makassar) time and date helpers

export function getWitaDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
}

export function getWitaDateYMD() {
  const d = getWitaDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWitaTimeHM() {
  const d = getWitaDate();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function parseNimMetadata(nim) {
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
