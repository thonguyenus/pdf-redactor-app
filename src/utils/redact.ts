/**
 * Replace the value of the field named "country" with block characters.
 * Attempts to cover common patterns (plain text, key-value with :, =, JSON-like).
 */
export function redactCountry(text: string): string {
  if (!text) return text;

  let result = text;

  // Pattern 1: key-value pairs e.g. "country: Vietnam" or "Country = US"
  result = result.replace(/(please\s*[:=]\s*)([^\r\n,;]+)/gi, (m, p1, p2) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}`;
  });

  // Pattern 2: JSON-like e.g. '"country": "Vietnam"'
  result = result.replace(/("please"\s*:\s*")(.*?)(")/gi, (m, p1, p2, p3) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}${p3}`;
  });

  // Pattern 3: Standalone lines e.g. "Country Vietnam"
  result = result.replace(/(please\s+)([^\r\n]+)/gi, (m, p1, p2) => {
    const blocks = '█'.repeat(p2.trim().length || 6);
    return `${p1}${blocks}`;
  });

  return result;
}
