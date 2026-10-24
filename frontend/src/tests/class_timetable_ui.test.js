import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Class Timetable UI component...');

const timetablePath = path.join(__dirname, '../components/RoomTimetable.jsx');
assert(fs.existsSync(timetablePath), 'RoomTimetable.jsx must exist');

const content = fs.readFileSync(timetablePath, 'utf8');

// Verify key features in component
assert(content.includes('by-class'), 'Must fetch class schedule from /api/schedules/by-class');
assert(content.includes('class-override'), 'Must have override mutator /api/schedules/class-override');
assert(content.includes('ONLINE'), 'Must support ONLINE action');
assert(content.includes('MOVE_ROOM'), 'Must support MOVE_ROOM action');
assert(content.includes('RESCHEDULE'), 'Must support RESCHEDULE action');
assert(content.includes('Ganti Jadwal'), 'Must render Ganti Jadwal label');
assert(content.includes('RESET'), 'Must support RESET action');
assert(content.includes('isPJOfSelectedClass'), 'Must have PJ role check');
assert(content.includes('Jadwal Kelas (Senin–Jumat)'), 'Must render class-centric tab');
assert(content.includes('Pantau per Ruangan'), 'Must retain room availability option');

console.log('Class Timetable UI component tests PASSED successfully!');
