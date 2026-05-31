require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const recognizeRouter = require('./src/routes/recognize');
const historyRouter   = require('./src/routes/history');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/recognize', recognizeRouter);
app.use('/api/history',   historyRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🎵  SoundSnap Backend');
  console.log(`🚀  Server running at http://localhost:${PORT}`);
  console.log(`📡  AudD token: ${process.env.AUDD_API_TOKEN ? '✅ set' : '❌ MISSING'}`);
  console.log('');
  console.log(`  POST   http://localhost:${PORT}/api/recognize`);
  console.log(`  GET    http://localhost:${PORT}/api/history`);
  console.log(`  GET    http://localhost:${PORT}/api/health`);
  console.log('');
});