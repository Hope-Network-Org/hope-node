import { useEffect, useState } from 'react';
import { buildQrDataUrl } from '../qr';

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

  useEffect(() => {
    if (!value) {
      setSrc(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setSrc(null);
    setError(null);
    void buildQrDataUrl(value, { width: size }).then((result) => {
      if (cancelled) return;
      if (result.ok) setSrc(result.dataUrl);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!value) return null;
  if (error) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
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
        style={{ width: size, height: size, background: '#f8fafc', borderRadius: 8 }}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={className}
    />
  );
}

export default HopeQrImage;
