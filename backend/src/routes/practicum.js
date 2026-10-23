const express = require('express');
const {
  saveDraft,
  publishReservation,
  getReservations,
  cancelReservation
} = require('../services/practicumService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { roomCode, date, status, pjNim } = req.query;
    const items = await getReservations({ roomCode, date, status, pjNim });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/draft', async (req, res) => {
  try {
    const item = await saveDraft(req.body);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const item = await publishReservation(req.params.id);
    res.json(item);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const item = await cancelReservation(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
