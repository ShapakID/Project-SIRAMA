import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWitaDateYMD, getWitaTimeHM, parseNimMetadata } from '../utils/timeUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Frontend WITA and Multi-Category Purposes...');

// 1. Test Frontend timeUtils
const ymd = getWitaDateYMD();
const hm = getWitaTimeHM();
assert.match(ymd, /^\d{4}-\d{2}-\d{2}$/, 'WITA date must be valid format');
assert.match(hm, /^\d{2}:\d{2}$/, 'WITA time must be HH:mm');

const meta = parseNimMetadata('F5212510018');
assert.strictEqual(meta.className, 'SI-A 2025');
assert.strictEqual(meta.angkatan, 2025);
assert.strictEqual(meta.kelas, 'A');

const metaC = parseNimMetadata('F5212610090');
assert.strictEqual(metaC.className, 'SI-C 2026');
assert.strictEqual(metaC.kelas, 'C');

// 2. Test PJDashboard code content
const pjPath = path.resolve(__dirname, '../components/PJDashboard.jsx');
const pjContent = fs.readFileSync(pjPath, 'utf-8');
assert.ok(pjContent.includes('PRAKTIKUM'), 'PJDashboard must support PRAKTIKUM category');
assert.ok(pjContent.includes('LAINNYA'), 'PJDashboard must support LAINNYA category');
assert.ok(pjContent.includes('Alasan / Tujuan Kegiatan') || pjContent.includes('purpose'), 'PJDashboard must have purpose input field');
assert.ok(pjContent.includes('pjClassTitle'), 'PJDashboard must display dynamic PJ class');

// 3. Test PetugasDashboard code content
const petugasPath = path.resolve(__dirname, '../components/PetugasDashboard.jsx');
const petugasContent = fs.readFileSync(petugasPath, 'utf-8');
assert.ok(petugasContent.includes('Kategori & Kegiatan'), 'PetugasDashboard must display category in table');
assert.ok(petugasContent.includes('Alasan / Tujuan'), 'PetugasDashboard must display reason/purpose in table');

// 4. Test GSGFloorPlan code content
const floorPath = path.resolve(__dirname, '../components/GSGFloorPlan.jsx');
const floorContent = fs.readFileSync(floorPath, 'utf-8');
assert.ok(floorContent.includes('WITA'), 'GSGFloorPlan must reference WITA');
assert.ok(floorContent.includes('currentTimeWita'), 'GSGFloorPlan must use currentTimeWita');

console.log('WITA and multi-category frontend tests PASSED successfully.');
