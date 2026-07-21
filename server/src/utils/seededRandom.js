const crypto = require('crypto');

/**
 * Mulberry32 — fast 32-bit seeded PRNG.
 * Returns a function that produces [0, 1) floats.
 */
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic seed from studentId + testId + attemptId.
 * Uses SHA-256 to guarantee uniqueness across combinations.
 */
function deriveSeed(studentId, testId, attemptId) {
  const raw = `${studentId}:${testId}:${attemptId}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return parseInt(hash.slice(0, 8), 16);
}

/**
 * Fisher-Yates shuffle with a seeded PRNG.
 * Returns a new shuffled array.
 */
function seededShuffle(arr, rng) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = { deriveSeed, seededShuffle, mulberry32 };
