/**
 * Replace the value of specified fields with ASCII hashes.
 * Attempts to cover common patterns (plain text, key-value with :, =, JSON-like).
 */
export function redactField(text: string, fieldName: string): string {
  if (!text || !fieldName) return text;

  let result = text;

  const makeHash = (len: number) => "#".repeat(len || 8);

  // Pattern 1: Field name with colon followed by content (most common in CVs)
  // This should catch "Languages: Fluent in English, with decent written and verbal communication skills."
  // Using word boundaries to avoid partial matches like "Programming Languages"
  result = result.replace(
    new RegExp(`(\\b${fieldName}\\b\\s*:)\\s*([^\\r\\n]+)`, "gi"),
    (m, p1, p2) => {
      return `${p1} ${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 2: Field name with equals sign e.g. "Languages = English"
  result = result.replace(
    new RegExp(`(\\b${fieldName}\\b\\s*=\\s*)([^\\r\\n]+)`, "gi"),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 3: JSON-like e.g. '"languages": "English, Vietnamese"'
  result = result.replace(
    new RegExp(`("${fieldName}"\\s*:\\s*")(.*?)(")`, "gi"),
    (m, p1, p2, p3) => {
      return `${p1}${makeHash(p2.trim().length)}${p3}`;
    }
  );

  // Pattern 4: Standalone lines e.g. "Languages English, Vietnamese" (without colon)
  result = result.replace(
    new RegExp(`(\\b${fieldName}\\b\\s+)([^\\r\\n]+)`, "gi"),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 5: Section headers with content below e.g. "Languages:" followed by content on next line
  result = result.replace(
    new RegExp(
      `(\\b${fieldName}\\b\\s*:?\\s*\\n)([^\\r\\n]+(?:\\n[^\\r\\n]+)*)`,
      "gi"
    ),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 6: Field name followed by bullet points or list items
  result = result.replace(
    new RegExp(
      `(\\b${fieldName}\\b\\s*:?\\s*\\n)((?:[•\\-\\*]\\s*[^\\r\\n]+\\n?)+)`,
      "gi"
    ),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 7: Field name with multiple lines of content (common in CVs)
  result = result.replace(
    new RegExp(
      `(\\b${fieldName}\\b\\s*:?\\s*\\n)([^\\r\\n]+(?:\\n[^\\r\\n]+)*?)(?=\\n\\s*[A-Z][a-z]+\\s*:|\\n\\s*[A-Z][a-z]+\\s*$|$)`,
      "gi"
    ),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  // Pattern 8: Field name at end of line with content on next line
  result = result.replace(
    new RegExp(
      `(\\b${fieldName}\\b\\s*:?\\s*$\\n)([^\\r\\n]+(?:\\n[^\\r\\n]+)*?)(?=\\n\\s*[A-Z][a-z]+\\s*:|\\n\\s*[A-Z][a-z]+\\s*$|$)`,
      "gm"
    ),
    (m, p1, p2) => {
      return `${p1}${makeHash(p2.trim().length)}`;
    }
  );

  return result;
}

/**
 * Replace the value of the field named "country" with ASCII hashes.
 * Attempts to cover common patterns (plain text, key-value with :, =, JSON-like).
 * @deprecated Use redactField instead for more flexibility
 */
export function redactCountry(text: string): string {
  return redactField(text, "country");
}
