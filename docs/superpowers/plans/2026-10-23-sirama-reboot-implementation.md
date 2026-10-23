# SIRAMA Reboot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SIRAMA fullstack system for Gedung Serbaguna (GSG) Fakultas Teknik Untad room reservation, dynamic SIGA timetable synchronization, projector lending tracking, and facility damage reporting.

**Architecture:** Client-server REST architecture with React Vite Tailwind frontend and Express.js backend with Prisma ORM and SQLite database, designed for seamless future migration to cloud hosting.

**Tech Stack:** Node.js, Express, Prisma ORM, SQLite, TypeScript/JavaScript, React, Vite, Tailwind CSS, XLSX parser.

**Spec:** `docs/superpowers/specs/2026-10-23-sirama-system-design.md`

## Global Constraints
- Working directory: `C:\Users\Acer\Documents\shapak\Project\Project`
- Backend runs on Node.js with Express and Prisma SQLite (`prisma/dev.db`)
- Zero external database installation required during local development
- Initial PJ accounts seeded: Shafairunizar Neirabista Ekazura (`F5212510018`), Moh. Daffa Setiawan (`F5212520039`)
- Initial Petugas account seeded: `petugas` / `petugas123`
- Excel source for timetable: `JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx` in root folder

## Review Focus
1. **Excel Decimal Time Precision**: Excel times stored as day fractions (e.g. 0.3125 for 07:30) must convert to clean `HH:mm` strings without rounding drift (tested in Task 2).
2. **Projector Loan Without Valid Room**: Attempting to borrow a projector without an active, published room reservation on that timeslot must be rejected with 400 Bad Request (tested in Task 6).
3. **Collision Detection on Practicum Publish**: Publishing a draft practicum over an occupied official class or already published practicum slot must fail atomically with 409 Conflict (tested in Task 5).
4. **Draft Privacy**: Practicum draft saved by one PJ must not block the room for other users or appear as occupied in availability calculation until published (tested in Task 5).
5. **Dynamic Override Release**: When a PJ marks an official class as "ONLINE" or "RELEASED", the slot must immediately calculate as "AVAILABLE" in room availability queries (tested in Task 4).

---

### Task 1: Backend Foundation & Prisma Database Schema

**Files:**
- Create: `backend/package.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/db.js`
- Create: `backend/prisma/seed.js`
- Test: `backend/tests/task1_schema.test.js`

**Interfaces:**
- Produces: Prisma Client models (`User`, `Room`, `WeeklySchedule`, `ScheduleOverride`, `PracticumReservation`, `Projector`, `ProjectorLoan`, `DamageReport`).
- Produces: Seeded database with PJ accounts, rooms (SG 5, SG 6, SG 7, JTI-1, JTI-2), and 11 projectors (01–11).

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task1_schema.test.js
const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

async function testSchemaAndSeed() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  const projectors = await prisma.projector.findMany();
  const rooms = await prisma.room.findMany();

  assert(users.length >= 3, 'Should seed at least 2 PJs and 1 Petugas');
  assert(projectors.length === 11, 'Should seed exactly 11 projectors (01-11)');
  assert(rooms.length >= 5, 'Should seed SG 5, SG 6, SG 7, JTI-1, JTI-2');
  console.log('Task 1 schema and seed test passed.');
  await prisma.$disconnect();
}

testSchemaAndSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task1_schema.test.js`
Expected: FAIL with "Cannot find module '@prisma/client'" or connection error.

- [ ] **Step 3: Implement Prisma schema, seed script, and database connection**

Setup `backend/package.json` with dependencies (`express`, `@prisma/client`, `prisma`, `xlsx`, `cors`, `dotenv`).
Define schema in `backend/prisma/schema.prisma` with SQLite provider.
Create `backend/prisma/seed.js` seeding PJ F5212510018, PJ F5212520039, Petugas, rooms (SG 5, SG 6, SG 7, JTI-1, JTI-2), and Projectors 01 to 11. Run `npx prisma db push` and `npx prisma db seed`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task1_schema.test.js`
Expected: PASS with "Task 1 schema and seed test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): initialize schema, prisma client, and seed data"
```

---

### Task 2: Excel Timetable Parser & Importer Service

**Files:**
- Create: `backend/src/services/excelParser.js`
- Test: `backend/tests/task2_excel_parser.test.js`

**Interfaces:**
- Consumes: Excel file at `JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx`.
- Produces: `parseScheduleExcel(filePath)` returning array of `{ dayOfWeek, startTime, endTime, courseName, sks, roomCode, lecturer }`.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task2_excel_parser.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task2_excel_parser.test.js`
Expected: FAIL with "Cannot find module '../src/services/excelParser'".

