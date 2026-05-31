const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_DIR  = path.join(__dirname, '../../database');
const DB_PATH = path.join(DB_DIR, 'soundsnap.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS recognition_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    artist          TEXT    NOT NULL,
    album           TEXT,
    release_date    TEXT,
    album_art       TEXT,
    label           TEXT,
    timecode        TEXT,
    spotify_url     TEXT,
    apple_music_url TEXT,
    preview_url     TEXT,
    recognized_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log(`✅ Database ready at ${DB_PATH}`);

const insertSong = db.prepare(`
  INSERT INTO recognition_history
    (title, artist, album, release_date, album_art, label, timecode, spotify_url, apple_music_url, preview_url)
  VALUES
    (@title, @artist, @album, @releaseDate, @albumArt, @label, @timecode, @spotifyUrl, @appleMusicUrl, @previewUrl)
`);

const getHistory  = db.prepare(`SELECT * FROM recognition_history ORDER BY recognized_at DESC LIMIT ?`);
const deleteById  = db.prepare(`DELETE FROM recognition_history WHERE id = ?`);
const clearAll    = db.prepare(`DELETE FROM recognition_history`);

function saveToHistory(song) {
  const info = insertSong.run({
    title:         song.title       || 'Unknown',
    artist:        song.artist      || 'Unknown',
    album:         song.album       || null,
    releaseDate:   song.releaseDate || null,
    albumArt:      song.albumArt    || null,
    label:         song.label       || null,
    timecode:      song.timecode    || null,
    spotifyUrl:    song.links?.spotify    || null,
    appleMusicUrl: song.links?.appleMusic || null,
    previewUrl:    song.previewUrl  || null,
  });
  return info.lastInsertRowid;
}

function getRecentHistory(limit = 50) {
  return getHistory.all(limit).map(row => ({
    id:           row.id,
    title:        row.title,
    artist:       row.artist,
    album:        row.album,
    releaseDate:  row.release_date,
    albumArt:     row.album_art,
    label:        row.label,
    timecode:     row.timecode,
    recognizedAt: row.recognized_at,
    links: {
      spotify:    row.spotify_url,
      appleMusic: row.apple_music_url,
    },
    previewUrl: row.preview_url,
  }));
}

function deleteHistoryItem(id) {
  return deleteById.run(id).changes > 0;
}

function clearHistory() { clearAll.run(); }

module.exports = { saveToHistory, getRecentHistory, deleteHistoryItem, clearHistory };