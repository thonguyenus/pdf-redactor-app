import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

export type RedactResult = { bytes: Uint8Array; found: boolean };

/**
 * Redact specified field values in a PDF by finding text patterns and overlaying them
 * with redacted rectangles. This works for plain text PDFs without form fields.
 * Uses pdf.js to extract text with coordinates, then pdf-lib to place redaction rectangles.
 */
export async function redactFieldInPdf(
  inputBytes: ArrayBuffer | Uint8Array,
  fieldName: string
): Promise<RedactResult> {
  const stable =
    inputBytes instanceof Uint8Array
      ? inputBytes
      : new Uint8Array(inputBytes.slice(0));

  try {
    // Convert to ArrayBuffer for pdf.js
    const arrayBuffer = stable.buffer.slice(
      stable.byteOffset,
      stable.byteOffset + stable.byteLength
    );

    // Use pdf.js to extract text with coordinates
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get text content with coordinates from all pages
    const textItems: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      pageIndex: number;
    }> = [];

    for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex + 1);
      const content = await page.getTextContent();

      for (const item of content.items) {
        const textItem = item as {
          str: string;
          transform: number[];
          width?: number;
          height?: number;
        };
        if (textItem.str && textItem.str.trim()) {
          textItems.push({
            text: textItem.str,
            x: textItem.transform[4], // x coordinate
            y: textItem.transform[5], // y coordinate
            width: textItem.width || 0,
            height: textItem.height || 0,
            pageIndex: pageIndex,
          });
        }
      }
    }

    // Find the field content to redact
    let found = false;
    const redactionRects: Array<{
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    // Debug: Log all text items to understand the structure
    console.log(
      "All text items:",
      textItems.map((item) => ({ text: item.text, x: item.x, y: item.y }))
    );

    // Search through text items to find field patterns
    for (let i = 0; i < textItems.length; i++) {
      const item = textItems[i];
      const lineText = item.text;

      console.log(`Checking item ${i}: "${lineText}"`);

      // Check if this is a field name that ends with a colon
      // This will match "Languages:" and "Programming Languages:" but not "languages" in content
      if (lineText.trim().endsWith(":")) {
        // Check if the field name contains our target field (case-insensitive)
        const fieldNameLower = fieldName.toLowerCase();
        const lineTextLower = lineText.toLowerCase();

        if (lineTextLower.includes(fieldNameLower)) {
          console.log(`Found field "${fieldName}" in: "${lineText}"`);

          // Find the content in the next item(s) on the same line
          const contentItems: Array<{
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
          }> = [];

          // Look ahead to find content items on the same line
          for (let j = i + 1; j < textItems.length; j++) {
            const nextItem = textItems[j];
            // Check if next item is part of the same line (similar y coordinate)
            if (Math.abs(nextItem.y - item.y) < 5) {
              contentItems.push(nextItem);
            } else {
              break;
            }
          }

          if (contentItems.length > 0) {
            // Calculate the total width and height of content
            let totalWidth = 0;
            let maxHeight = item.height;

            for (const contentItem of contentItems) {
              totalWidth += contentItem.width || 0;
              maxHeight = Math.max(maxHeight, contentItem.height || 0);
            }

            // Create redaction rectangle for the content (not the field name)
            redactionRects.push({
              pageIndex: item.pageIndex,
              x: contentItems[0].x, // Start from the first content item
              y: item.y,
              width: totalWidth,
              height: maxHeight,
            });

            found = true;
            console.log(
              `Content to redact: ${contentItems
                .map((item) => item.text)
                .join(" ")}`
            );
          }
        }
      }
    }

    // Apply redaction rectangles to the PDF using pdf-lib
    if (found && redactionRects.length > 0) {
      const pdfDoc = await PDFDocument.load(stable);
      const pages = pdfDoc.getPages();

      for (const rect of redactionRects) {
        const page = pages[rect.pageIndex];

        // Create redaction rectangle (only black rectangle, no text overlay)
        page.drawRectangle({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: rgb(0, 0, 0), // Black rectangle
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
      }

      // Save the modified PDF
      const bytes = await pdfDoc.save({ useObjectStreams: false });
      return { bytes, found: true };
    }

    // If no field found, return original PDF
    return { bytes: stable, found: false };
  } catch (e) {
    console.error("Error during text content redaction:", e);
    return { bytes: stable, found: false };
  }
}

/**
 * Redact country field values in a PDF by replacing with ASCII hashes (########).
 * @deprecated Use redactFieldInPdf instead for more flexibility
 */
export async function redactCountryFieldInPdf(
  inputBytes: ArrayBuffer | Uint8Array
): Promise<RedactResult> {
  return redactFieldInPdf(inputBytes, "country");
}
