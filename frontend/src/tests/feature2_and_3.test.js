import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testFeature2And3() {
  const floorPlanPath = path.resolve(__dirname, '../components/GSGFloorPlan.jsx');
  const floorContent = fs.readFileSync(floorPlanPath, 'utf8');
  assert(floorContent.includes('filterEmptyNow'), 'GSGFloorPlan must include filterEmptyNow state');
  assert(floorContent.includes('checkIsOccupiedNow'), 'GSGFloorPlan must include checkIsOccupiedNow function');
  assert(floorContent.includes('Ruang Kosong Sekarang'), 'GSGFloorPlan must include button label Ruang Kosong Sekarang');

  const catalogPath = path.resolve(__dirname, '../components/ProjectorCatalog.jsx');
  const catalogContent = fs.readFileSync(catalogPath, 'utf8');
  assert(catalogContent.includes('isUsed'), 'ProjectorCatalog must check isUsed');
  assert(catalogContent.includes('Riwayat Log & Audit'), 'ProjectorCatalog must provide audit trail modal');
  assert(catalogContent.includes('TERPAKAI'), 'ProjectorCatalog must display TERPAKAI status badge');

  const petugasPath = path.resolve(__dirname, '../components/PetugasDashboard.jsx');
  const petugasContent = fs.readFileSync(petugasPath, 'utf8');
  assert(petugasContent.includes('selectedProjectorLog'), 'PetugasDashboard must have selectedProjectorLog state');
  assert(petugasContent.includes('5 Riwayat Peminjaman Terakhir'), 'PetugasDashboard must show 5 recent loans');

  console.log('Feature 2 (Ruang Kosong Sekarang) & Feature 3 (Status Keterpakaian Proyektor & Audit Trail) verified successfully.');
}

testFeature2And3();
