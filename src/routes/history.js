const express = require('express');
const { getRecentHistory, deleteHistoryItem, clearHistory } = require('../services/dbService');
const { historyLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', historyLimiter, (req, res) => {
  const limit   = Math.min(parseInt(req.query.limit) || 50, 100);
  const history = getRecentHistory(limit);
  res.json({ success: true, count: history.length, history });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID.' });

  const deleted = deleteHistoryItem(id);
  if (!deleted) return res.status(404).json({ error: `No item with ID ${id}.` });

  res.json({ success: true, message: `Item ${id} deleted.` });
});

router.delete('/', (req, res) => {
  clearHistory();
  res.json({ success: true, message: 'History cleared.' });
});

module.exports = router;