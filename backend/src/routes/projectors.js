const express = require('express');
const {
  getProjectors,
  getProjectorHistory,
  borrowProjector,
  returnProjector,
  returnProjectorByCode,
  getLoans
} = require('../services/projectorService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { building } = req.query;
    const list = await getProjectors(building);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:code/history', async (req, res) => {
  try {
    const history = await getProjectorHistory(req.params.code);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/loans', async (req, res) => {
  try {
    const { status } = req.query;
    const list = await getLoans(status);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/borrow', async (req, res) => {
  try {
    const loan = await borrowProjector(req.body);
    res.json(loan);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/loans/:id/return', async (req, res) => {
  try {
    const { conditionNotes, isDamaged, releaseReservation } = req.body;
    const loan = await returnProjector(
      req.params.id,
      conditionNotes,
      isDamaged,
      releaseReservation !== false
    );
    res.json(loan);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:code/return', async (req, res) => {
  try {
    const { conditionNotes, isDamaged, releaseReservation } = req.body;
    const loan = await returnProjectorByCode(
      req.params.code,
      conditionNotes,
      isDamaged,
      releaseReservation !== false
    );
    res.json(loan);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
