/**
 * Convert pdf.js TextContent into a plain text string with line breaks preserved.
 * Heuristic: group text items by their baseline y (with a small tolerance),
 * sort items in each group by x, then join groups by newline. Finally join
 * pages externally with double newlines if desired.
 */
export function textContentToPlainText(content: any): string {
  if (!content || !Array.isArray(content.items)) return '';

  type Line = { y: number; items: { x: number; str: string }[] };
  const lines: Line[] = [];
  const yTolerance = 2; // pixels; small tolerance to merge same visual rows

  for (const item of content.items) {
    const transform = item?.transform as number[] | undefined;
    const str: string = typeof item?.str === 'string' ? item.str : '';
    if (!transform || !str) continue;

    const x = transform[4];
    const y = transform[5];

    // Find an existing line within tolerance
    let line = lines.find((l) => Math.abs(l.y - y) <= yTolerance);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push({ x, str });
  }

  // PDF coordinate origin is bottom-left, so y increases upwards.
  // Sort from top to bottom (descending y) for natural reading order.
  lines.sort((a, b) => b.y - a.y);

  const normalizedLines = lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    const joined = l.items.map((it) => it.str).join(' ');
    // Collapse excessive inner spaces; keep meaningful spaces
    return joined.replace(/\s+/g, ' ').trim();
  });

  // Join lines with newline characters
  return normalizedLines.join('\n');
}
