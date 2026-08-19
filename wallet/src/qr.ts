import QRCode from 'qrcode';
import { HOPE_ICON_DATA_URL } from './assets/hopeIcon';

/** Hope brand green used for QR modules. */
export const QR_MODULE_COLOR = '#3d6853';

/** QR quiet-zone / background. */
export const QR_BACKGROUND_COLOR = '#ffffff';

/** Corner radius as a fraction of each module cell (0 = square, 0.5 = dot). */
export const QR_MODULE_RADIUS_RATIO = 0.38;

/** Center logo width as a fraction of the full QR image. */
export const QR_LOGO_SCALE = 0.15;

/** White pad around the center logo, as a fraction of logo width. */
export const QR_LOGO_PAD_RATIO = 0.22;

/** Sign payloads above this use ECC M (logo + rounded modules need more redundancy). */
export const QR_ECC_M_MIN_CHARS = 500;

/** Very large payloads bump to ECC H and a smaller logo. */
export const QR_ECC_H_MIN_CHARS = 1400;

type QrEccLevel = 'L' | 'M' | 'H';

function brandedEccLevel(charLen: number): QrEccLevel {
  if (charLen >= QR_ECC_H_MIN_CHARS) return 'H';
  if (charLen >= QR_ECC_M_MIN_CHARS) return 'M';
  return 'L';
}

function brandedLogoScale(charLen: number): number {
  if (charLen >= QR_ECC_H_MIN_CHARS) return 0.1;
  if (charLen >= QR_ECC_M_MIN_CHARS) return 0.12;
  return QR_LOGO_SCALE;
}

function moduleRadiusRatio(moduleCount: number): number {
  if (moduleCount >= 105) return 0.22;
  if (moduleCount >= 85) return 0.28;
  return QR_MODULE_RADIUS_RATIO;
}

/** Larger on-screen QR for dense sign payloads (phone camera readability). */
export function qrDisplaySize(text: string, preferred = QR_IMAGE_SIZE): number {
  if (text.length >= QR_ECC_H_MIN_CHARS) return Math.max(preferred, 512);
  if (text.length >= QR_ECC_M_MIN_CHARS) return Math.max(preferred, 480);
  return preferred;
}

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

export type QrBuildOptions = {
  width?: number;
  /** When false, plain square modules (no logo). Default true in browsers. */
  branded?: boolean;
};

export type QrBuildResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

let iconPromise: Promise<CanvasImageSource> | null = null;

function loadHopeIcon(): Promise<CanvasImageSource> {
  if (!iconPromise) {
    iconPromise = new Promise((resolve, reject) => {
      if (typeof Image !== 'undefined') {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not load Hope icon'));
        img.src = HOPE_ICON_DATA_URL;
        return;
      }
      reject(new Error('Image not available'));
    });
  }
  return iconPromise;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function canUseCanvas(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

async function buildBrandedQrDataUrl(text: string, width: number): Promise<string> {
  const ecc = brandedEccLevel(text.length);
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  const moduleCount = qr.modules.size;
  const margin = 2;
  const scale = width / (moduleCount + margin * 2);
  const symbolSize = Math.floor((moduleCount + margin * 2) * scale);
  const scaledMargin = margin * scale;
  const canvasSize = width;
  const inset = Math.floor((canvasSize - symbolSize) / 2);
  const radiusRatio = moduleRadiusRatio(moduleCount);

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.fillStyle = QR_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvasSize, canvasSize);
  ctx.clip();

  ctx.fillStyle = QR_MODULE_COLOR;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.modules.get(row, col)) continue;
      const x0 = inset + Math.floor(scaledMargin + col * scale);
      const y0 = inset + Math.floor(scaledMargin + row * scale);
      const x1 = inset + Math.floor(scaledMargin + (col + 1) * scale);
      const y1 = inset + Math.floor(scaledMargin + (row + 1) * scale);
      const w = Math.max(1, x1 - x0);
      const h = Math.max(1, y1 - y0);
      const moduleRadius = Math.min(w, h) * radiusRatio;
      roundRectPath(ctx, x0, y0, w, h, moduleRadius);
      ctx.fill();
    }
  }

  const logoScale = brandedLogoScale(text.length);
  const logoWidth = Math.round(canvasSize * logoScale);
  const logoHeight = Math.round(logoWidth * (76 / 89));
  const pad = logoWidth * QR_LOGO_PAD_RATIO;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const badgeRadius = Math.max(logoWidth, logoHeight) / 2 + pad;

  ctx.fillStyle = QR_BACKGROUND_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  const icon = await loadHopeIcon();
  ctx.drawImage(
    icon,
    cx - logoWidth / 2,
    cy - logoHeight / 2,
    logoWidth,
    logoHeight
  );
  ctx.restore();

  return canvas.toDataURL('image/png');
}

async function buildPlainQrDataUrl(text: string, width: number): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'L',
    margin: 2,
    width,
    color: { dark: QR_MODULE_COLOR, light: QR_BACKGROUND_COLOR },
  });
}

/**
 * Draw a QR as a PNG data URL in this process — no third-party image host.
 * ECC L maximizes capacity for connect/sign deep links.
 * Branded output uses rounded green modules and a center Hope icon (browser only).
 */
export async function buildQrDataUrl(
  text: string,
  opts?: QrBuildOptions
): Promise<QrBuildResult> {
  if (!text) return { ok: false, error: 'Nothing to encode' };
  if (text.length > MAX_QR_CHARS) {
    return {
      ok: false,
      error: `QR payload is too large (${text.length} chars)`,
    };
  }

  const width = opts?.width ?? 240;
  const branded = opts?.branded !== false && canUseCanvas();
  const renderWidth = branded ? qrDisplaySize(text, width) : width;

  try {
    const dataUrl = branded
      ? await buildBrandedQrDataUrl(text, renderWidth)
      : await buildPlainQrDataUrl(text, renderWidth);
    return { ok: true, dataUrl };
  } catch (e) {
    try {
      const dataUrl = await buildPlainQrDataUrl(text, width);
      return { ok: true, dataUrl };
    } catch (fallbackError) {
      return {
        ok: false,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : e instanceof Error
              ? e.message
              : 'Could not generate QR code',
      };
    }
  }
}

/** Convenience: data URL or null. */
export async function qrDataUrl(content: string, size = QR_IMAGE_SIZE): Promise<string | null> {
  const result = await buildQrDataUrl(content, { width: size });
  return result.ok ? result.dataUrl : null;
}
