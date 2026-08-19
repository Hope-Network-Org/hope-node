import QRCode from 'qrcode';

/** Practical phone-camera limit for reliable Hope Wallet scans.
 *  QR v40 ECC-L can hold ~4296 alphanumeric chars. Raw base64 uses only
 *  [A-Za-z0-9+/=] so the scanner always gets alphanumeric mode.
 *  Sign payloads with two staking messages run ~1400–2000 chars encoded.
 *  We render at 400px so modules are large enough for phone cameras to read
 *  up to ~2800 chars reliably.
 */
export const MAX_QR_CHARS = 2800;

/** px width used when rendering sign/connect QR images. */
export const QR_IMAGE_SIZE = 400;

export type QrBuildResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/**
 * Draw a QR as a PNG data URL in this process — no third-party image host.
 * ECC L maximizes capacity for connect/sign deep links.
 */
export async function buildQrDataUrl(
  text: string,
  opts?: { width?: number }
): Promise<QrBuildResult> {
  if (!text) return { ok: false, error: 'Nothing to encode' };
  if (text.length > MAX_QR_CHARS) {
    return {
      ok: false,
      error: `QR payload is too large (${text.length} chars)`,
    };
  }
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: opts?.width ?? 240,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    return { ok: true, dataUrl };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Could not generate QR code',
    };
  }
}

/** Convenience: data URL or null. */
export async function qrDataUrl(content: string, size = QR_IMAGE_SIZE): Promise<string | null> {
  const result = await buildQrDataUrl(content, { width: size });
  return result.ok ? result.dataUrl : null;
}
