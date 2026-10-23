import { execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const floorPlanPath = path.resolve(__dirname, '../components/GSGFloorPlan.jsx');
assert(fs.existsSync(floorPlanPath), 'GSGFloorPlan.jsx must exist');

const content = fs.readFileSync(floorPlanPath, 'utf8');

// Check Floor 1 layout definition
assert(content.includes("'SG 03', 'SG 02', 'SG 01'"), 'Floor 1 left column must be SG 03, SG 02, SG 01');
assert(content.includes("'SG 06', 'SG 05', 'SG 04'"), 'Floor 1 right column must be SG 06, SG 05, SG 04');
assert(content.includes('Pintu Masuk Utama GSG FT-UNTAD'), 'Floor 1 must feature Pintu Masuk');

// Check Floor 2 layout definition
assert(content.includes("'SG 09', 'SG 08', 'SG 07'"), 'Floor 2 left column must be SG 09, SG 08, SG 07');
assert(content.includes("'Lab-Komputer', 'SG 11', 'SG 10'"), 'Floor 2 right column must be Lab-Komputer, SG 11, SG 10');

// Ensure no JTI
assert(!content.includes('JTI-1') && !content.includes('JTI-2'), 'Must not include JTI rooms');

const cwd = path.resolve(__dirname, '../..');
const output = execSync('npm run build', { cwd }).toString();
assert(output.includes('built in') || output.includes('dist'), 'Build must succeed with GSGFloorPlan');

console.log('GSG Floor Plan test and build passed successfully.');
