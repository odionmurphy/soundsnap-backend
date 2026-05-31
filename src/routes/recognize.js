const express  = require('express');
const multer   = require('multer');
const { recognizeWithAudd } = require('../services/auddService');
const { hashAudio, getCached, setCache } = require('../services/cacheService');
const { saveToHistory } = require('../services/dbService');
const { recognizeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/', recognizeLimiter, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const audioBuffer = req.file.buffer;
    const mimeType    = req.file.mimetype;

    console.log(`🎙️  Received audio: ${(audioBuffer.length / 1024).toFixed(1)} KB`);

    const hash   = hashAudio(audioBuffer);
    const cached = getCached(hash);

    if (cached !== null) {
      return res.json({ success: true, result: cached, source: 'cache' });
    }

    console.log(`📡 Calling AudD API…`);
    const song = await recognizeWithAudd(audioBuffer, mimeType);

    setCache(hash, song);

    if (song) {
      const id = saveToHistory(song);
      song.id  = id;
      console.log(`✅ Recognized: "${song.title}" by ${song.artist}`);
    } else {
      console.log(`❌ No match found`);
    }

    return res.json({ success: true, result: song, source: 'audd' });

  } catch (err) {
    console.error('Recognition error:', err.message);
    return res.status(500).json({ error: err.message || 'Recognition failed.' });
  }
});

module.exports = router;