const express = require('express');
const {
  submitDamageReport,
  updateReportStatus,
  getDamageReports
} = require('../services/damageReportService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, targetType } = req.query;
    const reports = await getDamageReports({ status, targetType });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const report = await submitDamageReport(req.body);
    res.status(201).json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const report = await updateReportStatus(req.params.id, status);
    res.json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
