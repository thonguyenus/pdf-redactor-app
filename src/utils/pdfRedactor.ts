import { PDFDocument, StandardFonts } from 'pdf-lib';

export type RedactResult = { bytes: Uint8Array; found: boolean };

function matchesCountryName(field: any): boolean {
  try {
    const names: string[] = [];
    const primary = typeof field.getName === 'function' ? field.getName() : '';
    if (primary) names.push(String(primary));
    const acro = (field as any).acroField;
    if (acro) {
      const alt = acro.getAlternateName?.();
      const partial = acro.getPartialName?.();
      const fq = acro.getFullyQualifiedName?.();
      if (alt) names.push(String(alt));
      if (partial) names.push(String(partial));
      if (fq) names.push(String(fq));
    }
    return names.some((n) => /country/i.test(n));
  } catch {
    return false;
  }
}

/**
 * Redact country field values in a PDF by replacing with ASCII hashes (########).
 * Works for text fields and dropdown/list fields. Updates appearances with
 * Helvetica and flattens the form so the mask becomes part of page content.
 */
export async function redactCountryFieldInPdf(
  inputBytes: ArrayBuffer | Uint8Array,
  maskValue = '########'
): Promise<RedactResult> {
  const stable = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes.slice(0));
  const pdfDoc = await PDFDocument.load(stable);

  let found = false;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const asciiMask = maskValue; // already ASCII-safe

    for (const field of fields) {
      if (!matchesCountryName(field)) continue;
      const anyField: any = field as any;

      if (typeof anyField.setText === 'function') {
        anyField.setText(asciiMask);
        found = true;
        continue;
      }

      if (typeof anyField.setOptions === 'function' && typeof anyField.select === 'function') {
        try {
          anyField.setOptions([asciiMask]);
          anyField.select(asciiMask);
          found = true;
          continue;
        } catch {
          // ignore and try next
        }
      }
    }

    form.updateFieldAppearances(helvetica);
    form.flatten();
  } catch (e) {
    // ignore; will still save doc
  }

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  return { bytes, found };
}
