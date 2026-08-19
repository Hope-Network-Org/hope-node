import { useEffect, useMemo, useState } from 'react';
import { buildQrDataUrl, qrDisplaySize } from '../qr';

export type HopeQrImageProps = {
  value: string;
  size?: number;
  alt?: string;
  className?: string;
};

/** Local QR `<img>`. Encode happens on-device; nothing is sent to a CDN. */
export function HopeQrImage({
  value,
  size = 208,
  alt = 'QR code',
  className,
}: HopeQrImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displaySize = useMemo(() => qrDisplaySize(value, size), [value, size]);

  useEffect(() => {
    if (!value) {
      setSrc(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setSrc(null);
    setError(null);
    void buildQrDataUrl(value, { width: displaySize }).then((result) => {
      if (cancelled) return;
      if (result.ok) setSrc(result.dataUrl);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [value, displaySize]);

  const frameStyle = {
    width: '100%',
    maxWidth: displaySize,
    aspectRatio: '1 / 1' as const,
    lineHeight: 0,
    overflow: 'hidden' as const,
    margin: '0 auto',
  };

  if (!value) return null;
  if (error) {
    return (
      <div
        className={className}
        style={{
          ...frameStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#64748b',
          textAlign: 'center',
          padding: 12,
          boxSizing: 'border-box',
        }}
      >
        {error}
      </div>
    );
  }
  if (!src) {
    return (
      <div
        className={className}
        style={{ ...frameStyle, background: '#f8fafc', borderRadius: 8 }}
        aria-hidden
      />
    );
  }
  return (
    <div className={className} style={frameStyle}>
      <img
        src={src}
        alt={alt}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

export default HopeQrImage;
