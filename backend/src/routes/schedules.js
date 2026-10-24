const express = require('express');
const path = require('path');
const prisma = require('../db');
const {
  getRoomAvailability,
  applyOverride,
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
    const data = await getFloorRoomsStatus(dateStr);
    res.json(data);
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
