import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Frontend Curriculum Selection and Weekend Closure UI...');

// Test 1: Test curriculumData.js logic
import { CURRICULUM_COURSES, getCoursesByNim, getCoursesBySemester } from '../utils/curriculumData.js';
import { isWeekend, getNextWeekdayYMD, getDayOfWeek } from '../utils/timeUtils.js';

// Curriculum check
const coursesSem3 = getCoursesByNim('F5212510018');
assert.ok(coursesSem3.length >= 7, 'Sem 3 must have at least 7 courses');
const rplCourse = coursesSem3.find(c => c.name.includes('Rekayasa Perangkat Lunak'));
assert.ok(rplCourse, 'RPL must be present in SI-A 2025 curriculum');
assert.strictEqual(rplCourse.hasLab, true, 'RPL must have lab');

const coursesSem1 = getCoursesByNim('F5212610001');
const alproCourse = coursesSem1.find(c => c.name.includes('Algoritma dan Pemrograman'));
assert.ok(alproCourse && alproCourse.hasLab, 'Alpro must be in Sem 1 with lab');

// Weekend check
assert.strictEqual(isWeekend('2026-10-24'), true);
assert.strictEqual(isWeekend('2026-10-25'), true);
assert.strictEqual(isWeekend('2026-10-26'), false);
assert.strictEqual(getNextWeekdayYMD('2026-10-24'), '2026-10-26');

// Test 2: Verify PJDashboard.jsx contains curriculum selector and weekend warning
const pjDashboardCode = fs.readFileSync(path.join(__dirname, '../components/PJDashboard.jsx'), 'utf-8');
assert.ok(pjDashboardCode.includes('getCoursesByNim'), 'PJDashboard must use getCoursesByNim');
assert.ok(pjDashboardCode.includes('Pilih Mata Kuliah Kurikulum'), 'PJDashboard must have curriculum dropdown');
assert.ok(pjDashboardCode.includes('Modul / Topik Praktikum (Manual)'), 'PJDashboard must have manual module topic input');
assert.ok(pjDashboardCode.includes('Gedung GSG tutup pada hari'), 'PJDashboard must alert on weekend');
assert.ok(pjDashboardCode.includes('disabled={isWeekend(formData.date)}'), 'PJDashboard must disable submit on weekend');

// Test 3: Verify GSGFloorPlan.jsx contains weekend closure notice and CLOSED badge
const floorPlanCode = fs.readFileSync(path.join(__dirname, '../components/GSGFloorPlan.jsx'), 'utf-8');
assert.ok(floorPlanCode.includes('isWeekend(selectedDate)'), 'GSGFloorPlan must check isWeekend');
assert.ok(floorPlanCode.includes('Gedung Serbaguna (GSG) Tutup pada Hari'), 'GSGFloorPlan must show weekend alert');
assert.ok(floorPlanCode.includes("case 'CLOSED':"), 'GSGFloorPlan must handle CLOSED status badge');

// Test 4: Verify RoomTimetable.jsx contains weekend alert
const timetableCode = fs.readFileSync(path.join(__dirname, '../components/RoomTimetable.jsx'), 'utf-8');
assert.ok(timetableCode.includes('isWeekend(selectedDate)'), 'RoomTimetable must check isWeekend');
assert.ok(timetableCode.includes('Gedung GSG Tutup (Akhir Pekan)'), 'RoomTimetable must show weekend banner');

console.log('Frontend Curriculum & Weekend tests PASSED successfully!');
