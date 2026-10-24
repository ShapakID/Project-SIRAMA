const express = require('express');
const path = require('path');
const prisma = require('../db');
const {
  getRoomAvailability,
  applyOverride,
  applyClassOverride,
  getClassSchedules,
  importSchedulesFromExcel,
  getFloorRoomsStatus
} = require('../services/availabilityService');
const { getWitaDateYMD } = require('../utils/timeUtils');

const router = express.Router();

// Get rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ where: { isActive: true } });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get floor rooms status for 2D floor plan
router.get('/floor-status', async (req, res) => {
  try {
    const dateStr = req.query.date || getWitaDateYMD();
    const building = req.query.building || 'GSG';
    const data = await getFloorRoomsStatus(dateStr, building);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all weekly schedules & published reservations for Course Matrix & Live Room Detector
router.get('/courses-matrix', async (req, res) => {
  try {
    const weeklySchedules = await prisma.weeklySchedule.findMany({
      include: {
        room: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const publishedReservations = await prisma.practicumReservation.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        room: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      weeklySchedules,
      publishedReservations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room availability by date
router.get('/availability', async (req, res) => {
  try {
    const { roomCode, date } = req.query;
    if (!roomCode || !date) {
      return res.status(400).json({ error: 'roomCode and date query params are required' });
    }
    const slots = await getRoomAvailability(roomCode, date);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create schedule override (PJ only)
router.post('/override', async (req, res) => {
  try {
    const { roomCode, date, courseName, status, notes, updatedBy } = req.body;
    if (!roomCode || !date || !status) {
      return res.status(400).json({ error: 'roomCode, date, and status are required' });
    }
    const override = await applyOverride({
      roomCode,
      date,
      courseName,
      status,
      notes,
      updatedBy
    });
    res.json(override);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of available classes for timetable selector
router.get('/classes', async (req, res) => {
  try {
    const schedules = await prisma.weeklySchedule.findMany({
      select: { courseName: true }
    });
    const classSet = new Set();
    schedules.forEach(s => {
      const match = s.courseName.match(/\((SI-[A-C]\s*\d{4})\)/i);
      if (match) {
        classSet.add(match[1].replace(/\s+/, ' '));
      }
    });
    const classes = Array.from(classSet).sort();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class schedule Monday-Friday with overrides
router.get('/by-class', async (req, res) => {
  try {
    const className = req.query.className || 'SI-A 2025';
    const dateStr = req.query.date || getWitaDateYMD();
    const data = await getClassSchedules(className, dateStr);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PJ action: Online / Move Room / Reschedule (Change Date/Time) / Reset
router.post('/class-override', async (req, res) => {
  try {
    const {
      courseName,
      roomCode,
      date,
      action,
      newDate,
      newRoomCode,
      newStartTime,
      newEndTime,
      notes,
      updatedBy
    } = req.body;

    if (!courseName || !date || !action) {
      return res.status(400).json({ error: 'courseName, date, and action are required' });
    }

    const result = await applyClassOverride({
      courseName,
      roomCode,
      date,
      action,
      newDate,
      newRoomCode,
      newStartTime,
      newEndTime,
      notes,
      updatedBy
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Import excel
router.post('/import-excel', async (req, res) => {
  try {
    // Only allow imported file from server root for security
    const filePath = path.resolve(__dirname, '../../../JADWAL KULIAH SEMESTER 3 2026 SI-A.xlsx');
    const items = await importSchedulesFromExcel(filePath);
    res.json({ message: 'Excel schedules imported successfully', count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
