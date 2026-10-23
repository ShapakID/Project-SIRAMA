const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const practicumRoutes = require('./routes/practicum');
const projectorRoutes = require('./routes/projectors');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/practicum', practicumRoutes);
app.use('/api/projectors', projectorRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`SIRAMA Backend listening on port ${PORT}`);
  });
}

module.exports = app;
