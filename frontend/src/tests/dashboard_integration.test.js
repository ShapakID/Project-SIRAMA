import { execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pjPath = path.resolve(__dirname, '../components/PJDashboard.jsx');
const petugasPath = path.resolve(__dirname, '../components/PetugasDashboard.jsx');

assert(fs.existsSync(pjPath), 'PJDashboard.jsx must exist');
assert(fs.existsSync(petugasPath), 'PetugasDashboard.jsx must exist');

const cwd = path.resolve(__dirname, '../..');
const output = execSync('npm run build', { cwd }).toString();
assert(output.includes('built in') || output.includes('dist'), 'Build must succeed with dashboards');
console.log('Task 8 Dashboard integration test passed.');
