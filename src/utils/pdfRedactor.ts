import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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

async function loadBlockCapableFont(pdfDoc: PDFDocument): Promise<{ font: any; supportsBlock: boolean }> {
  try {
    pdfDoc.registerFontkit(fontkit as any);

    // Prefer robust local fonts that include block glyph
    const candidates = [
      '/fonts/DejaVuSans.ttf',
      '/fonts/NotoSans-Regular.ttf',
      '/DejaVuSans.ttf',
      '/NotoSans-Regular.ttf',
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const fontBytes = await res.arrayBuffer();
        const font = await pdfDoc.embedFont(new Uint8Array(fontBytes), { subset: false });
        return { font, supportsBlock: true };
      } catch {
        // try next
      }
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    return { font, supportsBlock: false };
  } catch {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    return { font, supportsBlock: false };
  }
}

function toAsciiMask(input: string, fallback = 'REDACTED'): string {
  const ascii = Array.from(input)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 32;
      return code >= 32 && code <= 126 ? ch : '#';
    })
    .join('');
  const trimmed = ascii.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Redact country field values in a PDF: text fields prefer block mask (if a
 * block-capable font is available), otherwise fallback to ASCII mask; dropdown
 * fields always use ASCII mask. Appearances are updated per field, then the
 * form is flattened.
 */
export async function redactCountryFieldInPdf(
  inputBytes: ArrayBuffer | Uint8Array,
  maskValue = '██████'
): Promise<RedactResult> {
  const stable = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes.slice(0));
  const pdfDoc = await PDFDocument.load(stable);

  let found = false;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const { font: blockFont, supportsBlock } = await loadBlockCapableFont(pdfDoc);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const asciiMask = toAsciiMask(maskValue, 'REDACTED');
    const blockMask = maskValue; // only safe if supportsBlock

    for (const field of fields) {
      if (!matchesCountryName(field)) continue;
      const anyField: any = field as any;

      if (typeof anyField.setText === 'function') {
        const mask = supportsBlock ? blockMask : asciiMask;
        anyField.setText(mask);
        if (typeof anyField.updateAppearances === 'function') {
          anyField.updateAppearances(supportsBlock ? blockFont : helvetica);
        }
        found = true;
        continue;
      }

      if (typeof anyField.setOptions === 'function' && typeof anyField.select === 'function') {
        try {
          anyField.setOptions([asciiMask]);
          anyField.select(asciiMask);
          if (typeof anyField.updateAppearances === 'function') {
            anyField.updateAppearances(helvetica);
          }
          found = true;
          continue;
        } catch {
          // ignore and try next
        }
      }
    }

    form.flatten();
  } catch (e) {
    // ignore; will still save doc
  }

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  return { bytes, found };
}
