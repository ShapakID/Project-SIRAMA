const express = require('express');
const {
  saveDraft,
  publishReservation,
  getReservations,
  cancelReservation
} = require('../services/practicumService');
const { getCoursesBySemester, getCoursesByNim } = require('../utils/curriculum');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/courses', (req, res) => {
  try {
    const { semester, nim } = req.query;
    if (nim) {
      return res.json(getCoursesByNim(nim));
    }
    const semNum = parseInt(semester, 10) || 3;
    return res.json(getCoursesBySemester(semNum));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { roomCode, date, status, pjNim } = req.query;
    const items = await getReservations({ roomCode, date, status, pjNim });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/draft', requireAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      pjNim: req.user.role === 'PJ' ? req.user.nim : (req.body.pjNim || req.user.nim),
      pjName: req.user.role === 'PJ' ? req.user.name : (req.body.pjName || req.user.name)
    };
    const item = await saveDraft(payload);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const item = await publishReservation(req.params.id);
    res.json(item);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const item = await cancelReservation(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
