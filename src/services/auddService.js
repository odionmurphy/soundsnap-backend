const fetch    = require('node-fetch');
const FormData = require('form-data');

const AUDD_API_URL = 'https://api.audd.io/';

async function recognizeWithAudd(audioBuffer, mimeType = 'audio/m4a') {
  const token = process.env.AUDD_API_TOKEN;

  if (!token || token === 'your_actual_token_here') {
    throw new Error('AUDD_API_TOKEN is not set in .env file.');
  }

  const form = new FormData();
  form.append('api_token', token);
  form.append('return', 'spotify,apple_music');
  form.append('file', audioBuffer, {
    filename: 'recording.m4a',
    contentType: mimeType,
  });

  const response = await fetch(AUDD_API_URL, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
    timeout: 15000,
  });

  if (!response.ok) throw new Error(`AudD returned HTTP ${response.status}`);

  const json = await response.json();

  if (json.status !== 'success') {
    throw new Error(json.error?.error_message || 'AudD recognition failed');
  }

  if (!json.result) return null;

  return parseSong(json.result);
}

function parseSong(raw) {
  const spotify = raw.spotify;
  const apple   = raw.apple_music;

  const albumArt =
    spotify?.album?.images?.[0]?.url ||
    apple?.artwork?.url?.replace('{w}', '600').replace('{h}', '600') ||
    null;

  return {
    title:       raw.title,
    artist:      raw.artist,
    artistsList: spotify?.artists?.map(a => a.name).join(', ') || raw.artist,
    album:       raw.album       || null,
    releaseDate: raw.release_date || null,
    albumArt,
    label:       raw.label       || null,
    timecode:    raw.timecode    || null,
    genres:      apple?.genreNames?.filter(g => g !== 'Music') || [],
    duration:    spotify?.duration_ms
      ? `${Math.floor(spotify.duration_ms/60000)}:${String(Math.floor((spotify.duration_ms%60000)/1000)).padStart(2,'0')}`
      : null,
    popularity:  spotify?.popularity ?? null,
    links: {
      spotify:    spotify?.external_urls?.spotify || null,
      appleMusic: apple?.url                      || null,
    },
    previewUrl: spotify?.preview_url || null,
  };
}

module.exports = { recognizeWithAudd };