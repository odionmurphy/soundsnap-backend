const crypto = require('crypto');

const TTL_MS = (parseInt(process.env.CACHE_TTL_MINUTES) || 10) * 60 * 1000;
const cache  = new Map();

function hashAudio(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

function getCached(hash) {
  const entry = cache.get(hash);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(hash);
    return null;
  }
  console.log(`⚡ Cache HIT for ${hash.slice(0, 8)}…`);
  return entry.result;
}

function setCache(hash, result) {
  cache.set(hash, { result, expiresAt: Date.now() + TTL_MS });
  console.log(`💾 Cached result for ${hash.slice(0, 8)}…`);
}

function getCacheStats() {
  const now = Date.now();
  let active = 0;
  for (const [, entry] of cache) {
    if (now < entry.expiresAt) active++;
  }
  return { total: cache.size, active };
}

function clearCache() { cache.clear(); }

module.exports = { hashAudio, getCached, setCache, getCacheStats, clearCache };