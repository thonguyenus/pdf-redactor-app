/**
 * Replace the value of the field named "country" with ASCII hashes.
 * Attempts to cover common patterns (plain text, key-value with :, =, JSON-like).
 */
export function redactCountry(text: string): string {
  if (!text) return text;

  let result = text;

  const makeHash = (len: number) => '#'.repeat(len || 8);

  // Pattern 1: key-value pairs e.g. "country: Vietnam" or "Country = US"
  result = result.replace(/(country\s*[:=]\s*)([^\r\n,;]+)/gi, (m, p1, p2) => {
    return `${p1}${makeHash(p2.trim().length)}`;
  });

  // Pattern 2: JSON-like e.g. '"country": "Vietnam"'
  result = result.replace(/("country"\s*:\s*")(.*?)(")/gi, (m, p1, p2, p3) => {
    return `${p1}${makeHash(p2.trim().length)}${p3}`;
  });

  // Pattern 3: Standalone lines e.g. "Country Vietnam"
  result = result.replace(/(country\s+)([^\r\n]+)/gi, (m, p1, p2) => {
    return `${p1}${makeHash(p2.trim().length)}`;
  });

  return result;
}
