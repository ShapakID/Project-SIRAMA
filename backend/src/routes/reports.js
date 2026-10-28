const express = require('express');
const {
  submitDamageReport,
  updateReportStatus,
  getDamageReports
} = require('../services/damageReportService');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { getUserFromToken } = require('../services/authService');

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
    let reporter = req.body.reportedBy || 'Mahasiswa / Pengguna Fasilitas';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const user = await getUserFromToken(authHeader.slice(7).trim());
      if (user) reporter = user.nim || user.name;
    }
    const report = await submitDamageReport({
      ...req.body,
      reportedBy: reporter
    });
    res.status(201).json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.patch('/:id/status', requireAuth, requireRole(['PETUGAS']), async (req, res) => {
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
