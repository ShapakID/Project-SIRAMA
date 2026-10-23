const xlsx = require('xlsx');

function formatExcelTime(val) {
  if (typeof val === 'string') return val.trim();
  if (typeof val !== 'number') return '';
  const totalMinutes = Math.round(val * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeRoomCode(code) {
  if (!code) return '';
  const trimmed = String(code).trim();
  return trimmed.replace(/^SG\s*(\d+)$/i, 'SG-$1');
}

function parseScheduleExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const results = [];
  let currentDay = '';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const col0 = row[0] ? String(row[0]).trim() : '';
    if (['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'].includes(col0.toUpperCase())) {
      currentDay = col0.toUpperCase();
    }

    const startVal = row[1];
    const endVal = row[2];
    const courseName = row[3] ? String(row[3]).trim() : '';
    const sksVal = row[4];
    const roomVal = row[5];
    const lecturerVal = row[6] ? String(row[6]).trim() : '';

    if (startVal !== undefined && endVal !== undefined && courseName && currentDay) {
      // Ignore header row if accidentally captured
      if (typeof startVal === 'string' && startVal.toLowerCase().includes('mulai')) {
        continue;
      }

      results.push({
        dayOfWeek: currentDay,
        startTime: formatExcelTime(startVal),
        endTime: formatExcelTime(endVal),
        courseName,
        sks: Number(sksVal) || 2,
        roomCode: normalizeRoomCode(roomVal),
        lecturer: lecturerVal
      });
    }
  }

  return results;
}

module.exports = {
  formatExcelTime,
  normalizeRoomCode,
  parseScheduleExcel
};
