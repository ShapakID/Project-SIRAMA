const express = require('express');
const {
  getProjectors,
  borrowProjector,
  returnProjector,
  getLoans
} = require('../services/projectorService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await getProjectors();
    res.json(list);
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
    const { conditionNotes } = req.body;
    const loan = await returnProjector(req.params.id, conditionNotes);
    res.json(loan);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
