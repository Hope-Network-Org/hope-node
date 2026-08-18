import QRCode from 'qrcode';

/** Practical phone-camera limit for reliable Hope Wallet scans. */
export const MAX_QR_CHARS = 1800;

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
export async function qrDataUrl(content: string, size = 240): Promise<string | null> {
  const result = await buildQrDataUrl(content, { width: size });
  return result.ok ? result.dataUrl : null;
}
