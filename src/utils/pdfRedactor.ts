import { PDFDocument, StandardFonts } from 'pdf-lib';

export type RedactResult = { bytes: Uint8Array; found: boolean };

/**
 * Redact (mask) the value of the form field named "country" (case-insensitive)
 * inside the input PDF. Returns new PDF bytes and whether any matching field
 * was found.
 */
export async function redactCountryFieldInPdf(inputBytes: ArrayBuffer | Uint8Array, maskValue = '██████'): Promise<RedactResult> {
  // Ensure we pass a stable copy to pdf-lib
  const stable = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes.slice(0));
  const pdfDoc = await PDFDocument.load(stable);

  let found = false;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const field of fields) {
      const name = field.getName?.() ?? '';
      if (typeof name === 'string' && /country/i.test(name)) {
        // We only support text fields for now
        // @ts-ignore - pdf-lib types expose getText / setText for text fields
        if (typeof field.setText === 'function') {
          // @ts-ignore
          field.setText(maskValue);
          found = true;
        }
      }
    }

    // Update appearances and flatten so values become part of page content
    form.updateFieldAppearances(helvetica);
    form.flatten();
  } catch (e) {
    // If the PDF has no AcroForm or an unexpected structure, we just re-save
  }

  const bytes = await pdfDoc.save({
    useObjectStreams: false,
  });
  return { bytes, found };
}
