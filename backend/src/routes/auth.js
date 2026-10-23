const express = require('express');
const { loginUser, getUserFromToken } = require('../services/authService');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const nim = req.body.nim || req.body.identifier;
    const { password } = req.body;
    if (!nim) {
      return res.status(400).json({ error: 'NIM or username is required' });
    }
    const result = await loginUser(nim, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
