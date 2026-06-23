// Slug + key normalization helpers.
// `slugify` makes stable ids/urls. `normalizeKey` strips folder/name noise
// (parentheticals, "floor plan only", punctuation) so the CSV model names can be
// fuzzy-matched against messy gallery folder names.

const DIACRITICS = /[̀-ͯ]/g;

export function slugify(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Reduce a name to its meaningful tokens for matching.
export function normalizeKey(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/\([^)]*\)?/g, " ") // remove "( ... )" and unclosed "( ..."
    .replace(/floor\s*plan\s*only/g, " ")
    .replace(/no\s*photos/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keyTokens(input) {
  const k = normalizeKey(input);
  return k ? k.split(" ") : [];
}

// Classic Levenshtein distance (small strings only — fine for model names).
export function levenshtein(a, b) {
  a = String(a);
  b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

// 0..1 similarity combining edit distance + token overlap.
export function similarity(a, b) {
  const na = normalizeKey(a);
  const nb = normalizeKey(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const editScore = 1 - dist / Math.max(na.length, nb.length);

  const ta = new Set(keyTokens(a));
  const tb = new Set(keyTokens(b));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  const tokenScore = shared / Math.max(ta.size, tb.size);

  return editScore * 0.55 + tokenScore * 0.45;
}
