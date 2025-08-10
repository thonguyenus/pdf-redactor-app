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
 * Redact (mask) the value of the form field named "country" (case-insensitive)
 * inside the input PDF. Returns new PDF bytes and whether any matching field
 * was found.
 */
export async function redactCountryFieldInPdf(inputBytes: ArrayBuffer | Uint8Array, maskValue = '██████'): Promise<RedactResult> {
  const stable = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes.slice(0));
  const pdfDoc = await PDFDocument.load(stable);

  let found = false;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const field of fields) {
      if (!matchesCountryName(field)) continue;

      const anyField: any = field as any;
      // Text-like fields
      if (typeof anyField.setText === 'function') {
        anyField.setText(maskValue);
        found = true;
        continue;
      }
      // Dropdown / OptionList-like fields
      if (typeof anyField.setOptions === 'function' && typeof anyField.select === 'function') {
        try {
          anyField.setOptions([maskValue]);
          anyField.select(maskValue);
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
