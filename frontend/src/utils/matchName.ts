function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/** Classic Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** 0..1 similarity, 1 = identical. */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const WORD_MATCH_THRESHOLD = 0.72; // how close a single word must sound
const REQUIRED_WORD_COVERAGE = 0.7; // fraction of target's words that must be found
const WHOLE_STRING_THRESHOLD = 0.68; // fallback: overall string closeness

/**
 * Returns true if `spoken` is an acceptable match for `targetName`, tolerant
 * of speech-to-text mis-transcriptions (similar-sounding words, dropped
 * minor words, punctuation differences) rather than requiring an exact
 * reading of the name.
 */
export function matchName(spoken: string, targetName: string): boolean {
  const normalizedSpoken = normalize(spoken);
  const normalizedTarget = normalize(targetName);

  if (!normalizedSpoken || !normalizedTarget) return false;
  if (normalizedSpoken === normalizedTarget) return true;

  const targetWords = normalizedTarget.split(' ').filter(Boolean);
  const spokenWords = normalizedSpoken.split(' ').filter(Boolean);

  const matchedWords = targetWords.filter((targetWord) =>
    spokenWords.some((spokenWord) => similarity(targetWord, spokenWord) >= WORD_MATCH_THRESHOLD),
  );
  const coverage = matchedWords.length / targetWords.length;
  if (coverage >= REQUIRED_WORD_COVERAGE) return true;

  // Fallback for short names / STT running words together differently.
  return similarity(normalizedSpoken, normalizedTarget) >= WHOLE_STRING_THRESHOLD;
}

/** True if any candidate (e.g. multiple STT alternatives) matches. */
export function matchAny(candidates: string[], targetName: string): boolean {
  return candidates.some((candidate) => matchName(candidate, targetName));
}
