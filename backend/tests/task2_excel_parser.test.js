const assert = require('assert');
const path = require('path');
const { parseScheduleExcel, normalizeRoomCode } = require('../src/services/excelParser');

const sampleFile = path.resolve(__dirname, '../../JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx');
const parsed = parseScheduleExcel(sampleFile);

assert(Array.isArray(parsed), 'Must return an array');
assert(parsed.length === 3, 'Must parse exactly GSG rows (JTI excluded)');
assert(!parsed.some(r => r.roomCode.startsWith('JTI')), 'JTI must not be in schedule');

const first = parsed[0];
assert.strictEqual(first.dayOfWeek, 'SENIN');
assert.strictEqual(first.startTime, '13:00');
assert.strictEqual(first.endTime, '15:30');
assert.strictEqual(first.courseName, 'Keamanan Sistem Informasi');
assert.strictEqual(first.roomCode, 'SG-7');

// Test normalizeRoomCode logic
assert.strictEqual(normalizeRoomCode('SG 03'), 'SG-3');
assert.strictEqual(normalizeRoomCode('SG 06'), 'SG-6');
assert.strictEqual(normalizeRoomCode('SG 10'), 'SG-10');
assert.strictEqual(normalizeRoomCode('SG 12'), 'Lab-Komputer');
assert.strictEqual(normalizeRoomCode('Lab-Komputer'), 'Lab-Komputer');

console.log('Task 2 Excel parser test passed.');
