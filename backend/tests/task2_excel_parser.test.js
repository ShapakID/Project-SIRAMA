const assert = require('assert');
const path = require('path');
const { parseScheduleExcel } = require('../src/services/excelParser');

const sampleFile = path.resolve(__dirname, '../../JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx');
const parsed = parseScheduleExcel(sampleFile);

assert(Array.isArray(parsed), 'Must return an array');
assert(parsed.length >= 7, 'Must parse all rows from Excel');
const first = parsed[0];
assert.strictEqual(first.dayOfWeek, 'SENIN');
assert.strictEqual(first.startTime, '07:30');
assert.strictEqual(first.endTime, '10:00');
assert.strictEqual(first.courseName, 'Kecerdasan Artifisial');
assert.strictEqual(first.roomCode, 'JTI-1');
console.log('Task 2 Excel parser test passed.');
