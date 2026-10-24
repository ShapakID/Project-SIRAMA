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

export const DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

export function getDayOfWeek(dateStr) {
  let target;
  if (!dateStr || typeof dateStr !== 'string') {
    target = getWitaDate();
  } else {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      target = new Date(dateStr);
    }
  }
  const dayIdx = target.getDay();
  return isNaN(dayIdx) ? DAY_NAMES[getWitaDate().getDay()] : DAY_NAMES[dayIdx];
}

export function isWeekend(dateStr) {
  const day = getDayOfWeek(dateStr);
  return day === 'SABTU' || day === 'MINGGU';
}

export function getNextWeekdayYMD(dateStr) {
  let base;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      base = new Date(dateStr);
    }
  } else {
    base = getWitaDate();
  }
  const day = base.getDay();
  // 0 is Sunday, 6 is Saturday
  if (day === 6) {
    base.setDate(base.getDate() + 2); // Saturday -> Monday
  } else if (day === 0) {
    base.setDate(base.getDate() + 1); // Sunday -> Monday
  }
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