- [ ] **Step 3: Implement `excelParser.js`**

Implement `parseScheduleExcel(filePath)` using `xlsx` library. Convert fractional Excel time (`val * 24`) into rounded 24h format `HH:mm`. Normalize room names (e.g. `SG 7` -> `SG-7`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task2_excel_parser.test.js`
Expected: PASS with "Task 2 Excel parser test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/excelParser.js backend/tests/task2_excel_parser.test.js
git commit -m "feat(backend): implement Excel timetable parser"
```

---

### Task 3: Authentication & User Session API

**Files:**
- Create: `backend/src/services/authService.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/app.js`
- Test: `backend/tests/task3_auth.test.js`

**Interfaces:**
- Consumes: `prisma.user`
- Produces: `POST /api/auth/login` returning `{ token, user: { id, nim, name, role } }`.
- Produces: `GET /api/auth/me` returning current user.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task3_auth.test.js
const assert = require('assert');
const { loginUser } = require('../src/services/authService');

async function testAuth() {
  const result = await loginUser('F5212510018', 'password123');
  assert(result.user.nim === 'F5212510018', 'Should login PJ Shafairunizar');
  assert(result.user.role === 'PJ', 'User should have role PJ');
  assert(typeof result.token === 'string', 'Should return token');
  console.log('Task 3 Auth test passed.');
}

testAuth().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task3_auth.test.js`
Expected: FAIL with "Cannot find module '../src/services/authService'".

- [ ] **Step 3: Implement `authService.js` and Express auth routes**

Implement simple deterministic token auth for PJ (`F5212510018`, `F5212520039`), Petugas (`petugas`), and guest pass-through. Mount `authRouter` in Express `app.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task3_auth.test.js`
Expected: PASS with "Task 3 Auth test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/authService.js backend/src/routes/auth.js backend/src/app.js backend/tests/task3_auth.test.js
git commit -m "feat(backend): implement authentication and user session service"
```

---

### Task 4: Availability Engine & Dynamic Schedule Override API

**Files:**
- Create: `backend/src/services/availabilityService.js`
- Create: `backend/src/routes/schedules.js`
- Test: `backend/tests/task4_availability.test.js`

**Interfaces:**
- Consumes: `WeeklySchedule`, `ScheduleOverride`, `DamageReport`, `PracticumReservation`.
- Produces: `getRoomAvailability(roomId, date)` calculating slot statuses (`OCCUPIED_CLASS`, `ONLINE_CLASS`, `RELEASED`, `PRACTICUM`, `MAINTENANCE`, `AVAILABLE`).
- Produces: `createScheduleOverride(scheduleId, date, status, notes)`.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task4_availability.test.js
const assert = require('assert');
const { getRoomAvailability, applyOverride } = require('../src/services/availabilityService');

async function testAvailability() {
  // Test scenario: Monday date, check if class is occupied, then mark RELEASED, check if becomes AVAILABLE
  const dateStr = '2026-10-26'; // Monday
  const before = await getRoomAvailability('SG-7', dateStr);
  assert(before.some(s => s.status === 'OCCUPIED_CLASS'), 'Should show official class on SG-7');

  await applyOverride({ roomCode: 'SG-7', date: dateStr, status: 'RELEASED' });
  const after = await getRoomAvailability('SG-7', dateStr);
  const releasedSlot = after.find(s => s.status === 'AVAILABLE' && s.originalStatus === 'RELEASED');
  assert(releasedSlot, 'Released class slot must become AVAILABLE');
  console.log('Task 4 Availability & Override test passed.');
}

testAvailability().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task4_availability.test.js`
Expected: FAIL with "Cannot find module '../src/services/availabilityService'".

- [ ] **Step 3: Implement `availabilityService.js` and schedule routes**

Build multi-tier availability evaluator that layers weekly official schedules, date overrides (`ONLINE`, `RELEASED`, `RESCHEDULED`), practicum reservations (`PUBLISHED`), and maintenance damage reports.

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task4_availability.test.js`
Expected: PASS with "Task 4 Availability & Override test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/availabilityService.js backend/src/routes/schedules.js backend/tests/task4_availability.test.js
git commit -m "feat(backend): implement availability engine with dynamic overrides"
```

---

### Task 5: Practicum Reservation API (Draft & Atomic Publish)

**Files:**
- Create: `backend/src/services/practicumService.js`
- Create: `backend/src/routes/practicum.js`
- Test: `backend/tests/task5_practicum.test.js`

**Interfaces:**
- Consumes: `PracticumReservation`, `availabilityService`
- Produces: `saveDraft({ userId, roomCode, date, startTime, endTime, title })` -> reservation with status `DRAFT`.
- Produces: `publishReservation(reservationId)` -> validates room availability atomically; sets status `PUBLISHED` or throws 409 Conflict.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task5_practicum.test.js
const assert = require('assert');
const { saveDraft, publishReservation } = require('../src/services/practicumService');

async function testPracticum() {
  const draft = await saveDraft({
    userId: 'pj-1',
    roomCode: 'SG-5',
    date: '2026-10-27',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Praktikum RPL'
  });
  assert(draft.status === 'DRAFT', 'Newly created reservation should be DRAFT');

  const published = await publishReservation(draft.id);
  assert(published.status === 'PUBLISHED', 'Reservation should be PUBLISHED');

  // Second publish on same slot must throw 409 conflict
  let collided = false;
  try {
    const draft2 = await saveDraft({
      userId: 'pj-2',
      roomCode: 'SG-5',
      date: '2026-10-27',
      startTime: '11:00',
      endTime: '13:00',
      title: 'Praktikum Bentrok'
    });
    await publishReservation(draft2.id);
  } catch (err) {
    collided = err.status === 409 || err.message.includes('Conflict');
  }
  assert(collided, 'Overlapping publish must be rejected with Conflict');
  console.log('Task 5 Practicum draft & publish test passed.');
}

testPracticum().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task5_practicum.test.js`
Expected: FAIL with "Cannot find module '../src/services/practicumService'".

- [ ] **Step 3: Implement `practicumService.js` and Express routes**

Implement draft storage without locking, and publish method checking collision against active classes and already published practicum slots.

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task5_practicum.test.js`
Expected: PASS with "Task 5 Practicum draft & publish test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/practicumService.js backend/src/routes/practicum.js backend/tests/task5_practicum.test.js
git commit -m "feat(backend): implement practicum reservation draft and publish workflow"
```

---

### Task 6: Projector Lending & Facility Damage Report API

**Files:**
- Create: `backend/src/services/projectorService.js`
- Create: `backend/src/services/damageReportService.js`
- Create: `backend/src/routes/projectors.js`
- Create: `backend/src/routes/reports.js`
- Test: `backend/tests/task6_projector_reports.test.js`

**Interfaces:**
- Consumes: `Projector`, `ProjectorLoan`, `DamageReport`.
- Produces: `borrowProjector({ projectorCode, reservationId, borrowerName })` (enforces reservation check).
- Produces: `returnProjector(loanId, conditionNotes)`.
- Produces: `submitDamageReport({ targetType, targetCode, reporterName, description })`.
- Produces: `updateReportStatus(reportId, newStatus)`.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/tests/task6_projector_reports.test.js
const assert = require('assert');
const { borrowProjector, returnProjector } = require('../src/services/projectorService');
const { submitDamageReport } = require('../src/services/damageReportService');

async function testProjectorAndReports() {
  // 1. Cannot borrow without valid reservation
  let loanRejected = false;
  try {
    await borrowProjector({ projectorCode: '01', reservationId: null, borrowerName: 'Shapak' });
  } catch (err) {
    loanRejected = true;
  }
  assert(loanRejected, 'Borrowing projector without reservation must fail');

  // 2. Damage report creation
  const report = await submitDamageReport({
    targetType: 'PROJECTOR',
    targetCode: '02',
    reporterName: 'Shapak',
    description: 'Lampu proyektor redup dan mati mendadak'
  });
  assert(report.status === 'PENDING', 'New report must have status PENDING');
  console.log('Task 6 Projector and damage report test passed.');
}

testProjectorAndReports().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node backend/tests/task6_projector_reports.test.js`
Expected: FAIL with "Cannot find module '../src/services/projectorService'".

- [ ] **Step 3: Implement projector loan and damage reporting services & routes**

Implement constraint checks for projector loans and CRUD workflow for damage reports.

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/tests/task6_projector_reports.test.js`
Expected: PASS with "Task 6 Projector and damage report test passed."

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/projectorService.js backend/src/services/damageReportService.js backend/src/routes/projectors.js backend/src/routes/reports.js backend/tests/task6_projector_reports.test.js
git commit -m "feat(backend): implement projector lending and facility damage reporting"
```

---

### Task 7: Frontend Application Scaffolding & Public View (Vite + React + Tailwind)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/components/RoomTimetable.jsx`
- Create: `frontend/src/components/Navbar.jsx`
- Test: `frontend/src/tests/app_build.test.js`

**Interfaces:**
- Consumes: Backend API (`/api/rooms`, `/api/schedules/availability`).
- Produces: Responsive web UI for public/guest users to view room status and schedule.

- [ ] **Step 1: Write build verification test**

```javascript
// frontend/src/tests/app_build.test.js
const { execSync } = require('child_process');
const assert = require('assert');

try {
  const output = execSync('npm run build', { cwd: 'frontend' }).toString();
  assert(output.includes('built in') || output.includes('dist/'), 'Frontend must build successfully');
  console.log('Task 7 Frontend build test passed.');
} catch (err) {
  console.error('Frontend build failed:', err.message);
  process.exit(1);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node frontend/src/tests/app_build.test.js`
Expected: FAIL with "Cannot find module" or build directory missing.

- [ ] **Step 3: Scaffold Vite React and implement Public Room Viewer**

Initialize Vite React with Tailwind CSS, build navbar with role switcher / login modal, and room timetable grid showing live room statuses.

- [ ] **Step 4: Run build test to verify it passes**

Run: `node frontend/src/tests/app_build.test.js`
Expected: PASS with successful Vite production build.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): initialize React Vite app with public timetable viewer"
```

---

### Task 8: PJ & Petugas Interactive Dashboard Panels

**Files:**
- Create: `frontend/src/components/PJDashboard.jsx`
- Create: `frontend/src/components/PetugasDashboard.jsx`
- Create: `frontend/src/components/DamageReportModal.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/tests/dashboard_integration.test.js`

**Interfaces:**
- Consumes: Backend auth, practicum draft/publish endpoints, projector loan endpoints, damage report endpoints.
- Produces: Integrated single-page dashboard with role tabs (Mahasiswa/Guest, PJ Kelas, Petugas).

- [ ] **Step 1: Write integration render test**

Verify that all views render cleanly without syntax errors and production build passes.

- [ ] **Step 2: Run test to verify it fails**

Verify build fails before dashboard components exist.

- [ ] **Step 3: Implement PJ Dashboard, Petugas Dashboard, and Damage Report modal**

PJ can draft & publish practicum slots, trigger dynamic overrides ("Lepas Ruangan", "Kelas Daring"), and request projectors. Petugas can manage projector checkout/checkin (01-11) and update damage reports.

- [ ] **Step 4: Run build and lint verification**

Run: `npm run build --prefix frontend && npm test --prefix backend`
Expected: PASS across all test suites.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ frontend/src/App.jsx
git commit -m "feat(frontend): implement PJ and Petugas interactive dashboard panels"
```
